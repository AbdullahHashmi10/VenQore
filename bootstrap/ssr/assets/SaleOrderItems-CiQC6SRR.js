import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { usePage, Head, Link, router } from "@inertiajs/react";
import { R as ReportsLayout } from "./ReportsLayout-C08V7Mxf.js";
import { ArrowLeft, Layers, Search, ShoppingBag, DollarSign, Tag, Package } from "lucide-react";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, PieChart, Pie, Cell, Legend } from "recharts";
import { b as formatNumber, f as formatCurrency } from "./format-131Nyq79.js";
import { u as useTermText } from "./terms-DwYjlWsV.js";
import { v as vq, b as sequential } from "./runtime-DwSFgQZq.js";
import "./OneGlanceLayout-D0x15wPs.js";
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
import "laravel-echo";
import "pusher-js";
import "driver.js";
import "./utils-H80jjgLf.js";
import "clsx";
import "tailwind-merge";
function SaleOrderItems({ items = [], filters = {} }) {
  const {
    store
  } = usePage().props;
  const tt = useTermText();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState({ key: "subtotal", direction: "desc" });
  const [dateRange, setDateRange] = useState(filters.range || "this_month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const processedItems = useMemo(() => {
    let data = [...items];
    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();
      data = data.filter(
        (item) => (item.sales_order?.order_number || "").toString().toLowerCase().includes(lowerQ) || (item.product?.name || "").toLowerCase().includes(lowerQ)
      );
    }
    data.sort((a, b) => {
      let valA = a[sortBy.key];
      let valB = b[sortBy.key];
      if (sortBy.key === "order_number") {
        valA = Number(a.sales_order?.order_number || 0);
        valB = Number(b.sales_order?.order_number || 0);
      } else if (sortBy.key === "product") {
        valA = a.product?.name || "";
        valB = b.product?.name || "";
      } else if (sortBy.key === "subtotal") {
        valA = Number(a.quantity) * Number(a.price);
        valB = Number(b.quantity) * Number(b.price);
      } else if (sortBy.key === "quantity") {
        valA = Number(valA);
        valB = Number(valB);
      }
      if (valA < valB) return sortBy.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortBy.direction === "asc" ? 1 : -1;
      return 0;
    });
    return data;
  }, [items, searchQuery, sortBy]);
  const stats = useMemo(() => {
    const totalItems = processedItems.reduce((acc, curr) => acc + Number(curr.quantity), 0);
    const totalRevenue = processedItems.reduce((acc, curr) => acc + Number(curr.quantity) * Number(curr.price), 0);
    const count = processedItems.length;
    const avgPrice = count > 0 ? totalRevenue / count : 0;
    const productCounts = {};
    processedItems.forEach((i) => {
      const name = i.product?.name || "Unknown";
      if (!productCounts[name]) productCounts[name] = 0;
      productCounts[name] += Number(i.quantity);
    });
    const topProduct = Object.entries(productCounts).sort((a, b) => b[1] - a[1])[0];
    return {
      totalItems,
      totalRevenue,
      avgPrice,
      topProductEntry: topProduct ? { name: topProduct[0], qty: topProduct[1] } : null
    };
  }, [processedItems]);
  const topProducts = useMemo(() => {
    const map = {};
    processedItems.forEach((i) => {
      const name = i.product?.name || "Unknown";
      if (!map[name]) map[name] = 0;
      map[name] += Number(i.quantity);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [processedItems]);
  const revenueShare = useMemo(() => {
    const map = {};
    processedItems.forEach((i) => {
      const name = i.product?.name || "Unknown";
      if (!map[name]) map[name] = 0;
      map[name] += Number(i.quantity) * Number(i.price);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [processedItems]);
  const pieColors = [...sequential.light].reverse();
  const handleSort = (key) => {
    setSortBy((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc"
    }));
  };
  const handleRangeChange = (r) => {
    setDateRange(r);
    if (r !== "custom") {
      router.get(route("store.reports.sale-order-items", {
        store_slug: store.slug
      }), { range: r }, { preserveState: true, preserveScroll: true });
    }
  };
  const applyCustomRange = () => {
    router.get(route("store.reports.sale-order-items", {
      store_slug: store.slug
    }), {
      range: "custom",
      start_date: customStart,
      end_date: customEnd
    }, { preserveState: true, preserveScroll: true });
  };
  return /* @__PURE__ */ jsxs(ReportsLayout, { title: tt("Order Items Report"), children: [
    /* @__PURE__ */ jsx(Head, { title: "Item Analysis" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full gap-4 w-full", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row justify-between items-center gap-4 bg-surface p-3 rounded-2xl border border-line shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 pl-2", children: [
          /* @__PURE__ */ jsx(Link, { href: route("store.reports.index", {
            store_slug: store.slug
          }), className: "p-2 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-xl text-ink-muted transition-colors", children: /* @__PURE__ */ jsx(ArrowLeft, { size: 18 }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("h1", { className: "text-xl font-bold text-ink tracking-tight flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Layers, { className: "text-brand-500", size: 20 }),
              tt("Order Items")
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted font-medium", children: tt("Product performance in sales orders") })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative group", children: [
            /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted group-focus-within:text-brand-500 transition-colors", size: 14 }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                placeholder: tt("Search Item or Order #..."),
                value: searchQuery,
                onChange: (e) => setSearchQuery(e.target.value),
                className: "pl-9 pr-3 py-1.5 bg-app border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 w-52 transition-all"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex bg-sunken p-1 rounded-xl items-center", children: [
            ["today", "this_month", "this_year"].map((r) => /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => handleRangeChange(r),
                className: `px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${dateRange === r ? "bg-sunken shadow-sm text-brand-600 dark:text-brand-400" : "text-ink-muted hover:text-ink-secondary dark:hover:text-neutral-300"}`,
                children: r.replace("_", " ")
              },
              r
            )),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center ml-1 border-l border-line pl-1 gap-2", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => handleRangeChange("custom"),
                  className: `px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${dateRange === "custom" ? "bg-sunken shadow-sm text-brand-600 dark:text-brand-400" : "text-ink-muted hover:text-ink-secondary dark:hover:text-neutral-300"}`,
                  children: "Custom"
                }
              ),
              dateRange === "custom" && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 animate-in slide-in-from-right-2 fade-in duration-slow", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "date",
                    value: customStart,
                    onChange: (e) => setCustomStart(e.target.value),
                    className: "p-1 px-2 text-2xs rounded-lg border-none bg-sunken dark:text-white focus:ring-1 focus:ring-brand-500"
                  }
                ),
                /* @__PURE__ */ jsx("span", { className: "text-ink-muted", children: "-" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "date",
                    value: customEnd,
                    onChange: (e) => setCustomEnd(e.target.value),
                    className: "p-1 px-2 text-2xs rounded-lg border-none bg-sunken dark:text-white focus:ring-1 focus:ring-brand-500"
                  }
                ),
                /* @__PURE__ */ jsx("button", { onClick: applyCustomRange, className: "p-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700", children: /* @__PURE__ */ jsx(ArrowLeft, { size: 10, className: "rotate-180" }) })
              ] })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0", children: [
        /* @__PURE__ */ jsx(
          StatCard,
          {
            title: "Total Items Sold",
            value: formatNumber(stats.totalItems),
            icon: /* @__PURE__ */ jsx(ShoppingBag, { size: 18 }),
            color: "violet",
            footer: "Units moved"
          }
        ),
        /* @__PURE__ */ jsx(
          StatCard,
          {
            title: "Total Revenue",
            value: formatCurrency(stats.totalRevenue, store),
            icon: /* @__PURE__ */ jsx(DollarSign, { size: 18 }),
            color: "emerald"
          }
        ),
        /* @__PURE__ */ jsx(
          StatCard,
          {
            title: "Avg Unit Price",
            value: formatCurrency(stats.avgPrice, store),
            icon: /* @__PURE__ */ jsx(Tag, { size: 18 }),
            color: "blue"
          }
        ),
        /* @__PURE__ */ jsx(
          StatCard,
          {
            title: "Top Seller",
            value: stats.topProductEntry ? stats.topProductEntry.name.substring(0, 15) + (stats.topProductEntry.name.length > 15 ? "..." : "") : "N/A",
            icon: /* @__PURE__ */ jsx(Package, { size: 18 }),
            color: "amber",
            footer: stats.topProductEntry ? `${formatNumber(stats.topProductEntry.qty)} Units` : ""
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2 bg-surface border border-line rounded-2xl shadow-sm flex flex-col overflow-hidden", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-4 border-b border-line bg-sunken/50 dark:bg-surface flex justify-between items-center", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-ink-secondary dark:text-ink uppercase tracking-wide", children: "Item Details" }),
            /* @__PURE__ */ jsxs("span", { className: "text-xs font-mono text-ink-muted bg-sunken px-2 py-1 rounded", children: [
              processedItems.length,
              " Rows"
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-auto custom-scrollbar relative", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
            /* @__PURE__ */ jsx("thead", { className: "bg-app sticky top-0 z-10 backdrop-blur-sm", children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx(SortableHeader, { label: tt("Order #"), colKey: "order_number", currentSort: sortBy, onSort: handleSort }),
              /* @__PURE__ */ jsx(SortableHeader, { label: tt("Product Name"), colKey: "product", currentSort: sortBy, onSort: handleSort }),
              /* @__PURE__ */ jsx(SortableHeader, { label: "Qty", colKey: "quantity", align: "center", currentSort: sortBy, onSort: handleSort }),
              /* @__PURE__ */ jsx(SortableHeader, { label: "Price", colKey: "price", align: "right", currentSort: sortBy, onSort: handleSort }),
              /* @__PURE__ */ jsx(SortableHeader, { label: "Total", colKey: "subtotal", align: "right", currentSort: sortBy, onSort: handleSort })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-line", children: processedItems.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: "5", className: "h-64", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center h-full text-ink-muted gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: "bg-sunken p-4 rounded-full", children: /* @__PURE__ */ jsx(Search, { size: 32, className: "text-neutral-300 opacity-50" }) }),
              /* @__PURE__ */ jsx("p", { className: "font-medium text-sm", children: "No items found" })
            ] }) }) }) : processedItems.map(
              (item, idx) => /* @__PURE__ */ jsxs("tr", { className: "group hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors", children: [
                /* @__PURE__ */ jsxs("td", { className: "px-6 py-3 font-mono text-xs text-brand-600 dark:text-brand-400 font-bold", children: [
                  "#",
                  item.sales_order?.order_number
                ] }),
                /* @__PURE__ */ jsxs("td", { className: "px-6 py-3 text-sm font-medium text-ink-secondary dark:text-ink", children: [
                  item.product?.name || tt("Unknown Product"),
                  item.sales_order?.status && /* @__PURE__ */ jsx("span", { className: `ml-2 w-1.5 h-1.5 inline-block rounded-full ${item.sales_order.status === "pending" ? "bg-amber-500" : "bg-emerald-500"}`, title: tt(`Order is ${item.sales_order.status}`) })
                ] }),
                /* @__PURE__ */ jsx("td", { className: "px-6 py-3 text-center text-sm text-ink-muted", children: formatNumber(item.quantity) }),
                /* @__PURE__ */ jsx("td", { className: "px-6 py-3 text-right text-xs text-ink-muted font-mono", children: formatCurrency(item.price, store) }),
                /* @__PURE__ */ jsx("td", { className: "px-6 py-3 text-right text-sm font-bold text-ink-secondary font-mono", children: formatCurrency(item.quantity * item.price, store) })
              ] }, idx)
            ) })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4 h-full min-h-0 overflow-hidden", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-surface border border-line rounded-2xl p-4 shadow-sm flex-1 min-h-0 flex flex-col", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-xs font-bold text-ink-muted uppercase mb-2", children: "Most Ordered Items" }),
            /* @__PURE__ */ jsx("div", { className: "flex-1 w-full h-full min-h-0", children: topProducts.length > 0 ? /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", minWidth: 1, minHeight: 1, children: /* @__PURE__ */ jsxs(BarChart, { data: topProducts, layout: "vertical", margin: { left: 10, right: 30 }, children: [
              /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", horizontal: true, vertical: false, opacity: 0.3 }),
              /* @__PURE__ */ jsx(XAxis, { type: "number", hide: true }),
              /* @__PURE__ */ jsx(YAxis, { dataKey: "name", type: "category", width: 80, tick: { fontSize: 10, fill: vq.slate[400] }, axisLine: false, tickLine: false }),
              /* @__PURE__ */ jsx(
                Tooltip,
                {
                  cursor: { fill: vq.slate[100], opacity: 0.1 },
                  contentStyle: { backgroundColor: vq.slate[800], border: "none", borderRadius: "8px", color: "#fff" }
                }
              ),
              /* @__PURE__ */ jsx(Bar, { dataKey: "value", fill: sequential.light[2], radius: [0, 4, 4, 0], barSize: 16, background: { fill: "transparent" } })
            ] }) }) : /* @__PURE__ */ jsx("div", { className: "h-full flex items-center justify-center text-xs text-ink-muted italic", children: "No data" }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-surface border border-line rounded-2xl p-4 shadow-sm flex-1 min-h-0 flex flex-col", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-xs font-bold text-ink-muted uppercase mb-2", children: "Top Revenue Generators" }),
            /* @__PURE__ */ jsx("div", { className: "flex-1 w-full h-full min-h-0 relative", children: revenueShare.length > 0 ? /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", minWidth: 1, minHeight: 1, children: /* @__PURE__ */ jsxs(PieChart, { children: [
              /* @__PURE__ */ jsx(
                Pie,
                {
                  data: revenueShare,
                  dataKey: "value",
                  cx: "50%",
                  cy: "50%",
                  innerRadius: "50%",
                  outerRadius: "70%",
                  paddingAngle: 5,
                  children: revenueShare.map((entry, index) => /* @__PURE__ */ jsx(Cell, { fill: pieColors[index % pieColors.length], stroke: "none" }, `cell-${index}`))
                }
              ),
              /* @__PURE__ */ jsx(
                Tooltip,
                {
                  contentStyle: { backgroundColor: vq.slate[800], border: "none", borderRadius: "8px", color: "#fff" },
                  itemStyle: { color: "#fff" },
                  formatter: (val) => formatCurrency(val, store)
                }
              ),
              /* @__PURE__ */ jsx(Legend, { verticalAlign: "bottom", height: 36, iconType: "circle", wrapperStyle: { fontSize: "11px", paddingTop: "4px" } })
            ] }) }) : /* @__PURE__ */ jsx("div", { className: "h-full flex items-center justify-center text-xs text-ink-muted italic", children: "No data" }) })
          ] })
        ] })
      ] })
    ] })
  ] });
}
function StatCard({ title, value, icon, color, footer }) {
  const bgColors = {
    violet: "bg-brand-500",
    emerald: "bg-emerald-500",
    blue: "bg-blue-500",
    amber: "bg-amber-500"
  };
  const textColors = {
    violet: "text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20",
    emerald: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20",
    blue: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20",
    amber: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20"
  };
  return /* @__PURE__ */ jsxs("div", { className: "bg-surface border border-line rounded-xl p-3 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-line dark:hover:border-line-strong transition-colors", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-2 relative z-10", children: [
      /* @__PURE__ */ jsx("div", { className: `p-2 rounded-lg ${textColors[color]} shrink-0`, children: icon }),
      footer && /* @__PURE__ */ jsx("span", { className: "text-2xs font-bold text-ink-muted bg-sunken px-2 py-0.5 rounded-full truncate max-w-[100px]", children: footer })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "relative z-10", children: [
      /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold text-ink-muted uppercase tracking-wider", children: title }),
      /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-ink tracking-tight mt-0.5", children: value })
    ] }),
    /* @__PURE__ */ jsx("div", { className: `absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-5 dark:opacity-10 ${bgColors[color]} pointer-events-none transition-transform duration-slower` })
  ] });
}
function SortableHeader({ label, colKey, align = "left", currentSort, onSort }) {
  const isActive = currentSort.key === colKey;
  return /* @__PURE__ */ jsx(
    "th",
    {
      onClick: () => onSort(colKey),
      className: `px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider cursor-pointer group bg-sunken hover:bg-sunken dark:hover:bg-interactive-hover transition-colors select-none`,
      style: { textAlign: align },
      children: /* @__PURE__ */ jsxs("div", { className: `flex items-center gap-1.5 ${align === "center" ? "justify-center" : align === "right" ? "justify-end" : "justify-start"}`, children: [
        label,
        /* @__PURE__ */ jsxs("div", { className: `flex flex-col text-4xs leading-none ${isActive ? "text-brand-500" : "text-neutral-300 group-hover:text-ink-muted"}`, children: [
          /* @__PURE__ */ jsx("span", { className: isActive && currentSort.direction === "asc" ? "opacity-100" : "opacity-40", children: "?" }),
          /* @__PURE__ */ jsx("span", { className: isActive && currentSort.direction === "desc" ? "opacity-100" : "opacity-40", children: "?" })
        ] })
      ] })
    }
  );
}
export {
  SaleOrderItems as default
};

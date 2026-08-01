import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { usePage, Head, Link, router } from "@inertiajs/react";
import { R as ReportsLayout } from "./ReportsLayout-DYtHXvvS.js";
import { ArrowLeft, Calendar, Clock, Info, Search, PieChart, HelpCircle, ShieldCheck, Zap, AlertTriangle, DollarSign, Activity, X, Layers, Package } from "lucide-react";
import { ResponsiveContainer, PieChart as PieChart$1, Pie, Cell, Tooltip, Legend } from "recharts";
import { f as formatCurrency } from "./format-B_ph0Qec.js";
import "./OneGlanceLayout-KMWHwZqK.js";
import "axios";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "laravel-echo";
import "pusher-js";
import "driver.js";
function PointInTimeInventory({ data = [], stats = [], meta = {} }) {
  const { store } = usePage().props;
  const [asOfDate, setAsOfDate] = useState(meta.as_of_date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0]);
  const [asOfTime, setAsOfTime] = useState(meta.as_of_time || "");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState("stock_value");
  const [sortDir, setSortDir] = useState("desc");
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalDetails, setModalDetails] = useState({ ledger: [], batches: [] });
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState(null);
  const handleSelectItem = (item) => {
    setSelectedItem(item);
    if (!item) {
      setModalDetails({ ledger: [], batches: [] });
      return;
    }
    setIsLoadingDetails(true);
    fetch(route("store.reports.point-in-time-inventory.details", {
      store_slug: store.slug,
      product_id: item.product_id,
      as_of_date: asOfDate,
      as_of_time: asOfTime || void 0
    })).then((res) => res.json()).then((json) => {
      setModalDetails({
        ledger: json.ledger || [],
        batches: json.batches || []
      });
      setIsLoadingDetails(false);
    }).catch((err) => {
      console.error(err);
      setIsLoadingDetails(false);
    });
  };
  const applyDate = () => {
    router.get(route("store.reports.point-in-time-inventory", { store_slug: store.slug }), {
      as_of_date: asOfDate,
      as_of_time: asOfTime || void 0
    }, { preserveState: true, preserveScroll: true });
  };
  const pieData = useMemo(() => {
    const categoriesMap = {};
    data.forEach((item) => {
      const catName = item.category || "Uncategorized";
      const val = item.stock_value || 0;
      categoriesMap[catName] = (categoriesMap[catName] || 0) + val;
    });
    const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#3b82f6", "#ec4899", "#8b5cf6"];
    const list = Object.entries(categoriesMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    if (list.length > 5) {
      const top = list.slice(0, 4);
      const othersVal = list.slice(4).reduce((sum, item) => sum + item.value, 0);
      top.push({ name: "Others", value: othersVal });
      return top.map((entry, index) => ({
        ...entry,
        color: COLORS[index % COLORS.length]
      }));
    }
    return list.map((entry, index) => ({
      ...entry,
      color: COLORS[index % COLORS.length]
    }));
  }, [data]);
  const filtered = useMemo(() => {
    return data.filter((r) => {
      const matchesSearch = !search || r.name.toLowerCase().includes(search.toLowerCase()) || (r.sku || "").toLowerCase().includes(search.toLowerCase()) || (r.category || "").toLowerCase().includes(search.toLowerCase());
      if (!matchesSearch) return false;
      const qty = r.quantity || 0;
      if (statusFilter === "out") return qty <= 0;
      if (statusFilter === "low") return qty > 0 && qty <= 15;
      if (statusFilter === "healthy") return qty > 15 && qty <= 200;
      if (statusFilter === "over") return qty > 200;
      return true;
    }).sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (typeof av === "string") return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === "asc" ? av - bv : bv - av;
    });
  }, [data, search, statusFilter, sortKey, sortDir]);
  const topTiedProducts = useMemo(() => {
    return [...data].sort((a, b) => (b.stock_value || 0) - (a.stock_value || 0)).slice(0, 3);
  }, [data]);
  useMemo(() => {
    return [...data].filter((r) => (r.quantity || 0) > 0 && (r.quantity || 0) <= 15).sort((a, b) => (a.quantity || 0) - (b.quantity || 0)).slice(0, 3);
  }, [data]);
  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };
  const runInventoryAudit = () => {
    setIsAuditing(true);
    setTimeout(() => {
      const outOfStockCount = data.filter((r) => (r.quantity || 0) <= 0).length;
      const lowStockCount = data.filter((r) => (r.quantity || 0) > 0 && (r.quantity || 0) <= 15).length;
      const overstockedCount = data.filter((r) => (r.quantity || 0) > 200).length;
      const totalValue = data.reduce((sum, r) => sum + (r.stock_value || 0), 0);
      setAuditResult({
        score: Math.max(10, 100 - outOfStockCount * 4 - lowStockCount * 2 - overstockedCount * 1),
        outOfStockCount,
        lowStockCount,
        overstockedCount,
        healthyCount: data.length - outOfStockCount - lowStockCount - overstockedCount,
        tiedCapital: totalValue,
        potentialBleed: data.filter((r) => (r.quantity || 0) > 200).reduce((sum, r) => sum + (r.stock_value || 0) * 0.15, 0)
      });
      setIsAuditing(false);
    }, 800);
  };
  const statIcon = (label) => {
    if (label.includes("As Of") || label.includes("Date")) return /* @__PURE__ */ jsx(Calendar, { size: 18 });
    if (label.includes("Value")) return /* @__PURE__ */ jsx(DollarSign, { size: 18 });
    if (label.includes("Quantity")) return /* @__PURE__ */ jsx(Layers, { size: 18 });
    return /* @__PURE__ */ jsx(Package, { size: 18 });
  };
  return /* @__PURE__ */ jsxs(ReportsLayout, { title: "Point-In-Time Inventory", children: [
    /* @__PURE__ */ jsx(Head, { title: "Point-In-Time Inventory" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full gap-5 w-full", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(Link, { href: route("store.reports.index", { store_slug: store.slug }), className: "p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 transition-colors", children: /* @__PURE__ */ jsx(ArrowLeft, { size: 18 }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h1", { className: "text-xl font-black text-slate-800 dark:text-white tracking-tight", children: "Point-In-Time Inventory" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 font-medium", children: "Historical inventory ledger valuation & snapshot builder" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 p-1.5 rounded-xl flex-wrap w-full lg:w-auto", children: [
          /* @__PURE__ */ jsx(Calendar, { size: 15, className: "text-slate-400 ml-1.5" }),
          /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-wide", children: "Target Moment:" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "date",
              value: asOfDate,
              max: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
              onChange: (e) => setAsOfDate(e.target.value),
              className: "px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 text-slate-600 dark:text-slate-300 font-bold"
            }
          ),
          /* @__PURE__ */ jsx(Clock, { size: 13, className: "text-slate-400" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "time",
              value: asOfTime,
              onChange: (e) => setAsOfTime(e.target.value),
              className: "px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 text-slate-600 dark:text-slate-300 font-bold w-24"
            }
          ),
          asOfTime && /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setAsOfTime(""),
              className: "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs px-1 font-bold",
              children: "✕"
            }
          ),
          /* @__PURE__ */ jsx("button", { onClick: applyDate, className: "px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold uppercase transition-colors shadow-md shadow-indigo-500/10", children: "Reconstruct" })
        ] })
      ] }),
      meta.note && /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2.5 px-4 py-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 rounded-xl text-xs text-amber-700 dark:text-amber-400 shrink-0", children: [
        /* @__PURE__ */ jsx(Info, { size: 15, className: "shrink-0 mt-0.5" }),
        /* @__PURE__ */ jsx("span", { className: "leading-relaxed", children: meta.note })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0", children: stats.map((s, i) => {
        let colorClass = "text-indigo-500 bg-indigo-500/10";
        if (s.label.includes("Value")) colorClass = "text-emerald-500 bg-emerald-500/10";
        if (s.label.includes("Quantity")) colorClass = "text-blue-500 bg-blue-500/10";
        return /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-wider", children: s.label }),
            /* @__PURE__ */ jsx("h3", { className: "text-xl font-black text-slate-800 dark:text-white tracking-tight mt-1", children: s.value })
          ] }),
          /* @__PURE__ */ jsx("div", { className: `p-2.5 rounded-xl ${colorClass} shrink-0`, children: statIcon(s.label) })
        ] }, i);
      }) }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 xl:grid-cols-4 gap-6 flex-1 min-h-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "xl:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden min-h-0", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50/50 dark:bg-slate-800/30 gap-4 shrink-0", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider", children: "Inventory Snapshot" }),
            /* @__PURE__ */ jsxs("div", { className: "relative w-full sm:w-64", children: [
              /* @__PURE__ */ jsx(Search, { className: "absolute left-2.5 top-2.5 text-slate-400", size: 14 }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  placeholder: "Search catalog snapshot...",
                  value: search,
                  onChange: (e) => setSearch(e.target.value),
                  className: "pl-8 pr-3 py-1.5 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/20 flex gap-1.5 overflow-x-auto shrink-0 scrollbar-none", children: [
            { id: "all", label: "All Products", styles: "hover:bg-slate-100 dark:hover:bg-slate-800" },
            { id: "out", label: "Out of Stock", styles: "hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20" },
            { id: "low", label: "Low Stock (≤15)", styles: "hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/20" },
            { id: "healthy", label: "Healthy (16-200)", styles: "hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/20" },
            { id: "over", label: "Overstocked (>200)", styles: "hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/20" }
          ].map((opt) => {
            const isActive = statusFilter === opt.id;
            let activeStyles = "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 " + opt.styles;
            if (isActive) {
              if (opt.id === "out") activeStyles = "bg-rose-600 border-rose-600 text-white shadow-sm";
              else if (opt.id === "low") activeStyles = "bg-amber-500 border-amber-500 text-white shadow-sm";
              else if (opt.id === "healthy") activeStyles = "bg-emerald-600 border-emerald-600 text-white shadow-sm";
              else if (opt.id === "over") activeStyles = "bg-blue-600 border-blue-600 text-white shadow-sm";
              else activeStyles = "bg-slate-800 border-slate-800 dark:bg-slate-200 dark:border-slate-200 text-white dark:text-slate-900 shadow-sm";
            }
            return /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setStatusFilter(opt.id),
                className: `px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border whitespace-nowrap ${activeStyles}`,
                children: opt.label
              },
              opt.id
            );
          }) }),
          /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm text-left", children: [
            /* @__PURE__ */ jsx("thead", { className: "text-xs text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/50 sticky top-0 backdrop-blur-sm z-10 border-b border-slate-100 dark:border-slate-800", children: /* @__PURE__ */ jsx("tr", { children: [
              { key: "name", label: "Product" },
              { key: "quantity", label: "Qty", align: "right" },
              { key: "stock_value", label: "Value", align: "right" }
            ].map((col) => /* @__PURE__ */ jsxs(
              "th",
              {
                onClick: () => toggleSort(col.key),
                className: `px-6 py-3 font-bold cursor-pointer select-none hover:text-indigo-500 ${col.align === "right" ? "text-right" : ""}`,
                children: [
                  col.label,
                  " ",
                  sortKey === col.key && (sortDir === "asc" ? "↑" : "↓")
                ]
              },
              col.key
            )) }) }),
            /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: filtered.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 3, className: "px-6 py-12 text-center text-slate-400 italic", children: "No inventory matches search criteria." }) }) : filtered.map((row, idx) => {
              const qty = row.quantity || 0;
              let statusBadge = null;
              if (qty <= 0) statusBadge = /* @__PURE__ */ jsx("span", { className: "text-[9px] bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 px-1.5 py-0.5 rounded font-black uppercase tracking-wider shrink-0 ml-1.5", children: "Out" });
              else if (qty <= 15) statusBadge = /* @__PURE__ */ jsx("span", { className: "text-[9px] bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 px-1.5 py-0.5 rounded font-black uppercase tracking-wider shrink-0 ml-1.5", children: "Low" });
              return /* @__PURE__ */ jsxs(
                "tr",
                {
                  className: "hover:bg-indigo-50/50 dark:hover:bg-slate-850/40 transition-colors cursor-pointer group",
                  onClick: () => handleSelectItem(row),
                  children: [
                    /* @__PURE__ */ jsxs("td", { className: "px-6 py-3", children: [
                      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
                        /* @__PURE__ */ jsx("span", { className: "font-bold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors", children: row.name }),
                        statusBadge
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "text-[10px] text-slate-400 font-mono mt-0.5", children: [
                        row.sku,
                        " • ",
                        /* @__PURE__ */ jsx("span", { className: "font-sans font-medium text-slate-400/80", children: row.category })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsx("td", { className: "px-6 py-3 text-right font-mono font-semibold text-slate-600 dark:text-slate-300", children: qty }),
                    /* @__PURE__ */ jsxs("td", { className: "px-6 py-3 text-right", children: [
                      /* @__PURE__ */ jsx("span", { className: "font-mono font-bold text-slate-700 dark:text-slate-200 block", children: formatCurrency(row.stock_value, store) }),
                      /* @__PURE__ */ jsxs("span", { className: "text-[9px] text-slate-400 font-mono", children: [
                        "@",
                        formatCurrency(row.unit_cost, store)
                      ] })
                    ] })
                  ]
                },
                row.product_id || idx
              );
            }) })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "xl:col-span-1 flex flex-col gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col min-h-[300px]", children: [
            /* @__PURE__ */ jsxs("h3", { className: "text-xs font-bold text-slate-500 uppercase mb-4 flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(PieChart, { size: 14 }),
              " Value Distribution"
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex-1 relative", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: 180, minWidth: 1, minHeight: 1, children: /* @__PURE__ */ jsxs(PieChart$1, { children: [
              /* @__PURE__ */ jsx(Pie, { data: pieData, cx: "50%", cy: "50%", innerRadius: 50, outerRadius: 70, paddingAngle: 4, dataKey: "value", children: pieData.map((entry, index) => /* @__PURE__ */ jsx(Cell, { fill: entry.color, stroke: "none" }, `cell-${index}`)) }),
              /* @__PURE__ */ jsx(Tooltip, { formatter: (val) => formatCurrency(val, store), contentStyle: { backgroundColor: "#1e293b", border: "none", borderRadius: "8px", color: "#fff" }, itemStyle: { color: "#fff" } }),
              /* @__PURE__ */ jsx(Legend, { verticalAlign: "bottom", height: 36, iconType: "circle", wrapperStyle: { fontSize: "9px" } })
            ] }) }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-indigo-900 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden", children: [
            /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" }),
            /* @__PURE__ */ jsxs("div", { className: "relative z-10", children: [
              /* @__PURE__ */ jsxs("h3", { className: "text-xs font-bold opacity-90 mb-2 flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(HelpCircle, { size: 14 }),
                " Valuation Logic"
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-xs opacity-80 leading-relaxed space-y-2", children: [
                /* @__PURE__ */ jsx("p", { children: "Your stock value is calculated by reconstructing the full historical movement ledger in FIFO order down to the exact second selected." }),
                /* @__PURE__ */ jsxs("div", { className: "mt-2 pt-2 border-t border-white/10 flex items-center gap-1 font-bold text-emerald-300", children: [
                  /* @__PURE__ */ jsx(ShieldCheck, { size: 14 }),
                  " Audit Trail Guaranteed"
                ] })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "xl:col-span-1 flex flex-col gap-4 h-full", children: /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-2xl border border-slate-700 shadow-lg text-white h-full relative overflow-hidden flex flex-col justify-between", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("h3", { className: "text-base font-black uppercase tracking-tight mb-2 flex items-center gap-2 text-emerald-400", children: [
              /* @__PURE__ */ jsx(Zap, { size: 18, fill: "currentColor" }),
              " Stock Intelligence"
            ] }),
            auditResult ? /* @__PURE__ */ jsxs("div", { className: "space-y-3 animate-in fade-in duration-300", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("span", { className: "text-[10px] text-slate-400 font-bold block uppercase", children: "Health Score" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-2xl font-black text-emerald-400", children: [
                    auditResult.score,
                    "/100"
                  ] })
                ] }),
                auditResult.score >= 80 ? /* @__PURE__ */ jsx(ShieldCheck, { className: "text-emerald-400", size: 32 }) : /* @__PURE__ */ jsx(AlertTriangle, { className: "text-amber-400", size: 32 })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2 text-[10px]", children: [
                /* @__PURE__ */ jsxs("div", { className: "bg-white/5 p-2 rounded-lg text-center", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-rose-400 font-bold text-sm block", children: auditResult.outOfStockCount }),
                  /* @__PURE__ */ jsx("span", { className: "text-slate-400 uppercase tracking-wide", children: "Out of stock" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "bg-white/5 p-2 rounded-lg text-center", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-amber-400 font-bold text-sm block", children: auditResult.lowStockCount }),
                  /* @__PURE__ */ jsx("span", { className: "text-slate-400 uppercase tracking-wide", children: "Low stock" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-white/5 p-3 rounded-xl border border-white/10 space-y-1", children: [
                /* @__PURE__ */ jsxs("h4", { className: "text-[10px] font-bold text-emerald-300 uppercase flex items-center gap-1.5", children: [
                  /* @__PURE__ */ jsx(DollarSign, { size: 10 }),
                  " Capital Leaks"
                ] }),
                /* @__PURE__ */ jsxs("p", { className: "text-[11px] text-slate-300 leading-relaxed", children: [
                  "Estimated carrying costs for overstocked assets: ",
                  /* @__PURE__ */ jsxs("strong", { className: "text-white", children: [
                    formatCurrency(auditResult.potentialBleed, store),
                    " / yr"
                  ] }),
                  "."
                ] })
              ] })
            ] }) : /* @__PURE__ */ jsxs("div", { className: "bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/10 space-y-2", children: [
              /* @__PURE__ */ jsxs("h4", { className: "text-xs font-bold text-indigo-300 mb-1 flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(Activity, { size: 12 }),
                " AI Auditor"
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-[11px] text-slate-300 leading-relaxed", children: "Run the automated snapshot auditor to evaluate inventory turnover and capital leaks." })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2 pt-2 border-t border-white/10", children: [
              /* @__PURE__ */ jsx("h4", { className: "text-[10px] font-black uppercase text-slate-400 tracking-wider", children: "Tied-Up Capital (Top Value)" }),
              topTiedProducts.map((p, idx) => /* @__PURE__ */ jsxs(
                "div",
                {
                  onClick: () => handleSelectItem(p),
                  className: "flex justify-between items-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-2 text-[11px] transition-all cursor-pointer group",
                  children: [
                    /* @__PURE__ */ jsx("span", { className: "text-slate-300 font-medium truncate w-32 group-hover:text-indigo-400", children: p.name }),
                    /* @__PURE__ */ jsx("span", { className: "font-mono text-emerald-400 font-bold", children: formatCurrency(p.stock_value, store) })
                  ]
                },
                idx
              ))
            ] })
          ] }),
          /* @__PURE__ */ jsxs("button", { onClick: runInventoryAudit, disabled: isAuditing, className: "w-full mt-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase tracking-wide transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-wait shrink-0", children: [
            isAuditing ? /* @__PURE__ */ jsx("span", { className: "animate-spin mr-1", children: "⌛" }) : /* @__PURE__ */ jsx(Zap, { size: 15, fill: "currentColor" }),
            isAuditing ? "Auditing Snapshot..." : "Run Snapshot Audit"
          ] })
        ] }) })
      ] }),
      selectedItem && (() => {
        (selectedItem.quantity || 0) <= 0 ? "Out of Stock" : (selectedItem.quantity || 0) <= 15 ? "Low Stock" : "Healthy";
        return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200", children: /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-indigo-600 p-5 text-white relative overflow-hidden shrink-0", children: [
            /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" }),
            /* @__PURE__ */ jsxs("div", { className: "relative z-10 flex justify-between items-center", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxs("span", { className: "bg-indigo-500/50 text-white border border-indigo-400/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider", children: [
                  "Reconstructed Snapshot: ",
                  asOfDate,
                  " ",
                  asOfTime || "23:59:59"
                ] }),
                /* @__PURE__ */ jsx("h2", { className: "text-2xl font-black tracking-tight mt-1", children: selectedItem.name }),
                /* @__PURE__ */ jsxs("p", { className: "text-indigo-100 text-xs font-semibold", children: [
                  "SKU: ",
                  /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: selectedItem.sku || "N/A" }),
                  " • Category: ",
                  /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: selectedItem.category || "N/A" })
                ] })
              ] }),
              /* @__PURE__ */ jsx("button", { onClick: () => handleSelectItem(null), className: "text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-lg", children: /* @__PURE__ */ jsx(X, { size: 18 }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-6 space-y-6 overflow-y-auto flex-1 text-sm", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-4 gap-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50", children: [
                /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-400 uppercase", children: "Stock Quantity" }),
                /* @__PURE__ */ jsx("p", { className: "text-2xl font-black text-slate-800 dark:text-white mt-1", children: selectedItem.quantity })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50", children: [
                /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-400 uppercase", children: "Unit Valuation Cost" }),
                /* @__PURE__ */ jsx("p", { className: "text-2xl font-black text-slate-800 dark:text-white mt-1", children: formatCurrency(selectedItem.unit_cost, store) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50", children: [
                /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-400 uppercase", children: "Valuation Basis" }),
                /* @__PURE__ */ jsx("p", { className: "text-2xl font-black text-indigo-500 dark:text-indigo-400 mt-1", children: "FIFO cost" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50", children: [
                /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-400 uppercase", children: "Total Stock Value" }),
                /* @__PURE__ */ jsx("p", { className: "text-2xl font-black text-emerald-500 mt-1", children: formatCurrency(selectedItem.stock_value, store) })
              ] })
            ] }),
            isLoadingDetails ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center py-20 text-indigo-500 gap-3", children: [
              /* @__PURE__ */ jsx("span", { className: "animate-spin text-3xl", children: "⌛" }),
              /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-slate-400 uppercase tracking-widest", children: "Querying Ledger..." })
            ] }) : /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-12 gap-6", children: [
              /* @__PURE__ */ jsxs("div", { className: "md:col-span-6 flex flex-col", children: [
                /* @__PURE__ */ jsxs("h4", { className: "text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5", children: [
                  /* @__PURE__ */ jsx(Layers, { size: 13 }),
                  " Active FIFO Cost Layers"
                ] }),
                modalDetails.batches.length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-8 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 text-center text-slate-400 italic", children: "No cost layers—item is out of stock." }) : /* @__PURE__ */ jsx("div", { className: "border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-xs text-left", children: [
                  /* @__PURE__ */ jsx("thead", { className: "bg-slate-50 dark:bg-slate-800 text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700", children: /* @__PURE__ */ jsxs("tr", { children: [
                    /* @__PURE__ */ jsx("th", { className: "py-2.5 px-3", children: "Batch ID" }),
                    /* @__PURE__ */ jsx("th", { className: "py-2.5 px-3 text-right", children: "Cost Price" }),
                    /* @__PURE__ */ jsx("th", { className: "py-2.5 px-3 text-right", children: "Remaining Qty" }),
                    /* @__PURE__ */ jsx("th", { className: "py-2.5 px-3 text-right", children: "Remaining Value" })
                  ] }) }),
                  /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: modalDetails.batches.map((b, idx) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-50 dark:hover:bg-slate-800/20", children: [
                    /* @__PURE__ */ jsxs("td", { className: "py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-200", children: [
                      b.id,
                      /* @__PURE__ */ jsxs("span", { className: "block text-[9px] text-slate-400 font-mono", children: [
                        "Inwarded ",
                        b.date
                      ] })
                    ] }),
                    /* @__PURE__ */ jsx("td", { className: "py-2.5 px-3 text-right font-mono text-slate-500 font-bold", children: formatCurrency(b.cost, store) }),
                    /* @__PURE__ */ jsxs("td", { className: "py-2.5 px-3 text-right font-mono text-slate-500 font-semibold", children: [
                      b.qtyLeft,
                      " ",
                      /* @__PURE__ */ jsxs("span", { className: "text-[10px] text-slate-400", children: [
                        "/ ",
                        b.receivedQty
                      ] })
                    ] }),
                    /* @__PURE__ */ jsx("td", { className: "py-2.5 px-3 text-right font-mono font-bold text-slate-600 dark:text-slate-300", children: formatCurrency(b.qtyLeft * b.cost, store) })
                  ] }, idx)) })
                ] }) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "md:col-span-6 flex flex-col", children: [
                /* @__PURE__ */ jsxs("h4", { className: "text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5", children: [
                  /* @__PURE__ */ jsx(Activity, { size: 13 }),
                  " Reconstruction Audit Trail"
                ] }),
                modalDetails.ledger.length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-8 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 text-center text-slate-400 italic", children: "No stock movement ledger transactions found." }) : /* @__PURE__ */ jsx("div", { className: "border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-xs text-left", children: [
                  /* @__PURE__ */ jsx("thead", { className: "bg-slate-50 dark:bg-slate-800 text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700", children: /* @__PURE__ */ jsxs("tr", { children: [
                    /* @__PURE__ */ jsx("th", { className: "py-2.5 px-3", children: "Date" }),
                    /* @__PURE__ */ jsx("th", { className: "py-2.5 px-3", children: "Transaction" }),
                    /* @__PURE__ */ jsx("th", { className: "py-2.5 px-3", children: "Reference" }),
                    /* @__PURE__ */ jsx("th", { className: "py-2.5 px-3 text-right", children: "Delta Qty" })
                  ] }) }),
                  /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: modalDetails.ledger.map((l, idx) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-50 dark:hover:bg-slate-800/20", children: [
                    /* @__PURE__ */ jsx("td", { className: "py-2.5 px-3 text-slate-500 font-mono", children: l.date }),
                    /* @__PURE__ */ jsxs("td", { className: "py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-200", children: [
                      l.type,
                      /* @__PURE__ */ jsxs("span", { className: "block text-[9px] text-slate-400 font-sans", children: [
                        "by ",
                        l.user
                      ] })
                    ] }),
                    /* @__PURE__ */ jsx("td", { className: "py-2.5 px-3 font-mono text-slate-500", children: l.ref }),
                    /* @__PURE__ */ jsx("td", { className: `py-2.5 px-3 text-right font-mono font-bold ${l.qty.startsWith("+") ? "text-emerald-600" : "text-rose-500"}`, children: l.qty })
                  ] }, idx)) })
                ] }) })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end shrink-0", children: /* @__PURE__ */ jsx("button", { onClick: () => handleSelectItem(null), className: "px-5 py-2 bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs sm:text-sm font-bold rounded-lg transition-colors", children: "Close" }) })
        ] }) });
      })()
    ] })
  ] });
}
export {
  PointInTimeInventory as default
};

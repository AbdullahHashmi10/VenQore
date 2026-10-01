import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import { usePage, Link } from "@inertiajs/react";
import { TrendingUp, ChevronDown, AlertTriangle, Sparkles, RefreshCw, Users, Package, Wallet, CheckCircle2, ChevronRight, MessageCircle, Eye, X, ArrowUpRight } from "lucide-react";
import { f as formatCurrency } from "./format-Dor_DYzH.js";
import { v as vq } from "./runtime-zM7XrUga.js";
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Area } from "recharts";
import { createPortal } from "react-dom";
import axios from "axios";
import { u as useTermText } from "./terms-BnWz3Igl.js";
const ChartSection = ({ isDarkMode, salesData }) => {
  const { store, settings } = usePage().props;
  const [activeTab, setActiveTab] = useState("Today");
  const chartData = salesData[activeTab] || [];
  const totalSales = chartData.reduce((sum, item) => sum + (item.sales || 0), 0);
  const totalProfit = chartData.reduce((sum, item) => sum + (item.profit || 0), 0);
  return /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-lg p-5 sm:p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-none border border-line h-full flex flex-col relative group", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4 z-10", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 flex-wrap", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("div", { className: "p-1.5 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand-600", children: /* @__PURE__ */ jsx(TrendingUp, { size: 16 }) }),
          /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold text-ink", children: "Revenue Analytics" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-xs", children: [
          /* @__PURE__ */ jsx("div", { className: "w-3 h-3 rounded-full bg-brand-500" }),
          /* @__PURE__ */ jsx("span", { className: "font-bold text-ink-secondary", children: "Sales" }),
          /* @__PURE__ */ jsx("span", { className: "font-bold text-brand-600 dark:text-brand-400", children: formatCurrency(totalSales, store || settings) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-xs", children: [
          /* @__PURE__ */ jsx("div", { className: "w-3 h-3 rounded-full bg-emerald-500" }),
          /* @__PURE__ */ jsx("span", { className: "font-bold text-ink-secondary", children: "Gross Profit" }),
          /* @__PURE__ */ jsx("span", { className: "font-bold text-emerald-600 dark:text-emerald-400", children: formatCurrency(totalProfit, store || settings) })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex bg-sunken p-1 rounded-xl", children: ["Today", "Month", "Year"].map((tab) => /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setActiveTab(tab),
          className: `px-3 py-1 text-xs font-bold rounded-lg transition-all ${activeTab === tab ? "bg-sunken shadow-sm text-brand-600" : "text-ink-muted hover:text-ink-secondary dark:hover:text-neutral-300"}`,
          children: tab
        },
        tab
      )) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex-1 w-full relative min-h-[300px]", children: /* @__PURE__ */ jsx("div", { className: "w-full h-[300px] lg:absolute lg:inset-0 lg:h-auto", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", minWidth: 100, minHeight: 100, children: /* @__PURE__ */ jsxs(AreaChart, { data: chartData, margin: { top: 10, right: 10, left: -20, bottom: 0 }, children: [
      /* @__PURE__ */ jsxs("defs", { children: [
        /* @__PURE__ */ jsxs("linearGradient", { id: "colorSales", x1: "0", y1: "0", x2: "0", y2: "1", children: [
          /* @__PURE__ */ jsx("stop", { offset: "5%", stopColor: vq.indigo[500], stopOpacity: 0.3 }),
          /* @__PURE__ */ jsx("stop", { offset: "95%", stopColor: vq.indigo[500], stopOpacity: 0 })
        ] }),
        /* @__PURE__ */ jsxs("linearGradient", { id: "colorProfit", x1: "0", y1: "0", x2: "0", y2: "1", children: [
          /* @__PURE__ */ jsx("stop", { offset: "5%", stopColor: vq.emerald[500], stopOpacity: 0.4 }),
          /* @__PURE__ */ jsx("stop", { offset: "95%", stopColor: vq.emerald[500], stopOpacity: 0.05 })
        ] })
      ] }),
      /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", vertical: false, stroke: isDarkMode ? vq.slate[700] : vq.slate[100], strokeOpacity: 0.5 }),
      /* @__PURE__ */ jsx(
        XAxis,
        {
          dataKey: "name",
          axisLine: false,
          tickLine: false,
          tick: { fill: isDarkMode ? vq.slate[400] : vq.slate[400], fontSize: 11, fontWeight: 500 },
          dy: 10
        }
      ),
      /* @__PURE__ */ jsx(
        YAxis,
        {
          axisLine: false,
          tickLine: false,
          tick: { fill: isDarkMode ? vq.slate[400] : vq.slate[400], fontSize: 11, fontWeight: 500 },
          tickFormatter: (value) => `${value}`
        }
      ),
      /* @__PURE__ */ jsx(
        Tooltip,
        {
          content: ({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return /* @__PURE__ */ jsxs("div", { style: {
                backgroundColor: "rgba(15, 23, 42, 0.95)",
                backdropFilter: "blur(8px)",
                borderRadius: "12px",
                border: "1px solid rgba(99, 102, 241, 0.2)",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                padding: "12px 16px"
              }, children: [
                /* @__PURE__ */ jsx("p", { style: { fontSize: "11px", fontWeight: "bold", color: vq.slate[400], marginBottom: "4px" }, children: label }),
                /* @__PURE__ */ jsxs("p", { style: { fontSize: "13px", fontWeight: "bold", color: vq.slate[200], margin: 0 }, children: [
                  "💰 Sales: ",
                  /* @__PURE__ */ jsx("span", { style: { color: vq.indigo[500] }, children: formatCurrency(payload.find((p) => p.dataKey === "sales")?.value || 0, store || settings) })
                ] }),
                /* @__PURE__ */ jsxs("p", { style: { fontSize: "13px", fontWeight: "bold", color: vq.slate[200], margin: 0 }, children: [
                  "✨ Gross Profit: ",
                  /* @__PURE__ */ jsx("span", { style: { color: vq.emerald[500] }, children: formatCurrency(payload.find((p) => p.dataKey === "profit")?.value || 0, store || settings) })
                ] })
              ] });
            }
            return null;
          },
          cursor: { stroke: vq.indigo[500], strokeWidth: 2, strokeDasharray: "5 5" }
        }
      ),
      /* @__PURE__ */ jsx(Area, { type: "monotone", dataKey: "profit", stroke: vq.emerald[500], strokeWidth: 3, fillOpacity: 1, fill: "url(#colorProfit)" }),
      /* @__PURE__ */ jsx(Area, { type: "monotone", dataKey: "sales", stroke: vq.indigo[500], strokeWidth: 3, fillOpacity: 1, fill: "url(#colorSales)" })
    ] }) }) }) })
  ] });
};
const PremiumDropdown = ({ value, options, onChange, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const portalRef = useRef(null);
  const updateCoords = () => {
    if (dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom,
        left: rect.left,
        width: rect.width
      });
    }
  };
  useEffect(() => {
    if (isOpen) {
      updateCoords();
      window.addEventListener("scroll", updateCoords);
      window.addEventListener("resize", updateCoords);
    }
    return () => {
      window.removeEventListener("scroll", updateCoords);
      window.removeEventListener("resize", updateCoords);
    };
  }, [isOpen]);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && (!portalRef.current || !portalRef.current.contains(event.target))) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const selectedOption = options.find((opt) => opt.value === value) || options[0];
  return /* @__PURE__ */ jsxs("div", { className: `relative inline-block text-left ${className}`, ref: dropdownRef, children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        onClick: () => setIsOpen(!isOpen),
        className: "flex items-center gap-2 bg-app px-3 py-1.5 rounded-xl text-xs font-bold text-ink-muted hover:text-brand-600 dark:hover:text-brand-400 transition-all duration-normal border border-transparent hover:border-line dark:hover:border-line-strong shadow-sm active:scale-95",
        children: [
          /* @__PURE__ */ jsx("span", { children: selectedOption.label }),
          /* @__PURE__ */ jsx(ChevronDown, { size: 14, className: `transition-transform duration-slow ${isOpen ? "rotate-180" : ""}` })
        ]
      }
    ),
    isOpen && createPortal(
      /* @__PURE__ */ jsx(
        "div",
        {
          ref: portalRef,
          className: "fixed mt-2 w-32 origin-top-right rounded-[14px] bg-surface shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none z-command overflow-hidden animate-in fade-in zoom-in-95 duration-normal",
          style: {
            top: coords.top,
            left: coords.left + coords.width - 128
            // Align right (w-32 = 128px)
          },
          children: /* @__PURE__ */ jsx("div", { className: "py-1", children: options.map((option) => /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => {
                onChange(option.value);
                setIsOpen(false);
              },
              className: `
                                    flex items-center w-full px-4 py-2.5 text-xs font-bold transition-colors
                                    ${value === option.value ? "bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400" : "text-ink-secondary hover:bg-interactive-hover dark:hover:bg-interactive-hover"}
`,
              children: option.label
            },
            option.value
          )) })
        }
      ),
      document.body
    )
  ] });
};
const TodaysOpportunities = ({ className = "" }) => {
  const { store } = usePage().props;
  const tt = useTermText();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchData = async (refresh = false) => {
    setLoading(true);
    if (!route().has("store.growth-engine.dashboard")) {
      setLoading(false);
      return;
    }
    try {
      if (refresh) {
        await axios.post(route("store.growth-engine.refresh", { store_slug: store.slug }));
      }
      const response = await axios.get(route("store.growth-engine.dashboard", { store_slug: store.slug }));
      setData(response.data);
      setError(null);
    } catch (err) {
      if (err.response && (err.response.status === 403 || err.response.status === 401)) {
        setData(null);
        setError(null);
        setLoading(false);
        return;
      }
      setError("Failed to load opportunities.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1e3);
    return () => clearInterval(interval);
  }, []);
  const dismissTip = async (id) => {
    try {
      await axios.post(route("store.growth-engine.dismiss", [store.slug, id]));
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };
  const openWhatsApp = async (id) => {
    try {
      const response = await axios.get(route("store.growth-engine.whatsapp", [store.slug, id]));
      if (response.data.url) {
        window.open(response.data.url, "_blank");
      }
    } catch (err) {
      console.error(err);
    }
  };
  if (loading && !data) {
    return /* @__PURE__ */ jsx("div", { className: `bg-surface rounded-lg p-5 border border-line shadow-sm flex flex-col justify-center min-h-[300px] ${className}`, children: /* @__PURE__ */ jsxs("div", { className: "animate-pulse space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "w-10 h-10 bg-sunken rounded-xl" }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5 flex-1", children: [
          /* @__PURE__ */ jsx("div", { className: "h-4 bg-sunken rounded w-1/3" }),
          /* @__PURE__ */ jsx("div", { className: "h-3 bg-sunken rounded w-1/2" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2 pt-2", children: [
        /* @__PURE__ */ jsx("div", { className: "h-16 bg-sunken rounded-xl" }),
        /* @__PURE__ */ jsx("div", { className: "h-16 bg-sunken rounded-xl" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "h-24 bg-sunken rounded-xl" })
    ] }) });
  }
  if (error) {
    return /* @__PURE__ */ jsxs("div", { className: `bg-surface rounded-lg p-6 border border-rose-100 dark:border-rose-900/30 shadow-xs text-center ${className}`, children: [
      /* @__PURE__ */ jsx(AlertTriangle, { size: 24, className: "mx-auto text-rose-500 mb-2" }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-rose-600 dark:text-rose-400 font-medium mb-3", children: error }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => fetchData(true),
          className: "px-3 py-1.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-lg hover:bg-rose-100 transition-colors",
          children: "Retry"
        }
      )
    ] });
  }
  if (data?.forbidden || !data) {
    return null;
  }
  const stats = data?.stats || {};
  const recommendations = data?.recommendations || [];
  const getTypeIcon = (type) => {
    switch (type) {
      case "retention":
        return /* @__PURE__ */ jsx(Users, { className: "text-emerald-500", size: 15 });
      case "forecast":
        return /* @__PURE__ */ jsx(Package, { className: "text-amber-500", size: 15 });
      case "churn":
        return /* @__PURE__ */ jsx(AlertTriangle, { className: "text-rose-500", size: 15 });
      case "recovery":
        return /* @__PURE__ */ jsx(Wallet, { className: "text-blue-500", size: 15 });
      default:
        return /* @__PURE__ */ jsx(Sparkles, { className: "text-brand-500", size: 15 });
    }
  };
  const getTypeBadgeClass = (type) => {
    switch (type) {
      case "retention":
        return "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-500/20";
      case "forecast":
        return "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200/50 dark:border-amber-500/20";
      case "churn":
        return "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200/50 dark:border-rose-500/20";
      case "recovery":
        return "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200/50 dark:border-blue-500/20";
      default:
        return "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400 border-brand-200/50 dark:border-brand-500/20";
    }
  };
  const getTypeLabel = (type) => {
    switch (type) {
      case "retention":
        return "Sales Growth";
      case "forecast":
        return "Stock Alert";
      case "churn":
        return tt("Customer Risk");
      case "recovery":
        return "Cash Recovery";
      default:
        return "Action Tip";
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: `bg-surface rounded-lg border border-line shadow-sm overflow-hidden flex flex-col h-full ${className}`, children: [
    /* @__PURE__ */ jsxs("div", { className: "p-4 sm:p-5 border-b border-line bg-sunken", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 min-w-0", children: [
          /* @__PURE__ */ jsx("div", { className: "w-9 h-9 rounded-xl bg-gradient-brand text-white flex items-center justify-center shadow-xs shrink-0", children: /* @__PURE__ */ jsx(Sparkles, { size: 17 }) }),
          /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx("h3", { className: "font-bold text-ink text-sm tracking-tight truncate", children: "Today's Opportunities" }),
              /* @__PURE__ */ jsxs("span", { className: "flex h-2 w-2 relative shrink-0", children: [
                /* @__PURE__ */ jsx("span", { className: "animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" }),
                /* @__PURE__ */ jsx("span", { className: "relative inline-flex rounded-full h-2 w-2 bg-emerald-500" })
              ] })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-3xs text-ink-muted font-medium truncate", children: "AI-powered actions to grow revenue" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 shrink-0", children: [
          data.total_potential_revenue > 0 && /* @__PURE__ */ jsxs("div", { className: "text-right hidden sm:block", children: [
            /* @__PURE__ */ jsxs("p", { className: "text-xs font-bold text-emerald-600 dark:text-emerald-400 leading-tight", children: [
              "+",
              formatCurrency(data.total_potential_revenue || 0, store)
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-3xs font-semibold text-ink-muted uppercase tracking-wider", children: "Potential" })
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => fetchData(true),
              className: "p-1.5 rounded-lg text-ink-muted hover:text-brand-600 hover:bg-white dark:hover:bg-surface transition-colors border border-transparent hover:border-line-strong",
              disabled: loading,
              title: "Run AI Analysis",
              children: /* @__PURE__ */ jsx(RefreshCw, { size: 14, className: loading ? "animate-spin" : "" })
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2 mt-3.5", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white/80 dark:bg-surface rounded-xl p-2.5 border border-line flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "min-w-0 pr-1", children: [
            /* @__PURE__ */ jsx("p", { className: "text-3xs font-bold uppercase tracking-wider text-ink-muted truncate", children: tt("Customers Due") }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5", children: stats.customers_due || 0 })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(Users, { size: 12 }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white/80 dark:bg-surface rounded-xl p-2.5 border border-line flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "min-w-0 pr-1", children: [
            /* @__PURE__ */ jsx("p", { className: "text-3xs font-bold uppercase tracking-wider text-ink-muted truncate", children: "Stock Risks" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-amber-600 dark:text-amber-400 mt-0.5", children: stats.stock_risks || 0 })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "w-6 h-6 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(Package, { size: 12 }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white/80 dark:bg-surface rounded-xl p-2.5 border border-line flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "min-w-0 pr-1", children: [
            /* @__PURE__ */ jsx("p", { className: "text-3xs font-bold uppercase tracking-wider text-ink-muted truncate", children: "At Risk" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-rose-600 dark:text-rose-400 mt-0.5", children: stats.churn_risks || 0 })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "w-6 h-6 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(AlertTriangle, { size: 12 }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white/80 dark:bg-surface rounded-xl p-2.5 border border-line flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "min-w-0 pr-1", children: [
            /* @__PURE__ */ jsx("p", { className: "text-3xs font-bold uppercase tracking-wider text-ink-muted truncate", children: "Overdue" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-blue-600 dark:text-blue-400 mt-0.5", children: stats.overdue_invoices || 0 })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(Wallet, { size: 12 }) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex-1 p-3 space-y-2.5", children: recommendations.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "py-8 px-4 text-center flex flex-col items-center justify-center h-full", children: [
      /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/30 text-brand-500 flex items-center justify-center mb-2.5 shadow-xs", children: /* @__PURE__ */ jsx(CheckCircle2, { size: 24 }) }),
      /* @__PURE__ */ jsx("h4", { className: "font-bold text-ink-secondary dark:text-ink-faint text-xs tracking-tight", children: "All clear for today!" }),
      /* @__PURE__ */ jsx("p", { className: "text-3xs text-ink-muted mt-1 max-w-[220px] leading-relaxed", children: tt("No critical alerts or pending customer opportunities detected.") }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => fetchData(true),
          className: "mt-3 inline-flex items-center gap-1 text-3xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 hover:underline",
          children: [
            /* @__PURE__ */ jsx("span", { children: "Re-run AI Analysis" }),
            /* @__PURE__ */ jsx(ChevronRight, { size: 11 })
          ]
        }
      )
    ] }) : recommendations.slice(0, 8).map((rec) => /* @__PURE__ */ jsx(
      "div",
      {
        className: "p-3 bg-sunken rounded-xl border border-line hover:border-brand-200 dark:hover:border-brand-900/50 hover:bg-white dark:hover:bg-surface transition-all group",
        children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2.5", children: [
          /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-surface rounded-lg shadow-2xs shrink-0 mt-0.5 border border-line", children: getTypeIcon(rec.type) }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-1.5 mb-0.5", children: [
              /* @__PURE__ */ jsx("span", { className: `px-1.5 py-0.5 text-3xs font-bold uppercase tracking-wider rounded-md border ${getTypeBadgeClass(rec.type)}`, children: getTypeLabel(rec.type) }),
              rec.potential_revenue > 0 && /* @__PURE__ */ jsxs("span", { className: "text-3xs font-bold text-emerald-600 dark:text-emerald-400 shrink-0", children: [
                "+",
                formatCurrency(rec.potential_revenue || 0, store)
              ] })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "font-bold text-ink text-xs truncate mt-1", children: rec.title }),
            /* @__PURE__ */ jsx("p", { className: "text-3xs text-ink-muted mt-0.5 line-clamp-2 leading-relaxed", children: rec.message }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 mt-2.5", children: [
              rec.action_type === "whatsapp" && rec.party && /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => openWhatsApp(rec.id),
                  className: "flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-3xs font-bold rounded-lg transition-colors shadow-2xs",
                  children: [
                    /* @__PURE__ */ jsx(MessageCircle, { size: 10 }),
                    /* @__PURE__ */ jsx("span", { children: "WhatsApp" })
                  ]
                }
              ),
              rec.action_url && /* @__PURE__ */ jsxs(
                "a",
                {
                  href: rec.action_url,
                  className: `flex items-center gap-1 px-2.5 py-1 text-white text-3xs font-bold rounded-lg transition-colors shadow-2xs ${rec.action_type === "purchase_order" ? "bg-amber-600 hover:bg-amber-700" : "bg-brand-600 hover:bg-brand-700"}`,
                  children: [
                    rec.action_type === "purchase_order" ? /* @__PURE__ */ jsx(Package, { size: 10 }) : /* @__PURE__ */ jsx(Eye, { size: 10 }),
                    /* @__PURE__ */ jsx("span", { children: rec.action_type === "purchase_order" ? "Order Stock" : "View Details" })
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => dismissTip(rec.id),
                  className: "flex items-center gap-1 px-2 py-1 bg-surface hover:bg-interactive-hover text-ink-muted hover:text-ink text-3xs font-bold rounded-lg transition-colors border border-line ml-auto",
                  title: "Dismiss",
                  children: [
                    /* @__PURE__ */ jsx(X, { size: 10 }),
                    /* @__PURE__ */ jsx("span", { children: "Dismiss" })
                  ]
                }
              )
            ] })
          ] })
        ] })
      },
      rec.id
    )) }),
    /* @__PURE__ */ jsx("div", { className: "p-3 border-t border-line bg-sunken dark:bg-surface text-center shrink-0", children: /* @__PURE__ */ jsxs(
      Link,
      {
        href: route("store.growth-engine.dashboard", { store_slug: store.slug }),
        className: "text-3xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 inline-flex items-center justify-center gap-1 hover:underline",
        children: [
          /* @__PURE__ */ jsx("span", { children: "Open Full Growth Engine" }),
          /* @__PURE__ */ jsx(ArrowUpRight, { size: 12 })
        ]
      }
    ) })
  ] });
};
export {
  ChartSection as C,
  PremiumDropdown as P,
  TodaysOpportunities as T
};

import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect, useCallback } from "react";
import { usePage, router, Head } from "@inertiajs/react";
import { f as formatCurrency$1, g as getCurrencySymbol, a as formatNumber } from "./format-B_ph0Qec.js";
import { v as vq, O as OneGlanceLayout } from "./marketing-pages-DYgr6x02.js";
import { ChevronDown, TrendingUp, CalendarDays, Banknote, Building2, CreditCard, Smartphone, Hash, FileText, CheckCircle2, ArrowDownCircle, ArrowUpCircle, Search, X, User, Minus, TrendingDown, Wallet, MoreHorizontal, ArrowDownRight, ArrowUpRight, Plus, Box, Landmark, RefreshCw, Tag, UserPlus, FileMinus, LogOut, Truck, Sparkles, Rocket, ArrowRight, ArrowLeft, ChevronLeft } from "lucide-react";
import { createPortal } from "react-dom";
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Area } from "recharts";
import { F as FormModal } from "../ssr.js";
import axios from "axios";
import { T as TodaysOpportunities } from "./TodaysOpportunities-DWOMQx9Y.js";
import "marked";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "dexie";
import "laravel-echo";
import "pusher-js";
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
        className: "flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 shadow-sm active:scale-95",
        children: [
          /* @__PURE__ */ jsx("span", { children: selectedOption.label }),
          /* @__PURE__ */ jsx(ChevronDown, { size: 14, className: `transition-transform duration-300 ${isOpen ? "rotate-180" : ""}` })
        ]
      }
    ),
    isOpen && createPortal(
      /* @__PURE__ */ jsx(
        "div",
        {
          ref: portalRef,
          className: "fixed mt-2 w-32 origin-top-right rounded-2xl bg-white dark:bg-slate-800 shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none z-[9999] overflow-hidden animate-in fade-in zoom-in-95 duration-200",
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
                                    ${value === option.value ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"}
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
const DualStatCard = ({
  title,
  leftLabel,
  leftValue,
  rightLabel,
  rightValue,
  value,
  subValue,
  // Single stat props
  icon: Icon,
  colorClass,
  color,
  period = "Today",
  onPeriodChange,
  delay = 0,
  compact = false,
  onLeftClick,
  onRightClick
}) => {
  const baseColor = color || (colorClass ? colorClass.split("-")[1] : "indigo");
  const bgClass = colorClass || `bg-${baseColor}-500`;
  const textClass = `text-${baseColor}-600`;
  const bgOpacityClass = `bg-${baseColor}-50`;
  const isSingle = !!value;
  if (compact || isSingle) {
    return /* @__PURE__ */ jsxs(
      "div",
      {
        className: "bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-none border border-slate-100 dark:border-slate-800 relative overflow-hidden group hover:-translate-y-0.5 transition-transform duration-300",
        style: { animationDelay: `${delay}ms` },
        children: [
          /* @__PURE__ */ jsx("div", { className: `absolute -right-6 -top-6 w-20 h-20 ${bgClass} opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 ease-in-out` }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between relative z-10 w-full", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: `p-2 rounded-xl ${bgOpacityClass} dark:bg-opacity-10 ${textClass}`, children: /* @__PURE__ */ jsx(Icon, { size: 18, className: "text-current" }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h3", { className: "font-bold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wide", children: title }),
                subValue && /* @__PURE__ */ jsx("p", { className: "text-2xs font-medium text-slate-400", children: subValue })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              onPeriodChange && /* @__PURE__ */ jsx(
                PremiumDropdown,
                {
                  value: period,
                  onChange: onPeriodChange,
                  options: [
                    { value: "Today", label: "Today" },
                    { value: "Month", label: "Month" },
                    { value: "Year", label: "Year" },
                    { value: "All Time", label: "All Time" }
                  ]
                }
              ),
              /* @__PURE__ */ jsx("p", { className: `text-2xl font-bold text-slate-800 dark:text-white tracking-tight`, children: value })
            ] })
          ] })
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: "bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-none border border-slate-100 dark:border-slate-800 relative overflow-hidden group hover:-translate-y-0.5 transition-transform duration-300 h-full flex flex-col justify-center gap-2",
      style: { animationDelay: `${delay}ms` },
      children: [
        /* @__PURE__ */ jsx("div", { className: `absolute -right-4 -top-4 w-20 h-20 ${bgClass} opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 ease-in-out` }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 relative z-10 shrink-0", children: [
          /* @__PURE__ */ jsx("div", { className: `p-2 rounded-xl ${bgOpacityClass} dark:bg-opacity-10 ${textClass}`, children: /* @__PURE__ */ jsx(Icon, { size: 18, className: "text-current" }) }),
          /* @__PURE__ */ jsx("h3", { className: "font-bold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wide", children: title }),
          onPeriodChange && /* @__PURE__ */ jsx("div", { className: "ml-auto", children: /* @__PURE__ */ jsx(
            PremiumDropdown,
            {
              value: period,
              onChange: onPeriodChange,
              options: [
                { value: "Today", label: "Today" },
                { value: "Month", label: "Month" },
                { value: "Year", label: "Year" },
                { value: "All Time", label: "All Time" }
              ]
            }
          ) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 relative z-10 grow items-center", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute left-1/2 top-1 bottom-1 w-px bg-slate-100 dark:bg-slate-800 -translate-x-1/2" }),
          /* @__PURE__ */ jsxs("div", { className: `text-center ${onLeftClick ? "cursor-pointer hover:scale-105 transition-transform" : ""}`, onClick: onLeftClick, children: [
            /* @__PURE__ */ jsx("p", { className: "text-2xs uppercase font-bold text-slate-400 mb-1 tracking-wider", children: leftLabel }),
            /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-slate-800 dark:text-white tracking-tight leading-none", children: leftValue })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: `text-center ${onRightClick ? "cursor-pointer hover:scale-105 transition-transform" : ""}`, onClick: onRightClick, children: [
            /* @__PURE__ */ jsx("p", { className: "text-2xs uppercase font-bold text-slate-400 mb-1 tracking-wider", children: rightLabel }),
            /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-slate-800 dark:text-white tracking-tight leading-none", children: rightValue })
          ] })
        ] })
      ]
    }
  );
};
const ChartSection = ({ isDarkMode, salesData }) => {
  const { store, settings } = usePage().props;
  const [activeTab, setActiveTab] = useState("Today");
  const chartData = salesData[activeTab] || [];
  const totalSales = chartData.reduce((sum, item) => sum + (item.sales || 0), 0);
  const totalProfit = chartData.reduce((sum, item) => sum + (item.profit || 0), 0);
  return /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-800 h-full flex flex-col relative group", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4 z-10", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 flex-wrap", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("div", { className: "p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600", children: /* @__PURE__ */ jsx(TrendingUp, { size: 16 }) }),
          /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold text-slate-800 dark:text-white", children: "Revenue Analytics" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-xs", children: [
          /* @__PURE__ */ jsx("div", { className: "w-3 h-3 rounded-full bg-indigo-500" }),
          /* @__PURE__ */ jsx("span", { className: "font-bold text-slate-600 dark:text-slate-400", children: "Sales" }),
          /* @__PURE__ */ jsx("span", { className: "font-bold text-indigo-600 dark:text-indigo-400", children: formatCurrency$1(totalSales, store || settings) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-xs", children: [
          /* @__PURE__ */ jsx("div", { className: "w-3 h-3 rounded-full bg-emerald-500" }),
          /* @__PURE__ */ jsx("span", { className: "font-bold text-slate-600 dark:text-slate-400", children: "Gross Profit" }),
          /* @__PURE__ */ jsx("span", { className: "font-bold text-emerald-600 dark:text-emerald-400", children: formatCurrency$1(totalProfit, store || settings) })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl", children: ["Today", "Month", "Year"].map((tab) => /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setActiveTab(tab),
          className: `px-3 py-1 text-xs font-bold rounded-lg transition-all ${activeTab === tab ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`,
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
                  /* @__PURE__ */ jsx("span", { style: { color: vq.indigo[500] }, children: formatCurrency$1(payload.find((p) => p.dataKey === "sales")?.value || 0, store || settings) })
                ] }),
                /* @__PURE__ */ jsxs("p", { style: { fontSize: "13px", fontWeight: "bold", color: vq.slate[200], margin: 0 }, children: [
                  "✨ Gross Profit: ",
                  /* @__PURE__ */ jsx("span", { style: { color: vq.emerald[500] }, children: formatCurrency$1(payload.find((p) => p.dataKey === "profit")?.value || 0, store || settings) })
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
const formatCurrency = (v, symbol = "Rs") => symbol + " " + new Intl.NumberFormat("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v || 0);
const AC_OFF_NAME = "party-search-" + Math.random().toString(36).slice(2);
const METHODS = [
  { value: "cash", label: "Cash", icon: Banknote },
  { value: "bank", label: "Bank", icon: Building2 },
  { value: "card", label: "Card", icon: CreditCard },
  { value: "upi", label: "UPI/JazzCash", icon: Smartphone }
];
function PartySearchField({ selectedParty, onSelect, onClear, store, isIn }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [defaultResults, setDefaultResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);
  useEffect(() => {
    axios.get(route("store.parties.search", { store_slug: store.slug }), { params: {} }).then((res) => setDefaultResults((res.data || []).slice(0, 5))).catch(() => {
    });
  }, [store.slug]);
  const search = useCallback(async (q) => {
    setLoading(true);
    try {
      const res = await axios.get(route("store.parties.search", { store_slug: store.slug }), { params: q ? { search: q } : {} });
      setResults(res.data || []);
      setOpen(true);
    } catch (e) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [store.slug]);
  const handleInput = (e) => {
    const q = e.target.value;
    setQuery(q);
    if (selectedParty) onClear();
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(q), 220);
  };
  const handleFocus = () => {
    if (!query) {
      setResults(defaultResults);
      setOpen(defaultResults.length > 0);
    } else {
      setOpen(results.length > 0);
    }
  };
  const handleSelect = (party) => {
    setQuery(party.name);
    setOpen(false);
    setResults([]);
    onSelect(party);
  };
  const handleClear = () => {
    setQuery("");
    setResults(defaultResults);
    setOpen(false);
    onClear();
  };
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const balanceBadge = () => {
    if (!selectedParty) return null;
    const bal = parseFloat(selectedParty.current_balance || 0);
    const dir = selectedParty.balance_direction || (bal > 0 ? "To Receive" : bal < 0 ? "To Pay" : "Settled");
    if (Math.abs(bal) < 0.01) return /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-2xs font-bold", children: [
      /* @__PURE__ */ jsx(Minus, { size: 10 }),
      " Settled"
    ] });
    const isReceive = dir === "To Receive";
    return /* @__PURE__ */ jsxs("span", { className: `inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold ${isReceive ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"}`, children: [
      isReceive ? /* @__PURE__ */ jsx(TrendingUp, { size: 10 }) : /* @__PURE__ */ jsx(TrendingDown, { size: 10 }),
      dir,
      ": ",
      formatCurrency(Math.abs(bal), store?.currency_symbol)
    ] });
  };
  return /* @__PURE__ */ jsxs("div", { ref: containerRef, className: "relative", children: [
    /* @__PURE__ */ jsxs("div", { style: { outline: "none" }, className: `flex items-center gap-2 w-full px-3 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border ${selectedParty ? isIn ? "border-emerald-500" : "border-rose-500" : "border-slate-200 dark:border-slate-700"} transition-all focus-within:border-indigo-500`, children: [
      /* @__PURE__ */ jsx(Search, { size: 15, className: "text-slate-400 shrink-0" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "text",
          name: AC_OFF_NAME,
          value: query,
          onChange: handleInput,
          onFocus: handleFocus,
          placeholder: "Click or type name / phone...",
          className: "flex-1 bg-transparent border-none outline-none text-sm text-slate-800 dark:text-white placeholder-slate-400",
          autoComplete: "new-password",
          style: { outline: "none", boxShadow: "none" }
        }
      ),
      loading && /* @__PURE__ */ jsx("div", { className: `w-4 h-4 border-2 border-slate-300 ${isIn ? "border-t-emerald-500" : "border-t-rose-500"} rounded-full animate-spin shrink-0` }),
      (query || selectedParty) && !loading && /* @__PURE__ */ jsx("button", { type: "button", onClick: handleClear, className: "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition shrink-0", children: /* @__PURE__ */ jsx(X, { size: 14 }) })
    ] }),
    selectedParty && /* @__PURE__ */ jsxs("div", { className: "mt-1.5 flex items-center gap-2 px-1", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsx("div", { className: `w-5 h-5 rounded-full ${isIn ? "bg-emerald-100 dark:bg-emerald-900/40" : "bg-rose-100 dark:bg-rose-900/40"} flex items-center justify-center`, children: /* @__PURE__ */ jsx(User, { size: 10, className: isIn ? "text-emerald-600" : "text-rose-600" }) }),
        /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold text-slate-700 dark:text-slate-300", children: selectedParty.name }),
        selectedParty.type && /* @__PURE__ */ jsx("span", { className: `text-3xs font-bold uppercase px-1.5 py-0.5 rounded-full ${selectedParty.type === "customer" ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" : "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"}`, children: selectedParty.type })
      ] }),
      balanceBadge()
    ] }),
    open && results.length > 0 && /* @__PURE__ */ jsx("div", { className: "absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-50 max-h-56 overflow-auto", children: results.map((party) => {
      const bal = parseFloat(party.current_balance || 0);
      const dir = party.balance_direction || (bal > 0 ? "To Receive" : bal < 0 ? "To Pay" : "Settled");
      const settled = Math.abs(bal) < 0.01;
      return /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: () => handleSelect(party),
          className: "w-full px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-3 transition-colors border-b border-slate-100 dark:border-slate-700/50 last:border-0",
          children: [
            /* @__PURE__ */ jsx("div", { className: `w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${party.type === "customer" ? "bg-blue-100 dark:bg-blue-900/30" : "bg-amber-100 dark:bg-amber-900/30"}`, children: party.type === "customer" ? /* @__PURE__ */ jsx(User, { size: 13, className: "text-blue-600 dark:text-blue-400" }) : /* @__PURE__ */ jsx(Building2, { size: 13, className: "text-amber-600 dark:text-amber-400" }) }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-slate-800 dark:text-white truncate", children: party.name }),
              /* @__PURE__ */ jsx("p", { className: "text-2xs text-slate-400 truncate", children: party.phone || party.email || party.type })
            ] }),
            !settled && /* @__PURE__ */ jsxs("span", { className: `text-2xs font-bold px-1.5 py-0.5 rounded-full shrink-0 ${dir === "To Receive" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`, children: [
              dir,
              ": ",
              formatCurrency(Math.abs(bal), store?.currency_symbol)
            ] }),
            settled && /* @__PURE__ */ jsx("span", { className: "text-2xs font-bold px-1.5 py-0.5 rounded-full shrink-0 bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400", children: "Settled" })
          ]
        },
        party.id
      );
    }) }),
    open && results.length === 0 && !loading && query && /* @__PURE__ */ jsxs("div", { className: "absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 px-4 py-5 text-center", children: [
      /* @__PURE__ */ jsxs("p", { className: "text-sm font-medium text-slate-600 dark:text-slate-400", children: [
        'No contacts found for "',
        query,
        '"'
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 mt-0.5", children: "Try a different name or phone number" })
    ] })
  ] });
}
function PaymentModal({ isOpen, onClose, type = "in", bankAccounts = [], store }) {
  const isIn = type === "in";
  const [loading, setLoading] = useState(false);
  const [selectedParty, setSelectedParty] = useState(null);
  const [formData, setFormData] = useState({
    date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    party_id: "",
    party_name: "",
    amount: "",
    payment_method: "cash",
    bank_account_id: "",
    reference: "",
    description: ""
  });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  useEffect(() => {
    if (isOpen) {
      setFormData({
        date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        party_id: "",
        party_name: "",
        amount: "",
        payment_method: "cash",
        bank_account_id: "",
        reference: "",
        description: ""
      });
      setSelectedParty(null);
      setErrors({});
      setSuccess(false);
    }
  }, [isOpen]);
  const handlePartySelect = (party) => {
    setSelectedParty(party);
    setFormData((prev) => ({ ...prev, party_id: party.id, party_name: party.name }));
  };
  const handlePartyClear = () => {
    setSelectedParty(null);
    setFormData((prev) => ({ ...prev, party_id: "", party_name: "" }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      await axios.post(route("store.payments.store", { store_slug: store.slug }), { ...formData, type });
      setSuccess(true);
      setTimeout(() => {
        onClose();
        router.reload();
      }, 1e3);
    } catch (error) {
      if (error.response?.status === 422) {
        setErrors(error.response.data.errors || {});
      } else {
        alert(error.response?.data?.message || "An error occurred");
      }
    } finally {
      setLoading(false);
    }
  };
  const ringClass = isIn ? "ring-emerald-500/20" : "ring-rose-500/20";
  const buttonBgClass = isIn ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/25" : "bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 shadow-rose-500/25";
  return /* @__PURE__ */ jsx(
    FormModal,
    {
      isOpen,
      onClose,
      title: isIn ? "Record Payment In" : "Record Payment Out",
      subtitle: isIn ? "Money received from a contact" : "Money paid to a contact",
      size: "md",
      confirmClose: !success && (formData.amount || formData.party_id || formData.description),
      children: /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-5", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("label", { className: "block text-2xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5", children: [
            isIn ? "Receive From" : "Pay To",
            " ",
            /* @__PURE__ */ jsx("span", { className: "text-red-500", children: "*" })
          ] }),
          /* @__PURE__ */ jsx(
            PartySearchField,
            {
              selectedParty,
              onSelect: handlePartySelect,
              onClear: handlePartyClear,
              store,
              isIn
            }
          ),
          errors.party_id && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-red-500", children: errors.party_id[0] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("label", { className: "block text-2xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5", children: [
              "Date ",
              /* @__PURE__ */ jsx("span", { className: "text-red-500", children: "*" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(CalendarDays, { size: 14, className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "date",
                  value: formData.date,
                  onChange: (e) => setFormData((p) => ({ ...p, date: e.target.value })),
                  className: `w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 ${ringClass} focus:border-indigo-500 transition`
                }
              )
            ] }),
            errors.date && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-red-500", children: errors.date[0] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("label", { className: "block text-2xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5", children: [
              "Amount ",
              /* @__PURE__ */ jsx("span", { className: "text-red-500", children: "*" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx("span", { className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold", children: getCurrencySymbol(store) }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  value: formData.amount,
                  onChange: (e) => setFormData((p) => ({ ...p, amount: e.target.value })),
                  placeholder: "0",
                  className: `w-full pl-8 pr-3 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 ${ringClass} focus:border-indigo-500 transition`
                }
              )
            ] }),
            errors.amount && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-red-500", children: errors.amount[0] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("label", { className: "block text-2xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2", children: [
            "Payment Method ",
            /* @__PURE__ */ jsx("span", { className: "text-red-500", children: "*" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "grid grid-cols-4 gap-2", children: METHODS.map((m) => {
            const isSelected = formData.payment_method === m.value;
            return /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => setFormData((p) => ({ ...p, payment_method: m.value })),
                className: `flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl border-2 transition-all text-2xs font-bold uppercase ${isSelected ? `${isIn ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" : "border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400"}` : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-800/40"}`,
                children: [
                  /* @__PURE__ */ jsx(m.icon, { size: 16 }),
                  m.label
                ]
              },
              m.value
            );
          }) })
        ] }),
        formData.payment_method === "bank" && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-2xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5", children: "Bank Account" }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: formData.bank_account_id,
              onChange: (e) => setFormData((p) => ({ ...p, bank_account_id: e.target.value })),
              className: `w-full px-3 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 ${ringClass} focus:border-indigo-500 transition`,
              children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "Select account..." }),
                bankAccounts.map((acc) => /* @__PURE__ */ jsx("option", { value: acc.id, children: acc.name }, acc.id))
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-2xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5", children: "Reference No." }),
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(Hash, { size: 13, className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: formData.reference,
                  onChange: (e) => setFormData((p) => ({ ...p, reference: e.target.value })),
                  placeholder: "Cheque / TxID",
                  className: `w-full pl-8 pr-3 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 ${ringClass} focus:border-indigo-500 transition`
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-2xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5", children: "Description" }),
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(FileText, { size: 13, className: "absolute left-3 top-3 text-slate-400" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: formData.description,
                  onChange: (e) => setFormData((p) => ({ ...p, description: e.target.value })),
                  placeholder: "Notes...",
                  className: `w-full pl-8 pr-3 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 ${ringClass} focus:border-indigo-500 transition`
                }
              )
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "border-t border-slate-100 dark:border-slate-800" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: onClose,
              className: "px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition",
              children: "Cancel"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "submit",
              disabled: loading || success,
              className: `flex items-center gap-2 px-6 py-2.5 text-white font-bold text-sm rounded-xl shadow-lg transition-all disabled:opacity-60 ${buttonBgClass}`,
              children: success ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(CheckCircle2, { size: 16 }),
                " Recorded!"
              ] }) : loading ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx("div", { className: "w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" }),
                " Recording..."
              ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                isIn ? /* @__PURE__ */ jsx(ArrowDownCircle, { size: 16 }) : /* @__PURE__ */ jsx(ArrowUpCircle, { size: 16 }),
                "Record Payment ",
                isIn ? "In" : "Out"
              ] })
            }
          )
        ] })
      ] })
    }
  );
}
const ActionMenu = ({ isOpen, onClose, store, onAction }) => {
  if (!isOpen) return null;
  const actions = [
    { label: "Payment In", icon: ArrowDownRight, color: "text-emerald-500", bg: "bg-emerald-500/10", route: "store.payments.in" },
    { label: "Payment Out", icon: ArrowUpRight, color: "text-red-500", bg: "bg-red-500/10", route: "store.payments.out" },
    { label: "New Quote", icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10", route: "store.proposals.create" },
    { label: "Transfer Stock", icon: RefreshCw, color: "text-orange-500", bg: "bg-orange-500/10", route: "store.stock-transfers.create" },
    { label: "Add Product", icon: Box, color: "text-purple-500", bg: "bg-purple-500/10", route: "store.inventory.create" },
    { label: "Add Category", icon: Tag, color: "text-pink-500", bg: "bg-pink-500/10", route: "store.categories.index" },
    { label: "Add User", icon: UserPlus, color: "text-indigo-500", bg: "bg-indigo-500/10", route: "store.admin.users" },
    { label: "Expense", icon: FileMinus, color: "text-red-500", bg: "bg-red-500/10", route: "store.expenses.index" },
    { label: "Refund", icon: LogOut, color: "text-yellow-500", bg: "bg-yellow-500/10", route: "store.returns.create" },
    { label: "Supplier", icon: Truck, color: "text-emerald-500", bg: "bg-emerald-500/10", route: "store.parties.index" }
  ];
  return /* @__PURE__ */ jsxs("div", { className: "absolute top-full mt-2 right-0 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-2 z-50 animate-in fade-in slide-in-from-top-4 duration-200", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-2", children: [
      /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-slate-500 uppercase tracking-wider", children: "Quick Actions" }),
      /* @__PURE__ */ jsx("button", { onClick: onClose, className: "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200", children: /* @__PURE__ */ jsx(X, { size: 14 }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-1 max-h-64 overflow-y-auto custom-scrollbar", children: actions.map((action, i) => /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => {
          if (action.label === "Payment In") {
            onAction("payment-in");
          } else if (action.label === "Payment Out") {
            onAction("payment-out");
          } else if (action.route) {
            router.visit(route(action.route, {
              store_slug: store?.slug,
              ...action.params || {}
            }));
          }
          onClose();
        },
        className: "flex flex-col items-center justify-center p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group",
        children: [
          /* @__PURE__ */ jsx("div", { className: `p-2 rounded-lg mb-1 group-hover:scale-110 transition-transform ${action.bg} ${action.color}`, children: /* @__PURE__ */ jsx(action.icon, { size: 18 }) }),
          /* @__PURE__ */ jsx("span", { className: "text-2xs font-medium text-slate-600 dark:text-slate-300 text-center leading-tight", children: action.label })
        ]
      },
      i
    )) })
  ] });
};
const CashDetailModal = ({ isOpen, onClose, transactions, onNavigate, store }) => {
  if (!isOpen) return null;
  const currencySymbol = getCurrencySymbol(store);
  return /* @__PURE__ */ jsx("div", { className: "absolute inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200", children: /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxs("div", { className: "p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("div", { className: "p-2 bg-emerald-500/10 rounded-xl text-emerald-500", children: /* @__PURE__ */ jsx(Wallet, { size: 18 }) }),
        /* @__PURE__ */ jsx("h3", { className: "font-bold text-slate-800 dark:text-white", children: "Cash in Hand" })
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: onClose, className: "p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400", children: /* @__PURE__ */ jsx(X, { size: 18 }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "p-4 bg-slate-50 dark:bg-slate-900/50", children: [
      /* @__PURE__ */ jsx("h4", { className: "text-xs font-bold text-slate-400 uppercase tracking-wider mb-3", children: "Cash Activity (Chronological)" }),
      /* @__PURE__ */ jsx("div", { className: "space-y-2 max-h-64 overflow-y-auto custom-scrollbar", children: transactions && transactions.length > 0 ? transactions.map((tx, i) => /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-sm p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700/50", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "font-medium text-slate-700 dark:text-slate-200 truncate max-w-[170px]", children: tx.desc }),
          /* @__PURE__ */ jsx("p", { className: "text-2xs text-slate-400", children: new Date(tx.date).toLocaleString("en-PK", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) })
        ] }),
        /* @__PURE__ */ jsxs("span", { className: `font-bold ${tx.type === "in" ? "text-emerald-500" : "text-red-500"}`, children: [
          tx.type === "in" ? "+" : "-",
          " ",
          currencySymbol,
          " ",
          Math.abs(parseFloat(tx.amount)).toLocaleString()
        ] })
      ] }, tx.id || i)) : /* @__PURE__ */ jsx("p", { className: "text-center text-xs text-slate-400 py-4", children: "No recent history." }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "p-4 grid grid-cols-4 gap-2", children: [
      /* @__PURE__ */ jsxs("button", { onClick: () => {
        onNavigate("store.funds.index");
        onClose();
      }, className: "flex flex-col items-center gap-1 p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors group", children: [
        /* @__PURE__ */ jsx(ArrowDownRight, { size: 18, className: "text-emerald-500 group-hover:scale-110 transition-transform" }),
        /* @__PURE__ */ jsx("span", { className: "text-3xs font-bold text-emerald-600 dark:text-emerald-400", children: "Add" })
      ] }),
      /* @__PURE__ */ jsxs("button", { onClick: () => {
        onNavigate("store.funds.index");
        onClose();
      }, className: "flex flex-col items-center gap-1 p-3 bg-red-50 dark:bg-red-500/10 rounded-2xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors group", children: [
        /* @__PURE__ */ jsx(ArrowUpRight, { size: 18, className: "text-red-500 group-hover:scale-110 transition-transform" }),
        /* @__PURE__ */ jsx("span", { className: "text-3xs font-bold text-red-600 dark:text-red-400", children: "Remove" })
      ] }),
      /* @__PURE__ */ jsxs("button", { onClick: () => {
        onNavigate("store.funds.index");
        onClose();
      }, className: "flex flex-col items-center gap-1 p-3 bg-blue-50 dark:bg-blue-500/10 rounded-2xl hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors group", children: [
        /* @__PURE__ */ jsx(RefreshCw, { size: 18, className: "text-blue-500 group-hover:scale-110 transition-transform" }),
        /* @__PURE__ */ jsx("span", { className: "text-3xs font-bold text-blue-600 dark:text-blue-400", children: "Transfer" })
      ] }),
      /* @__PURE__ */ jsxs("button", { onClick: () => {
        onNavigate("store.funds.index", { view: "history" });
        onClose();
      }, className: "flex flex-col items-center gap-1 p-3 bg-slate-50 dark:bg-slate-500/10 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-500/20 transition-colors group", children: [
        /* @__PURE__ */ jsx(FileText, { size: 18, className: "text-slate-500 group-hover:scale-110 transition-transform" }),
        /* @__PURE__ */ jsx("span", { className: "text-3xs font-bold text-slate-600 dark:text-slate-400", children: "History" })
      ] })
    ] })
  ] }) });
};
const RightPanel = ({ recentTransactions, bankAccounts = [], cashAccounts = [], cashData, inventoryValue = 0 }) => {
  const { store, auth } = usePage().props;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [paymentModal, setPaymentModal] = useState({ isOpen: false, type: "in" });
  const menuRef = useRef(null);
  const settingsRef = useRef(null);
  const userPerms = auth?.user?.permissions || [];
  const canViewBalances = auth?.user?.is_platform_admin || userPerms.includes("*") || userPerms.includes("finance.balances");
  const glBalance = parseFloat(cashData?.balance || 0);
  const bankBalance = bankAccounts.reduce((sum, acc) => sum + parseFloat(acc.current_balance || 0), 0);
  const totalBalance = canViewBalances ? glBalance + bankBalance : 0;
  const formatMoney = (amount) => formatCurrency$1(parseFloat(amount), store);
  const handleNavigate = (r, params = {}) => router.visit(route(r, { ...params, store_slug: store?.slug }));
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setIsSettingsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef, settingsRef]);
  return /* @__PURE__ */ jsxs("div", { className: "bg-slate-900 text-white rounded-[2rem] p-6 h-full min-h-full flex flex-col relative overflow-visible shadow-2xl ring-1 ring-white/10", children: [
    /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/30 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" }),
    /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3 pointer-events-none" }),
    /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[url('/images/noise.svg')] opacity-20 pointer-events-none" }),
    /* @__PURE__ */ jsx(
      CashDetailModal,
      {
        isOpen: isCashModalOpen,
        onClose: () => setIsCashModalOpen(false),
        transactions: cashData?.transactions || [],
        onNavigate: handleNavigate,
        store
      }
    ),
    /* @__PURE__ */ jsx(
      PaymentModal,
      {
        isOpen: paymentModal.isOpen,
        onClose: () => setPaymentModal((p) => ({ ...p, isOpen: false })),
        type: paymentModal.type,
        bankAccounts,
        store
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "relative z-30 flex justify-between items-center mb-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10", children: /* @__PURE__ */ jsx(Wallet, { size: 18, className: "text-white" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-300 font-medium", children: "Total Balance" }),
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold tracking-tight", children: canViewBalances ? formatMoney(totalBalance) : "Restricted" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "relative", ref: settingsRef, children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setIsSettingsOpen(!isSettingsOpen),
            className: `p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors backdrop-blur-sm ${isSettingsOpen ? "bg-white/20" : ""}`,
            children: /* @__PURE__ */ jsx(MoreHorizontal, { size: 20, className: "text-slate-300" })
          }
        ),
        isSettingsOpen && /* @__PURE__ */ jsxs("div", { className: "absolute top-12 right-0 w-48 bg-slate-800 rounded-xl shadow-xl border border-slate-700 p-1 z-50 animate-in fade-in zoom-in-95 duration-200", children: [
          /* @__PURE__ */ jsx("button", { className: "w-full text-left px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg transition-colors", children: "View Profile" }),
          /* @__PURE__ */ jsx("button", { className: "w-full text-left px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg transition-colors", children: "Account Settings" }),
          /* @__PURE__ */ jsx("div", { className: "h-px bg-slate-700 my-1" }),
          /* @__PURE__ */ jsx("button", { className: "w-full text-left px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors", children: "Sign Out" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "relative z-20 mb-8", ref: menuRef, children: [
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-2 h-20", children: [
        /* @__PURE__ */ jsxs("button", { onClick: () => router.visit(route("store.sales.invoice.create", { store_slug: store?.slug })), className: "col-span-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 group backdrop-blur-sm", children: [
          /* @__PURE__ */ jsx("div", { className: "p-1.5 rounded-full bg-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white transition-colors", children: /* @__PURE__ */ jsx(ArrowDownRight, { size: 18 }) }),
          /* @__PURE__ */ jsx("span", { className: "text-2xs font-bold tracking-wider", children: "SALE" })
        ] }),
        /* @__PURE__ */ jsxs("button", { onClick: () => router.visit(route("store.purchases.create", { store_slug: store?.slug })), className: "col-span-1 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/50 text-orange-400 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 group backdrop-blur-sm", children: [
          /* @__PURE__ */ jsx("div", { className: "p-1.5 rounded-full bg-orange-500/20 group-hover:bg-orange-500 group-hover:text-white transition-colors", children: /* @__PURE__ */ jsx(ArrowUpRight, { size: 18 }) }),
          /* @__PURE__ */ jsx("span", { className: "text-2xs font-bold tracking-wider", children: "PURCHASE" })
        ] }),
        /* @__PURE__ */ jsxs("button", { onClick: () => setIsMenuOpen(!isMenuOpen), className: `col-span-1 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/50 text-indigo-400 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 group backdrop-blur-sm ${isMenuOpen ? "bg-indigo-500/20 ring-2 ring-indigo-500/30" : ""}`, children: [
          /* @__PURE__ */ jsx("div", { className: "p-1.5 rounded-full bg-indigo-500/20 group-hover:bg-indigo-500 group-hover:text-white transition-colors", children: /* @__PURE__ */ jsx(Plus, { size: 18 }) }),
          /* @__PURE__ */ jsx("span", { className: "text-2xs font-bold tracking-wider", children: "ACTIONS" })
        ] })
      ] }),
      /* @__PURE__ */ jsx(
        ActionMenu,
        {
          isOpen: isMenuOpen,
          onClose: () => setIsMenuOpen(false),
          store,
          onAction: (act) => {
            if (act === "payment-in") {
              setPaymentModal({ isOpen: true, type: "in" });
            } else if (act === "payment-out") {
              setPaymentModal({ isOpen: true, type: "out" });
            }
          }
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "relative z-10 mb-8 flex-1 overflow-y-auto custom-scrollbar content-start space-y-3", children: [
      canViewBalances && /* @__PURE__ */ jsxs("div", { onClick: () => setIsCashModalOpen(true), className: "bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 hover:border-white/20 hover:scale-[1.02] transition-all cursor-pointer group", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Wallet, { size: 18, className: "text-emerald-300" }),
            /* @__PURE__ */ jsx("span", { className: "text-[12px] font-bold text-slate-200", children: "Cash in Hand" })
          ] }),
          /* @__PURE__ */ jsx("span", { className: "text-3xs text-emerald-200 bg-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase", children: "Main" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h4", { className: "text-2xl font-bold tracking-tight text-white mb-1", children: formatMoney(glBalance) }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-2xs text-emerald-400", children: [
            /* @__PURE__ */ jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" }),
            "Active"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { id: "tour-stock-value", onClick: () => router.visit(route("store.inventory.index", { store_slug: store?.slug })), className: "bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-md rounded-2xl p-4 border border-indigo-500/20 hover:border-indigo-500/40 hover:scale-[1.02] transition-all cursor-pointer group", children: [
        /* @__PURE__ */ jsx("div", { className: "flex justify-between items-start mb-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Box, { size: 18, className: "text-indigo-300" }),
          /* @__PURE__ */ jsx("span", { className: "text-[12px] font-bold text-slate-200", children: "Stock Value" })
        ] }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h4", { className: "text-2xl font-bold tracking-tight text-white mb-1", children: formatMoney(inventoryValue) }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-2xs text-indigo-400", children: [
            /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-indigo-400" }),
            "Total Asset Cost"
          ] })
        ] })
      ] }),
      canViewBalances && (bankAccounts.length > 0 ? /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold text-slate-400 uppercase tracking-wider pl-1", children: "Bank Accounts" }),
        bankAccounts.map((acc) => /* @__PURE__ */ jsxs("div", { onClick: () => handleNavigate("store.bank-accounts.index"), className: "bg-white/5 backdrop-blur-md rounded-xl p-3 border border-white/5 hover:bg-white/10 transition-all flex justify-between items-center group cursor-pointer hover:scale-[1.01] active:scale-[0.99]", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx(Landmark, { size: 18, className: "text-blue-300" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-200", children: acc.bank_name || acc.name }),
              /* @__PURE__ */ jsxs("p", { className: "text-2xs text-slate-400", children: [
                "**** ",
                acc.account_number ? acc.account_number.slice(-4) : "...."
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx("span", { className: "font-bold text-white text-sm", children: formatMoney(acc.current_balance) })
        ] }, acc.id))
      ] }) : /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-2xl border border-dashed border-slate-700 bg-white/5 flex flex-col items-center justify-center text-center gap-2 group hover:bg-white/10 transition-colors cursor-pointer", onClick: () => handleNavigate("store.bank-accounts.index", { action: "add" }), children: [
        /* @__PURE__ */ jsx("div", { className: "p-2 bg-slate-800 rounded-full text-slate-400 group-hover:text-indigo-400 group-hover:scale-110 transition-all", children: /* @__PURE__ */ jsx(Plus, { size: 16 }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-300", children: "Add Bank Account" }),
          /* @__PURE__ */ jsx("p", { className: "text-2xs text-slate-500", children: "Track your business banking" })
        ] })
      ] }))
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "relative z-10 mt-auto bg-black/20 rounded-2xl p-4 backdrop-blur-sm border border-white/5 max-h-48 flex flex-col", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-3 shrink-0", children: [
        /* @__PURE__ */ jsx("h3", { className: "font-bold text-xs text-slate-300 uppercase tracking-wider", children: "Activity" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-3xs text-slate-500", children: [
          /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsx("span", { className: "w-2 h-2 rounded-full bg-blue-500" }),
            "Sale"
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsx("span", { className: "w-2 h-2 rounded-full bg-amber-500" }),
            "Purchase"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-auto p-1 custom-scrollbar space-y-2", children: recentTransactions && recentTransactions.length > 0 ? recentTransactions.map((tx, i) => {
        const activityType = tx.activityType || (tx.type === "Sale" ? "sale" : tx.type === "Purchase" ? "purchase" : "other");
        const colorMap = {
          sale: { bg: "bg-blue-500/20", text: "text-blue-400", dot: "bg-blue-500", amountColor: "text-emerald-400" },
          return: { bg: "bg-rose-500/20", text: "text-rose-400", dot: "bg-rose-500", amountColor: "text-rose-400" },
          purchase: { bg: "bg-amber-500/20", text: "text-amber-400", dot: "bg-amber-500", amountColor: "text-amber-400" },
          payment_in: { bg: "bg-emerald-500/20", text: "text-emerald-400", dot: "bg-emerald-500", amountColor: "text-emerald-400" },
          payment_out: { bg: "bg-purple-500/20", text: "text-purple-400", dot: "bg-purple-500", amountColor: "text-purple-400" },
          expense: { bg: "bg-red-500/20", text: "text-red-400", dot: "bg-red-500", amountColor: "text-red-400" },
          other: { bg: "bg-slate-500/20", text: "text-slate-400", dot: "bg-slate-500", amountColor: "text-slate-300" }
        };
        const colors = colorMap[activityType] || colorMap.other;
        const isIncoming = tx.amount?.startsWith("+") || activityType === "sale" || activityType === "payment_in";
        const isReturn = activityType === "return";
        const handleActivityClick = () => {
          if (!tx.reference_id || !tx.reference_type) return;
          if (tx.reference_type === "sale" || activityType === "sale" || activityType === "return") {
            router.visit(route("store.sales.show", { store_slug: store?.slug, sale: tx.reference_id }));
          } else if (tx.reference_type === "purchase" || activityType === "purchase") {
            router.visit(route("store.purchases.show", { store_slug: store?.slug, purchase: tx.reference_id }));
          } else if (tx.reference_type === "expense" || activityType === "expense") {
            router.visit(route("store.expenses.index", { store_slug: store?.slug }));
          } else if (tx.reference_type === "fund_transaction" || activityType === "payment_in" || activityType === "payment_out") {
            router.visit(route("store.funds.index", { store_slug: store?.slug }));
          }
        };
        return /* @__PURE__ */ jsxs(
          "div",
          {
            onClick: handleActivityClick,
            className: "flex items-center justify-between group cursor-pointer px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors",
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsx("div", { className: `w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${colors.bg} ${colors.text}`, children: isReturn ? /* @__PURE__ */ jsx(RefreshCw, { size: 12 }) : isIncoming ? /* @__PURE__ */ jsx(ArrowDownRight, { size: 12 }) : /* @__PURE__ */ jsx(ArrowUpRight, { size: 12 }) }),
                /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
                    /* @__PURE__ */ jsx("span", { className: `w-1.5 h-1.5 rounded-full ${colors.dot}` }),
                    /* @__PURE__ */ jsx("span", { className: "text-1xs font-semibold text-white/90", children: tx.type })
                  ] }),
                  /* @__PURE__ */ jsx("span", { className: "text-3xs text-slate-500 leading-none", children: tx.time })
                ] })
              ] }),
              /* @__PURE__ */ jsx("span", { className: `text-1xs font-bold ${isIncoming ? "text-emerald-400" : colors.amountColor}`, children: tx.amount })
            ]
          },
          i
        );
      }) : /* @__PURE__ */ jsx("div", { className: "text-center py-4 text-slate-500 text-xs", children: "No recent activity" }) })
    ] })
  ] });
};
function WelcomeTourModal({ store }) {
  const [currentStep, setCurrentStep] = useState(() => {
    return store?.onboarding_step || "welcome";
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [coords, setCoords] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const handleSkipAll = () => {
    setIsDismissed(true);
    try {
      router.post(
        route("store.onboarding.step", { store_slug: store?.slug }),
        { step: "skipped" },
        {
          preserveScroll: true,
          onError: () => {
          },
          onFinish: () => setIsSubmitting(false)
        }
      );
    } catch (e) {
    }
  };
  const renderPortal = (content) => {
    if (typeof document === "undefined") return null;
    return createPortal(content, document.body);
  };
  console.log("WelcomeTourModal render - currentStep:", currentStep, "coords:", coords, "store onboarding_step:", store?.onboarding_step, "element:", typeof document !== "undefined" ? document.getElementById("tour-stock-value") : "no doc");
  useEffect(() => {
    if (store?.onboarding_step) {
      setCurrentStep(store.onboarding_step);
    }
  }, [store?.onboarding_step]);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  useEffect(() => {
    window.activeOnboardingStep = currentStep;
    window.dispatchEvent(new CustomEvent("onboarding-step-changed", { detail: currentStep }));
  }, [currentStep]);
  useEffect(() => {
    if (currentStep !== "sidebar_stock" && currentStep !== "purchase_tour_sidebar") return;
    let attempts = 0;
    const attachListener = () => {
      const targetId = currentStep === "sidebar_stock" ? "tour-sidebar-products" : "tour-sidebar-purchases";
      const el = document.getElementById(targetId);
      if (el) {
        const handleSidebarClick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (currentStep === "sidebar_stock") {
            handleFinalizeTour();
          } else {
            handleFinalizePurchaseTourStart();
          }
        };
        el.addEventListener("click", handleSidebarClick);
        return () => {
          el.removeEventListener("click", handleSidebarClick);
        };
      } else if (attempts < 10) {
        attempts++;
        setTimeout(attachListener, 100);
      }
    };
    return attachListener();
  }, [currentStep, store]);
  useEffect(() => {
    if (currentStep === "welcome" || currentStep === "purchase_tour_start") {
      setCoords(null);
      return;
    }
    const getVisibleElement = (id) => {
      const elements = document.querySelectorAll(`[id="${id}"]`);
      for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          return el;
        }
      }
      return elements[0] || null;
    };
    const updateCoords = () => {
      let targetId = "tour-stock-value";
      if (currentStep === "sidebar_stock") {
        targetId = "tour-sidebar-products";
      } else if (currentStep === "purchase_tour_sidebar") {
        targetId = "tour-sidebar-purchases";
      }
      const el = getVisibleElement(targetId);
      if (el) {
        const rect = el.getBoundingClientRect();
        setCoords((prev) => {
          if (prev && prev.top === rect.top && prev.left === rect.left && prev.width === rect.width && prev.height === rect.height) {
            return prev;
          }
          return {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
          };
        });
      } else {
        setCoords(null);
      }
    };
    const timer = setTimeout(updateCoords, 300);
    window.addEventListener("resize", updateCoords);
    window.addEventListener("scroll", updateCoords, true);
    const interval = setInterval(updateCoords, 50);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      window.removeEventListener("resize", updateCoords);
      window.removeEventListener("scroll", updateCoords, true);
    };
  }, [currentStep]);
  const handleUpdateStep = (stepValue, completedStepValue = null) => {
    setIsSubmitting(true);
    const data = { step: stepValue };
    if (completedStepValue) {
      data.completed_step = completedStepValue;
    }
    router.post(
      route("store.onboarding.step", { store_slug: store?.slug }),
      data,
      {
        preserveScroll: true,
        onFinish: () => setIsSubmitting(false)
      }
    );
  };
  const handleStartInvoiceTour = () => {
    setIsSubmitting(true);
    router.post(
      route("store.onboarding.step", { store_slug: store?.slug }),
      { step: "invoice_tour" },
      {
        preserveScroll: true,
        onSuccess: () => {
          router.visit(route("store.sales.invoice.create", { store_slug: store?.slug }));
        },
        onFinish: () => setIsSubmitting(false)
      }
    );
  };
  const handleStartPosTour = () => {
    setIsSubmitting(true);
    router.post(
      route("store.onboarding.step", { store_slug: store?.slug }),
      { step: "pos_tour" },
      {
        preserveScroll: true,
        onSuccess: () => {
          router.visit(route("store.pos", { store_slug: store?.slug }));
        },
        onFinish: () => setIsSubmitting(false)
      }
    );
  };
  const handleStartExpenseTour = () => {
    setIsSubmitting(true);
    router.post(
      route("store.onboarding.step", { store_slug: store?.slug }),
      { step: "expense_tour" },
      {
        preserveScroll: true,
        onSuccess: () => {
          router.visit(route("store.expenses.index", { store_slug: store?.slug }));
        },
        onFinish: () => setIsSubmitting(false)
      }
    );
  };
  const handleSkipInvoiceOrPos = () => {
    const doneSteps = store?.onboarding_steps_done || [];
    const nextStep = !doneSteps.includes("pos") ? "pos_tour_start" : "expense_tour_start";
    handleUpdateStep(nextStep, "invoice");
  };
  const handleSkipPos = () => {
    const doneSteps = store?.onboarding_steps_done || [];
    const nextStep = !doneSteps.includes("invoice") ? "invoice_tour_start" : "expense_tour_start";
    handleUpdateStep(nextStep, "pos");
  };
  const handleSkipExpense = () => {
    handleUpdateStep("completed", "expense");
  };
  const handleFinalizeTour = () => {
    setIsSubmitting(true);
    router.post(
      route("store.onboarding.step", { store_slug: store?.slug }),
      { step: "inventory_tour" },
      {
        preserveScroll: true,
        onSuccess: () => {
          router.visit(route("store.inventory.index", { store_slug: store?.slug }));
        },
        onFinish: () => setIsSubmitting(false)
      }
    );
  };
  const handleFinalizePurchaseTourStart = () => {
    setIsSubmitting(true);
    router.post(
      route("store.onboarding.step", { store_slug: store?.slug }),
      { step: "purchase_tour" },
      {
        preserveScroll: true,
        onSuccess: () => {
          router.visit(route("store.purchases.create", { store_slug: store?.slug }));
        },
        onFinish: () => setIsSubmitting(false)
      }
    );
  };
  const activeSteps = [
    "welcome",
    "purchase_tour_start",
    "invoice_tour_start",
    "pos_tour_start",
    "expense_tour_start",
    "stock_value",
    "sidebar_stock",
    "purchase_tour_sidebar"
  ];
  if (!activeSteps.includes(currentStep) || store?.onboarding_completed || store?.is_demo || isDismissed) {
    return null;
  }
  if (currentStep === "welcome") {
    return renderPortal(
      /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-[150] flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none", children: [
        /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-slate-950/65 backdrop-blur-md transition-opacity duration-300 animate-in fade-in" }),
        /* @__PURE__ */ jsx("div", { className: "relative w-full max-w-lg mx-auto my-6 px-4 z-[151] animate-in zoom-in-95 duration-300", children: /* @__PURE__ */ jsxs("div", { className: "relative flex flex-col w-full bg-slate-900/90 dark:bg-slate-950/95 border border-indigo-500/20 rounded-3xl shadow-[0_20px_50px_rgba(99,102,241,0.15)] overflow-hidden", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute -top-12 -left-12 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" }),
          /* @__PURE__ */ jsx("div", { className: "absolute -bottom-12 -right-12 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: handleSkipAll,
              disabled: isSubmitting,
              className: "absolute top-5 right-5 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 p-2 rounded-full transition-all duration-200 z-10",
              title: "Skip Tour",
              children: /* @__PURE__ */ jsx(X, { size: 16 })
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "p-8 flex flex-col items-center text-center relative z-10", children: [
            /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-6 animate-bounce", children: /* @__PURE__ */ jsx(Sparkles, { className: "text-white w-8 h-8" }) }),
            /* @__PURE__ */ jsxs("h2", { className: "text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-3", children: [
              "Welcome to ",
              /* @__PURE__ */ jsx("span", { className: "bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent", children: store?.name || "Your Store" }),
              "!"
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-slate-400 text-sm font-semibold mb-2", children: "Your store setup is complete. Let's get you up and running!" }),
            /* @__PURE__ */ jsx("p", { className: "text-slate-300 text-sm leading-relaxed max-w-sm mb-8", children: "To help you get the most out of VenQore, we have prepared a quick, interactive tour of the platform. We will show you how to add your first product and manage stock." }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-3 w-full", children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => setCurrentStep("stock_value"),
                  className: "flex-1 flex items-center justify-center gap-2 py-3 px-5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
                  children: [
                    /* @__PURE__ */ jsx(Rocket, { size: 18 }),
                    /* @__PURE__ */ jsx("span", { children: "Start the Tour" }),
                    /* @__PURE__ */ jsx(ArrowRight, { size: 16, className: "ml-1" })
                  ]
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: handleSkipAll,
                  disabled: isSubmitting,
                  className: "py-3 px-5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white font-bold rounded-xl border border-slate-700/60 transition-all duration-200",
                  children: "Skip Tour"
                }
              )
            ] })
          ] })
        ] }) })
      ] })
    );
  }
  if (currentStep === "purchase_tour_start") {
    return renderPortal(
      /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-[150] flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none", children: [
        /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-slate-950/65 backdrop-blur-md transition-opacity duration-300 animate-in fade-in" }),
        /* @__PURE__ */ jsx("div", { className: "relative w-full max-w-lg mx-auto my-6 px-4 z-[151] animate-in zoom-in-95 duration-300", children: /* @__PURE__ */ jsxs("div", { className: "relative flex flex-col w-full bg-slate-900/90 dark:bg-slate-950/95 border border-indigo-500/20 rounded-3xl shadow-[0_20px_50px_rgba(99,102,241,0.15)] overflow-hidden", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute -top-12 -left-12 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" }),
          /* @__PURE__ */ jsx("div", { className: "absolute -bottom-12 -right-12 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleUpdateStep("skipped"),
              disabled: isSubmitting,
              className: "absolute top-5 right-5 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 p-2 rounded-full transition-all duration-200 z-10",
              title: "Skip Tour",
              children: /* @__PURE__ */ jsx(X, { size: 16 })
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "p-8 flex flex-col items-center text-center relative z-10", children: [
            /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-6 animate-bounce", children: /* @__PURE__ */ jsx(Sparkles, { className: "text-white w-8 h-8" }) }),
            /* @__PURE__ */ jsx("h2", { className: "text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-3", children: "Next Step: Buy Stock! 📦" }),
            /* @__PURE__ */ jsx("p", { className: "text-slate-400 text-sm font-semibold mb-2", children: "Your first product is cataloged, but your stock is still 0." }),
            /* @__PURE__ */ jsx("p", { className: "text-slate-300 text-sm leading-relaxed max-w-sm mb-8", children: "To sell products and print invoices, you must first add stock to your inventory. Let's record a purchase transaction to buy inventory from a supplier!" }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-3 w-full", children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => setCurrentStep("purchase_tour_sidebar"),
                  className: "flex-1 flex items-center justify-center gap-2 py-3 px-5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
                  children: [
                    /* @__PURE__ */ jsx(Rocket, { size: 18 }),
                    /* @__PURE__ */ jsx("span", { children: "Record a Purchase" }),
                    /* @__PURE__ */ jsx(ArrowRight, { size: 16, className: "ml-1" })
                  ]
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => handleUpdateStep("skipped"),
                  disabled: isSubmitting,
                  className: "py-3 px-5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white font-bold rounded-xl border border-slate-700/60 transition-all duration-200",
                  children: "Skip Tour"
                }
              )
            ] })
          ] })
        ] }) })
      ] })
    );
  }
  if (currentStep === "invoice_tour_start") {
    return renderPortal(
      /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-[150] flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none", children: [
        /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-slate-950/65 backdrop-blur-md transition-opacity duration-300 animate-in fade-in" }),
        /* @__PURE__ */ jsx("div", { className: "relative w-full max-w-lg mx-auto my-6 px-4 z-[151] animate-in zoom-in-95 duration-300", children: /* @__PURE__ */ jsxs("div", { className: "relative flex flex-col w-full bg-slate-900/90 dark:bg-slate-950/95 border border-indigo-500/20 rounded-3xl shadow-[0_20px_50px_rgba(99,102,241,0.15)] overflow-hidden", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute -top-12 -left-12 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" }),
          /* @__PURE__ */ jsx("div", { className: "absolute -bottom-12 -right-12 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: handleSkipInvoiceOrPos,
              disabled: isSubmitting,
              className: "absolute top-5 right-5 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 p-2 rounded-full transition-all duration-200 z-10",
              title: "Skip Step",
              children: /* @__PURE__ */ jsx(X, { size: 16 })
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "p-8 flex flex-col items-center text-center relative z-10", children: [
            /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-6 animate-bounce", children: /* @__PURE__ */ jsx(Sparkles, { className: "text-white w-8 h-8" }) }),
            /* @__PURE__ */ jsx("h2", { className: "text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-3", children: "Generate B2B Invoice! 🧾" }),
            /* @__PURE__ */ jsx("p", { className: "text-slate-400 text-sm font-semibold mb-2", children: "Stage 3: Make Your First Wholesale/B2B Sale" }),
            /* @__PURE__ */ jsx("p", { className: "text-slate-300 text-sm leading-relaxed max-w-sm mb-8", children: "To complete your onboarding, let's create a professional B2B sale invoice for a client purchase. We'll guide you step-by-step." }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-3 w-full", children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: handleStartInvoiceTour,
                  disabled: isSubmitting,
                  className: "flex-1 flex items-center justify-center gap-2 py-3 px-5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
                  children: [
                    /* @__PURE__ */ jsx(Rocket, { size: 18 }),
                    /* @__PURE__ */ jsx("span", { children: "Start Invoice Tour" }),
                    /* @__PURE__ */ jsx(ArrowRight, { size: 16, className: "ml-1" })
                  ]
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: handleSkipInvoiceOrPos,
                  disabled: isSubmitting,
                  className: "py-3 px-5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white font-bold rounded-xl border border-slate-700/60 transition-all duration-200",
                  children: "Skip Step"
                }
              )
            ] })
          ] })
        ] }) })
      ] })
    );
  }
  if (currentStep === "pos_tour_start") {
    return renderPortal(
      /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-[150] flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none", children: [
        /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-slate-950/65 backdrop-blur-md transition-opacity duration-300 animate-in fade-in" }),
        /* @__PURE__ */ jsx("div", { className: "relative w-full max-w-lg mx-auto my-6 px-4 z-[151] animate-in zoom-in-95 duration-300", children: /* @__PURE__ */ jsxs("div", { className: "relative flex flex-col w-full bg-slate-900/90 dark:bg-slate-950/95 border border-indigo-500/20 rounded-3xl shadow-[0_20px_50px_rgba(99,102,241,0.15)] overflow-hidden", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute -top-12 -left-12 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" }),
          /* @__PURE__ */ jsx("div", { className: "absolute -bottom-12 -right-12 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: handleSkipPos,
              disabled: isSubmitting,
              className: "absolute top-5 right-5 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 p-2 rounded-full transition-all duration-200 z-10",
              title: "Skip Step",
              children: /* @__PURE__ */ jsx(X, { size: 16 })
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "p-8 flex flex-col items-center text-center relative z-10", children: [
            /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/30 mb-6 animate-bounce", children: /* @__PURE__ */ jsx(Sparkles, { className: "text-white w-8 h-8" }) }),
            /* @__PURE__ */ jsx("h2", { className: "text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-3", children: "Open POS Register! 🛒" }),
            /* @__PURE__ */ jsx("p", { className: "text-slate-400 text-sm font-semibold mb-2", children: "Stage 3: Make Your First Retail POS Sale" }),
            /* @__PURE__ */ jsx("p", { className: "text-slate-300 text-sm leading-relaxed max-w-sm mb-8", children: "Let's test checking out a retail sale using our high-speed, beautiful Point of Sale interface. We'll guide you step-by-step." }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-3 w-full", children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: handleStartPosTour,
                  disabled: isSubmitting,
                  className: "flex-1 flex items-center justify-center gap-2 py-3 px-5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white font-bold rounded-xl shadow-lg shadow-teal-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
                  children: [
                    /* @__PURE__ */ jsx(Rocket, { size: 18 }),
                    /* @__PURE__ */ jsx("span", { children: "Start POS Tour" }),
                    /* @__PURE__ */ jsx(ArrowRight, { size: 16, className: "ml-1" })
                  ]
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: handleSkipPos,
                  disabled: isSubmitting,
                  className: "py-3 px-5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white font-bold rounded-xl border border-slate-700/60 transition-all duration-200",
                  children: "Skip Step"
                }
              )
            ] })
          ] })
        ] }) })
      ] })
    );
  }
  if (currentStep === "expense_tour_start") {
    return renderPortal(
      /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-[150] flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none", children: [
        /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-slate-950/65 backdrop-blur-md transition-opacity duration-300 animate-in fade-in" }),
        /* @__PURE__ */ jsx("div", { className: "relative w-full max-w-lg mx-auto my-6 px-4 z-[151] animate-in zoom-in-95 duration-300", children: /* @__PURE__ */ jsxs("div", { className: "relative flex flex-col w-full bg-slate-900/90 dark:bg-slate-950/95 border border-indigo-500/20 rounded-3xl shadow-[0_20px_50px_rgba(99,102,241,0.15)] overflow-hidden", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute -top-12 -left-12 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" }),
          /* @__PURE__ */ jsx("div", { className: "absolute -bottom-12 -right-12 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: handleSkipExpense,
              disabled: isSubmitting,
              className: "absolute top-5 right-5 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 p-2 rounded-full transition-all duration-200 z-10",
              title: "Skip Step",
              children: /* @__PURE__ */ jsx(X, { size: 16 })
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "p-8 flex flex-col items-center text-center relative z-10", children: [
            /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-gradient-to-br from-indigo-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-6 animate-bounce", children: /* @__PURE__ */ jsx(Sparkles, { className: "text-white w-8 h-8" }) }),
            /* @__PURE__ */ jsx("h2", { className: "text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-3", children: "Record Store Expenses! 💸" }),
            /* @__PURE__ */ jsx("p", { className: "text-slate-400 text-sm font-semibold mb-2", children: "Stage 4: Add Store Operation Expense" }),
            /* @__PURE__ */ jsx("p", { className: "text-slate-300 text-sm leading-relaxed max-w-sm mb-8", children: "To get an accurate picture of your net profits, let's record a store operating expense (like rent or utilities) in the expenses log. We'll guide you step-by-step." }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-3 w-full", children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: handleStartExpenseTour,
                  disabled: isSubmitting,
                  className: "flex-1 flex items-center justify-center gap-2 py-3 px-5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
                  children: [
                    /* @__PURE__ */ jsx(Rocket, { size: 18 }),
                    /* @__PURE__ */ jsx("span", { children: "Start Expense Tour" }),
                    /* @__PURE__ */ jsx(ArrowRight, { size: 16, className: "ml-1" })
                  ]
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: handleSkipExpense,
                  disabled: isSubmitting,
                  className: "py-3 px-5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white font-bold rounded-xl border border-slate-700/60 transition-all duration-200",
                  children: "Skip Step"
                }
              )
            ] })
          ] })
        ] }) })
      ] })
    );
  }
  const getTooltipStyle = () => {
    if (!coords) return { display: "none" };
    if (isMobile) {
      return {
        position: "fixed",
        bottom: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "calc(100% - 32px)",
        maxWidth: "360px",
        zIndex: 151
      };
    }
    if (currentStep === "stock_value") {
      return {
        position: "fixed",
        top: coords.top + coords.height / 2 - 90,
        left: coords.left - 340,
        width: "320px",
        zIndex: 151
      };
    }
    if (currentStep === "sidebar_stock" || currentStep === "purchase_tour_sidebar") {
      return {
        position: "fixed",
        top: coords.top + coords.height / 2 - 80,
        left: coords.left + coords.width + 20,
        width: "320px",
        zIndex: 151
      };
    }
    return {};
  };
  return renderPortal(
    /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-[150] overflow-hidden pointer-events-none", children: [
      coords && /* @__PURE__ */ jsx(
        "div",
        {
          className: "fixed pointer-events-none transition-all duration-100 ease-out",
          style: {
            top: coords.top - 6,
            left: coords.left - 6,
            width: coords.width + 12,
            height: coords.height + 12,
            borderRadius: currentStep === "stock_value" ? "24px" : "8px",
            boxShadow: "0 0 0 9999px rgba(3, 7, 18, 0.75), 0 0 18px 6px rgba(99, 102, 241, 0.45), 0 0 0 2px rgb(99, 102, 241)",
            zIndex: 150
          }
        }
      ),
      !coords && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-slate-950/75 pointer-events-auto z-[150]" }),
      /* @__PURE__ */ jsxs(
        "div",
        {
          style: getTooltipStyle(),
          className: "bg-slate-900/95 dark:bg-slate-950/98 border border-indigo-500/30 rounded-2xl shadow-[0_15px_40px_rgba(99,102,241,0.2)] p-6 pointer-events-auto relative z-[151] animate-in fade-in slide-in-from-bottom-4 duration-300",
          children: [
            !isMobile && currentStep === "stock_value" && /* @__PURE__ */ jsx("div", { className: "absolute right-0 top-[90px] -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-slate-900 border-t border-r border-indigo-500/30 rotate-45 z-10" }),
            !isMobile && (currentStep === "sidebar_stock" || currentStep === "purchase_tour_sidebar") && /* @__PURE__ */ jsx("div", { className: "absolute left-0 top-[80px] -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-slate-900 border-b border-l border-indigo-500/30 rotate-45 z-10" }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 mb-3", children: [
              /* @__PURE__ */ jsx("div", { className: "p-2 bg-indigo-500/10 rounded-lg text-indigo-400 shrink-0", children: /* @__PURE__ */ jsx(Box, { size: 20, className: "animate-pulse" }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-white uppercase tracking-wider", children: currentStep === "stock_value" ? "Inventory Status" : "Add First Purchase" }),
                /* @__PURE__ */ jsx("span", { className: "text-2xs font-semibold text-indigo-400", children: currentStep === "stock_value" ? "Step 1 of 2" : "Step 2 of 2" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
              currentStep === "stock_value" && /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                  "Your ",
                  /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Stock Value is Rs. 0" }),
                  ". We need to add stock in order to sell and generate invoices."
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex gap-2 justify-end", children: [
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      onClick: () => setCurrentStep("welcome"),
                      className: "px-3 py-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors",
                      children: [
                        /* @__PURE__ */ jsx(ArrowLeft, { size: 12 }),
                        /* @__PURE__ */ jsx("span", { children: "Back" })
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      onClick: () => setCurrentStep("sidebar_stock"),
                      className: "px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all",
                      children: [
                        /* @__PURE__ */ jsx("span", { children: "Next Step" }),
                        /* @__PURE__ */ jsx(ArrowRight, { size: 12 })
                      ]
                    }
                  )
                ] })
              ] }),
              currentStep === "sidebar_stock" && /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                  "Let's add your first product. Click on the highlighted ",
                  /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Products" }),
                  " menu link in the sidebar to open the catalog."
                ] }),
                !isMobile && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 text-indigo-400 text-xs font-bold animate-bounce mt-1", children: [
                  /* @__PURE__ */ jsx(ArrowLeft, { size: 14, className: "animate-pulse" }),
                  /* @__PURE__ */ jsx("span", { children: "Click on the highlighted Products link" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex gap-2 justify-between items-center", children: [
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      onClick: () => setCurrentStep("stock_value"),
                      className: "px-3 py-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors",
                      children: [
                        /* @__PURE__ */ jsx(ArrowLeft, { size: 12 }),
                        /* @__PURE__ */ jsx("span", { children: "Back" })
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      onClick: handleFinalizeTour,
                      disabled: isSubmitting,
                      className: "px-4 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-lg shadow-indigo-500/25 hover:scale-105 active:scale-95 transition-all disabled:opacity-50",
                      children: [
                        /* @__PURE__ */ jsx("span", { children: "Let's Add Product" }),
                        /* @__PURE__ */ jsx(ArrowRight, { size: 12 })
                      ]
                    }
                  )
                ] })
              ] }),
              currentStep === "purchase_tour_sidebar" && /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                  "Let's record your first purchase. Click on the highlighted ",
                  /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Purchases" }),
                  " menu link in the sidebar to create a new purchase transaction."
                ] }),
                !isMobile && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 text-indigo-400 text-xs font-bold animate-bounce mt-1", children: [
                  /* @__PURE__ */ jsx(ArrowLeft, { size: 14, className: "animate-pulse" }),
                  /* @__PURE__ */ jsx("span", { children: "Click on the highlighted Purchases link" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex gap-2 justify-between items-center", children: [
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      onClick: () => setCurrentStep("purchase_tour_start"),
                      className: "px-3 py-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors animate-in duration-300",
                      children: [
                        /* @__PURE__ */ jsx(ArrowLeft, { size: 12 }),
                        /* @__PURE__ */ jsx("span", { children: "Back" })
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      onClick: handleFinalizePurchaseTourStart,
                      disabled: isSubmitting,
                      className: "px-4 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-lg shadow-indigo-500/25 hover:scale-105 active:scale-95 transition-all disabled:opacity-50",
                      children: [
                        /* @__PURE__ */ jsx("span", { children: "Go to Purchases" }),
                        /* @__PURE__ */ jsx(ArrowRight, { size: 12 })
                      ]
                    }
                  )
                ] })
              ] })
            ] })
          ]
        }
      )
    ] })
  );
}
function DashboardTourGuide({ store }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [coords, setCoords] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const renderPortal = (content) => {
    if (typeof document === "undefined") return null;
    return createPortal(content, document.body);
  };
  const isVisible = store?.onboarding_step === "dashboard_tour";
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  const getTargetId = (step) => {
    switch (step) {
      case 0:
        return "tour-performance";
      case 1:
        return "tour-outstanding";
      case 2:
        return "tour-net-profit";
      case 3:
        return "tour-sales-chart";
      case 4:
        return "tour-sidebar-admin";
      case 5:
        return "tour-chat-widget-btn";
      default:
        return null;
    }
  };
  useEffect(() => {
    if (!isVisible) {
      setCoords(null);
      return;
    }
    const targetId = getTargetId(currentStep);
    if (!targetId) {
      setCoords(null);
      return;
    }
    const getVisibleElement = (id) => {
      const elements = document.querySelectorAll(`[id="${id}"]`);
      for (let i = 0; i < elements.length; i++) {
        const el2 = elements[i];
        const rect = el2.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          return el2;
        }
      }
      return elements[0] || null;
    };
    const updateCoords = () => {
      const el2 = getVisibleElement(targetId);
      if (el2) {
        const rect = el2.getBoundingClientRect();
        setCoords({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        });
      } else {
        setCoords(null);
      }
    };
    const el = getVisibleElement(targetId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    const timer = setTimeout(updateCoords, 300);
    window.addEventListener("resize", updateCoords);
    window.addEventListener("scroll", updateCoords, true);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateCoords);
      window.removeEventListener("scroll", updateCoords, true);
    };
  }, [currentStep, isVisible]);
  const handleCompleteTour = () => {
    router.post(
      route("store.onboarding.step", { store_slug: store?.slug }),
      { step: "completed" },
      { preserveScroll: true, preserveState: false }
    );
  };
  if (!isVisible) return null;
  const getTooltipStyle = () => {
    if (!coords) {
      return {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "calc(100% - 32px)",
        maxWidth: "360px",
        zIndex: 115
      };
    }
    if (isMobile) {
      return {
        position: "fixed",
        bottom: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "calc(100% - 32px)",
        maxWidth: "360px",
        zIndex: 115
      };
    }
    const tooltipWidth = 360;
    const tooltipHeight = 220;
    const spacing = 16;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    let top = coords.top + coords.height + spacing;
    let left = coords.left + coords.width / 2 - tooltipWidth / 2;
    if (top + tooltipHeight > viewportHeight) {
      top = coords.top - tooltipHeight - spacing;
    }
    if (left < spacing) {
      left = spacing;
    } else if (left + tooltipWidth > viewportWidth - spacing) {
      left = viewportWidth - tooltipWidth - spacing;
    }
    if (currentStep === 4) {
      left = coords.left + coords.width + spacing;
      top = coords.top;
    } else if (currentStep === 5) {
      left = coords.left - tooltipWidth - spacing;
      top = coords.top - tooltipHeight + coords.height;
    }
    return {
      position: "fixed",
      top: `${top}px`,
      left: `${left}px`,
      width: `${tooltipWidth}px`,
      zIndex: 115
    };
  };
  return renderPortal(
    /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-[150] overflow-hidden pointer-events-none", children: [
      coords && /* @__PURE__ */ jsx(
        "div",
        {
          className: "fixed pointer-events-none transition-all duration-300 ease-out",
          style: {
            top: coords.top - 6,
            left: coords.left - 6,
            width: coords.width + 12,
            height: coords.height + 12,
            borderRadius: currentStep === 5 ? "50%" : "12px",
            boxShadow: "0 0 0 9999px rgba(3, 7, 18, 0.75), 0 0 15px 5px rgba(99, 102, 241, 0.4), 0 0 0 2px rgb(99, 102, 241)",
            zIndex: 151
          }
        }
      ),
      /* @__PURE__ */ jsx(
        "div",
        {
          className: "pointer-events-auto transition-all duration-300 ease-out",
          style: getTooltipStyle(),
          children: /* @__PURE__ */ jsxs("div", { className: "bg-slate-900/90 dark:bg-slate-950/95 backdrop-blur-xl border border-indigo-500/30 rounded-2xl shadow-[0_20px_50px_rgba(99,102,241,0.2)] p-6 relative overflow-hidden animate-in zoom-in-95 duration-200", children: [
            /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
              /* @__PURE__ */ jsx("div", { className: "p-2 rounded-lg bg-indigo-500/20 text-indigo-400", children: /* @__PURE__ */ jsx(CheckCircle2, { size: 18 }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-white uppercase tracking-wider", children: "Dashboard Overview" }),
                /* @__PURE__ */ jsxs("span", { className: "text-2xs font-semibold text-indigo-400", children: [
                  "Step ",
                  currentStep + 1,
                  " of 6"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "min-h-[60px] mb-6", children: [
              currentStep === 0 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                "Here you can view your overall ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Sales Performance" }),
                " and ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Gross Profit" }),
                ". Use the dropdown to filter by different time periods to see how you are doing."
              ] }),
              currentStep === 1 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                "This section shows your pending ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Outstanding" }),
                " receivables and payables. Keep an eye here to maintain healthy cash flow!"
              ] }),
              currentStep === 2 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                "Your ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Net Profit" }),
                " summary. It instantly calculates your true bottom line based on your income and expenses."
              ] }),
              currentStep === 3 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                "The ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Sales Chart" }),
                " gives you a visual representation of your sales trends over time, making it easy to spot peaks and valleys."
              ] }),
              currentStep === 4 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                "The ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Admin Panel" }),
                ". You can configure advanced settings, manage users, and more! ",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-indigo-400", children: "Need a training session for you or your staff?" }),
                " Check the ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Billing Page > Services" }),
                " to arrange a meeting!"
              ] }),
              currentStep === 5 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                "And finally, the ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Chat Widget" }),
                "! If you want to know how to do anything extra, you can ask us here and we will guide you through every single thing. We're always here to help!"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mt-auto", children: [
              currentStep > 0 ? /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => setCurrentStep(currentStep - 1),
                  className: "px-3 py-1.5 text-slate-400 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer",
                  children: [
                    /* @__PURE__ */ jsx(ArrowLeft, { size: 12 }),
                    /* @__PURE__ */ jsx("span", { children: "Back" })
                  ]
                }
              ) : /* @__PURE__ */ jsx("div", {}),
              currentStep < 5 ? /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => setCurrentStep(currentStep + 1),
                  className: "px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer",
                  children: [
                    /* @__PURE__ */ jsx("span", { children: "Next" }),
                    /* @__PURE__ */ jsx(ArrowRight, { size: 12 })
                  ]
                }
              ) : /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: handleCompleteTour,
                  className: "px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-emerald-900/20 cursor-pointer animate-pulse",
                  children: "Finish Setup"
                }
              )
            ] })
          ] })
        }
      )
    ] })
  );
}
function Dashboard({
  performance,
  outstanding,
  netProfit,
  salesData,
  topSellingItems,
  lowStockItems,
  recentPurchases = [],
  recentTransactions,
  plSummary,
  bankAccounts,
  cashAccounts,
  cashData,
  inventoryValue
}) {
  const { auth, store } = usePage().props;
  const isAdmin = auth?.user?.role === "platform_admin" || auth?.user?.role === "admin" || auth?.user?.role === "owner";
  const userPerms = auth?.user?.permissions || [];
  const hasPerm = (...keys) => keys.some((k) => userPerms.some((p) => p === k || p.startsWith(k + ".")));
  const canSales = isAdmin || hasPerm("sales", "reports");
  const canFinance = isAdmin || hasPerm("finance");
  const canInventory = isAdmin || hasPerm("inventory");
  isAdmin || hasPerm("reports");
  const canPurchases = isAdmin || hasPerm("purchases");
  let topProductsSpan = "col-span-12 md:col-span-8 lg:col-span-6";
  let lowStockSpan = "col-span-12 md:col-span-4 lg:col-span-3";
  let purchasesSpan = "col-span-12 md:col-span-4 lg:col-span-3";
  if (canSales && canInventory && canPurchases) {
    topProductsSpan = "col-span-12 md:col-span-4 lg:col-span-3";
    lowStockSpan = "col-span-12 md:col-span-4 lg:col-span-3";
    purchasesSpan = "col-span-12 md:col-span-4 lg:col-span-3";
  } else if (canSales && canPurchases) {
    topProductsSpan = "col-span-12 md:col-span-8 lg:col-span-6";
    purchasesSpan = "col-span-12 md:col-span-4 lg:col-span-3";
  } else if (canInventory && canPurchases) {
    lowStockSpan = "col-span-12 md:col-span-6 lg:col-span-5";
    purchasesSpan = "col-span-12 md:col-span-6 lg:col-span-4";
  } else if (canPurchases) {
    purchasesSpan = "col-span-12 lg:col-span-9";
  }
  const [profitView, setProfitView] = useState("Month");
  const [performancePeriod, setPerformancePeriod] = useState("Today");
  const [outstandingPeriod, setOutstandingPeriod] = useState("Month");
  const [netProfitPeriod, setNetProfitPeriod] = useState("Month");
  const [purchasesPeriod, setPurchasesPeriod] = useState("Month");
  const [mobileRightPanelOpen, setMobileRightPanelOpen] = useState(false);
  plSummary[profitView] || {};
  const purchasesList = Array.isArray(recentPurchases) ? recentPurchases : recentPurchases[purchasesPeriod] || [];
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { activeMenu: "Dashboard", children: [
    /* @__PURE__ */ jsx(Head, { title: "Dashboard" }),
    /* @__PURE__ */ jsx("style", { children: `
                @keyframes nudge-left {
                    0%, 100% { transform: translateY(-50%) translateX(0); }
                    50% { transform: translateY(-50%) translateX(-3px); }
                }
                .animate-nudge-left {
                    animation: nudge-left 2.5s ease-in-out infinite;
                }
            ` }),
    (isAdmin || auth?.user?.role === "manager" || auth?.user?.role === "accountant") && /* @__PURE__ */ jsxs("div", { className: "lg:hidden", children: [
      mobileRightPanelOpen && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-black/50 z-[90]", onClick: () => setMobileRightPanelOpen(false) }),
      /* @__PURE__ */ jsxs(
        "div",
        {
          className: `
                            fixed top-0 right-0 h-[100vh] z-[100]
                            transition-transform duration-300 ease-in-out transform
                            ${mobileRightPanelOpen ? "translate-x-0" : "translate-x-full"}
                            w-[320px] bg-white dark:bg-slate-900 border-l border-slate-100 dark:border-slate-800 p-4 flex flex-col h-full
                        `,
          children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => setMobileRightPanelOpen(!mobileRightPanelOpen),
                className: `absolute left-[-24px] top-1/2 -translate-y-1/2 z-[110] lg:hidden w-6 h-32 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-indigo-500 transition-colors pointer-events-auto ${!mobileRightPanelOpen ? "animate-nudge-left" : ""}`,
                style: { filter: "drop-shadow(-4px 4px 6px rgba(0, 0, 0, 0.04))" },
                children: [
                  /* @__PURE__ */ jsxs(
                    "svg",
                    {
                      className: "absolute inset-0 w-full h-full text-white dark:text-slate-900 pointer-events-none",
                      viewBox: "0 0 24 128",
                      fill: "currentColor",
                      xmlns: "http://www.w3.org/2000/svg",
                      children: [
                        /* @__PURE__ */ jsx(
                          "path",
                          {
                            d: "M 24 0 C 24 20, 0 35, 0 64 C 0 93, 24 108, 24 128 Z",
                            fill: "currentColor"
                          }
                        ),
                        /* @__PURE__ */ jsx(
                          "path",
                          {
                            d: "M 24 0 C 24 20, 0 35, 0 64 C 0 93, 24 108, 24 128",
                            fill: "none",
                            className: "stroke-slate-100 dark:stroke-slate-800",
                            strokeWidth: "1"
                          }
                        )
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsx(ChevronLeft, { size: 14, className: `relative z-10 transition-transform duration-300 ${mobileRightPanelOpen ? "rotate-180" : ""}` })
                ]
              }
            ),
            /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-auto custom-scrollbar pr-1", children: /* @__PURE__ */ jsx(
              RightPanel,
              {
                recentTransactions,
                bankAccounts,
                cashAccounts,
                cashData,
                inventoryValue
              }
            ) })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-12 lg:grid-rows-6 gap-6 lg:h-[calc(100vh-5rem)] h-auto w-full animate-in fade-in duration-500 pt-2 pb-2 pr-2", children: [
      canSales && /* @__PURE__ */ jsx("div", { id: "tour-performance", className: "col-span-12 md:col-span-6 lg:col-span-3 lg:row-span-1", children: /* @__PURE__ */ jsx(
        DualStatCard,
        {
          title: "Performance",
          leftLabel: "Total Revenue",
          leftValue: formatCurrency$1(parseFloat(performance[performancePeriod]?.sales || 0), store),
          rightLabel: "Gross Profit",
          rightValue: formatCurrency$1(parseFloat(performance[performancePeriod]?.gross_profit || 0), store),
          icon: TrendingUp,
          colorClass: "bg-indigo-500",
          delay: 0,
          period: performancePeriod,
          onPeriodChange: setPerformancePeriod,
          onLeftClick: () => router.visit(route("store.sales.index", { store_slug: store?.slug })),
          onRightClick: () => router.visit(route("store.reports.dashboard", { store_slug: store?.slug }))
        }
      ) }),
      canFinance && /* @__PURE__ */ jsx("div", { id: "tour-outstanding", className: "col-span-12 md:col-span-6 lg:col-span-3 lg:row-span-1", children: /* @__PURE__ */ jsx(
        DualStatCard,
        {
          title: "Outstanding",
          leftLabel: "To Receive",
          leftValue: formatCurrency$1(parseFloat(outstanding[outstandingPeriod]?.receivables || 0), store),
          rightLabel: "To Pay",
          rightValue: formatCurrency$1(parseFloat(outstanding[outstandingPeriod]?.payables || 0), store),
          icon: CreditCard,
          colorClass: "bg-orange-500",
          delay: 100,
          period: outstandingPeriod,
          onPeriodChange: setOutstandingPeriod,
          onLeftClick: () => router.visit(route("store.finance.receivables", { store_slug: store?.slug })),
          onRightClick: () => router.visit(route("store.finance.payables", { store_slug: store?.slug }))
        }
      ) }),
      canFinance && /* @__PURE__ */ jsx("div", { id: "tour-net-profit", className: "col-span-12 md:col-span-6 lg:col-span-3 lg:row-span-1", children: /* @__PURE__ */ jsxs(
        "div",
        {
          onClick: () => router.visit(route("store.reports.profit-loss", { store_slug: store?.slug })),
          className: "bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-none border border-slate-100 dark:border-slate-800 flex flex-col justify-center gap-2 h-full relative overflow-hidden group hover:-translate-y-0.5 transition-transform duration-300 cursor-pointer",
          children: [
            /* @__PURE__ */ jsx("div", { className: "absolute -right-4 -top-4 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 ease-in-out" }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 relative z-10 shrink-0", children: [
              /* @__PURE__ */ jsx("div", { className: "p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600", children: /* @__PURE__ */ jsx(Wallet, { size: 18 }) }),
              /* @__PURE__ */ jsx("h3", { className: "font-bold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wide", children: "Net Profit" }),
              /* @__PURE__ */ jsx("div", { className: "ml-auto", onClick: (e) => e.stopPropagation(), children: /* @__PURE__ */ jsx(
                PremiumDropdown,
                {
                  options: [
                    { value: "Today", label: "Today" },
                    { value: "Month", label: "Month" },
                    { value: "Year", label: "Year" },
                    { value: "All Time", label: "All Time" }
                  ],
                  value: netProfitPeriod,
                  onChange: setNetProfitPeriod
                }
              ) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 relative z-10 grow items-center", children: [
              /* @__PURE__ */ jsx("div", { className: "absolute left-1/2 top-1 bottom-1 w-px bg-slate-100 dark:bg-slate-800 -translate-x-1/2" }),
              /* @__PURE__ */ jsxs("div", { className: "text-center min-w-0", children: [
                /* @__PURE__ */ jsx("p", { className: "text-2xs uppercase font-bold text-slate-400 mb-1 tracking-wider truncate", children: "Current Status" }),
                /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold text-emerald-600 dark:text-emerald-400 tracking-tight truncate", children: netProfit[netProfitPeriod]?.status || "N/A" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-center min-w-0", children: [
                /* @__PURE__ */ jsx("p", { className: "text-2xs uppercase font-bold text-slate-400 mb-1 tracking-wider truncate", children: formatCurrency$1(parseFloat(netProfit[netProfitPeriod]?.value || 0), store) }),
                /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-x-2 gap-y-0.5 justify-center mt-1 text-3xs font-medium opacity-80 leading-none", children: [
                  /* @__PURE__ */ jsxs("span", { className: "text-emerald-600 dark:text-emerald-400 whitespace-nowrap", title: "Revenue", children: [
                    "Revenue: ",
                    formatCurrency$1(netProfit[netProfitPeriod]?.income || 0, store)
                  ] }),
                  /* @__PURE__ */ jsxs("span", { className: "text-red-500 whitespace-nowrap", title: "Expenses", children: [
                    "Expenses: ",
                    formatCurrency$1(netProfit[netProfitPeriod]?.expense || 0, store)
                  ] })
                ] })
              ] })
            ] })
          ]
        }
      ) }),
      (isAdmin || auth?.user?.role === "manager" || auth?.user?.role === "accountant") && /* @__PURE__ */ jsx("div", { id: "tour-right-panel", className: "hidden lg:block col-span-3 lg:row-span-6 h-full", children: /* @__PURE__ */ jsx(
        RightPanel,
        {
          recentTransactions,
          bankAccounts,
          cashAccounts,
          cashData,
          inventoryValue
        }
      ) }),
      canSales && /* @__PURE__ */ jsx("div", { id: "tour-sales-chart", className: `col-span-12 ${isAdmin ? "lg:col-span-6" : "lg:col-span-9"} lg:row-span-3 min-h-[300px]`, children: /* @__PURE__ */ jsx(ChartSection, { salesData }) }),
      isAdmin && /* @__PURE__ */ jsx("div", { id: "tour-opportunities", className: "col-span-12 lg:col-span-3 lg:row-span-3 h-full min-h-0 flex flex-col", children: /* @__PURE__ */ jsx(TodaysOpportunities, { className: "flex-1" }) }),
      canSales && /* @__PURE__ */ jsxs("div", { id: "tour-top-products", className: `${topProductsSpan} lg:row-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-800 flex flex-col min-h-0 group`, children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-4 shrink-0", children: [
          /* @__PURE__ */ jsxs("h3", { className: "font-bold text-slate-800 dark:text-white flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "w-1.5 h-5 bg-emerald-500 rounded-full" }),
            "Top Products"
          ] }),
          /* @__PURE__ */ jsx("button", { className: "p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-indigo-600", children: /* @__PURE__ */ jsx(MoreHorizontal, { size: 18 }) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-auto min-h-0 pr-2 custom-scrollbar", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "text-xs font-semibold text-slate-400 border-b border-slate-100 dark:border-slate-800", children: [
            /* @__PURE__ */ jsx("th", { className: "pb-3 pl-2", children: "Product" }),
            /* @__PURE__ */ jsx("th", { className: "pb-3 text-center", children: "Volume" }),
            /* @__PURE__ */ jsx("th", { className: "pb-3 text-right pr-2", children: "Total" })
          ] }) }),
          /* @__PURE__ */ jsxs("tbody", { children: [
            topSellingItems.map((item, i) => /* @__PURE__ */ jsxs("tr", { className: "group/row hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-default rounded-xl", children: [
              /* @__PURE__ */ jsx("td", { className: "py-3 pl-2 border-b border-slate-50 dark:border-slate-800/50 group-last/row:border-none", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg shadow-sm border border-slate-200 dark:border-slate-700 group-hover/row:scale-110 transition-transform", children: item.image }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-700 dark:text-slate-200", children: item.name }),
                  /* @__PURE__ */ jsx("p", { className: "text-2xs text-slate-400 font-medium", children: item.category })
                ] })
              ] }) }),
              /* @__PURE__ */ jsx("td", { className: "py-3 text-sm text-center font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-50 dark:border-slate-800/50 group-last/row:border-none", children: /* @__PURE__ */ jsx("span", { className: "bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-xs", children: item.sold }) }),
              /* @__PURE__ */ jsx("td", { className: "py-3 pr-2 text-sm text-right font-bold text-emerald-600 dark:text-emerald-400 border-b border-slate-50 dark:border-slate-800/50 group-last/row:border-none", children: item.revenue })
            ] }, i)),
            topSellingItems.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: "3", className: "py-8 text-center text-slate-400 text-sm", children: "No sales data yet." }) })
          ] })
        ] }) })
      ] }),
      canInventory && /* @__PURE__ */ jsxs("div", { id: "tour-low-stock", className: `${lowStockSpan} lg:row-span-2 h-full bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-800 flex flex-col min-h-0`, children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-4 shrink-0", children: [
          /* @__PURE__ */ jsxs("h3", { className: "font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "w-1.5 h-5 bg-red-500 rounded-full" }),
            "Low Stock Alerts"
          ] }),
          /* @__PURE__ */ jsx("button", { className: "text-xs text-indigo-600 font-medium hover:underline", children: "View All" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-y-auto min-h-0 pr-1 custom-scrollbar space-y-3", children: [
          lowStockItems.map((item) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/20", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-700 dark:text-slate-200 truncate w-32", children: item.name }),
              /* @__PURE__ */ jsxs("p", { className: "text-2xs text-red-500 font-bold", children: [
                "Stock: ",
                formatNumber(item.stock),
                " / ",
                formatNumber(item.alert)
              ] })
            ] }),
            (auth?.user?.role === "owner" || auth?.user?.role === "admin" || auth?.user?.role === "manager" || auth?.user?.role === "purchasing_officer" || auth?.user?.permissions?.includes("purchases")) && /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => router.visit(route("store.purchases.create", { store_slug: store?.slug, product_id: item.id })),
                className: "px-2 py-1 bg-white dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 hover:text-indigo-600",
                children: "Order"
              }
            )
          ] }, item.id)),
          lowStockItems.length === 0 && /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center h-full text-slate-400", children: [
            /* @__PURE__ */ jsx("span", { className: "text-2xl", children: "✅" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs mt-2", children: "Stock levels are healthy" })
          ] })
        ] })
      ] }),
      canPurchases && /* @__PURE__ */ jsxs("div", { id: "tour-purchases", className: `${purchasesSpan} lg:row-span-2 h-full bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-800 flex flex-col min-h-0`, children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-4 shrink-0", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "w-1.5 h-5 bg-orange-500 rounded-full" }),
            /* @__PURE__ */ jsx("h3", { className: "font-bold text-slate-800 dark:text-white text-sm", children: "Recent Purchases" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { onClick: (e) => e.stopPropagation(), children: /* @__PURE__ */ jsx(
              PremiumDropdown,
              {
                options: [
                  { value: "Today", label: "Today" },
                  { value: "Month", label: "Month" },
                  { value: "Year", label: "Year" },
                  { value: "All Time", label: "All Time" }
                ],
                value: purchasesPeriod,
                onChange: setPurchasesPeriod
              }
            ) }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => router.visit(route("store.purchases.index", { store_slug: store?.slug })),
                className: "text-xs text-indigo-600 font-medium hover:underline",
                children: "View All"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-y-auto min-h-0 pr-1 custom-scrollbar space-y-3", children: [
          purchasesList.map((item) => /* @__PURE__ */ jsxs(
            "div",
            {
              onClick: () => router.visit(route("store.purchases.show", { store_slug: store?.slug, purchase: item.id })),
              className: "flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/10 rounded-xl border border-orange-100 dark:border-orange-900/20 hover:scale-[1.01] transition-transform cursor-pointer",
              children: [
                /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1 pr-2", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-700 dark:text-slate-200 truncate", children: item.supplier_name }),
                  /* @__PURE__ */ jsx("p", { className: "text-2xs text-slate-400 font-medium", children: item.date })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-orange-600 dark:text-orange-400", children: item.total_amount }),
                  /* @__PURE__ */ jsx("p", { className: "text-3xs uppercase tracking-wider font-bold text-slate-400 leading-none mt-0.5", children: item.status })
                ] })
              ]
            },
            item.id
          )),
          purchasesList.length === 0 && /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center h-full text-slate-400 py-8", children: [
            /* @__PURE__ */ jsx("span", { className: "text-2xl", children: "📦" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs mt-2", children: "No purchases recorded yet" })
          ] })
        ] })
      ] })
    ] }),
    !store?.is_demo && !store?.onboarding_completed && (store?.onboarding_step === "welcome" || store?.onboarding_step === "purchase_tour_start" || store?.onboarding_step === "purchase_tour_sidebar" || store?.onboarding_step === "invoice_tour_start" || store?.onboarding_step === "pos_tour_start" || store?.onboarding_step === "expense_tour_start") && /* @__PURE__ */ jsx(WelcomeTourModal, { store }),
    !store?.is_demo && !store?.onboarding_completed && store?.onboarding_step === "dashboard_tour" && /* @__PURE__ */ jsx(DashboardTourGuide, { store })
  ] });
}
export {
  Dashboard as default
};

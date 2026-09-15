import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef, useCallback } from "react";
import { usePage, router, Link } from "@inertiajs/react";
import { TrendingUp, CalendarDays, Banknote, Building2, CreditCard, Smartphone, Hash, FileText, CheckCircle2, ArrowDownCircle, ArrowUpCircle, Search, X, User, Minus, TrendingDown, Wallet, MoreHorizontal, ArrowDownRight, ArrowUpRight, Plus, Box, Landmark, RefreshCw, Tag, UserPlus, FileMinus, LogOut, Truck, ChevronDown, AlertTriangle, Sparkles, Users, Package, ChevronRight, MessageCircle, Eye } from "lucide-react";
import { f as formatCurrency$1, g as getCurrencySymbol } from "./format-B_ph0Qec.js";
import { v as vq } from "./runtime-DwSFgQZq.js";
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Area } from "recharts";
import { F as FormModal } from "../ssr.js";
import axios from "axios";
import { u as useTermText } from "./terms-DwYjlWsV.js";
import { createPortal } from "react-dom";
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
          /* @__PURE__ */ jsx("span", { className: "font-bold text-brand-600 dark:text-brand-400", children: formatCurrency$1(totalSales, store || settings) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-xs", children: [
          /* @__PURE__ */ jsx("div", { className: "w-3 h-3 rounded-full bg-emerald-500" }),
          /* @__PURE__ */ jsx("span", { className: "font-bold text-ink-secondary", children: "Gross Profit" }),
          /* @__PURE__ */ jsx("span", { className: "font-bold text-emerald-600 dark:text-emerald-400", children: formatCurrency$1(totalProfit, store || settings) })
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
    if (Math.abs(bal) < 0.01) return /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sunken text-ink-muted text-2xs font-bold", children: [
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
    /* @__PURE__ */ jsxs("div", { style: { outline: "none" }, className: `flex items-center gap-2 w-full px-3 py-3 rounded-xl bg-app border ${selectedParty ? isIn ? "border-emerald-500" : "border-rose-500" : "border-line"} transition-all focus-within:border-brand-500`, children: [
      /* @__PURE__ */ jsx(Search, { size: 15, className: "text-ink-muted shrink-0" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "text",
          name: AC_OFF_NAME,
          value: query,
          onChange: handleInput,
          onFocus: handleFocus,
          placeholder: "Click or type name / phone...",
          className: "flex-1 bg-transparent border-none outline-none text-sm text-ink placeholder-slate-400",
          autoComplete: "new-password",
          style: { outline: "none", boxShadow: "none" }
        }
      ),
      loading && /* @__PURE__ */ jsx("div", { className: `w-4 h-4 border-2 border-line ${isIn ? "border-t-emerald-500" : "border-t-rose-500"} rounded-full animate-spin shrink-0` }),
      (query || selectedParty) && !loading && /* @__PURE__ */ jsx("button", { type: "button", onClick: handleClear, className: "text-ink-muted hover:text-ink-secondary dark:hover:text-neutral-200 transition shrink-0", children: /* @__PURE__ */ jsx(X, { size: 14 }) })
    ] }),
    selectedParty && /* @__PURE__ */ jsxs("div", { className: "mt-1.5 flex items-center gap-2 px-1", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsx("div", { className: `w-5 h-5 rounded-full ${isIn ? "bg-emerald-100 dark:bg-emerald-900/40" : "bg-rose-100 dark:bg-rose-900/40"} flex items-center justify-center`, children: /* @__PURE__ */ jsx(User, { size: 10, className: isIn ? "text-emerald-600" : "text-rose-600" }) }),
        /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold text-ink-secondary", children: selectedParty.name }),
        selectedParty.type && /* @__PURE__ */ jsx("span", { className: `text-3xs font-bold uppercase px-1.5 py-0.5 rounded-full ${selectedParty.type === "customer" ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" : "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"}`, children: selectedParty.type })
      ] }),
      balanceBadge()
    ] }),
    open && results.length > 0 && /* @__PURE__ */ jsx("div", { className: "absolute top-full left-0 right-0 mt-1 bg-surface border border-line rounded-[14px] shadow-2xl z-50 max-h-56 overflow-auto", children: results.map((party) => {
      const bal = parseFloat(party.current_balance || 0);
      const dir = party.balance_direction || (bal > 0 ? "To Receive" : bal < 0 ? "To Pay" : "Settled");
      const settled = Math.abs(bal) < 0.01;
      return /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: () => handleSelect(party),
          className: "w-full px-4 py-2.5 text-left hover:bg-interactive-hover dark:hover:bg-interactive-hover flex items-center gap-3 transition-colors border-b border-line last:border-0",
          children: [
            /* @__PURE__ */ jsx("div", { className: `w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${party.type === "customer" ? "bg-blue-100 dark:bg-blue-900/30" : "bg-amber-100 dark:bg-amber-900/30"}`, children: party.type === "customer" ? /* @__PURE__ */ jsx(User, { size: 13, className: "text-blue-600 dark:text-blue-400" }) : /* @__PURE__ */ jsx(Building2, { size: 13, className: "text-amber-600 dark:text-amber-400" }) }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-ink truncate", children: party.name }),
              /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted truncate", children: party.phone || party.email || party.type })
            ] }),
            !settled && /* @__PURE__ */ jsxs("span", { className: `text-2xs font-bold px-1.5 py-0.5 rounded-full shrink-0 ${dir === "To Receive" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`, children: [
              dir,
              ": ",
              formatCurrency(Math.abs(bal), store?.currency_symbol)
            ] }),
            settled && /* @__PURE__ */ jsx("span", { className: "text-2xs font-bold px-1.5 py-0.5 rounded-full shrink-0 bg-sunken text-ink-muted dark:bg-raised dark:text-ink-muted", children: "Settled" })
          ]
        },
        party.id
      );
    }) }),
    open && results.length === 0 && !loading && query && /* @__PURE__ */ jsxs("div", { className: "absolute top-full left-0 right-0 mt-1 bg-surface border border-line rounded-[14px] shadow-xl z-50 px-4 py-5 text-center", children: [
      /* @__PURE__ */ jsxs("p", { className: "text-sm font-medium text-ink-secondary", children: [
        'No contacts found for "',
        query,
        '"'
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted mt-0.5", children: "Try a different name or phone number" })
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
  const buttonBgClass = isIn ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 " : "bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 ";
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
          /* @__PURE__ */ jsxs("label", { className: "block text-2xs font-bold uppercase tracking-wider text-ink-muted mb-1.5", children: [
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
            /* @__PURE__ */ jsxs("label", { className: "block text-2xs font-bold uppercase tracking-wider text-ink-muted mb-1.5", children: [
              "Date ",
              /* @__PURE__ */ jsx("span", { className: "text-red-500", children: "*" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(CalendarDays, { size: 14, className: "absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "date",
                  value: formData.date,
                  onChange: (e) => setFormData((p) => ({ ...p, date: e.target.value })),
                  className: `w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-app border border-line text-ink outline-none focus:ring-2 ${ringClass} focus:border-brand-500 transition`
                }
              )
            ] }),
            errors.date && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-red-500", children: errors.date[0] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("label", { className: "block text-2xs font-bold uppercase tracking-wider text-ink-muted mb-1.5", children: [
              "Amount ",
              /* @__PURE__ */ jsx("span", { className: "text-red-500", children: "*" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx("span", { className: "absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted text-sm font-bold", children: getCurrencySymbol(store) }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  value: formData.amount,
                  onChange: (e) => setFormData((p) => ({ ...p, amount: e.target.value })),
                  placeholder: "0",
                  className: `w-full pl-8 pr-3 py-2.5 text-sm rounded-xl bg-app border border-line text-ink outline-none focus:ring-2 ${ringClass} focus:border-brand-500 transition`
                }
              )
            ] }),
            errors.amount && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-red-500", children: errors.amount[0] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("label", { className: "block text-2xs font-bold uppercase tracking-wider text-ink-muted mb-2", children: [
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
                className: `flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl border-2 transition-all text-2xs font-bold uppercase ${isSelected ? `${isIn ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" : "border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400"}` : "border-line text-ink-muted hover:border-line dark:hover:border-line-strong bg-app"}`,
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
          /* @__PURE__ */ jsx("label", { className: "block text-2xs font-bold uppercase tracking-wider text-ink-muted mb-1.5", children: "Bank Account" }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: formData.bank_account_id,
              onChange: (e) => setFormData((p) => ({ ...p, bank_account_id: e.target.value })),
              className: `w-full px-3 py-2.5 text-sm rounded-xl bg-app border border-line text-ink outline-none focus:ring-2 ${ringClass} focus:border-brand-500 transition`,
              children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "Select account..." }),
                bankAccounts.map((acc) => /* @__PURE__ */ jsx("option", { value: acc.id, children: acc.name }, acc.id))
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-2xs font-bold uppercase tracking-wider text-ink-muted mb-1.5", children: "Reference No." }),
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(Hash, { size: 13, className: "absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: formData.reference,
                  onChange: (e) => setFormData((p) => ({ ...p, reference: e.target.value })),
                  placeholder: "Cheque / TxID",
                  className: `w-full pl-8 pr-3 py-2.5 text-sm rounded-xl bg-app border border-line text-ink outline-none focus:ring-2 ${ringClass} focus:border-brand-500 transition`
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-2xs font-bold uppercase tracking-wider text-ink-muted mb-1.5", children: "Description" }),
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(FileText, { size: 13, className: "absolute left-3 top-3 text-ink-muted" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: formData.description,
                  onChange: (e) => setFormData((p) => ({ ...p, description: e.target.value })),
                  placeholder: "Notes...",
                  className: `w-full pl-8 pr-3 py-2.5 text-sm rounded-xl bg-app border border-line text-ink outline-none focus:ring-2 ${ringClass} focus:border-brand-500 transition`
                }
              )
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "border-t border-line" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: onClose,
              className: "px-4 py-2 text-sm font-semibold text-ink-muted hover:text-ink-secondary dark:hover:text-neutral-300 transition",
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
  const tt = useTermText();
  if (!isOpen) return null;
  const actions = [
    { label: "Payment In", icon: ArrowDownRight, color: "text-emerald-500", bg: "bg-emerald-500/10", route: "store.payments.in" },
    { label: "Payment Out", icon: ArrowUpRight, color: "text-red-500", bg: "bg-red-500/10", route: "store.payments.out" },
    { label: "New Quote", icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10", route: "store.proposals.create" },
    { label: "Transfer Stock", icon: RefreshCw, color: "text-orange-500", bg: "bg-orange-500/10", route: "store.stock-transfers.create" },
    { label: "Add Product", icon: Box, color: "text-brand-500", bg: "bg-brand-500/10", route: "store.inventory.create" },
    { label: "Add Category", icon: Tag, color: "text-brand-500", bg: "bg-brand-500/10", route: "store.categories.index" },
    { label: "Add User", icon: UserPlus, color: "text-brand-500", bg: "bg-brand-500/10", route: "store.admin.users" },
    { label: "Expense", icon: FileMinus, color: "text-red-500", bg: "bg-red-500/10", route: "store.expenses.index" },
    { label: "Refund", icon: LogOut, color: "text-yellow-500", bg: "bg-yellow-500/10", route: "store.returns.create" },
    { label: "Supplier", icon: Truck, color: "text-emerald-500", bg: "bg-emerald-500/10", route: "store.parties.index" }
  ];
  return /* @__PURE__ */ jsxs("div", { className: "absolute top-full mt-2 right-0 w-64 bg-surface rounded-[14px] shadow-2xl border border-line p-2 z-50 animate-in fade-in slide-in-from-top-4 duration-normal", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center px-3 py-2 border-b border-line mb-2", children: [
      /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-ink-muted uppercase tracking-wider", children: "Quick Actions" }),
      /* @__PURE__ */ jsx("button", { onClick: onClose, className: "text-ink-muted hover:text-ink-secondary dark:hover:text-neutral-200", children: /* @__PURE__ */ jsx(X, { size: 14 }) })
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
        className: "flex flex-col items-center justify-center p-3 rounded-xl hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors group",
        children: [
          /* @__PURE__ */ jsx("div", { className: `p-2 rounded-lg mb-1 transition-transform ${action.bg} ${action.color}`, children: /* @__PURE__ */ jsx(action.icon, { size: 18 }) }),
          /* @__PURE__ */ jsx("span", { className: "text-2xs font-medium text-ink-secondary text-center leading-tight", children: tt(action.label) })
        ]
      },
      i
    )) })
  ] });
};
const CashDetailModal = ({ isOpen, onClose, transactions, onNavigate, store }) => {
  if (!isOpen) return null;
  const currencySymbol = getCurrencySymbol(store);
  return /* @__PURE__ */ jsx("div", { className: "absolute inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-normal", children: /* @__PURE__ */ jsxs("div", { className: "bg-surface w-full max-w-sm rounded-2xl shadow-2xl border border-line overflow-hidden", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxs("div", { className: "p-4 border-b border-line flex justify-between items-center", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("div", { className: "p-2 bg-emerald-500/10 rounded-xl text-emerald-500", children: /* @__PURE__ */ jsx(Wallet, { size: 18 }) }),
        /* @__PURE__ */ jsx("h3", { className: "font-bold text-ink", children: "Cash in Hand" })
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: onClose, className: "p-1 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg text-ink-muted", children: /* @__PURE__ */ jsx(X, { size: 18 }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "p-4 bg-app", children: [
      /* @__PURE__ */ jsx("h4", { className: "text-xs font-bold text-ink-muted uppercase tracking-wider mb-3", children: "Cash Activity (Chronological)" }),
      /* @__PURE__ */ jsx("div", { className: "space-y-2 max-h-64 overflow-y-auto custom-scrollbar", children: transactions && transactions.length > 0 ? transactions.map((tx, i) => /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-sm p-2 bg-surface rounded-lg border border-line", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "font-medium text-ink-secondary dark:text-ink truncate max-w-[170px]", children: tx.desc }),
          /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted", children: new Date(tx.date).toLocaleString("en-PK", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) })
        ] }),
        /* @__PURE__ */ jsxs("span", { className: `font-bold ${tx.type === "in" ? "text-emerald-500" : "text-red-500"}`, children: [
          tx.type === "in" ? "+" : "-",
          " ",
          currencySymbol,
          " ",
          Math.abs(parseFloat(tx.amount)).toLocaleString()
        ] })
      ] }, tx.id || i)) : /* @__PURE__ */ jsx("p", { className: "text-center text-xs text-ink-muted py-4", children: "No recent history." }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "p-4 grid grid-cols-4 gap-2", children: [
      /* @__PURE__ */ jsxs("button", { onClick: () => {
        onNavigate("store.funds.index");
        onClose();
      }, className: "flex flex-col items-center gap-1 p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors group", children: [
        /* @__PURE__ */ jsx(ArrowDownRight, { size: 18, className: "text-emerald-500 transition-transform" }),
        /* @__PURE__ */ jsx("span", { className: "text-3xs font-bold text-emerald-600 dark:text-emerald-400", children: "Add" })
      ] }),
      /* @__PURE__ */ jsxs("button", { onClick: () => {
        onNavigate("store.funds.index");
        onClose();
      }, className: "flex flex-col items-center gap-1 p-3 bg-red-50 dark:bg-red-500/10 rounded-2xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors group", children: [
        /* @__PURE__ */ jsx(ArrowUpRight, { size: 18, className: "text-red-500 transition-transform" }),
        /* @__PURE__ */ jsx("span", { className: "text-3xs font-bold text-red-600 dark:text-red-400", children: "Remove" })
      ] }),
      /* @__PURE__ */ jsxs("button", { onClick: () => {
        onNavigate("store.funds.index");
        onClose();
      }, className: "flex flex-col items-center gap-1 p-3 bg-blue-50 dark:bg-blue-500/10 rounded-2xl hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors group", children: [
        /* @__PURE__ */ jsx(RefreshCw, { size: 18, className: "text-blue-500 transition-transform" }),
        /* @__PURE__ */ jsx("span", { className: "text-3xs font-bold text-blue-600 dark:text-blue-400", children: "Transfer" })
      ] }),
      /* @__PURE__ */ jsxs("button", { onClick: () => {
        onNavigate("store.funds.index", { view: "history" });
        onClose();
      }, className: "flex flex-col items-center gap-1 p-3 bg-sunken rounded-2xl hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors group", children: [
        /* @__PURE__ */ jsx(FileText, { size: 18, className: "text-ink-muted transition-transform" }),
        /* @__PURE__ */ jsx("span", { className: "text-3xs font-bold text-ink-secondary", children: "History" })
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
  return /* @__PURE__ */ jsxs("div", { className: "bg-neutral-900 text-white rounded-lg p-6 flex flex-col relative overflow-hidden shadow-2xl ring-1 ring-white/10", children: [
    /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-[500px] h-[500px] bg-brand-600/30 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" }),
    /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-600/20 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3 pointer-events-none" }),
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
          /* @__PURE__ */ jsx("p", { className: "text-xs text-neutral-300 font-medium", children: "Total Balance" }),
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold tracking-tight", children: canViewBalances ? formatMoney(totalBalance) : "Restricted" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "relative", ref: settingsRef, children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setIsSettingsOpen(!isSettingsOpen),
            className: `p-2 bg-white/5 hover:bg-white/10 rounded-[14px] transition-colors backdrop-blur-sm ${isSettingsOpen ? "bg-white/20" : ""}`,
            children: /* @__PURE__ */ jsx(MoreHorizontal, { size: 20, className: "text-neutral-300" })
          }
        ),
        isSettingsOpen && /* @__PURE__ */ jsxs("div", { className: "absolute top-12 right-0 w-48 bg-neutral-800 rounded-[14px] shadow-xl border border-neutral-700 p-1 z-50 animate-in fade-in zoom-in-95 duration-normal", children: [
          /* @__PURE__ */ jsx("button", { className: "w-full text-left px-3 py-2 text-xs font-medium text-neutral-300 hover:bg-interactive-hover hover:text-white rounded-lg transition-colors", children: "View Profile" }),
          /* @__PURE__ */ jsx("button", { className: "w-full text-left px-3 py-2 text-xs font-medium text-neutral-300 hover:bg-interactive-hover hover:text-white rounded-lg transition-colors", children: "Account Settings" }),
          /* @__PURE__ */ jsx("div", { className: "h-px bg-neutral-700 my-1" }),
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
        /* @__PURE__ */ jsxs("button", { onClick: () => setIsMenuOpen(!isMenuOpen), className: `col-span-1 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/50 text-brand-400 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 group backdrop-blur-sm ${isMenuOpen ? "bg-brand-500/20 ring-2 ring-brand-500/30" : ""}`, children: [
          /* @__PURE__ */ jsx("div", { className: "p-1.5 rounded-full bg-brand-500/20 group-hover:bg-brand-500 group-hover:text-white transition-colors", children: /* @__PURE__ */ jsx(Plus, { size: 18 }) }),
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
    /* @__PURE__ */ jsxs("div", { className: "relative z-10 mb-8 flex-1 content-start space-y-3", children: [
      canViewBalances && /* @__PURE__ */ jsxs("div", { onClick: () => setIsCashModalOpen(true), className: "bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 hover:border-white/20 transition-all cursor-pointer group", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Wallet, { size: 18, className: "text-emerald-300" }),
            /* @__PURE__ */ jsx("span", { className: "text-[12px] font-bold text-neutral-200", children: "Cash in Hand" })
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
      /* @__PURE__ */ jsxs("div", { id: "tour-stock-value", onClick: () => router.visit(route("store.inventory.index", { store_slug: store?.slug })), className: "bg-brand-500/10 backdrop-blur-md rounded-2xl p-4 border border-brand-500/20 hover:border-brand-500/40 transition-all cursor-pointer group", children: [
        /* @__PURE__ */ jsx("div", { className: "flex justify-between items-start mb-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Box, { size: 18, className: "text-brand-300" }),
          /* @__PURE__ */ jsx("span", { className: "text-[12px] font-bold text-neutral-200", children: "Stock Value" })
        ] }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h4", { className: "text-2xl font-bold tracking-tight text-white mb-1", children: formatMoney(inventoryValue) }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-2xs text-brand-400", children: [
            /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-brand-400" }),
            "Total Asset Cost"
          ] })
        ] })
      ] }),
      canViewBalances && (bankAccounts.length > 0 ? /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold text-ink-muted uppercase tracking-wider pl-1", children: "Bank Accounts" }),
        bankAccounts.map((acc) => /* @__PURE__ */ jsxs("div", { onClick: () => handleNavigate("store.bank-accounts.index"), className: "bg-white/5 backdrop-blur-md rounded-xl p-3 border border-white/5 hover:bg-white/10 transition-all flex justify-between items-center group cursor-pointer active:scale-[0.99]", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx(Landmark, { size: 18, className: "text-blue-300" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-neutral-200", children: acc.bank_name || acc.name }),
              /* @__PURE__ */ jsxs("p", { className: "text-2xs text-ink-muted", children: [
                "**** ",
                acc.account_number ? acc.account_number.slice(-4) : "...."
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx("span", { className: "font-bold text-white text-sm", children: formatMoney(acc.current_balance) })
        ] }, acc.id))
      ] }) : /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-2xl border border-dashed border-neutral-700 bg-white/5 flex flex-col items-center justify-center text-center gap-2 group hover:bg-white/10 transition-colors cursor-pointer", onClick: () => handleNavigate("store.bank-accounts.index", { action: "add" }), children: [
        /* @__PURE__ */ jsx("div", { className: "p-2 bg-neutral-800 rounded-full text-ink-muted group-hover:text-brand-400 transition-all", children: /* @__PURE__ */ jsx(Plus, { size: 16 }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-neutral-300", children: "Add Bank Account" }),
          /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted", children: "Track your business banking" })
        ] })
      ] }))
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "relative z-10 mt-auto bg-black/20 rounded-2xl p-4 backdrop-blur-sm border border-white/5 flex flex-col", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-3 shrink-0", children: [
        /* @__PURE__ */ jsx("h3", { className: "font-bold text-xs text-neutral-300 uppercase tracking-wider", children: "Activity" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-3xs text-ink-muted", children: [
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
      /* @__PURE__ */ jsx("div", { className: "p-1 space-y-2", children: recentTransactions && recentTransactions.length > 0 ? recentTransactions.map((tx, i) => {
        const activityType = tx.activityType || (tx.type === "Sale" ? "sale" : tx.type === "Purchase" ? "purchase" : "other");
        const colorMap = {
          sale: { bg: "bg-blue-500/20", text: "text-blue-400", dot: "bg-blue-500", amountColor: "text-emerald-400" },
          return: { bg: "bg-rose-500/20", text: "text-rose-400", dot: "bg-rose-500", amountColor: "text-rose-400" },
          purchase: { bg: "bg-amber-500/20", text: "text-amber-400", dot: "bg-amber-500", amountColor: "text-amber-400" },
          payment_in: { bg: "bg-emerald-500/20", text: "text-emerald-400", dot: "bg-emerald-500", amountColor: "text-emerald-400" },
          payment_out: { bg: "bg-brand-500/20", text: "text-brand-400", dot: "bg-brand-500", amountColor: "text-brand-400" },
          expense: { bg: "bg-red-500/20", text: "text-red-400", dot: "bg-red-500", amountColor: "text-red-400" },
          other: { bg: "bg-neutral-500/20", text: "text-ink-muted", dot: "bg-neutral-500", amountColor: "text-neutral-300" }
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
                  /* @__PURE__ */ jsx("span", { className: "text-3xs text-ink-muted leading-none", children: tx.time })
                ] })
              ] }),
              /* @__PURE__ */ jsx("span", { className: `text-1xs font-bold ${isIncoming ? "text-emerald-400" : colors.amountColor}`, children: tx.amount })
            ]
          },
          i
        );
      }) : /* @__PURE__ */ jsx("div", { className: "text-center py-4 text-ink-muted text-xs", children: "No recent activity" }) })
    ] })
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
              formatCurrency$1(data.total_potential_revenue || 0, store)
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
                formatCurrency$1(rec.potential_revenue || 0, store)
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
  RightPanel as R,
  TodaysOpportunities as T
};

import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef, useCallback } from "react";
import { g as getCurrencySymbol } from "./format-B_ph0Qec.js";
import { usePage, Head, router } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./marketing-pages-CTBAvetE.js";
import { ArrowDownCircle, CalendarDays, Banknote, Building2, CreditCard, Smartphone, Hash, FileText, CheckCircle2, Search, X, User, Minus, TrendingUp, TrendingDown } from "lucide-react";
import axios from "axios";
import "marked";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
const formatCurrency = (v, symbol = "Rs") => symbol + " " + new Intl.NumberFormat("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v || 0);
const AC_OFF_NAME = "party-search-" + Math.random().toString(36).slice(2);
function PartySearchField({ value, selectedParty, onSelect, onClear, accentClass, ringClass }) {
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState([]);
  const [defaultResults, setDefaultResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);
  const { store } = usePage().props;
  useEffect(() => {
    axios.get(route("store.parties.search", {
      store_slug: store.slug
    }), { params: {} }).then((res) => setDefaultResults((res.data || []).slice(0, 5))).catch(() => {
    });
  }, []);
  const search = useCallback(async (q) => {
    setLoading(true);
    try {
      const res = await axios.get(route("store.parties.search", {
        store_slug: store.slug
      }), { params: q ? { search: q } : {} });
      setResults(res.data || []);
      setOpen(true);
    } catch (e) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);
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
    /* @__PURE__ */ jsxs("div", { style: { outline: "none" }, className: `flex items-center gap-2 w-full px-3 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border ${selectedParty ? "border-emerald-500" : "border-slate-200 dark:border-slate-700"} transition-all focus-within:border-emerald-500`, children: [
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
      loading && /* @__PURE__ */ jsx("div", { className: "w-4 h-4 border-2 border-slate-300 border-t-emerald-500 rounded-full animate-spin shrink-0" }),
      (query || selectedParty) && !loading && /* @__PURE__ */ jsx("button", { type: "button", onClick: handleClear, className: "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition shrink-0", children: /* @__PURE__ */ jsx(X, { size: 14 }) })
    ] }),
    selectedParty && /* @__PURE__ */ jsxs("div", { className: "mt-1.5 flex items-center gap-2 px-1", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsx("div", { className: "w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center", children: /* @__PURE__ */ jsx(User, { size: 10, className: "text-emerald-600" }) }),
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
const METHODS = [
  { value: "cash", label: "Cash", icon: Banknote, color: "emerald" },
  { value: "bank", label: "Bank", icon: Building2, color: "blue" },
  { value: "card", label: "Card", icon: CreditCard, color: "purple" },
  { value: "upi", label: "UPI/JazzCash", icon: Smartphone, color: "orange" }
];
function PaymentIn({ parties = [], bankAccounts = [], selected_party_id = null }) {
  const {
    store
  } = usePage().props;
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
  const handlePartySelect = (party) => {
    setSelectedParty(party);
    setFormData((prev) => ({ ...prev, party_id: party.id, party_name: party.name }));
  };
  useEffect(() => {
    if (selected_party_id) {
      const party = parties.find((p) => String(p.id) === String(selected_party_id));
      if (party) {
        handlePartySelect(party);
      }
    }
  }, [selected_party_id, parties]);
  const handlePartyClear = () => {
    setSelectedParty(null);
    setFormData((prev) => ({ ...prev, party_id: "", party_name: "" }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      await axios.post(route("store.payments.store", { store_slug: store.slug }), { ...formData, type: "in" });
      setSuccess(true);
      setTimeout(() => router.visit(route("store.payments.index", { store_slug: store.slug })), 1200);
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
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Payment In", children: [
    /* @__PURE__ */ jsx(Head, { title: "Record Payment In" }),
    /* @__PURE__ */ jsx("div", { className: "h-full flex flex-col items-center justify-center overflow-auto py-6 px-4", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-xl relative", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-teal-500/10 rounded-3xl blur-xl pointer-events-none" }),
      /* @__PURE__ */ jsxs("div", { className: "relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5 overflow-hidden", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" }),
          /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-10 w-24 h-24 bg-white/5 rounded-full translate-y-1/2" }),
          /* @__PURE__ */ jsxs("div", { className: "relative flex items-center gap-4", children: [
            /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shadow-lg", children: /* @__PURE__ */ jsx(ArrowDownCircle, { size: 22, className: "text-white" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h1", { className: "text-xl font-black text-white tracking-tight", children: "Record Payment In" }),
              /* @__PURE__ */ jsx("p", { className: "text-emerald-100 text-sm", children: "Money received from a contact" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "p-6 space-y-5", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("label", { className: "block text-2xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5", children: [
              "Receive From ",
              /* @__PURE__ */ jsx("span", { className: "text-red-500", children: "*" })
            ] }),
            /* @__PURE__ */ jsx(
              PartySearchField,
              {
                selectedParty,
                onSelect: handlePartySelect,
                onClear: handlePartyClear,
                accentClass: "border-emerald-500",
                ringClass: "ring-emerald-500/20"
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
                    className: "w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 ring-emerald-500/20 focus:border-emerald-500 transition"
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
                /* @__PURE__ */ jsx("span", { className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold", children: getCurrencySymbol() }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "number",
                    value: formData.amount,
                    onChange: (e) => setFormData((p) => ({ ...p, amount: e.target.value })),
                    placeholder: "0",
                    className: "w-full pl-8 pr-3 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 ring-emerald-500/20 focus:border-emerald-500 transition"
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
                  className: `flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl border-2 transition-all text-2xs font-bold uppercase ${isSelected ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-800/40"}`,
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
                className: "w-full px-3 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 ring-emerald-500/20 focus:border-emerald-500 transition",
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
                    className: "w-full pl-8 pr-3 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 ring-emerald-500/20 focus:border-emerald-500 transition"
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
                    className: "w-full pl-8 pr-3 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 ring-emerald-500/20 focus:border-emerald-500 transition"
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
                onClick: () => router.visit(route("store.payments.index", { store_slug: store.slug })),
                className: "px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition",
                children: "← Cancel"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "submit",
                disabled: loading || success,
                className: "flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-60",
                children: success ? /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx(CheckCircle2, { size: 16 }),
                  " Recorded!"
                ] }) : loading ? /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx("div", { className: "w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" }),
                  " Recording..."
                ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx(ArrowDownCircle, { size: 16 }),
                  " Record Payment In"
                ] })
              }
            )
          ] })
        ] })
      ] })
    ] }) })
  ] });
}
export {
  PaymentIn as default
};

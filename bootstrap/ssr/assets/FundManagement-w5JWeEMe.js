import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { g as getCurrencySymbol } from "./format-B_ph0Qec.js";
import { usePage, Head, router } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-KMWHwZqK.js";
import { M as MoneyModuleTabs } from "./MoneyModuleTabs-Bn5c0gSZ.js";
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Area } from "recharts";
import { X, Shield, Delete, Check, Settings2, Plus, Minus, ArrowLeftRight, Clock, ExternalLink, Search, Filter, Wallet, Landmark, AlertCircle, TrendingUp } from "lucide-react";
import axios from "axios";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "laravel-echo";
import "pusher-js";
import "driver.js";
function ElevatedPinModal({ isOpen, onClose, onSuccess, permission, actionLabel = "this action", store }) {
  const [step, setStep] = useState("select");
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  useEffect(() => {
    if (!isOpen) {
      setStep("select");
      setSelectedMember(null);
      setInput("");
      setError("");
      return;
    }
    fetchMembers();
  }, [isOpen]);
  useEffect(() => {
    if (step !== "pin" || !isOpen) return;
    const handleKeyDown = (e) => {
      if (/^[0-9]$/.test(e.key)) handleNumberClick(e.key);
      else if (e.key === "Backspace") handleDelete();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [step, isOpen, input]);
  const fetchMembers = async () => {
    setLoadingMembers(true);
    try {
      const res = await axios.get(route("store.profile.store-members", { store_slug: store?.slug }));
      setMembers(res.data.members || []);
    } catch {
      setMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };
  const handleNumberClick = (num) => {
    if (input.length >= 6) return;
    const newInput = input + num;
    setInput(newInput);
    setError("");
    if (newInput.length === 6) setTimeout(() => verifyPin(newInput), 200);
  };
  const handleDelete = () => {
    setInput((prev) => prev.slice(0, -1));
    setError("");
  };
  const verifyPin = async (pin) => {
    if (pin.length !== 6) return;
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(route("store.profile.verify-elevated-pin", { store_slug: store?.slug }), {
        pin,
        user_id: selectedMember?.user_id ?? null,
        permission
      });
      if (res.data.success) {
        onSuccess(pin, res.data.authorized_by);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Incorrect PIN");
      setTimeout(() => setInput(""), 400);
    } finally {
      setLoading(false);
    }
  };
  if (!isOpen) return null;
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-200", children: /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative animate-in zoom-in-95 duration-200", children: [
    /* @__PURE__ */ jsx("button", { onClick: onClose, className: "absolute right-6 top-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 z-10 transition-colors", children: /* @__PURE__ */ jsx(X, { size: 20 }) }),
    step === "select" ? /* @__PURE__ */ jsxs("div", { className: "p-8 space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center space-y-2", children: [
        /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-violet-100 dark:bg-violet-900/30 rounded-[1.5rem] flex items-center justify-center mx-auto text-violet-600", children: /* @__PURE__ */ jsx(Shield, { size: 32 }) }),
        /* @__PURE__ */ jsx("h3", { className: "text-xl font-black text-slate-900 dark:text-white", children: "Authorization Required" }),
        /* @__PURE__ */ jsxs("p", { className: "text-slate-500 text-xs", children: [
          "Select who is authorizing ",
          /* @__PURE__ */ jsx("strong", { children: actionLabel })
        ] })
      ] }),
      loadingMembers ? /* @__PURE__ */ jsx("p", { className: "text-center text-slate-400 text-sm py-4", children: "Loading members..." }) : members.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-center text-slate-400 text-sm py-4", children: "No store members with a PIN set up." }) : /* @__PURE__ */ jsx("div", { className: "space-y-2 max-h-64 overflow-y-auto", children: members.map((m) => /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => {
            setSelectedMember(m);
            setStep("pin");
          },
          className: "w-full flex items-center gap-3 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all text-left",
          children: [
            /* @__PURE__ */ jsx("div", { className: "w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-violet-600 font-black text-sm", children: m.name.charAt(0).toUpperCase() }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "font-bold text-sm text-slate-800 dark:text-white", children: m.name }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 capitalize", children: m.role })
            ] })
          ]
        },
        m.user_id
      )) })
    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("div", { className: "p-8 text-center border-b border-slate-100 dark:border-slate-800 space-y-2", children: [
        /* @__PURE__ */ jsxs("button", { onClick: () => {
          setStep("select");
          setInput("");
          setError("");
        }, className: "text-xs text-violet-500 font-bold mb-2 flex items-center gap-1 mx-auto", children: [
          "← ",
          selectedMember?.name
        ] }),
        /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-violet-100 dark:bg-violet-900/30 rounded-[1.5rem] flex items-center justify-center mx-auto text-violet-600", children: /* @__PURE__ */ jsx(Shield, { size: 32 }) }),
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-black text-slate-900 dark:text-white", children: "Enter PIN" }),
        /* @__PURE__ */ jsxs("p", { className: "text-slate-500 text-xs", children: [
          selectedMember?.name,
          "'s 6-digit security PIN"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: `py-8 bg-slate-50 dark:bg-slate-800/30 flex flex-col items-center gap-4`, children: [
        /* @__PURE__ */ jsx("div", { className: "flex gap-3", children: [...Array(6)].map((_, i) => /* @__PURE__ */ jsx("div", { className: `w-4 h-4 rounded-full transition-all duration-300 ${i < input.length ? "bg-violet-600 scale-125" : "bg-slate-300 dark:bg-slate-700"} ${error ? "bg-red-500 animate-pulse" : ""}` }, i)) }),
        error && /* @__PURE__ */ jsx("p", { className: "text-red-500 text-xs font-black uppercase tracking-wider", children: error })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-8 grid grid-cols-3 gap-3 bg-white dark:bg-slate-900", children: [
        [1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => /* @__PURE__ */ jsx(
          "button",
          {
            disabled: loading,
            onClick: () => handleNumberClick(num.toString()),
            className: "h-14 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-xl font-black text-slate-700 dark:text-white hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-600 transition-all active:scale-95 disabled:opacity-50",
            children: num
          },
          num
        )),
        /* @__PURE__ */ jsx("button", { disabled: loading, onClick: handleDelete, className: "h-14 rounded-2xl flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all active:scale-95", children: /* @__PURE__ */ jsx(Delete, { size: 24 }) }),
        /* @__PURE__ */ jsx("button", { disabled: loading, onClick: () => handleNumberClick("0"), className: "h-14 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-xl font-black text-slate-700 dark:text-white hover:bg-violet-50 hover:text-violet-600 transition-all active:scale-95 disabled:opacity-50", children: "0" }),
        /* @__PURE__ */ jsx(
          "button",
          {
            disabled: loading || input.length !== 6,
            onClick: () => verifyPin(input),
            className: `h-14 rounded-2xl flex items-center justify-center transition-all active:scale-95 ${input.length === 6 ? "bg-violet-600 text-white shadow-lg shadow-violet-500/30 hover:bg-violet-700" : "bg-slate-100 dark:bg-slate-800 text-slate-300 cursor-not-allowed"}`,
            children: /* @__PURE__ */ jsx(Check, { size: 28 })
          }
        )
      ] })
    ] })
  ] }) });
}
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200", onClick: onClose, children: /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700 overflow-hidden", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-slate-800 dark:text-white", children: title }),
      /* @__PURE__ */ jsx("button", { onClick: onClose, className: "p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors", children: /* @__PURE__ */ jsx(X, { size: 18, className: "text-slate-400" }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "p-5", children })
  ] }) });
};
const ActionCard3D = ({ icon: Icon, title, description, colorClass, glowColor, onClick, delay = 0 }) => {
  const cardRef = useRef(null);
  const glowRef = useRef(null);
  const handleMouseMove = (e) => {
    if (!cardRef.current || !glowRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / centerY * -10;
    const rotateY = (x - centerX) / centerX * 10;
    cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    const glowX = x / rect.width * 100;
    const glowY = y / rect.height * 100;
    glowRef.current.style.opacity = "1";
    glowRef.current.style.background = `radial-gradient(circle at ${glowX}% ${glowY}%, rgba(255,255,255,0.2), transparent 70%)`;
  };
  const handleMouseLeave = () => {
    if (!cardRef.current || !glowRef.current) return;
    cardRef.current.style.transform = "perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)";
    glowRef.current.style.opacity = "0";
  };
  return /* @__PURE__ */ jsxs(
    "button",
    {
      onClick,
      className: "group relative w-full h-[120px] cursor-pointer block animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-backwards z-10 hover:z-20",
      style: { animationDelay: `${delay}ms` },
      onMouseMove: handleMouseMove,
      onMouseLeave: handleMouseLeave,
      children: [
        /* @__PURE__ */ jsx("div", { className: `absolute inset-0 ${colorClass} rounded-2xl blur-[30px] opacity-20 group-hover:opacity-40 transition-opacity duration-500` }),
        /* @__PURE__ */ jsxs(
          "div",
          {
            ref: cardRef,
            className: "relative h-full w-full bg-white dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/10 p-4 flex flex-col items-center justify-center text-center transition-transform duration-100 ease-out will-change-transform shadow-sm group-hover:shadow-xl dark:shadow-black/50",
            style: { transformStyle: "preserve-3d" },
            children: [
              /* @__PURE__ */ jsx("div", { ref: glowRef, className: "absolute inset-0 transition-opacity duration-300 pointer-events-none opacity-0 mix-blend-soft-light z-20 rounded-2xl" }),
              /* @__PURE__ */ jsxs("div", { className: "relative z-10 flex flex-col items-center", children: [
                /* @__PURE__ */ jsx("div", { className: `mb-2 p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 ${glowColor} shadow-inner group-hover:scale-110 transition-transform duration-300`, children: /* @__PURE__ */ jsx(Icon, { size: 20 }) }),
                /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold mb-0.5 text-slate-800 dark:text-white group-hover:text-indigo-500 dark:group-hover:text-indigo-300 transition-colors", children: title }),
                /* @__PURE__ */ jsx("p", { className: "text-slate-500 dark:text-slate-400 text-[10px] font-medium", children: description })
              ] })
            ]
          }
        )
      ]
    }
  );
};
const FundFlowChart = ({ transactions, store }) => {
  const data = useMemo(() => {
    const grouped = {};
    [...transactions].reverse().forEach((tx) => {
      const dateStr = tx.created_at.split(" ").slice(0, 3).join(" ");
      if (!grouped[dateStr]) {
        grouped[dateStr] = { name: dateStr.split(",")[0], income: 0, expense: 0, net: 0 };
      }
      const amount = parseFloat(tx.amount);
      if (tx.type === "add") {
        grouped[dateStr].income += amount;
        grouped[dateStr].net += amount;
      } else if (tx.type === "remove") {
        grouped[dateStr].expense += amount;
        grouped[dateStr].net -= amount;
      }
    });
    const result = Object.values(grouped);
    if (result.length === 0) {
      return [{ name: "Today", income: 0, expense: 0 }];
    }
    return result;
  }, [transactions]);
  return /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm h-full min-h-[300px] flex flex-col", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-4", children: [
      /* @__PURE__ */ jsxs("h2", { className: "text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("div", { className: "p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600", children: /* @__PURE__ */ jsx(TrendingUp, { size: 16 }) }),
        "Fund Flow Analysis"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg", children: [
          /* @__PURE__ */ jsx("div", { className: "w-2 h-2 rounded-full bg-emerald-500" }),
          " In"
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-900/20 px-2 py-1 rounded-lg", children: [
          /* @__PURE__ */ jsx("div", { className: "w-2 h-2 rounded-full bg-rose-500" }),
          " Out"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex-1 w-full min-h-0", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", minWidth: 1, minHeight: 1, children: /* @__PURE__ */ jsxs(AreaChart, { data, margin: { top: 10, right: 10, left: 0, bottom: 0 }, children: [
      /* @__PURE__ */ jsxs("defs", { children: [
        /* @__PURE__ */ jsxs("linearGradient", { id: "colorIncome", x1: "0", y1: "0", x2: "0", y2: "1", children: [
          /* @__PURE__ */ jsx("stop", { offset: "5%", stopColor: "#10b981", stopOpacity: 0.3 }),
          /* @__PURE__ */ jsx("stop", { offset: "95%", stopColor: "#10b981", stopOpacity: 0 })
        ] }),
        /* @__PURE__ */ jsxs("linearGradient", { id: "colorExpense", x1: "0", y1: "0", x2: "0", y2: "1", children: [
          /* @__PURE__ */ jsx("stop", { offset: "5%", stopColor: "#f43f5e", stopOpacity: 0.3 }),
          /* @__PURE__ */ jsx("stop", { offset: "95%", stopColor: "#f43f5e", stopOpacity: 0 })
        ] })
      ] }),
      /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", vertical: false, stroke: "#E2E8F0", strokeOpacity: 0.5 }),
      /* @__PURE__ */ jsx(
        XAxis,
        {
          dataKey: "name",
          axisLine: false,
          tickLine: false,
          tick: { fontSize: 10, fill: "#94a3b8" },
          dy: 10
        }
      ),
      /* @__PURE__ */ jsx(
        YAxis,
        {
          axisLine: false,
          tickLine: false,
          tick: { fontSize: 10, fill: "#94a3b8" },
          tickFormatter: (val) => `${getCurrencySymbol()} ${val / 1e3}k`
        }
      ),
      /* @__PURE__ */ jsx(
        Tooltip,
        {
          contentStyle: { backgroundColor: "#1e293b", borderRadius: "12px", border: "none", color: "#fff" },
          itemStyle: { fontSize: "12px" }
        }
      ),
      /* @__PURE__ */ jsx(Area, { type: "monotone", dataKey: "income", stroke: "#10b981", strokeWidth: 3, fillOpacity: 1, fill: "url(#colorIncome)" }),
      /* @__PURE__ */ jsx(Area, { type: "monotone", dataKey: "expense", stroke: "#f43f5e", strokeWidth: 3, fillOpacity: 1, fill: "url(#colorExpense)" })
    ] }) }) })
  ] });
};
function FundManagement({ cashAccount, bankAccounts = [], transactions = [], ledger = [], totalFunds = 0, stats = {} }) {
  const { flash, store } = usePage().props;
  const [mode, setMode] = useState("dashboard");
  const [subMode, setSubMode] = useState("all");
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("view") === "history") {
      setMode("transactions");
      setSubMode("all");
    }
    const actionParam = params.get("action") || params.get("modal");
    if (["add", "remove", "transfer", "adjust"].includes(actionParam)) {
      setActiveModal(actionParam);
    }
  }, []);
  const [activeModal, setActiveModal] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [verifiedPin, setVerifiedPin] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    account_type: "cash",
    bank_account_id: "",
    amount: "",
    reason: "",
    notes: "",
    new_balance: "",
    from_type: "bank",
    from_bank_id: "",
    to_type: "cash",
    to_bank_id: ""
  });
  const resetForm = () => {
    setFormData({
      account_type: "cash",
      bank_account_id: "",
      amount: "",
      reason: "",
      notes: "",
      new_balance: "",
      from_type: "bank",
      from_bank_id: "",
      to_type: "cash",
      to_bank_id: ""
    });
  };
  const handleSubmit = (action) => {
    setPendingAction(action);
    setIsSecurityModalOpen(true);
  };
  const confirmSubmit = (pin) => {
    if (!pendingAction) return;
    setProcessing(true);
    router.post(route(`store.funds.${pendingAction}`, { store_slug: store.slug }), {
      ...formData,
      passcode: pin
    }, {
      onSuccess: () => {
        setActiveModal(null);
        setIsSecurityModalOpen(false);
        setPendingAction(null);
        resetForm();
      },
      onFinish: () => {
        setProcessing(false);
        setIsSecurityModalOpen(false);
        setPendingAction(null);
      }
    });
  };
  const handleNavClick = (newMode, newSubMode = "all") => {
    setMode(newMode);
    setSubMode(newSubMode);
  };
  const filteredTransactions = useMemo(() => {
    let data = [...transactions];
    if (subMode === "deposits") data = data.filter((t) => t.type === "add");
    if (subMode === "withdrawals") data = data.filter((t) => t.type === "remove");
    if (subMode === "transfers") data = data.filter((t) => t.type === "transfer");
    if (subMode === "adjustments") data = data.filter((t) => t.type === "adjust");
    if (subMode === "sales") data = data.filter((t) => t.type === "sale");
    if (subMode === "purchases") data = data.filter((t) => t.type === "purchase");
    if (subMode === "expenses") data = data.filter((t) => t.type === "expense");
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      data = data.filter(
        (t) => (t.reason?.toLowerCase() || "").includes(lower) || (t.notes?.toLowerCase() || "").includes(lower) || (t.amount?.toString() || "").includes(lower)
      );
    }
    return data;
  }, [transactions, subMode, searchTerm]);
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Fund Management", activeMenu: "Money", children: [
    /* @__PURE__ */ jsx(Head, { title: "Fund Management" }),
    /* @__PURE__ */ jsx(
      ElevatedPinModal,
      {
        isOpen: isSecurityModalOpen,
        onClose: () => {
          setIsSecurityModalOpen(false);
          setPendingAction(null);
        },
        onSuccess: (pin, authorizedBy) => {
          setVerifiedPin(pin);
          confirmSubmit(pin);
        },
        permission: "funds.manage",
        actionLabel: pendingAction ? pendingAction + " funds" : "this action",
        store
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-2 gap-2 overflow-hidden", children: [
      /* @__PURE__ */ jsx(MoneyModuleTabs, { activeTab: "funds", className: "!mb-2" }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 overflow-x-auto p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0 no-scrollbar", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => handleNavClick("dashboard"),
            className: `px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${mode === "dashboard" ? "bg-slate-800 text-white dark:bg-white dark:text-slate-900 shadow-md" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`,
            children: [
              /* @__PURE__ */ jsx(Settings2, { size: 16 }),
              " Dashboard"
            ]
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => handleNavClick("transactions", "all"),
            className: `px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${mode === "transactions" && subMode === "all" ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`,
            children: "All Transactions"
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => handleNavClick("transactions", "deposits"),
            className: `px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${mode === "transactions" && subMode === "deposits" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`,
            children: [
              "Deposits ",
              /* @__PURE__ */ jsx("span", { className: "text-[10px] bg-emerald-200 dark:bg-emerald-800 px-1.5 rounded-full ml-1", children: "Add" })
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => handleNavClick("transactions", "withdrawals"),
            className: `px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${mode === "transactions" && subMode === "withdrawals" ? "bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`,
            children: [
              "Withdrawals ",
              /* @__PURE__ */ jsx("span", { className: "text-[10px] bg-rose-200 dark:bg-rose-800 px-1.5 rounded-full ml-1", children: "Rem" })
            ]
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => handleNavClick("transactions", "transfers"),
            className: `px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${mode === "transactions" && subMode === "transfers" ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`,
            children: "Transfers"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => handleNavClick("transactions", "adjustments"),
            className: `px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${mode === "transactions" && subMode === "adjustments" ? "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`,
            children: "Adjustments"
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => handleNavClick("transactions", "sales"),
            className: `px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${mode === "transactions" && subMode === "sales" ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`,
            children: "Sales"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => handleNavClick("transactions", "purchases"),
            className: `px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${mode === "transactions" && subMode === "purchases" ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`,
            children: "Purchases"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => handleNavClick("transactions", "expenses"),
            className: `px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${mode === "transactions" && subMode === "expenses" ? "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`,
            children: "Expenses"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-hidden animate-in fade-in duration-300", children: [
        mode === "dashboard" && /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full gap-4 p-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-6 p-2 shrink-0", children: [
            /* @__PURE__ */ jsx(
              ActionCard3D,
              {
                icon: Plus,
                title: "Add Funds",
                description: "Capital Injection",
                colorClass: "bg-emerald-500",
                glowColor: "text-emerald-500 dark:text-emerald-400",
                onClick: () => setActiveModal("add"),
                delay: 0
              }
            ),
            /* @__PURE__ */ jsx(
              ActionCard3D,
              {
                icon: Minus,
                title: "Remove Funds",
                description: "Owner Drawing",
                colorClass: "bg-rose-500",
                glowColor: "text-rose-500 dark:text-rose-400",
                onClick: () => setActiveModal("remove"),
                delay: 100
              }
            ),
            /* @__PURE__ */ jsx(
              ActionCard3D,
              {
                icon: ArrowLeftRight,
                title: "Transfer",
                description: "Move Money",
                colorClass: "bg-blue-500",
                glowColor: "text-blue-500 dark:text-blue-400",
                onClick: () => setActiveModal("transfer"),
                delay: 200
              }
            ),
            /* @__PURE__ */ jsx(
              ActionCard3D,
              {
                icon: Settings2,
                title: "Adjust",
                description: "Fix Balance",
                colorClass: "bg-amber-500",
                glowColor: "text-amber-500 dark:text-amber-400",
                onClick: () => setActiveModal("adjust"),
                delay: 300
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-12 gap-6 shrink-0 h-[250px] lg:h-[300px]", children: [
            /* @__PURE__ */ jsx("div", { className: "lg:col-span-8 h-full", children: /* @__PURE__ */ jsx(FundFlowChart, { transactions, store }) }),
            /* @__PURE__ */ jsx("div", { className: "lg:col-span-4 h-full flex flex-col", children: /* @__PURE__ */ jsxs("div", { className: "flex-1 bg-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group border border-slate-800", children: [
              /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[url('/images/noise.svg')] opacity-20 pointer-events-none" }),
              /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 p-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-500/20 transition-colors duration-500" }),
              /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 p-24 bg-purple-500/10 rounded-full blur-3xl -ml-12 -mb-12 group-hover:bg-purple-500/20 transition-colors duration-500" }),
              /* @__PURE__ */ jsxs("div", { className: "relative z-10 flex flex-col justify-between h-full", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsxs("h3", { className: "text-slate-400 font-medium text-xs uppercase tracking-wider mb-2 flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx("div", { className: "w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)] animate-pulse" }),
                    "Total Business Liquidity"
                  ] }),
                  /* @__PURE__ */ jsxs("h2", { className: "text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-indigo-300", children: [
                    getCurrencySymbol(),
                    " ",
                    parseFloat(totalFunds).toLocaleString()
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4 mt-6", children: [
                  /* @__PURE__ */ jsxs("div", { className: "bg-white/5 rounded-xl p-3 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors", children: [
                    /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400 uppercase font-bold mb-1", children: "Cash In Hand" }),
                    /* @__PURE__ */ jsxs("p", { className: "font-bold text-lg text-emerald-400", children: [
                      getCurrencySymbol(),
                      " ",
                      parseFloat(cashAccount.balance).toLocaleString()
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "bg-white/5 rounded-xl p-3 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors", children: [
                    /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400 uppercase font-bold mb-1", children: "Bank Accounts" }),
                    /* @__PURE__ */ jsxs("p", { className: "font-bold text-lg text-blue-400", children: [
                      getCurrencySymbol(),
                      " ",
                      bankAccounts.reduce((sum, b) => sum + parseFloat(b.balance), 0).toLocaleString()
                    ] })
                  ] })
                ] })
              ] })
            ] }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1 min-h-0 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-4 shrink-0", children: [
              /* @__PURE__ */ jsxs("h3", { className: "text-slate-800 dark:text-white font-bold flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(Clock, { size: 16, className: "text-slate-400" }),
                " Recent Activity"
              ] }),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => setMode("transactions"),
                  className: "text-[10px] font-black uppercase text-indigo-500 hover:text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1",
                  children: [
                    "Full History ",
                    /* @__PURE__ */ jsx(ExternalLink, { size: 10 })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2", children: [
              transactions.slice(0, 10).map((tx) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
                  /* @__PURE__ */ jsx("div", { className: `w-10 h-10 rounded-xl flex items-center justify-center ${["add", "sale"].includes(tx.type) ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600" : ["remove", "purchase", "expense"].includes(tx.type) ? "bg-rose-100 dark:bg-rose-900/30 text-rose-600" : "bg-blue-100 dark:bg-blue-900/30 text-blue-600"}`, children: ["add", "sale"].includes(tx.type) ? /* @__PURE__ */ jsx(Plus, { size: 18 }) : ["remove", "purchase", "expense"].includes(tx.type) ? /* @__PURE__ */ jsx(Minus, { size: 18 }) : /* @__PURE__ */ jsx(ArrowLeftRight, { size: 18 }) }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-800 dark:text-white text-sm line-clamp-1", children: tx.reason || "Transaction" }),
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs text-slate-500", children: [
                      /* @__PURE__ */ jsx("span", { children: tx.created_at }),
                      /* @__PURE__ */ jsx("span", { className: "w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700" }),
                      /* @__PURE__ */ jsx("span", { children: tx.account_name })
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("span", { className: `text-sm font-bold ${tx.type === "add" ? "text-emerald-600" : tx.type === "remove" ? "text-rose-600" : "text-slate-700 dark:text-slate-300"}`, children: [
                  tx.type === "add" ? "+" : tx.type === "remove" ? "-" : "",
                  " ",
                  getCurrencySymbol(),
                  " ",
                  parseFloat(tx.amount).toLocaleString()
                ] })
              ] }, tx.id)),
              transactions.length === 0 && /* @__PURE__ */ jsxs("div", { className: "h-full flex flex-col items-center justify-center text-slate-400", children: [
                /* @__PURE__ */ jsx("div", { className: "p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-3", children: /* @__PURE__ */ jsx(Clock, { size: 24, className: "opacity-50" }) }),
                /* @__PURE__ */ jsx("p", { className: "text-sm", children: "No recent activity" })
              ] })
            ] })
          ] })
        ] }),
        mode === "transactions" && /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full mb-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/50 text-black dark:text-white", children: [
            /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 w-full sm:w-auto", children: /* @__PURE__ */ jsxs("div", { className: "relative w-full sm:w-64", children: [
              /* @__PURE__ */ jsx(Search, { size: 16, className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: searchTerm,
                  onChange: (e) => setSearchTerm(e.target.value),
                  placeholder: "Search...",
                  className: "w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                }
              )
            ] }) }),
            /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2", children: /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 flex items-center gap-2 cursor-pointer", children: [
              /* @__PURE__ */ jsx(Filter, { size: 14, className: "text-slate-400" }),
              /* @__PURE__ */ jsxs("span", { className: "text-xs font-bold text-slate-600 dark:text-slate-300", children: [
                filteredTransactions.length,
                " records"
              ] })
            ] }) })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-auto custom-scrollbar", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
            /* @__PURE__ */ jsx("thead", { className: "sticky top-0 z-10 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700", children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("th", { className: "p-4 text-xs font-bold text-slate-500 uppercase w-[15%]", children: "Date" }),
              /* @__PURE__ */ jsx("th", { className: "p-4 text-xs font-bold text-slate-500 uppercase w-[10%]", children: "Type" }),
              /* @__PURE__ */ jsx("th", { className: "p-4 text-xs font-bold text-slate-500 uppercase w-[30%]", children: "Details" }),
              /* @__PURE__ */ jsx("th", { className: "p-4 text-xs font-bold text-slate-500 uppercase w-[15%]", children: "Account" }),
              /* @__PURE__ */ jsx("th", { className: "p-4 text-xs font-bold text-slate-500 uppercase text-right w-[15%]", children: "Amount" }),
              /* @__PURE__ */ jsx("th", { className: "p-4 text-xs font-bold text-slate-500 uppercase w-[15%] text-right", children: "Reference" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: filteredTransactions.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 6, className: "p-12 text-center text-slate-400", children: /* @__PURE__ */ jsx("p", { children: "No transactions match your search." }) }) }) : filteredTransactions.map((tx) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors", children: [
              /* @__PURE__ */ jsx("td", { className: "p-4 text-sm font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap", children: tx.created_at }),
              /* @__PURE__ */ jsx("td", { className: "p-4", children: /* @__PURE__ */ jsx("span", { className: `px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border ${["add", "sale"].includes(tx.type) ? "bg-emerald-50 text-emerald-600 border-emerald-200" : ["remove", "purchase", "expense"].includes(tx.type) ? "bg-rose-50 text-rose-600 border-rose-200" : tx.type === "transfer" ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-orange-50 text-orange-600 border-orange-200"}`, children: tx.type === "add" ? "Capital Add" : tx.type === "remove" ? "Withdrawal" : tx.type === "sale" ? "Sale" : tx.type === "purchase" ? "Purchase" : tx.type === "expense" ? "Expense" : tx.type === "transfer" ? "Transfer" : "Adjustment" }) }),
              /* @__PURE__ */ jsxs("td", { className: "p-4", children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-800 dark:text-white line-clamp-1", children: tx.reason }),
                tx.notes && /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 line-clamp-1 italic", children: tx.notes })
              ] }),
              /* @__PURE__ */ jsx("td", { className: "p-4 text-sm text-slate-600 dark:text-slate-400", children: tx.account_name }),
              /* @__PURE__ */ jsxs("td", { className: `p-4 text-right text-sm font-black tabular-nums ${tx.is_outgoing ? "text-rose-600" : "text-emerald-600"}`, children: [
                tx.is_outgoing ? "-" : "+",
                " ",
                getCurrencySymbol(),
                " ",
                parseFloat(tx.amount).toLocaleString()
              ] }),
              /* @__PURE__ */ jsx("td", { className: "p-4 text-right text-xs font-mono text-slate-400", children: tx.reference || "-" })
            ] }, tx.id)) })
          ] }) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(Modal, { isOpen: activeModal === "add", onClose: () => setActiveModal(null), title: "Add Funds", children: /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2", children: "Add To" }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
          /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => setFormData({ ...formData, account_type: "cash" }), className: `p-3 rounded-xl border-2 transition-all ${formData.account_type === "cash" ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" : "border-slate-200 dark:border-slate-700"}`, children: [
            /* @__PURE__ */ jsx(Wallet, { size: 20, className: "mx-auto mb-1 text-emerald-500" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: "Cash" })
          ] }),
          /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => setFormData({ ...formData, account_type: "bank" }), className: `p-3 rounded-xl border-2 transition-all ${formData.account_type === "bank" ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-slate-200 dark:border-slate-700"}`, children: [
            /* @__PURE__ */ jsx(Landmark, { size: 20, className: "mx-auto mb-1 text-blue-500" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: "Bank" })
          ] })
        ] })
      ] }),
      formData.account_type === "bank" && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2", children: "Select Bank Account" }),
        /* @__PURE__ */ jsxs("select", { value: formData.bank_account_id, onChange: (e) => setFormData({ ...formData, bank_account_id: e.target.value }), className: "w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none", children: [
          /* @__PURE__ */ jsx("option", { value: "", children: "Select account..." }),
          bankAccounts.map((acc) => /* @__PURE__ */ jsx("option", { value: acc.id, children: acc.name }, acc.id))
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2", children: [
          "Amount (",
          getCurrencySymbol(),
          ")"
        ] }),
        /* @__PURE__ */ jsx("input", { type: "number", value: formData.amount, onChange: (e) => setFormData({ ...formData, amount: e.target.value }), placeholder: "Enter amount", className: "w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-lg font-bold" })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2", children: "Reason" }),
        /* @__PURE__ */ jsx("input", { type: "text", value: formData.reason, onChange: (e) => setFormData({ ...formData, reason: e.target.value }), placeholder: "e.g., Owner capital investment", className: "w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" })
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: () => handleSubmit("add"), disabled: processing || !formData.amount || !formData.reason, className: "w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white font-bold rounded-xl transition-colors", children: processing ? "Processing..." : "Add Funds" })
    ] }) }),
    /* @__PURE__ */ jsx(Modal, { isOpen: activeModal === "remove", onClose: () => setActiveModal(null), title: "Remove Funds", children: /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2", children: "Remove From" }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
          /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => setFormData({ ...formData, account_type: "cash" }), className: `p-3 rounded-xl border-2 transition-all ${formData.account_type === "cash" ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" : "border-slate-200 dark:border-slate-700"}`, children: [
            /* @__PURE__ */ jsx(Wallet, { size: 20, className: "mx-auto mb-1 text-emerald-500" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: "Cash" })
          ] }),
          /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => setFormData({ ...formData, account_type: "bank" }), className: `p-3 rounded-xl border-2 transition-all ${formData.account_type === "bank" ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-slate-200 dark:border-slate-700"}`, children: [
            /* @__PURE__ */ jsx(Landmark, { size: 20, className: "mx-auto mb-1 text-blue-500" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: "Bank" })
          ] })
        ] })
      ] }),
      formData.account_type === "bank" && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2", children: "Select Bank Account" }),
        /* @__PURE__ */ jsxs("select", { value: formData.bank_account_id, onChange: (e) => setFormData({ ...formData, bank_account_id: e.target.value }), className: "w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none", children: [
          /* @__PURE__ */ jsx("option", { value: "", children: "Select account..." }),
          bankAccounts.map((acc) => /* @__PURE__ */ jsx("option", { value: acc.id, children: acc.name }, acc.id))
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2", children: [
          "Amount (",
          getCurrencySymbol(),
          ")"
        ] }),
        /* @__PURE__ */ jsx("input", { type: "number", value: formData.amount, onChange: (e) => setFormData({ ...formData, amount: e.target.value }), placeholder: "Enter amount", className: "w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-lg font-bold" })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2", children: "Reason" }),
        /* @__PURE__ */ jsx("input", { type: "text", value: formData.reason, onChange: (e) => setFormData({ ...formData, reason: e.target.value }), placeholder: "e.g., Owner personal withdrawal", className: "w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" })
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: () => handleSubmit("remove"), disabled: processing || !formData.amount || !formData.reason, className: "w-full py-3 bg-red-500 hover:bg-red-600 disabled:bg-slate-300 text-white font-bold rounded-xl transition-colors", children: processing ? "Processing..." : "Remove Funds" })
    ] }) }),
    /* @__PURE__ */ jsx(Modal, { isOpen: activeModal === "transfer", onClose: () => setActiveModal(null), title: "Transfer Funds", children: /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3", children: "Transfer From" }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => setFormData({ ...formData, from_type: "cash" }),
                className: `relative flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300 ${formData.from_type === "cash" ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10 shadow-lg shadow-indigo-500/10" : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50"}`,
                children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                    /* @__PURE__ */ jsx("div", { className: `p-2 rounded-xl ${formData.from_type === "cash" ? "bg-indigo-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`, children: /* @__PURE__ */ jsx(Wallet, { size: 18 }) }),
                    /* @__PURE__ */ jsx("span", { className: `text-sm font-black ${formData.from_type === "cash" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500"}`, children: "Cash" })
                  ] }),
                  formData.from_type === "cash" && /* @__PURE__ */ jsx("div", { className: "w-2 h-2 rounded-full bg-indigo-500" })
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => setFormData({ ...formData, from_type: "bank" }),
                className: `relative flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300 ${formData.from_type === "bank" ? "border-blue-500 bg-blue-50/50 dark:bg-blue-500/10 shadow-lg shadow-blue-500/10" : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50"}`,
                children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                    /* @__PURE__ */ jsx("div", { className: `p-2 rounded-xl ${formData.from_type === "bank" ? "bg-blue-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`, children: /* @__PURE__ */ jsx(Landmark, { size: 18 }) }),
                    /* @__PURE__ */ jsx("span", { className: `text-sm font-black ${formData.from_type === "bank" ? "text-blue-600 dark:text-blue-400" : "text-slate-500"}`, children: "Bank" })
                  ] }),
                  formData.from_type === "bank" && /* @__PURE__ */ jsx("div", { className: "w-2 h-2 rounded-full bg-blue-500" })
                ]
              }
            )
          ] }),
          formData.from_type === "bank" && /* @__PURE__ */ jsx("div", { className: "mt-3 animate-in slide-in-from-top-2 duration-300", children: /* @__PURE__ */ jsxs(
            "select",
            {
              value: formData.from_bank_id,
              onChange: (e) => setFormData({ ...formData, from_bank_id: e.target.value }),
              className: "w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-bold transition-all shadow-inner",
              children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "Select Origin Bank Account..." }),
                bankAccounts.map((acc) => /* @__PURE__ */ jsxs("option", { value: acc.id, children: [
                  acc.name,
                  " (",
                  getCurrencySymbol(),
                  " ",
                  parseFloat(acc.balance).toLocaleString(),
                  ")"
                ] }, acc.id))
              ]
            }
          ) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex justify-center -my-2 relative z-10", children: /* @__PURE__ */ jsx("div", { className: "bg-white dark:bg-slate-800 p-2 rounded-full border border-slate-200 dark:border-slate-700 shadow-xl text-slate-400", children: /* @__PURE__ */ jsx(Minus, { className: "rotate-90", size: 16 }) }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3", children: "Transfer To" }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => setFormData({ ...formData, to_type: "cash" }),
                className: `relative flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300 ${formData.to_type === "cash" ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10 shadow-lg shadow-indigo-500/10" : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50"}`,
                children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                    /* @__PURE__ */ jsx("div", { className: `p-2 rounded-xl ${formData.to_type === "cash" ? "bg-indigo-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`, children: /* @__PURE__ */ jsx(Wallet, { size: 18 }) }),
                    /* @__PURE__ */ jsx("span", { className: `text-sm font-black ${formData.to_type === "cash" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500"}`, children: "Cash" })
                  ] }),
                  formData.to_type === "cash" && /* @__PURE__ */ jsx("div", { className: "w-2 h-2 rounded-full bg-indigo-500" })
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => setFormData({ ...formData, to_type: "bank" }),
                className: `relative flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300 ${formData.to_type === "bank" ? "border-blue-500 bg-blue-50/50 dark:bg-blue-500/10 shadow-lg shadow-blue-500/10" : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50"}`,
                children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                    /* @__PURE__ */ jsx("div", { className: `p-2 rounded-xl ${formData.to_type === "bank" ? "bg-blue-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`, children: /* @__PURE__ */ jsx(Landmark, { size: 18 }) }),
                    /* @__PURE__ */ jsx("span", { className: `text-sm font-black ${formData.to_type === "bank" ? "text-blue-600 dark:text-blue-400" : "text-slate-500"}`, children: "Bank" })
                  ] }),
                  formData.to_type === "bank" && /* @__PURE__ */ jsx("div", { className: "w-2 h-2 rounded-full bg-blue-500" })
                ]
              }
            )
          ] }),
          formData.to_type === "bank" && /* @__PURE__ */ jsx("div", { className: "mt-3 animate-in slide-in-from-top-2 duration-300", children: /* @__PURE__ */ jsxs(
            "select",
            {
              value: formData.to_bank_id,
              onChange: (e) => setFormData({ ...formData, to_bank_id: e.target.value }),
              className: "w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-bold transition-all shadow-inner",
              children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "Select Destination Bank Account..." }),
                bankAccounts.map((acc) => /* @__PURE__ */ jsx("option", { value: acc.id, children: acc.name }, acc.id))
              ]
            }
          ) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2", children: [
          "Amount (",
          getCurrencySymbol(),
          ")"
        ] }),
        /* @__PURE__ */ jsx("input", { type: "number", value: formData.amount, onChange: (e) => setFormData({ ...formData, amount: e.target.value }), placeholder: "Enter amount", className: "w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-lg font-bold" })
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: () => handleSubmit("transfer"), disabled: processing || !formData.amount, className: "w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 text-white font-bold rounded-xl transition-colors", children: processing ? "Processing..." : "Transfer Funds" })
    ] }) }),
    /* @__PURE__ */ jsx(Modal, { isOpen: activeModal === "adjust", onClose: () => setActiveModal(null), title: "Adjust Balance", children: /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsx("div", { className: "p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl", children: /* @__PURE__ */ jsxs("p", { className: "text-sm text-orange-700 dark:text-orange-300", children: [
        /* @__PURE__ */ jsx(AlertCircle, { size: 16, className: "inline mr-2" }),
        "Use this to correct discrepancies between physical count and system balance."
      ] }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2", children: "Account" }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
          /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => setFormData({ ...formData, account_type: "cash", new_balance: cashAccount.balance }), className: `p-3 rounded-xl border-2 transition-all ${formData.account_type === "cash" ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" : "border-slate-200 dark:border-slate-700"}`, children: [
            /* @__PURE__ */ jsx(Wallet, { size: 20, className: "mx-auto mb-1 text-emerald-500" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: "Cash" }),
            /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-400", children: [
              getCurrencySymbol(),
              " ",
              parseFloat(cashAccount.balance).toLocaleString()
            ] })
          ] }),
          /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => setFormData({ ...formData, account_type: "bank" }), className: `p-3 rounded-xl border-2 transition-all ${formData.account_type === "bank" ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-slate-200 dark:border-slate-700"}`, children: [
            /* @__PURE__ */ jsx(Landmark, { size: 20, className: "mx-auto mb-1 text-blue-500" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: "Bank" })
          ] })
        ] })
      ] }),
      formData.account_type === "bank" && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2", children: "Select Bank Account" }),
        /* @__PURE__ */ jsxs("select", { value: formData.bank_account_id, onChange: (e) => setFormData({ ...formData, bank_account_id: e.target.value }), className: "w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800", children: [
          /* @__PURE__ */ jsx("option", { value: "", children: "Select account..." }),
          bankAccounts.map((acc) => /* @__PURE__ */ jsxs("option", { value: acc.id, children: [
            acc.name,
            " - ",
            getCurrencySymbol(),
            " ",
            parseFloat(acc.balance).toLocaleString()
          ] }, acc.id))
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2", children: [
          "Correct Balance (",
          getCurrencySymbol(),
          ")"
        ] }),
        /* @__PURE__ */ jsx("input", { type: "number", value: formData.new_balance, onChange: (e) => setFormData({ ...formData, new_balance: e.target.value }), placeholder: "Enter actual balance", className: "w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-lg font-bold" })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2", children: "Reason for Adjustment" }),
        /* @__PURE__ */ jsx("input", { type: "text", value: formData.reason, onChange: (e) => setFormData({ ...formData, reason: e.target.value }), placeholder: "e.g., Physical cash count correction", className: "w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800" })
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: () => handleSubmit("adjust"), disabled: processing || formData.new_balance === "" || !formData.reason, className: "w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white font-bold rounded-xl transition-colors", children: processing ? "Processing..." : "Adjust Balance" })
    ] }) })
  ] });
}
export {
  FundManagement as default
};

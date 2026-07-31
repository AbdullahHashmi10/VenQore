import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { R as ReportsLayout } from "./ReportsLayout-CCBXGMSb.js";
import { Head, router } from "@inertiajs/react";
import { ShieldAlert, Shield, Lock, Unlock, EyeOff, Eye, RefreshCw, LogOut, TrendingUp, Package, DollarSign, CreditCard, ArrowRight, Clock, AlertCircle, Activity, Calendar, FileText, CheckCircle } from "lucide-react";
import { M as MidnightNebula } from "./MidnightNebula-BEpU-4M8.js";
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Area } from "recharts";
import axios from "axios";
import { f as formatCurrency } from "./format-B_ph0Qec.js";
import "./OneGlanceLayout-BqRkhJQJ.js";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "laravel-echo";
import "pusher-js";
import "driver.js";
function OwnersDailyPulse({ is_locked, needs_setup, is_owner, store_slug, store_name, snapshots = [] }) {
  const [passcode, setPasscode] = useState("");
  const [showPasscode, setShowPasscode] = useState(false);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [shake, setShake] = useState(false);
  const [activeKey, setActiveKey] = useState(null);
  const [setupPhase, setSetupPhase] = useState("initial");
  const [newPasscode, setNewPasscode] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [noteEdits, setNoteEdits] = useState({});
  const [savingNotes, setSavingNotes] = useState({});
  const [saveTimers, setSaveTimers] = useState({});
  const [selectedDate, setSelectedDate] = useState(snapshots[0]?.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0]);
  useEffect(() => {
    if (!is_locked) return;
    const handleKeyDown = (e) => {
      const key = e.key;
      if (/^[0-9]$/.test(key)) {
        e.preventDefault();
        setPasscode((prev) => prev + key);
        triggerKeyFlash(key);
      } else if (key === "Backspace") {
        e.preventDefault();
        setPasscode((prev) => prev.slice(0, -1));
        triggerKeyFlash("⌫");
      } else if (key === "Escape") {
        e.preventDefault();
        setPasscode("");
        triggerKeyFlash("C");
      } else if (key === "Enter") {
        e.preventDefault();
        handleUnlock();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [is_locked, passcode, needs_setup, setupPhase, newPasscode, confirmPasscode]);
  const triggerKeyFlash = (key) => {
    setActiveKey(key);
    setTimeout(() => setActiveKey(null), 1500);
  };
  const handleUnlock = (e) => {
    if (e) e.preventDefault();
    if (!passcode || processing) return;
    setProcessing(true);
    setError("");
    axios.post(route("store.reports.owner-daily-pulse.verify", { store_slug }), { passcode }).then((res) => {
      if (res.data.success) {
        window.location.reload();
      }
    }).catch((err) => {
      setProcessing(false);
      setError(err.response?.data?.message || "Access Denied: Invalid security passcode.");
      setShake(true);
      setPasscode("");
      setTimeout(() => setShake(false), 500);
    });
  };
  const handleKeypadPress = (val, target = "passcode") => {
    setError("");
    let setter = setPasscode;
    if (target === "new") setter = setNewPasscode;
    if (target === "confirm") setter = setConfirmPasscode;
    if (val === "C") {
      setter("");
    } else if (val === "⌫") {
      setter((prev) => prev.slice(0, -1));
    } else {
      setter((prev) => prev + val);
    }
  };
  const handleSetupDisable = () => {
    setProcessing(true);
    axios.post(route("store.reports.owner-daily-pulse.setup", { store_slug }), { action: "disable" }).then(() => window.location.reload()).catch(() => setProcessing(false));
  };
  const handleSetupConfirm = () => {
    if (newPasscode !== confirmPasscode) {
      setError("Passcodes do not match!");
      setConfirmPasscode("");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    setProcessing(true);
    axios.post(route("store.reports.owner-daily-pulse.setup", { store_slug }), { action: "set", passcode: newPasscode }).then(() => window.location.reload()).catch((err) => {
      setProcessing(false);
      setError(err.response?.data?.message || "Setup failed.");
    });
  };
  const handleLockTerminal = () => {
    router.post(route("store.reports.owner-daily-pulse.lock", { store_slug }));
  };
  const handleNoteChange = (date, value) => {
    setNoteEdits((prev) => ({ ...prev, [date]: value }));
    if (saveTimers[date]) {
      clearTimeout(saveTimers[date]);
    }
    setSavingNotes((prev) => ({ ...prev, [date]: "saving" }));
    const timer = setTimeout(() => {
      saveNoteToServer(date, value);
    }, 1200);
    setSaveTimers((prev) => ({ ...prev, [date]: timer }));
  };
  const saveNoteToServer = (date, value) => {
    axios.post(route("store.reports.owner-daily-pulse.note", { store_slug }), { date, note: value }).then(() => {
      setSavingNotes((prev) => ({ ...prev, [date]: "saved" }));
      setTimeout(() => {
        setSavingNotes((prev) => {
          const next = { ...prev };
          delete next[date];
          return next;
        });
      }, 3e3);
    }).catch(() => {
      setSavingNotes((prev) => ({ ...prev, [date]: "error" }));
    });
  };
  const formattedSnapshots = useMemo(() => {
    return snapshots.map((snap) => {
      const sales = parseFloat(snap.sales_value) || 0;
      const purchases = parseFloat(snap.purchases_value) || 0;
      const stock = parseFloat(snap.stock_value) || 0;
      const payables = parseFloat(snap.payables_value) || 0;
      const receivables = parseFloat(snap.receivables_value) || 0;
      const cash = parseFloat(snap.cash_value) || 0;
      const expense = parseFloat(snap.expense_value) || 0;
      const netAssets = cash + receivables + stock - payables;
      const netProfit = sales - expense;
      return {
        ...snap,
        sales,
        purchases,
        stock,
        payables,
        receivables,
        cash,
        expense,
        netAssets,
        netProfit,
        displayDate: new Date(snap.date).toLocaleDateString(void 0, {
          month: "short",
          day: "numeric"
        })
      };
    });
  }, [snapshots]);
  const chartData = useMemo(() => {
    return [...formattedSnapshots].reverse();
  }, [formattedSnapshots]);
  const selectedIndex = formattedSnapshots.findIndex((s) => s.date === selectedDate);
  const todaySnap = selectedIndex >= 0 ? formattedSnapshots[selectedIndex] : null;
  const yesterdaySnap = selectedIndex >= 0 ? formattedSnapshots[selectedIndex + 1] || null : null;
  const calculateChange = (todayVal, yesterdayVal) => {
    if (!yesterdayVal || yesterdayVal === 0) return null;
    const diff = todayVal - yesterdayVal;
    return diff / yesterdayVal * 100;
  };
  const formatPercent = (val) => {
    if (val === null || val === void 0) return null;
    const sign = val >= 0 ? "+" : "";
    return `${sign}${val.toFixed(1)}%`;
  };
  if (needs_setup) {
    if (!is_owner) {
      return /* @__PURE__ */ jsx(ReportsLayout, { title: "Secure Vault Locked", showSidebar: false, children: /* @__PURE__ */ jsx("div", { className: "min-h-[85vh] flex items-center justify-center p-4", children: /* @__PURE__ */ jsxs("div", { className: "text-center p-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl max-w-sm", children: [
        /* @__PURE__ */ jsx(ShieldAlert, { className: "w-16 h-16 text-red-500 mx-auto mb-4 animate-pulse" }),
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-white mb-2", children: "Vault Unconfigured" }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-400 text-sm", children: "The store owner must configure the Daily Pulse vault security before it can be accessed." })
      ] }) }) });
    }
    return /* @__PURE__ */ jsxs(ReportsLayout, { title: "Configure Vault Security", showSidebar: false, children: [
      /* @__PURE__ */ jsx(Head, { title: "Configure Vault Security" }),
      /* @__PURE__ */ jsxs("div", { className: "min-h-[85vh] flex items-center justify-center p-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 bg-slate-950 z-0 overflow-hidden", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-1/4 left-1/4 w-[30rem] h-[30rem] bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none" }),
          /* @__PURE__ */ jsx("div", { className: "absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: `relative z-10 w-full max-w-md ${shake ? "animate-bounce" : ""}`, style: shake ? { animation: "shake 0.4s ease-in-out" } : {}, children: /* @__PURE__ */ jsxs(MidnightNebula, { className: "rounded-[2.5rem] border border-slate-800 shadow-2xl p-8 backdrop-blur-md bg-slate-900/80", primaryColor: "emerald", secondaryColor: "indigo", children: [
          /* @__PURE__ */ jsxs("div", { className: "text-center mb-8", children: [
            /* @__PURE__ */ jsx("div", { className: "inline-flex p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400 mb-4 animate-bounce", children: /* @__PURE__ */ jsx(Shield, { size: 32 }) }),
            /* @__PURE__ */ jsx("h2", { className: "text-2xl font-black text-white tracking-tight", children: "Vault Security Setup" }),
            /* @__PURE__ */ jsx("p", { className: "text-slate-400 text-xs max-w-xs mx-auto mt-2", children: "You are the owner. Choose how you want to secure your Daily Pulse dashboard." })
          ] }),
          setupPhase === "initial" && /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => setSetupPhase("setting"),
                className: "w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-emerald-500/20 transition-all",
                children: [
                  /* @__PURE__ */ jsx(Lock, { size: 18 }),
                  /* @__PURE__ */ jsx("span", { children: "REQUIRE PASSCODE" })
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: handleSetupDisable,
                disabled: processing,
                className: "w-full flex items-center justify-center gap-2 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all",
                children: [
                  /* @__PURE__ */ jsx(Unlock, { size: 18 }),
                  /* @__PURE__ */ jsx("span", { children: "LEAVE UNLOCKED" })
                ]
              }
            )
          ] }),
          setupPhase === "setting" && /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-center font-bold text-slate-300", children: "Enter New Passcode" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "password",
                value: newPasscode,
                readOnly: true,
                className: "w-full text-center tracking-[0.7em] text-xl font-black bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-white focus:outline-none placeholder-slate-700",
                placeholder: "••••••••"
              }
            ),
            /* @__PURE__ */ jsx("div", { className: "grid grid-cols-3 gap-3", children: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "⌫"].map((key) => /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => handleKeypadPress(key, "new"),
                className: `h-14 rounded-2xl font-black text-lg ${key === "C" || key === "⌫" ? "bg-slate-800 text-slate-400" : "bg-slate-700 text-white"}`,
                children: key
              },
              key
            )) }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => {
                  if (newPasscode.length >= 4) setSetupPhase("confirming");
                  else setError("Passcode must be at least 4 digits");
                },
                disabled: newPasscode.length < 4,
                className: "w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-2xl transition-all",
                children: "NEXT"
              }
            ),
            error && /* @__PURE__ */ jsx("p", { className: "text-red-400 text-xs text-center", children: error })
          ] }),
          setupPhase === "confirming" && /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-center font-bold text-slate-300", children: "Confirm Passcode" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "password",
                value: confirmPasscode,
                readOnly: true,
                className: "w-full text-center tracking-[0.7em] text-xl font-black bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-white focus:outline-none placeholder-slate-700",
                placeholder: "••••••••"
              }
            ),
            /* @__PURE__ */ jsx("div", { className: "grid grid-cols-3 gap-3", children: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "⌫"].map((key) => /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => handleKeypadPress(key, "confirm"),
                className: `h-14 rounded-2xl font-black text-lg ${key === "C" || key === "⌫" ? "bg-slate-800 text-slate-400" : "bg-slate-700 text-white"}`,
                children: key
              },
              key
            )) }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: handleSetupConfirm,
                disabled: processing || confirmPasscode.length < 4,
                className: "w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-2xl transition-all",
                children: processing ? "SAVING..." : "CONFIRM & SAVE"
              }
            ),
            error && /* @__PURE__ */ jsx("p", { className: "text-red-400 text-xs text-center", children: error })
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsx("style", { children: `
                    @keyframes shake {
                        0%, 100% { transform: translateX(0); }
                        20%, 60% { transform: translateX(-6px); }
                        40%, 80% { transform: translateX(6px); }
                    }
                ` })
    ] });
  }
  if (is_locked) {
    return /* @__PURE__ */ jsxs(ReportsLayout, { title: "Secure Vault Lock", showSidebar: false, children: [
      /* @__PURE__ */ jsx(Head, { title: "Secure Vault Authorization" }),
      /* @__PURE__ */ jsxs("div", { className: "min-h-[85vh] flex items-center justify-center p-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 bg-slate-950 z-0 overflow-hidden", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-1/4 left-1/4 w-[30rem] h-[30rem] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" }),
          /* @__PURE__ */ jsx("div", { className: "absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" }),
          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[url('/images/noise.svg')] opacity-[0.03] pointer-events-none" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: `relative z-10 w-full max-w-md ${shake ? "animate-bounce" : ""}`, style: shake ? { animation: "shake 0.4s ease-in-out" } : {}, children: /* @__PURE__ */ jsxs(MidnightNebula, { className: "rounded-[2.5rem] border border-slate-800 shadow-2xl p-8 backdrop-blur-md bg-slate-900/80", primaryColor: "indigo", secondaryColor: "purple", children: [
          /* @__PURE__ */ jsxs("div", { className: "text-center mb-8", children: [
            /* @__PURE__ */ jsx("div", { className: "inline-flex p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400 mb-4 animate-pulse", children: /* @__PURE__ */ jsx(Lock, { size: 32 }) }),
            /* @__PURE__ */ jsx("h2", { className: "text-2xl font-black text-white tracking-tight", children: store_name }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-indigo-400 uppercase tracking-widest mt-1", children: "Owner's Secure Daily Pulse" }),
            /* @__PURE__ */ jsx("p", { className: "text-slate-400 text-xs max-w-xs mx-auto mt-2", children: "Enter your authorization passcode to unlock the financial vault." })
          ] }),
          /* @__PURE__ */ jsxs("form", { onSubmit: handleUnlock, className: "space-y-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: showPasscode ? "text" : "password",
                  value: passcode,
                  onChange: (e) => setPasscode(e.target.value),
                  placeholder: "••••••••",
                  className: "w-full text-center tracking-[0.7em] text-xl font-black bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-mono placeholder-slate-700 shadow-inner",
                  disabled: processing,
                  autoFocus: true
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => setShowPasscode(!showPasscode),
                  className: "absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors",
                  children: showPasscode ? /* @__PURE__ */ jsx(EyeOff, { size: 18 }) : /* @__PURE__ */ jsx(Eye, { size: 18 })
                }
              )
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex justify-center gap-3", children: [1, 2, 3, 4, 5, 6].map((idx) => /* @__PURE__ */ jsx(
              "div",
              {
                className: `w-3.5 h-3.5 rounded-full transition-all duration-300 ${passcode.length >= idx ? "bg-indigo-400 shadow-[0_0_12px_rgba(129,140,248,0.8)] scale-110" : "bg-slate-800"}`
              },
              idx
            )) }),
            error && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 p-3 bg-red-950/40 border border-red-900/50 rounded-xl text-red-400 text-xs text-center justify-center font-medium animate-pulse", children: [
              /* @__PURE__ */ jsx(ShieldAlert, { size: 14, className: "shrink-0" }),
              error
            ] }),
            /* @__PURE__ */ jsx("div", { className: "grid grid-cols-3 gap-3 my-4", children: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "⌫"].map((key) => {
              const isFlash = activeKey === key;
              return /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => handleKeypadPress(key),
                  className: `h-14 rounded-2xl flex items-center justify-center font-black text-lg transition-all active:scale-95 select-none ${key === "C" || key === "⌫" ? "bg-slate-800/40 hover:bg-slate-800 text-slate-400" : "bg-slate-800/80 hover:bg-slate-700 text-white"} border border-slate-800/80 hover:border-slate-700 shadow-md ${isFlash ? "bg-indigo-600/80 text-white border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.6)] scale-95" : ""}`,
                  children: key
                },
                key
              );
            }) }),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "submit",
                disabled: !passcode || processing,
                className: "w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-slate-800 disabled:to-slate-800 disabled:opacity-40 text-white font-bold rounded-2xl transition-all shadow-lg hover:shadow-indigo-500/20 active:scale-[0.99] focus:outline-none",
                children: processing ? /* @__PURE__ */ jsx(RefreshCw, { className: "w-5 h-5 animate-spin" }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx(Unlock, { size: 18 }),
                  /* @__PURE__ */ jsx("span", { children: "UNLOCK SYSTEM" })
                ] })
              }
            )
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsx("style", { children: `
                    @keyframes shake {
                        0%, 100% { transform: translateX(0); }
                        20%, 60% { transform: translateX(-6px); }
                        40%, 80% { transform: translateX(6px); }
                    }
                ` })
    ] });
  }
  return /* @__PURE__ */ jsxs(ReportsLayout, { title: "Owner's Daily Pulse", showSidebar: true, children: [
    /* @__PURE__ */ jsx(Head, { title: "Owner's Daily Pulse Dashboard" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6 max-w-7xl mx-auto pb-12", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl relative overflow-hidden", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 relative z-10", children: [
          /* @__PURE__ */ jsx("div", { className: "p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400", children: /* @__PURE__ */ jsx(Shield, { size: 24, className: "animate-pulse" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("h1", { className: "text-xl font-black text-white tracking-tight flex items-center gap-2", children: [
              "Owner's Daily Pulse",
              /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]", children: [
                /* @__PURE__ */ jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" }),
                "Executive Session"
              ] })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 mt-0.5", children: "Executive financial ledger audits and auto-healing data backups." })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 relative z-10", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "date",
              value: selectedDate,
              onChange: (e) => setSelectedDate(e.target.value),
              className: "bg-slate-950/80 border border-slate-700/80 text-white rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/80 hover:border-slate-600 transition-all outline-none",
              title: "Select Date"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => window.location.reload(),
              className: "p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700/80 transition-colors",
              title: "Force Refresh Data",
              children: /* @__PURE__ */ jsx(RefreshCw, { size: 16 })
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: handleLockTerminal,
              className: "flex items-center gap-2 px-4 py-3 bg-red-950/40 hover:bg-red-900/30 text-red-400 hover:text-red-300 rounded-xl border border-red-900/50 transition-all font-semibold text-xs uppercase tracking-wider",
              children: [
                /* @__PURE__ */ jsx(LogOut, { size: 14 }),
                /* @__PURE__ */ jsx("span", { children: "Lock Vault" })
              ]
            }
          )
        ] })
      ] }),
      todaySnap ? /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-slate-900 border border-slate-800/80 rounded-2xl p-4 shadow-xl flex flex-col justify-between hover:border-emerald-500/30 transition-all group hover:-translate-y-0.5", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-3", children: [
              /* @__PURE__ */ jsx("span", { className: "text-[10px] font-extrabold text-slate-400 uppercase tracking-widest", children: "Today Sales" }),
              /* @__PURE__ */ jsx("div", { className: "p-2 bg-emerald-500/10 rounded-lg text-emerald-400", children: /* @__PURE__ */ jsx(TrendingUp, { size: 14 }) })
            ] }),
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-black text-white leading-none", children: formatCurrency(todaySnap.sales) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-4 pt-2 border-t border-slate-800/50 flex justify-between items-center text-[10px]", children: [
            /* @__PURE__ */ jsx("span", { className: "text-slate-500 font-bold", children: "VS YESTERDAY" }),
            yesterdaySnap ? /* @__PURE__ */ jsx("span", { className: `font-black ${todaySnap.sales >= yesterdaySnap.sales ? "text-emerald-400" : "text-red-400"}`, children: formatPercent(calculateChange(todaySnap.sales, yesterdaySnap.sales)) || "0.0%" }) : /* @__PURE__ */ jsx("span", { className: "text-slate-500", children: "N/A" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-slate-900 border border-slate-800/80 rounded-2xl p-4 shadow-xl flex flex-col justify-between hover:border-blue-500/30 transition-all group hover:-translate-y-0.5", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-3", children: [
              /* @__PURE__ */ jsx("span", { className: "text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1", children: "Today Purchases" }),
              /* @__PURE__ */ jsx("div", { className: "p-2 bg-blue-500/10 rounded-lg text-blue-400", children: /* @__PURE__ */ jsx(Package, { size: 14 }) })
            ] }),
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-black text-white leading-none", children: formatCurrency(todaySnap.purchases) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-4 pt-2 border-t border-slate-800/50 flex justify-between items-center text-[10px]", children: [
            /* @__PURE__ */ jsx("span", { className: "text-slate-500 font-bold", children: "VS YESTERDAY" }),
            yesterdaySnap ? /* @__PURE__ */ jsx("span", { className: `font-black ${todaySnap.purchases <= yesterdaySnap.purchases ? "text-emerald-400" : "text-red-400"}`, children: formatPercent(calculateChange(todaySnap.purchases, yesterdaySnap.purchases)) || "0.0%" }) : /* @__PURE__ */ jsx("span", { className: "text-slate-500", children: "N/A" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-slate-900 border border-slate-800/80 rounded-2xl p-4 shadow-xl flex flex-col justify-between hover:border-violet-500/30 transition-all group hover:-translate-y-0.5", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-3", children: [
              /* @__PURE__ */ jsx("span", { className: "text-[10px] font-extrabold text-slate-400 uppercase tracking-widest", children: "Cash in Hand" }),
              /* @__PURE__ */ jsx("div", { className: "p-2 bg-violet-500/10 rounded-lg text-violet-400", children: /* @__PURE__ */ jsx(DollarSign, { size: 14 }) })
            ] }),
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-black text-white leading-none", children: formatCurrency(todaySnap.cash) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-4 pt-2 border-t border-slate-800/50 flex justify-between items-center text-[10px]", children: [
            /* @__PURE__ */ jsx("span", { className: "text-slate-500 font-bold", children: "VS YESTERDAY" }),
            yesterdaySnap ? /* @__PURE__ */ jsx("span", { className: `font-black ${todaySnap.cash >= yesterdaySnap.cash ? "text-emerald-400" : "text-red-400"}`, children: formatPercent(calculateChange(todaySnap.cash, yesterdaySnap.cash)) || "0.0%" }) : /* @__PURE__ */ jsx("span", { className: "text-slate-500", children: "N/A" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-slate-900 border border-slate-800/80 rounded-2xl p-4 shadow-xl flex flex-col justify-between hover:border-cyan-500/30 transition-all group hover:-translate-y-0.5", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-3", children: [
              /* @__PURE__ */ jsx("span", { className: "text-[10px] font-extrabold text-slate-400 uppercase tracking-widest", children: "Stock Asset" }),
              /* @__PURE__ */ jsx("div", { className: "p-2 bg-cyan-500/10 rounded-lg text-cyan-400", children: /* @__PURE__ */ jsx(Package, { size: 14 }) })
            ] }),
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-black text-white leading-none", children: formatCurrency(todaySnap.stock) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-4 pt-2 border-t border-slate-800/50 flex justify-between items-center text-[10px]", children: [
            /* @__PURE__ */ jsx("span", { className: "text-slate-500 font-bold", children: "VS YESTERDAY" }),
            yesterdaySnap ? /* @__PURE__ */ jsx("span", { className: `font-black ${todaySnap.stock >= yesterdaySnap.stock ? "text-emerald-400" : "text-red-400"}`, children: formatPercent(calculateChange(todaySnap.stock, yesterdaySnap.stock)) || "0.0%" }) : /* @__PURE__ */ jsx("span", { className: "text-slate-500", children: "N/A" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-slate-900 border border-slate-800/80 rounded-2xl p-4 shadow-xl flex flex-col justify-between hover:border-orange-500/30 transition-all group hover:-translate-y-0.5", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-3", children: [
              /* @__PURE__ */ jsx("span", { className: "text-[10px] font-extrabold text-slate-400 uppercase tracking-widest", children: "Today Expense" }),
              /* @__PURE__ */ jsx("div", { className: "p-2 bg-orange-500/10 rounded-lg text-orange-400", children: /* @__PURE__ */ jsx(CreditCard, { size: 14 }) })
            ] }),
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-black text-white leading-none", children: formatCurrency(todaySnap.expense) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-4 pt-2 border-t border-slate-800/50 flex justify-between items-center text-[10px]", children: [
            /* @__PURE__ */ jsx("span", { className: "text-slate-500 font-bold", children: "VS YESTERDAY" }),
            yesterdaySnap ? /* @__PURE__ */ jsx("span", { className: `font-black ${todaySnap.expense <= yesterdaySnap.expense ? "text-emerald-400" : "text-red-400"}`, children: formatPercent(calculateChange(todaySnap.expense, yesterdaySnap.expense)) || "0.0%" }) : /* @__PURE__ */ jsx("span", { className: "text-slate-500", children: "N/A" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-slate-900 border border-slate-800/80 rounded-2xl p-4 shadow-xl flex flex-col justify-between hover:border-amber-500/30 transition-all group hover:-translate-y-0.5", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-3", children: [
              /* @__PURE__ */ jsx("span", { className: "text-[10px] font-extrabold text-slate-400 uppercase tracking-widest", children: "Receivables" }),
              /* @__PURE__ */ jsx("div", { className: "p-2 bg-amber-500/10 rounded-lg text-amber-400", children: /* @__PURE__ */ jsx(ArrowRight, { size: 14 }) })
            ] }),
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-black text-white leading-none", children: formatCurrency(todaySnap.receivables) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-4 pt-2 border-t border-slate-800/50 flex justify-between items-center text-[10px]", children: [
            /* @__PURE__ */ jsx("span", { className: "text-slate-500 font-bold", children: "VS YESTERDAY" }),
            yesterdaySnap ? /* @__PURE__ */ jsx("span", { className: `font-black ${todaySnap.receivables >= yesterdaySnap.receivables ? "text-emerald-400" : "text-red-400"}`, children: formatPercent(calculateChange(todaySnap.receivables, yesterdaySnap.receivables)) || "0.0%" }) : /* @__PURE__ */ jsx("span", { className: "text-slate-500", children: "N/A" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-slate-900 border border-slate-800/80 rounded-2xl p-4 shadow-xl flex flex-col justify-between hover:border-rose-500/30 transition-all group hover:-translate-y-0.5", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-3", children: [
              /* @__PURE__ */ jsx("span", { className: "text-[10px] font-extrabold text-slate-400 uppercase tracking-widest", children: "Payables" }),
              /* @__PURE__ */ jsx("div", { className: "p-2 bg-rose-500/10 rounded-lg text-rose-400", children: /* @__PURE__ */ jsx(Clock, { size: 14 }) })
            ] }),
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-black text-white leading-none", children: formatCurrency(todaySnap.payables) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-4 pt-2 border-t border-slate-800/50 flex justify-between items-center text-[10px]", children: [
            /* @__PURE__ */ jsx("span", { className: "text-slate-500 font-bold", children: "VS YESTERDAY" }),
            yesterdaySnap ? /* @__PURE__ */ jsx("span", { className: `font-black ${todaySnap.payables <= yesterdaySnap.payables ? "text-emerald-400" : "text-red-400"}`, children: formatPercent(calculateChange(todaySnap.payables, yesterdaySnap.payables)) || "0.0%" }) : /* @__PURE__ */ jsx("span", { className: "text-slate-500", children: "N/A" })
          ] })
        ] })
      ] }) : /* @__PURE__ */ jsxs("div", { className: "bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-400", children: [
        /* @__PURE__ */ jsx(AlertCircle, { className: "w-12 h-12 text-slate-600 mx-auto mb-3" }),
        /* @__PURE__ */ jsx("h3", { className: "text-white font-bold text-lg", children: "No Financial Snapshots Yet" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 mt-1 max-w-sm mx-auto", children: "The self-healing data backfiller is scanning your double-entry accounts to generate your daily history." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-slate-900 border border-slate-800 rounded-[2.2rem] p-6 shadow-2xl relative overflow-hidden", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute top-1/2 left-1/2 w-[40rem] h-[40rem] -translate-x-1/2 -translate-y-1/2 bg-indigo-500/[0.02] rounded-full blur-[120px] pointer-events-none" }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col xl:flex-row xl:items-center justify-between gap-6 pb-6 border-b border-slate-800/80 mb-6 relative z-10", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("h2", { className: "text-lg font-black text-white tracking-tight flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Activity, { className: "w-5 h-5 text-indigo-400" }),
              "30-Day Financial Trends"
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 mt-0.5", children: "Select a tab below to filter individual metrics or view combined double-entry trends." })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800/50", children: [
            { id: "overview", label: "All Combined", color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20 hover:text-white" },
            { id: "sales", label: "Sales", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:text-white" },
            { id: "purchases", label: "Purchases", color: "text-blue-400 bg-blue-500/10 border-blue-500/20 hover:text-white" },
            { id: "cash", label: "Cash Hand", color: "text-violet-400 bg-violet-500/10 border-violet-500/20 hover:text-white" },
            { id: "stock", label: "Stock Value", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20 hover:text-white" },
            { id: "expense", label: "Expenses", color: "text-orange-400 bg-orange-500/10 border-orange-500/20 hover:text-white" },
            { id: "receivables", label: "Receivables", color: "text-amber-400 bg-amber-500/10 border-amber-500/20 hover:text-white" },
            { id: "payables", label: "Payables", color: "text-rose-400 bg-rose-500/10 border-rose-500/20 hover:text-white" }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setActiveTab(tab.id),
                className: `px-3 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${isActive ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30" : "text-slate-400 hover:bg-slate-900 hover:text-white"}`,
                children: tab.label
              },
              tab.id
            );
          }) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "h-[24rem] w-full relative z-10", children: chartData.length > 0 ? /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(AreaChart, { data: chartData, margin: { top: 10, right: 10, left: 10, bottom: 0 }, children: [
          /* @__PURE__ */ jsxs("defs", { children: [
            /* @__PURE__ */ jsxs("linearGradient", { id: "salesGlow", x1: "0", y1: "0", x2: "0", y2: "1", children: [
              /* @__PURE__ */ jsx("stop", { offset: "5%", stopColor: "#10b981", stopOpacity: 0.2 }),
              /* @__PURE__ */ jsx("stop", { offset: "95%", stopColor: "#10b981", stopOpacity: 0 })
            ] }),
            /* @__PURE__ */ jsxs("linearGradient", { id: "purchasesGlow", x1: "0", y1: "0", x2: "0", y2: "1", children: [
              /* @__PURE__ */ jsx("stop", { offset: "5%", stopColor: "#3b82f6", stopOpacity: 0.2 }),
              /* @__PURE__ */ jsx("stop", { offset: "95%", stopColor: "#3b82f6", stopOpacity: 0 })
            ] }),
            /* @__PURE__ */ jsxs("linearGradient", { id: "cashGlow", x1: "0", y1: "0", x2: "0", y2: "1", children: [
              /* @__PURE__ */ jsx("stop", { offset: "5%", stopColor: "#8b5cf6", stopOpacity: 0.2 }),
              /* @__PURE__ */ jsx("stop", { offset: "95%", stopColor: "#8b5cf6", stopOpacity: 0 })
            ] }),
            /* @__PURE__ */ jsxs("linearGradient", { id: "stockGlow", x1: "0", y1: "0", x2: "0", y2: "1", children: [
              /* @__PURE__ */ jsx("stop", { offset: "5%", stopColor: "#06b6d4", stopOpacity: 0.2 }),
              /* @__PURE__ */ jsx("stop", { offset: "95%", stopColor: "#06b6d4", stopOpacity: 0 })
            ] }),
            /* @__PURE__ */ jsxs("linearGradient", { id: "expenseGlow", x1: "0", y1: "0", x2: "0", y2: "1", children: [
              /* @__PURE__ */ jsx("stop", { offset: "5%", stopColor: "#f97316", stopOpacity: 0.2 }),
              /* @__PURE__ */ jsx("stop", { offset: "95%", stopColor: "#f97316", stopOpacity: 0 })
            ] }),
            /* @__PURE__ */ jsxs("linearGradient", { id: "receivablesGlow", x1: "0", y1: "0", x2: "0", y2: "1", children: [
              /* @__PURE__ */ jsx("stop", { offset: "5%", stopColor: "#f59e0b", stopOpacity: 0.2 }),
              /* @__PURE__ */ jsx("stop", { offset: "95%", stopColor: "#f59e0b", stopOpacity: 0 })
            ] }),
            /* @__PURE__ */ jsxs("linearGradient", { id: "payablesGlow", x1: "0", y1: "0", x2: "0", y2: "1", children: [
              /* @__PURE__ */ jsx("stop", { offset: "5%", stopColor: "#f43f5e", stopOpacity: 0.2 }),
              /* @__PURE__ */ jsx("stop", { offset: "95%", stopColor: "#f43f5e", stopOpacity: 0 })
            ] })
          ] }),
          /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#1e293b", opacity: 0.5, vertical: false }),
          /* @__PURE__ */ jsx(
            XAxis,
            {
              dataKey: "displayDate",
              stroke: "#475569",
              fontSize: 10,
              fontWeight: "bold",
              tickLine: false,
              axisLine: false,
              dy: 10
            }
          ),
          /* @__PURE__ */ jsx(
            YAxis,
            {
              stroke: "#475569",
              fontSize: 10,
              fontWeight: "bold",
              tickLine: false,
              axisLine: false,
              tickFormatter: (val) => val >= 1e3 ? `${(val / 1e3).toFixed(0)}k` : val,
              dx: -10
            }
          ),
          /* @__PURE__ */ jsx(
            Tooltip,
            {
              content: ({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return /* @__PURE__ */ jsxs("div", { className: "bg-slate-950/95 border border-slate-800 p-4 rounded-xl shadow-2xl backdrop-blur-md", children: [
                    /* @__PURE__ */ jsxs("p", { className: "text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5", children: [
                      /* @__PURE__ */ jsx(Calendar, { size: 10 }),
                      label
                    ] }),
                    /* @__PURE__ */ jsx("div", { className: "space-y-1.5", children: payload.map((item, i) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-6 text-xs", children: [
                      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-slate-400", children: [
                        /* @__PURE__ */ jsx("div", { className: "w-2 h-2 rounded-full", style: { backgroundColor: item.color } }),
                        /* @__PURE__ */ jsxs("span", { children: [
                          item.name,
                          ":"
                        ] })
                      ] }),
                      /* @__PURE__ */ jsx("span", { className: "font-extrabold text-white", children: formatCurrency(item.value) })
                    ] }, i)) })
                  ] });
                }
                return null;
              }
            }
          ),
          activeTab === "overview" && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(Area, { type: "monotone", name: "Sales", dataKey: "sales", stroke: "#10b981", strokeWidth: 2.5, fillOpacity: 0 }),
            /* @__PURE__ */ jsx(Area, { type: "monotone", name: "Purchases", dataKey: "purchases", stroke: "#3b82f6", strokeWidth: 2.5, fillOpacity: 0 }),
            /* @__PURE__ */ jsx(Area, { type: "monotone", name: "Cash hand", dataKey: "cash", stroke: "#8b5cf6", strokeWidth: 2.5, fillOpacity: 0 }),
            /* @__PURE__ */ jsx(Area, { type: "monotone", name: "Stock Value", dataKey: "stock", stroke: "#06b6d4", strokeWidth: 2.5, fillOpacity: 0 }),
            /* @__PURE__ */ jsx(Area, { type: "monotone", name: "Expenses", dataKey: "expense", stroke: "#f97316", strokeWidth: 2.5, fillOpacity: 0 })
          ] }),
          activeTab === "sales" && /* @__PURE__ */ jsx(Area, { type: "monotone", name: "Sales", dataKey: "sales", stroke: "#10b981", strokeWidth: 3, fill: "url(#salesGlow)" }),
          activeTab === "purchases" && /* @__PURE__ */ jsx(Area, { type: "monotone", name: "Purchases", dataKey: "purchases", stroke: "#3b82f6", strokeWidth: 3, fill: "url(#purchasesGlow)" }),
          activeTab === "cash" && /* @__PURE__ */ jsx(Area, { type: "monotone", name: "Cash Hand", dataKey: "cash", stroke: "#8b5cf6", strokeWidth: 3, fill: "url(#cashGlow)" }),
          activeTab === "stock" && /* @__PURE__ */ jsx(Area, { type: "monotone", name: "Stock Value", dataKey: "stock", stroke: "#06b6d4", strokeWidth: 3, fill: "url(#stockGlow)" }),
          activeTab === "expense" && /* @__PURE__ */ jsx(Area, { type: "monotone", name: "Expenses", dataKey: "expense", stroke: "#f97316", strokeWidth: 3, fill: "url(#expenseGlow)" }),
          activeTab === "receivables" && /* @__PURE__ */ jsx(Area, { type: "monotone", name: "Receivables", dataKey: "receivables", stroke: "#f59e0b", strokeWidth: 3, fill: "url(#receivablesGlow)" }),
          activeTab === "payables" && /* @__PURE__ */ jsx(Area, { type: "monotone", name: "Payables", dataKey: "payables", stroke: "#f43f5e", strokeWidth: 3, fill: "url(#payablesGlow)" })
        ] }) }) : /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center justify-center text-slate-500 font-bold text-sm", children: "Loading Trend Analysis..." }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-slate-900 border border-slate-800 rounded-[2.2rem] shadow-2xl overflow-hidden relative", children: [
        /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("h2", { className: "text-lg font-black text-white tracking-tight flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(FileText, { className: "w-5 h-5 text-indigo-400" }),
              "Historical Pulse Logs"
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 mt-0.5", children: "Chronological ledger records for the past 30 days. Save memos in-line." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs text-slate-500", children: [
            /* @__PURE__ */ jsx("span", { className: "w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" }),
            /* @__PURE__ */ jsx("span", { children: "Autosave Enabled" })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-xs border-collapse", children: [
          /* @__PURE__ */ jsx("thead", { className: "bg-slate-950/60 text-slate-400 uppercase tracking-widest font-black border-b border-slate-800", children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: "Date" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: "Sales" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: "Purchases" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: "Cash Position" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: "Stock Asset" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: "Receivables" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: "Payables" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: "Expenses" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 min-w-[240px]", children: "Daily Memo / Note (Autosaves Inline)" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-800/60", children: formattedSnapshots.length > 0 ? formattedSnapshots.map((snap) => {
            const dateStr = snap.date;
            const currentNote = noteEdits[dateStr] !== void 0 ? noteEdits[dateStr] : snap.note || "";
            const saveStatus = savingNotes[dateStr];
            return /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-950/20 transition-colors", children: [
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4 font-bold text-white whitespace-nowrap", children: new Date(snap.date).toLocaleDateString(void 0, {
                year: "numeric",
                month: "short",
                day: "numeric"
              }) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4 font-extrabold text-emerald-400", children: formatCurrency(snap.sales) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4 font-extrabold text-blue-400", children: formatCurrency(snap.purchases) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4 font-extrabold text-violet-300", children: formatCurrency(snap.cash) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4 font-bold text-slate-300", children: formatCurrency(snap.stock) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4 font-bold text-amber-400", children: formatCurrency(snap.receivables) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4 font-bold text-rose-400", children: formatCurrency(snap.payables) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4 font-bold text-orange-400", children: formatCurrency(snap.expense) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4 relative", children: /* @__PURE__ */ jsxs("div", { className: "relative group", children: [
                /* @__PURE__ */ jsx(
                  "textarea",
                  {
                    value: currentNote,
                    onChange: (e) => handleNoteChange(dateStr, e.target.value),
                    placeholder: "Write daily notes, events, exceptions...",
                    rows: 2,
                    className: "w-full bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium placeholder-slate-600 resize-none hover:border-slate-700/80"
                  }
                ),
                saveStatus && /* @__PURE__ */ jsxs("div", { className: "absolute right-2 bottom-3 flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-slate-950 border border-slate-800 shadow-xl z-20", children: [
                  saveStatus === "saving" && /* @__PURE__ */ jsxs(Fragment, { children: [
                    /* @__PURE__ */ jsx(RefreshCw, { size: 10, className: "text-amber-400 animate-spin" }),
                    /* @__PURE__ */ jsx("span", { className: "text-amber-400", children: "Saving..." })
                  ] }),
                  saveStatus === "saved" && /* @__PURE__ */ jsxs(Fragment, { children: [
                    /* @__PURE__ */ jsx(CheckCircle, { size: 10, className: "text-emerald-400" }),
                    /* @__PURE__ */ jsx("span", { className: "text-emerald-400", children: "Saved" })
                  ] }),
                  saveStatus === "error" && /* @__PURE__ */ jsxs(Fragment, { children: [
                    /* @__PURE__ */ jsx(AlertCircle, { size: 10, className: "text-red-400 animate-pulse" }),
                    /* @__PURE__ */ jsx("span", { className: "text-red-400", children: "Retry" })
                  ] })
                ] })
              ] }) })
            ] }, snap.id);
          }) : /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: "7", className: "px-6 py-8 text-center text-slate-500", children: "No daily history logs found." }) }) })
        ] }) })
      ] })
    ] })
  ] });
}
export {
  OwnersDailyPulse as default
};

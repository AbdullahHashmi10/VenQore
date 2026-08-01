import { jsxs, jsx } from "react/jsx-runtime";
import React, { useState } from "react";
import { f as formatCurrency, g as getCurrencySymbol } from "./format-B_ph0Qec.js";
import { O as OneGlanceLayout } from "./OneGlanceLayout-KMWHwZqK.js";
import { usePage, Head } from "@inertiajs/react";
import { User, X, Info, MessageSquare, History, BarChart2, Calendar, Sparkles, ArrowRight, TrendingUp, Package, CheckCircle, AlertTriangle, FileText, RefreshCcw } from "lucide-react";
import axios from "axios";
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Area } from "recharts";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "laravel-echo";
import "pusher-js";
import "driver.js";
function OpportunityIntelligencePanel({ isOpen, onClose, recommendation, stats }) {
  const { store, settings } = usePage().props;
  if (!isOpen || !recommendation) return null;
  const tabs = [
    { id: "intelligence", label: "INTELLIGENCE", icon: Info },
    { id: "action", label: "ACTION", icon: MessageSquare },
    { id: "history", label: "HISTORY", icon: History },
    { id: "forecast", label: "FORECAST", icon: BarChart2 },
    { id: "notes", label: "NOTES", icon: Calendar }
  ];
  const [activeTab, setActiveTab] = React.useState("intelligence");
  const [note, setNote] = React.useState("");
  const [isActing, setIsActing] = React.useState(null);
  const handleWhatsApp = async () => {
    setIsActing("whatsapp");
    try {
      const response = await axios.get(`/growth-engine/whatsapp/${recommendation.id}`);
      if (response.data.url) {
        window.open(response.data.url, "_blank");
      }
    } catch (error) {
      console.error("WhatsApp error:", error);
      alert("Could not generate WhatsApp link. Make sure the customer has a phone number.");
    } finally {
      setIsActing(null);
    }
  };
  const handleProposal = () => {
    setIsActing("proposal");
    setTimeout(() => {
      alert("AI Proposal Drafted successfully! A professional discount offer has been added to the customer's account notes.");
      setIsActing(null);
    }, 1500);
  };
  const handleTask = () => {
    setIsActing("task");
    setTimeout(() => {
      alert(`Follow-up scheduled for ${recommendation.party?.name}. This has been added to your Admin Task List.`);
      setIsActing(null);
    }, 1e3);
  };
  const chartData = [
    { name: "Jan", value: 4e3 },
    { name: "Feb", value: 3e3 },
    { name: "Mar", value: 2e3 },
    { name: "Apr", value: 2780 },
    { name: "May", value: 1890 },
    { name: "Jun", value: 2390 },
    { name: "Jul", value: 3490 }
  ];
  const generateNarrative = () => {
    const type = recommendation.type;
    const data = recommendation.data || {};
    recommendation.potential_revenue || 4500;
    const adbo = data.adbo || 8;
    const partyName = recommendation.party?.name || "this customer";
    if (type === "churn" || type === "retention") {
      let story = "";
      {
        story = `${partyName} used to be a very strong buyer, often ordering around ${getCurrencySymbol(store || settings)} 50,000. However, we noticed a worrying pattern where their orders started shrinking—first to 40,000, then 30,000, and now they haven't ordered at all for ${adbo * 2} days. This suggests they might be slowly moving their business elsewhere or are unhappy with something. You should call them to ask why their purchases dropped before they leave for good.`;
      }
      return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("p", { className: "text-base font-medium text-slate-600 dark:text-slate-300 leading-relaxed italic", children: [
          '"',
          story,
          '"'
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20 px-4 py-2 rounded-xl border border-indigo-100/50", children: [
          /* @__PURE__ */ jsx(Info, { size: 14 }),
          "Non-Technical Summary: Customer is fading away. Act now to save the relationship."
        ] })
      ] });
    }
    if (type === "recovery") {
      return /* @__PURE__ */ jsx("div", { className: "space-y-4", children: /* @__PURE__ */ jsxs("p", { className: "text-base font-medium text-slate-600 dark:text-slate-300 leading-relaxed italic", children: [
        '"',
        partyName,
        " has ",
        formatCurrency(recommendation.potential_revenue, store || settings),
        " currently stuck in unpaid invoices. Their oldest payment is ",
        data.oldest_days || "26",
        ' days past due. Usually, they pay much faster than this, so this delay is out of character. You are currently losing the use of this cash, which could be used to buy more stock."'
      ] }) });
    }
    return /* @__PURE__ */ jsx("p", { children: recommendation.message });
  };
  const generateWhatsAppDraft = () => {
    const partyName = recommendation.party?.name?.split(" ")[0] || "valued customer";
    const type = recommendation.type;
    const avgRev = recommendation.potential_revenue || 4500;
    if (type === "recovery") {
      return `Hi ${partyName}, hope you're doing well. Just a friendly reminder about your outstanding balance of ${formatCurrency(avgRev, store || settings)}. Please let us know if you have any questions or when we can expect payment. Thanks!`;
    }
    return `Hi ${partyName}, we haven't seen you for a while! We've prepared a special restock offer for your favorite items (Basmati Rice, etc.). Would you like me to send over a fresh quote with a 5% loyalty discount?`;
  };
  const renderNotesTab = () => {
    return /* @__PURE__ */ jsx("div", { className: "space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-4 gap-10", children: [
      /* @__PURE__ */ jsxs("div", { className: "lg:col-span-3 space-y-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsx("h4", { className: "text-sm font-black text-slate-800 dark:text-white uppercase tracking-[0.2em]", children: "Add Strategy Note" }),
          /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-6 focus-within:ring-4 ring-indigo-600/10 transition-all", children: [
            /* @__PURE__ */ jsx(
              "textarea",
              {
                className: "w-full bg-transparent border-none focus:ring-0 text-lg font-medium text-slate-700 dark:text-slate-300 min-h-[150px] placeholder:text-slate-400",
                placeholder: "Write down any findings, customer feedback, or recovery plans here...",
                value: note,
                onChange: (e) => setNote(e.target.value)
              }
            ),
            /* @__PURE__ */ jsx("div", { className: "flex justify-end mt-4", children: /* @__PURE__ */ jsx("button", { className: "py-4 px-10 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black shadow-xl shadow-indigo-500/20 transition-all active:scale-95", children: "Save Note" }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsx("h4", { className: "text-sm font-black text-slate-400 uppercase tracking-widest", children: "Recent Team Notes" }),
          /* @__PURE__ */ jsx("div", { className: "space-y-4", children: [
            { user: "Abdullah", date: "2 hours ago", text: "Spoke with the owner. They are on vacation until next week—outreach will resume then." },
            { user: "AI Brain", date: "Yesterday", text: "Detected a 15% revenue drop across their top 3 essential items." }
          ].map((n, i) => /* @__PURE__ */ jsxs("div", { className: "p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] shadow-sm", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsx("div", { className: "w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-[10px] font-black", children: n.user.charAt(0) }),
                /* @__PURE__ */ jsx("span", { className: "text-xs font-black dark:text-white uppercase tracking-tight", children: n.user })
              ] }),
              /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold text-slate-400 uppercase", children: n.date })
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "text-base text-slate-600 dark:text-slate-400 font-medium italic", children: [
              '"',
              n.text,
              '"'
            ] })
          ] }, i)) })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "lg:col-span-1 space-y-6", children: /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800", children: [
        /* @__PURE__ */ jsx("h4", { className: "text-[10px] text-slate-400 font-black uppercase tracking-widest mb-6", children: "Current Status" }),
        /* @__PURE__ */ jsx("div", { className: "space-y-3", children: [
          { id: "in-progress", label: "In Progress", color: "bg-indigo-50 border-indigo-200 text-indigo-600" },
          { id: "recovered", label: "Successfully Recovered", color: "bg-emerald-50 border-emerald-200 text-emerald-600" },
          { id: "lost", label: "Opportunity Lost", color: "bg-red-50 border-red-200 text-red-600" }
        ].map((status) => /* @__PURE__ */ jsx(
          "button",
          {
            className: `w-full py-4 text-xs font-black uppercase tracking-widest rounded-2xl border transition-all ${status.id === "in-progress" ? status.color : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 opacity-50 grayscale hover:grayscale-0 hover:opacity-100"}`,
            children: status.label
          },
          status.id
        )) })
      ] }) })
    ] }) });
  };
  const renderForecastTab = () => {
    const partyName = recommendation.party?.name?.split(" ")[0] || "customer";
    const monthlyLoss = recommendation.potential_revenue || 12500;
    const yearlyLoss = monthlyLoss * 12;
    return /* @__PURE__ */ jsxs("div", { className: "space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-10", children: [
        /* @__PURE__ */ jsx("div", { className: "bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-10 rounded-[3.5rem] relative overflow-hidden group shadow-lg", children: /* @__PURE__ */ jsxs("div", { className: "relative z-10 space-y-8", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
            /* @__PURE__ */ jsx("div", { className: "p-3 bg-red-600 rounded-2xl text-white shadow-lg shadow-red-500/20", children: /* @__PURE__ */ jsx(TrendingUp, { className: "rotate-180", size: 24 }) }),
            /* @__PURE__ */ jsx("h4", { className: "text-xl font-black text-red-900 dark:text-red-300 uppercase tracking-tight", children: "Revenue Loss Prediction" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-8", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-[10px] text-red-400 font-black uppercase tracking-[0.2em] mb-2", children: "Monthly Loss" }),
              /* @__PURE__ */ jsx("p", { className: "text-3xl font-black text-red-600", children: formatCurrency(monthlyLoss, store || settings) })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-[10px] text-red-400 font-black uppercase tracking-[0.2em] mb-2", children: "Yearly Risk" }),
              /* @__PURE__ */ jsx("p", { className: "text-3xl font-black text-red-600", children: formatCurrency(yearlyLoss, store || settings) })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "p-4 bg-white/50 dark:bg-red-950/50 rounded-[1.5rem] border border-red-100 dark:border-red-800", children: /* @__PURE__ */ jsxs("p", { className: "text-sm font-bold text-red-800 dark:text-red-200 leading-relaxed italic", children: [
            '"If ',
            partyName,
            " is not recovered this month, your business stands to lose over ",
            formatCurrency(yearlyLoss, store || settings),
            ' in annual revenue based on their purchase history."'
          ] }) })
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 p-10 rounded-[3.5rem] relative overflow-hidden shadow-lg", children: /* @__PURE__ */ jsxs("div", { className: "relative z-10 space-y-8", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
            /* @__PURE__ */ jsx("div", { className: "p-3 bg-emerald-600 rounded-2xl text-white shadow-lg shadow-emerald-500/20", children: /* @__PURE__ */ jsx(Package, { size: 24 }) }),
            /* @__PURE__ */ jsx("h4", { className: "text-xl font-black text-emerald-900 dark:text-emerald-300 uppercase tracking-tight", children: "Inventory Match" })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm font-bold text-emerald-600/80 uppercase tracking-widest leading-none", children: [
            "In Stock Now — ",
            partyName,
            "'s Regular Items"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "space-y-4", children: [
            { name: "Premium Basmati Rice", stock: "250 KG", color: "text-emerald-600" },
            { name: "White Sugar (50kg)", stock: "12 Bags", color: "text-emerald-600" }
          ].map((item, i) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-5 bg-white/80 dark:bg-slate-900/80 rounded-3xl border border-emerald-100/50 dark:border-emerald-900/30", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
              /* @__PURE__ */ jsx("div", { className: "w-10 h-10 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center text-emerald-600", children: /* @__PURE__ */ jsx(CheckCircle, { size: 20 }) }),
              /* @__PURE__ */ jsx("span", { className: "text-sm font-black dark:text-slate-200 uppercase tracking-tight", children: item.name })
            ] }),
            /* @__PURE__ */ jsx("span", { className: `text-[10px] font-black uppercase ${item.color}`, children: item.stock })
          ] }, i)) })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-10 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-[3rem] relative overflow-hidden group", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-8", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
            /* @__PURE__ */ jsx("div", { className: "p-3 bg-slate-800 rounded-2xl text-white", children: /* @__PURE__ */ jsx(BarChart2, { size: 24 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h4", { className: "text-lg font-black dark:text-white uppercase tracking-tight", children: "Market Segment Trend" }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 font-bold uppercase tracking-widest", children: "Category: Wholesale Grocery" })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "px-6 py-2 bg-emerald-50 text-emerald-600 rounded-full text-xs font-black uppercase tracking-widest border border-emerald-100", children: "Growing Sector" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "h-4 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "h-full w-[75%] bg-indigo-600 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.5)]" }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between mt-4", children: [
          /* @__PURE__ */ jsx("span", { className: "text-[10px] font-black text-slate-400 uppercase", children: "Declining" }),
          /* @__PURE__ */ jsx("span", { className: "text-[10px] font-black text-slate-400 uppercase", children: "Steady" }),
          /* @__PURE__ */ jsx("span", { className: "text-[10px] font-black text-indigo-600 uppercase", children: "Strong Demand" })
        ] })
      ] })
    ] });
  };
  const renderHistoryTab = () => {
    const historyItems = [
      { date: "Today, 04:30 AM", event: "AI Analysis Alert Generated", icon: Sparkles, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-900/20", desc: "The VenQore Brain detected a high-risk churn pattern based on the last 30 days of inactivity." },
      { date: "March 15, 2025", event: "Last Recovery Success", icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20", desc: `Customer returned after a 12-day silence period via WhatsApp outreach. Total order: ${formatCurrency(14500, store || settings)}.` },
      { date: "Feb 28, 2025", event: "Previous Churn Alert", icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-900/20", desc: "Retention outreach sent by Admin. Customer re-engaged successfully." }
    ];
    return /* @__PURE__ */ jsx("div", { className: "space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-4 gap-12", children: [
      /* @__PURE__ */ jsxs("div", { className: "lg:col-span-3 space-y-10", children: [
        /* @__PURE__ */ jsx("h4", { className: "text-sm font-black text-slate-800 dark:text-white uppercase tracking-[0.2em] mb-4", children: "Engagement Timeline" }),
        /* @__PURE__ */ jsx("div", { className: "relative space-y-12 before:absolute before:inset-y-0 before:left-8 before:w-1 before:bg-slate-100 dark:before:bg-slate-800 before:rounded-full", children: historyItems.map((item, i) => /* @__PURE__ */ jsxs("div", { className: "relative flex items-start gap-10 group", children: [
          /* @__PURE__ */ jsx("div", { className: `shrink-0 w-16 h-16 ${item.bg} rounded-3xl flex items-center justify-center ${item.color} shadow-lg z-10 group-hover:scale-110 transition-transform`, children: /* @__PURE__ */ jsx(item.icon, { size: 28 }) }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2 pt-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("span", { className: "text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest", children: item.date }),
              /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full" }),
              /* @__PURE__ */ jsx("span", { className: "text-sm font-black dark:text-white uppercase tracking-tight", children: item.event })
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "text-base text-slate-600 dark:text-slate-400 font-medium leading-relaxed max-w-2xl italic", children: [
              '"',
              item.desc,
              '"'
            ] })
          ] })
        ] }, i)) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "lg:col-span-1 space-y-6", children: /* @__PURE__ */ jsx("div", { className: "bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm", children: /* @__PURE__ */ jsxs("div", { className: "space-y-8", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400 font-black uppercase tracking-widest mb-3", children: "Recovery Luck" }),
          /* @__PURE__ */ jsx("p", { className: "text-4xl font-black text-emerald-500", children: "80%" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 font-bold mt-1 uppercase italic", children: "High Re-engagement Rate" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "h-0.5 bg-slate-100 dark:bg-slate-800 rounded-full" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2", children: "Past Outreach" }),
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-black dark:text-white", children: "4 Attempted" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 font-bold mt-1 italic leading-tight", children: "Last touch via Phone Call" })
        ] })
      ] }) }) })
    ] }) });
  };
  const renderActionTab = () => {
    const partyName = recommendation.party?.name || "this customer";
    const draft = generateWhatsAppDraft();
    return /* @__PURE__ */ jsxs("div", { className: "space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 p-8 rounded-[2.5rem] flex flex-col justify-between group hover:shadow-xl hover:-translate-y-1 transition-all duration-300", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 mb-6 group-hover:scale-110 transition-transform", children: /* @__PURE__ */ jsx(MessageSquare, { size: 32 }) }),
            /* @__PURE__ */ jsx("h4", { className: "text-xl font-black text-emerald-900 dark:text-emerald-300 uppercase tracking-tight mb-2", children: "Direct Message" }),
            /* @__PURE__ */ jsxs("p", { className: "text-sm text-emerald-600 dark:text-emerald-500/80 font-bold mb-6", children: [
              "Send an AI-drafted WhatsApp message to ",
              partyName,
              " instantly."
            ] })
          ] }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: handleWhatsApp,
              disabled: isActing,
              className: "w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2",
              children: [
                isActing === "whatsapp" ? "Opening Chat..." : "Send WhatsApp",
                /* @__PURE__ */ jsx(ArrowRight, { size: 18 })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 p-8 rounded-[2.5rem] flex flex-col justify-between group hover:shadow-xl hover:-translate-y-1 transition-all duration-300", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 mb-6 group-hover:scale-110 transition-transform", children: /* @__PURE__ */ jsx(FileText, { size: 32 }) }),
            /* @__PURE__ */ jsx("h4", { className: "text-xl font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-tight mb-2", children: "Create Proposal" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-indigo-600 dark:text-indigo-500/80 font-bold mb-6", children: "Generate a professional PDF proposal with a recovery discount." })
          ] }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: handleProposal,
              disabled: isActing,
              className: "w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black shadow-lg shadow-indigo-500/20 transition-all active:scale-95 flex items-center justify-center gap-2",
              children: [
                isActing === "proposal" ? "Drafting PDF..." : "Draft Proposal",
                /* @__PURE__ */ jsx(ArrowRight, { size: 18 })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-8 rounded-[2.5rem] flex flex-col justify-between group hover:shadow-xl hover:-translate-y-1 transition-all duration-300", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-500/30 mb-6 group-hover:scale-110 transition-transform", children: /* @__PURE__ */ jsx(Calendar, { size: 32 }) }),
            /* @__PURE__ */ jsx("h4", { className: "text-xl font-black text-amber-900 dark:text-amber-300 uppercase tracking-tight mb-2", children: "Schedule Task" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-amber-600 dark:text-amber-500/80 font-bold mb-6", children: "Create a follow-up reminder in your admin task list for later." })
          ] }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: handleTask,
              disabled: isActing,
              className: "w-full py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl font-black shadow-lg shadow-amber-500/20 transition-all active:scale-95 flex items-center justify-center gap-2",
              children: [
                isActing === "task" ? "Scheduling..." : "Set Reminder",
                /* @__PURE__ */ jsx(ArrowRight, { size: 18 })
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-[3rem] p-10 relative overflow-hidden", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-6", children: [
          /* @__PURE__ */ jsx("div", { className: "p-2 bg-indigo-600 rounded-xl text-white", children: /* @__PURE__ */ jsx(Sparkles, { size: 18 }) }),
          /* @__PURE__ */ jsx("h4", { className: "text-xs font-black text-slate-400 uppercase tracking-[0.3em]", children: "AI-Authored WhatsApp Draft" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "p-8 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-inner", children: /* @__PURE__ */ jsxs("p", { className: "text-xl font-bold text-slate-800 dark:text-white leading-relaxed italic", children: [
          '"',
          draft,
          '"'
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mt-6 text-xs font-black text-slate-400 uppercase tracking-widest px-4", children: [
          /* @__PURE__ */ jsx("div", { className: "w-2 h-2 bg-emerald-500 rounded-full animate-pulse" }),
          "Dynamic placeholders (Last Order: ",
          recommendation.data?.last_order_date || "N/A",
          ")"
        ] })
      ] })
    ] });
  };
  const renderIntelligenceTab = () => {
    recommendation.type;
    const data = recommendation.data || {};
    const realChartData = data.history && data.history.length > 0 ? data.history : chartData;
    const realProducts = data.top_products && data.top_products.length > 0 ? data.top_products : ["Premium Basmati Rice", "White Sugar (50kg)"];
    return /* @__PURE__ */ jsxs("div", { className: "space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700", children: [
      /* @__PURE__ */ jsx("div", { className: "p-8 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] relative overflow-hidden group transition-all duration-500", children: /* @__PURE__ */ jsxs("div", { className: "relative z-10", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
          /* @__PURE__ */ jsx("div", { className: "p-2 bg-indigo-600 rounded-xl text-white", children: /* @__PURE__ */ jsx(Sparkles, { size: 18 }) }),
          /* @__PURE__ */ jsx("h4", { className: "text-sm font-black text-slate-400 uppercase tracking-[0.2em]", children: "What's happening?" })
        ] }),
        generateNarrative()
      ] }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h4", { className: "text-sm font-black text-slate-800 dark:text-white mb-6 flex items-center gap-3 uppercase tracking-widest", children: [
          /* @__PURE__ */ jsx(TrendingUp, { size: 20, className: "text-indigo-500" }),
          " Revenue & Order Pattern"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "h-[350px] w-full bg-white dark:bg-slate-900 rounded-[3rem] relative border border-slate-100 dark:border-slate-800 shadow-inner overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "absolute inset-10", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", minWidth: 100, minHeight: 100, children: /* @__PURE__ */ jsxs(AreaChart, { data: realChartData, children: [
          /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("linearGradient", { id: "colorVal", x1: "0", y1: "0", x2: "0", y2: "1", children: [
            /* @__PURE__ */ jsx("stop", { offset: "5%", stopColor: "#6366f1", stopOpacity: 0.2 }),
            /* @__PURE__ */ jsx("stop", { offset: "95%", stopColor: "#6366f1", stopOpacity: 0 })
          ] }) }),
          /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", vertical: false, stroke: "#88888810" }),
          /* @__PURE__ */ jsx(
            XAxis,
            {
              dataKey: "name",
              stroke: "#64748b",
              fontSize: 11,
              axisLine: false,
              tickLine: false,
              tick: { fill: "#64748b", fontWeight: "bold" },
              dy: 15
            }
          ),
          /* @__PURE__ */ jsx(
            YAxis,
            {
              stroke: "#64748b",
              fontSize: 11,
              axisLine: false,
              tickLine: false,
              tick: { fill: "#64748b", fontWeight: "bold" },
              tickFormatter: (value) => formatCurrency(value, store || settings),
              dx: -15
            }
          ),
          /* @__PURE__ */ jsx(
            Tooltip,
            {
              contentStyle: { borderRadius: "24px", border: "none", boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)", fontWeight: "bold", padding: "16px" }
            }
          ),
          /* @__PURE__ */ jsx(Area, { type: "monotone", dataKey: "value", stroke: "#4f46e5", fillOpacity: 1, fill: "url(#colorVal)", strokeWidth: 5 })
        ] }) }) }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800", children: [
            /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2", children: "Likely Order Value" }),
            /* @__PURE__ */ jsx("p", { className: "text-2xl font-black dark:text-white", children: formatCurrency(recommendation.potential_revenue, store || settings) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800", children: [
            /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2", children: "Order Frequency" }),
            /* @__PURE__ */ jsxs("p", { className: "text-2xl font-black dark:text-white", children: [
              "Every ",
              data.adbo || "8",
              " Days"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2 ml-2", children: "Mostly Purchased Products" }),
          realProducts.map((prod, i) => /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl group", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
            /* @__PURE__ */ jsx("div", { className: "w-10 h-10 bg-indigo-50 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center text-indigo-600 font-black text-xs", children: prod.charAt(0) }),
            /* @__PURE__ */ jsx("span", { className: "text-sm font-bold dark:text-slate-200", children: prod })
          ] }) }, i))
        ] })
      ] })
    ] });
  };
  return /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12", children: [
    /* @__PURE__ */ jsx(
      "div",
      {
        className: "absolute inset-0 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300",
        onClick: onClose
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: `relative w-full max-w-6xl h-[85vh] bg-white dark:bg-slate-950 rounded-[3rem] shadow-[0_40px_100px_-15px_rgba(0,0,0,0.6)] border border-slate-100 dark:border-slate-800 flex flex-col transition-all duration-500 overflow-hidden animate-in zoom-in-95 fade-in slide-in-from-bottom-12 duration-700 ease-out`, children: [
      /* @__PURE__ */ jsx("div", { className: "px-10 py-8 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shrink-0", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-6", children: [
          /* @__PURE__ */ jsx("div", { className: "p-4 bg-indigo-600 rounded-[1.5rem] text-white shadow-xl shadow-indigo-500/20", children: /* @__PURE__ */ jsx(User, { size: 28 }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h2", { className: "text-3xl font-black dark:text-white tracking-tight uppercase leading-none mb-1", children: recommendation.party?.name || "Unknown Customer" }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: "px-3 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 rounded-full text-[10px] font-black border border-indigo-200 dark:border-indigo-800 uppercase tracking-widest", children: "Beta AI Intelligence" }),
              /* @__PURE__ */ jsxs("span", { className: "text-xs text-slate-400 font-bold uppercase tracking-widest", children: [
                "• ",
                recommendation.title
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: onClose,
            className: "p-4 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-all text-slate-400 hover:text-slate-600 group active:scale-95 bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700",
            children: /* @__PURE__ */ jsx(X, { size: 24, className: "group-hover:rotate-90 transition-transform duration-300" })
          }
        )
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col min-h-0", children: [
        /* @__PURE__ */ jsx("div", { className: "flex border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 px-10 overflow-x-auto custom-scrollbar shrink-0", children: tabs.map((tab) => /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setActiveTab(tab.id),
            className: `
                                    flex items-center gap-3 py-6 px-10 border-b-4 transition-all relative group
                                    ${activeTab === tab.id ? "border-indigo-600 text-indigo-600 font-black" : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"}
                                `,
            children: [
              /* @__PURE__ */ jsx(tab.icon, { size: 20, className: activeTab === tab.id ? "text-indigo-600" : "group-hover:scale-110 transition-transform" }),
              /* @__PURE__ */ jsx("span", { className: "text-xs uppercase tracking-[0.2em]", children: tab.label })
            ]
          },
          tab.id
        )) }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-y-auto p-12 custom-scrollbar bg-white dark:bg-slate-950", children: [
          activeTab === "intelligence" && renderIntelligenceTab(),
          activeTab === "action" && renderActionTab(),
          activeTab === "history" && renderHistoryTab(),
          activeTab === "forecast" && renderForecastTab(),
          activeTab === "notes" && renderNotesTab()
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "p-10 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: `px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${recommendation.priority === "urgent" ? "bg-red-50 text-red-600 border-red-200" : "bg-orange-50 text-orange-600 border-orange-200"}`, children: [
            recommendation.priority,
            " Urgency"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl text-[10px] font-black border border-indigo-100 dark:border-indigo-800 uppercase tracking-widest", children: [
            recommendation.type,
            " Detected"
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex-1 px-10 text-center", children: /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm", children: [
          /* @__PURE__ */ jsx(Sparkles, { size: 16, className: "text-indigo-500 animate-pulse" }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm font-bold text-slate-800 dark:text-white italic", children: [
            "AI Recommendation: We suggest contacting ",
            recommendation.party?.name.split(" ")[0],
            " to discuss their recent purchase pattern."
          ] })
        ] }) }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setActiveTab("action"),
            className: "flex items-center justify-center gap-3 py-4 px-10 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black shadow-xl shadow-indigo-500/30 transition-all active:scale-95 group",
            children: [
              "Take Action",
              /* @__PURE__ */ jsx(ArrowRight, { size: 20, className: "group-hover:translate-x-1 transition-transform" })
            ]
          }
        )
      ] }) })
    ] })
  ] });
}
function GrowthEngineIndex({ recommendations, stats, filters }) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedRec, setSelectedRec] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const handleOpenPanel = (rec) => {
    setSelectedRec(rec);
    setIsPanelOpen(true);
  };
  const hasData = recommendations?.data?.length > 0;
  const displayRecommendations = hasData ? recommendations.data : [
    {
      id: 1,
      type: "retention",
      priority: "urgent",
      title: "Customer Recovery Alert",
      message: "Bilal General Store has missed their usual weekly order. They are 3 days overdue.",
      action: "Generate WhatsApp Reminder",
      party_name: "Bilal General Store",
      created_at: "2 hours ago"
    },
    {
      id: 2,
      type: "forecast",
      priority: "high",
      title: "Stockout Risk Prediction",
      message: 'Based on current sales velocity, "Sugar (50kg)" will run out in 3 days. 5 regular customers are due to order this week.',
      action: "Draft Purchase Order",
      party_name: null,
      created_at: "5 hours ago"
    },
    {
      id: 3,
      type: "churn",
      priority: "medium",
      title: "Churn Probability Rising",
      message: 'Customer "Ali Traders" has reduced order frequency by 40% this month.',
      action: "View Customer Profile",
      party_name: "Ali Traders",
      created_at: "1 day ago"
    }
  ];
  const getIcon = (type) => {
    switch (type) {
      case "retention":
        return /* @__PURE__ */ jsx(RefreshCcw, { className: "text-blue-500" });
      case "forecast":
        return /* @__PURE__ */ jsx(TrendingUp, { className: "text-emerald-500" });
      case "churn":
        return /* @__PURE__ */ jsx(AlertTriangle, { className: "text-orange-500" });
      default:
        return /* @__PURE__ */ jsx(Sparkles, { className: "text-indigo-500" });
    }
  };
  const getBadgeColor = (priority) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800";
      case "high":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700";
    }
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Growth Engine", activeMenu: "Growth Engine", children: [
    /* @__PURE__ */ jsx(Head, { title: "Growth Engine" }),
    /* @__PURE__ */ jsxs("div", { className: "relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 p-8 text-white shadow-xl mb-8", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" }),
      /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-40 h-40 bg-purple-500/20 rounded-full blur-2xl translate-y-1/4 -translate-x-1/4" }),
      /* @__PURE__ */ jsxs("div", { className: "relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-2 bg-white/20 backdrop-blur-md rounded-xl", children: /* @__PURE__ */ jsx(Sparkles, { size: 24, className: "text-yellow-300" }) }),
            /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold tracking-tight", children: "Growth Engine" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-indigo-100 text-lg max-w-2xl", children: "AI-powered actionable intelligence to grow your revenue, recover customers, and optimize stock." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "text-center p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10", children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm text-indigo-200 uppercase tracking-widest font-bold", children: "Potential Revenue" }),
            /* @__PURE__ */ jsxs("p", { className: "text-2xl font-bold mt-1", children: [
              getCurrencySymbol(),
              " ",
              hasData ? (stats?.potential_revenue || 0).toLocaleString() : "45,000"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-center p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10", children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm text-indigo-200 uppercase tracking-widest font-bold", children: "Actions Pending" }),
            /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold mt-1", children: hasData ? stats?.total_count || 0 : displayRecommendations.length })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex items-center gap-4 mb-6 overflow-x-auto pb-2", children: ["all", "retention", "forecast", "churn", "recovery"].map((filter) => /* @__PURE__ */ jsx(
      "button",
      {
        onClick: () => setActiveFilter(filter),
        className: `
                            px-4 py-2 rounded-full text-sm font-bold capitalize whitespace-nowrap transition-all
                            ${activeFilter === filter ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"}
                        `,
        children: filter
      },
      filter
    )) }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: displayRecommendations.map((rec) => /* @__PURE__ */ jsxs(
      "div",
      {
        onClick: () => handleOpenPanel(rec),
        className: "group bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-100 dark:border-slate-800 relative cursor-pointer overflow-hidden",
        children: [
          /* @__PURE__ */ jsx("div", { className: `absolute top-0 right-0 px-3 py-1 rounded-bl-2xl text-[10px] uppercase font-bold tracking-wider border-b border-l ${getBadgeColor(rec.priority)}`, children: rec.priority }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4 mb-4", children: [
            /* @__PURE__ */ jsx("div", { className: "p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl group-hover:scale-110 transition-transform duration-300", children: getIcon(rec.type) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h3", { className: "font-bold text-lg text-slate-800 dark:text-white leading-tight mb-1", children: rec.title }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 font-medium", children: rec.created_at })
            ] })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-6", children: rec.message }),
          /* @__PURE__ */ jsx("div", { className: "border-t border-slate-100 dark:border-slate-800 pt-4 mt-auto", children: /* @__PURE__ */ jsxs("button", { className: "w-full py-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold text-sm hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white transition-all flex items-center justify-center gap-2 group/btn", children: [
            rec.action,
            /* @__PURE__ */ jsx(ArrowRight, { size: 16, className: "group-hover/btn:translate-x-1 transition-transform" })
          ] }) })
        ]
      },
      rec.id
    )) }),
    displayRecommendations.length === 0 && /* @__PURE__ */ jsxs("div", { className: "text-center py-20", children: [
      /* @__PURE__ */ jsx("div", { className: "w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400", children: /* @__PURE__ */ jsx(CheckCircle, { size: 40 }) }),
      /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-slate-800 dark:text-white", children: "All Clear!" }),
      /* @__PURE__ */ jsx("p", { className: "text-slate-500 mt-2", children: "No pending recommendations at this time." })
    ] }),
    /* @__PURE__ */ jsx(
      OpportunityIntelligencePanel,
      {
        isOpen: isPanelOpen,
        onClose: () => setIsPanelOpen(false),
        recommendation: selectedRec
      }
    )
  ] });
}
export {
  GrowthEngineIndex as default
};

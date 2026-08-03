import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { Sparkles, LogOut, Store, MessageSquare, ArrowRight, Lock, BookOpen, Megaphone, LineChart, CheckCircle2, Clock, ListTodo, ShieldAlert, DollarSign, Users, Zap, Crown } from "lucide-react";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from "recharts";
import axios from "axios";
import { v as vq } from "./marketing-pages-CTBAvetE.js";
import "marked";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
const PLATFORM_ROLES = {
  platform_owner: { label: "Hashmi Dashboard", icon: Crown, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" },
  platform_manager: { label: "Platform Manager", icon: Crown, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" },
  support_director: { label: "Support Director", icon: Zap, color: "text-indigo-400", bg: "bg-indigo-400/10", border: "border-indigo-400/20" },
  support_dept_manager: { label: "Support Manager", icon: Zap, color: "text-indigo-400", bg: "bg-indigo-400/10", border: "border-indigo-400/20" },
  support_agent: { label: "Support Agent", icon: Users, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" },
  content_writer: { label: "Content Writer", icon: BookOpen, color: "text-teal-400", bg: "bg-teal-400/10", border: "border-teal-400/20" },
  marketing_manager: { label: "Marketing Lead", icon: Megaphone, color: "text-pink-400", bg: "bg-pink-400/10", border: "border-pink-400/20" },
  platform_finance: { label: "Finance Officer", icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" }
};
function RoleBadge({ role }) {
  const cfg = PLATFORM_ROLES[role] ?? { label: "Platform Staff", icon: Users, color: "text-slate-400", bg: "bg-slate-400/10", border: "border-slate-400/20" };
  const Icon = cfg.icon;
  return /* @__PURE__ */ jsxs("span", { className: `inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${cfg.color} ${cfg.bg} ${cfg.border}`, children: [
    /* @__PURE__ */ jsx(Icon, { size: 12 }),
    " ",
    cfg.label
  ] });
}
function StaffHub({ employee, referred_chats = [], tasks = [], stats = { unassigned: 0, active: 0, resolved: 0 } }) {
  const [activeTasks, setActiveTasks] = useState(tasks);
  const [autonomyStats, setAutonomyStats] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);
  const [loadingStats, setLoadingStats] = useState(employee.role === "owner");
  const toggleTask = (taskId) => {
    setActiveTasks(
      (prev) => prev.map((t) => t.id === taskId ? { ...t, completed: !t.completed } : t)
    );
  };
  const handleLogout = () => {
    router.post(route("logout"));
  };
  const fetchAutonomyStats = async () => {
    try {
      const res = await axios.get(route("platform.chatbot.autonomy-stats"));
      if (res.data.success) {
        setAutonomyStats(res.data.stats || []);
        setCategoryStats(res.data.categories || []);
      }
    } catch (err) {
      console.error("Failed to fetch autonomy stats", err);
    } finally {
      setLoadingStats(false);
    }
  };
  useEffect(() => {
    if (employee.role === "owner") {
      fetchAutonomyStats();
    }
  }, [employee.role]);
  const handleToggleAutonomy = async (category, currentStatus) => {
    try {
      const res = await axios.post(route("platform.chatbot.autonomy-stats.promote"), {
        category,
        autonomous: !currentStatus
      });
      if (res.data.success) {
        window.dispatchEvent(new CustomEvent("amd:toast", {
          detail: { message: res.data.message, type: "success" }
        }));
        fetchAutonomyStats();
      }
    } catch (err) {
      console.error("Failed to toggle autonomy", err);
    }
  };
  const hasSupportAccess = ["platform_owner", "platform_manager", "support_director", "support_dept_manager", "support_agent", "support", "owner"].includes(employee.role);
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-void-950 text-white font-sans selection:bg-violet-500/40 selection:text-white relative overflow-hidden", children: [
    /* @__PURE__ */ jsx(Head, { title: "Platform Employee Cockpit" }),
    /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 pointer-events-none overflow-hidden", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[140px]" }),
      /* @__PURE__ */ jsx("div", { className: "absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-600/8 rounded-full blur-[120px]" })
    ] }),
    /* @__PURE__ */ jsxs("header", { className: "relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-white/[0.04]", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "w-10 h-10 bg-violet-500/10 rounded-xl flex items-center justify-center border border-violet-500/20 shadow-xl", children: /* @__PURE__ */ jsx(Sparkles, { size: 18, className: "text-violet-400" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "text-2xs font-black text-violet-400 uppercase tracking-widest block", children: "VenQore Internal" }),
          /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-white tracking-tight", children: "Team Command Cockpit" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: handleLogout,
          className: "text-xs font-bold text-slate-500 hover:text-white transition-colors flex items-center gap-2 group",
          children: [
            /* @__PURE__ */ jsx("span", { children: "Sign Out" }),
            /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-red-500/20 group-hover:border-red-500/40 transition-all", children: /* @__PURE__ */ jsx(LogOut, { size: 13, className: "text-slate-400 group-hover:text-red-400" }) })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("main", { className: "relative z-10 w-full max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2 space-y-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative rounded-[2rem] bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.06] p-8 overflow-hidden shadow-2xl", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 p-8 w-48 h-48 bg-violet-600/10 rounded-full blur-[50px] -mt-16 -mr-16 pointer-events-none" }),
          /* @__PURE__ */ jsx("span", { className: "text-3xs font-black text-violet-400 uppercase tracking-[0.2em] block mb-2", children: "VenQore Platform Staff" }),
          /* @__PURE__ */ jsx("h1", { className: "text-3xl font-black tracking-tight text-white mb-2", style: { fontFamily: "'Space Grotesk', sans-serif" }, children: employee.name }),
          /* @__PURE__ */ jsxs("p", { className: "text-slate-400 text-sm max-w-lg mb-6 leading-relaxed", children: [
            "Authorized as ",
            /* @__PURE__ */ jsx("span", { className: "text-slate-300 font-semibold", children: employee.email }),
            ". Operating at the platform control level."
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2.5", children: /* @__PURE__ */ jsx(RoleBadge, { role: employee.role }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("h2", { className: "text-lg font-black text-white tracking-tight flex items-center gap-2.5", children: [
            /* @__PURE__ */ jsx(Store, { size: 18, className: "text-violet-400" }),
            " Cockpit Rooms"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "group rounded-2xl bg-white/[0.02] border border-white/[0.05] p-5 transition-all duration-300 flex flex-col justify-between shadow-lg", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-sm font-black text-indigo-400", children: /* @__PURE__ */ jsx(MessageSquare, { size: 18 }) }),
                  /* @__PURE__ */ jsx("span", { className: "text-2xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider", children: "Active" })
                ] }),
                /* @__PURE__ */ jsx("h3", { className: "font-bold text-white mb-1 group-hover:text-indigo-300 transition-colors", children: "Support Room" }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 mb-4", children: "Manage global customer inbox sessions and co-pilot with Vena AI." }),
                /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-2 mb-6", children: [
                  /* @__PURE__ */ jsxs("div", { className: "bg-white/5 border border-white/[0.04] p-2.5 rounded-xl text-center", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-3xs text-slate-400 font-bold uppercase tracking-wider block", children: "Unassigned" }),
                    /* @__PURE__ */ jsx("span", { className: "text-sm font-black text-rose-400 block mt-0.5", children: stats.unassigned })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "bg-white/5 border border-white/[0.04] p-2.5 rounded-xl text-center", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-3xs text-slate-400 font-bold uppercase tracking-wider block", children: "Active" }),
                    /* @__PURE__ */ jsx("span", { className: "text-sm font-black text-indigo-400 block mt-0.5", children: stats.active })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "bg-white/5 border border-white/[0.04] p-2.5 rounded-xl text-center", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-3xs text-slate-400 font-bold uppercase tracking-wider block", children: "Resolved" }),
                    /* @__PURE__ */ jsx("span", { className: "text-sm font-black text-emerald-400 block mt-0.5", children: stats.resolved })
                  ] })
                ] })
              ] }),
              hasSupportAccess ? /* @__PURE__ */ jsxs(Link, { href: route("platform.chatbot.inbox"), className: "w-full text-center py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-bold text-white shadow-lg shadow-violet-600/15 hover:shadow-violet-600/30 transition-all flex items-center justify-center gap-1.5", children: [
                "Enter Support Command ",
                /* @__PURE__ */ jsx(ArrowRight, { size: 12 })
              ] }) : /* @__PURE__ */ jsxs("div", { className: "w-full text-center py-2.5 rounded-xl bg-slate-800 text-slate-500 text-xs font-bold flex items-center justify-center gap-1.5 cursor-not-allowed", children: [
                /* @__PURE__ */ jsx(Lock, { size: 12 }),
                " Restricted"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "group rounded-2xl bg-white/[0.01] border border-white/[0.03] p-5 opacity-60 flex flex-col justify-between shadow-lg", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-lg bg-teal-500/5 flex items-center justify-center text-sm font-black text-teal-500", children: /* @__PURE__ */ jsx(BookOpen, { size: 18 }) }),
                  /* @__PURE__ */ jsx("span", { className: "text-4xs bg-slate-800 border border-slate-700 text-slate-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider", children: "Locked" })
                ] }),
                /* @__PURE__ */ jsx("h3", { className: "font-bold text-slate-300 mb-1", children: "Content & SEO Room" }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-600 mb-6", children: "VenQore landing page articles, knowledge bases, and site SEO tools." })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "w-full text-center py-2.5 rounded-xl bg-slate-900 text-slate-600 text-xs font-bold flex items-center justify-center gap-1.5", children: [
                /* @__PURE__ */ jsx(Lock, { size: 12 }),
                " Coming Soon"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "group rounded-2xl bg-white/[0.01] border border-white/[0.03] p-5 opacity-60 flex flex-col justify-between shadow-lg", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-lg bg-pink-500/5 flex items-center justify-center text-sm font-black text-pink-500", children: /* @__PURE__ */ jsx(Megaphone, { size: 18 }) }),
                  /* @__PURE__ */ jsx("span", { className: "text-4xs bg-slate-800 border border-slate-700 text-slate-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider", children: "Locked" })
                ] }),
                /* @__PURE__ */ jsx("h3", { className: "font-bold text-slate-300 mb-1", children: "Marketing & Growth" }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-600 mb-6", children: "Social reach analytics, marketing lists, and promotional assets." })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "w-full text-center py-2.5 rounded-xl bg-slate-900 text-slate-600 text-xs font-bold flex items-center justify-center gap-1.5", children: [
                /* @__PURE__ */ jsx(Lock, { size: 12 }),
                " Coming Soon"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "group rounded-2xl bg-white/[0.01] border border-white/[0.03] p-5 opacity-60 flex flex-col justify-between shadow-lg", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-lg bg-emerald-500/5 flex items-center justify-center text-sm font-black text-emerald-500", children: /* @__PURE__ */ jsx(LineChart, { size: 18 }) }),
                  /* @__PURE__ */ jsx("span", { className: "text-4xs bg-slate-800 border border-slate-700 text-slate-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider", children: "Locked" })
                ] }),
                /* @__PURE__ */ jsx("h3", { className: "font-bold text-slate-300 mb-1", children: "Finance & Subscriptions" }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-600 mb-6", children: "Active subscription fee journals and Gateway reconciliations." })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "w-full text-center py-2.5 rounded-xl bg-slate-900 text-slate-600 text-xs font-bold flex items-center justify-center gap-1.5", children: [
                /* @__PURE__ */ jsx(Lock, { size: 12 }),
                " Coming Soon"
              ] })
            ] })
          ] })
        ] }),
        hasSupportAccess && /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("h2", { className: "text-lg font-black text-white tracking-tight flex items-center gap-2.5", children: [
            /* @__PURE__ */ jsx(MessageSquare, { size: 18, className: "text-violet-400" }),
            " Referred Platform Queue"
          ] }),
          referred_chats.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-dashed border-white/[0.06] bg-white/[0.01] p-12 text-center", children: [
            /* @__PURE__ */ jsx(CheckCircle2, { size: 36, className: "text-slate-600 mx-auto mb-3" }),
            /* @__PURE__ */ jsx("h3", { className: "font-bold text-white text-sm", children: "Inbox Fully Cleared!" }),
            /* @__PURE__ */ jsx("p", { className: "text-slate-500 text-xs mt-1", children: "There are currently no chatbot session tickets referred specifically to your username." })
          ] }) : /* @__PURE__ */ jsx("div", { className: "rounded-2xl border border-white/[0.05] bg-white/[0.02] overflow-hidden divide-y divide-white/[0.04] shadow-lg", children: referred_chats.map((chat) => /* @__PURE__ */ jsxs("div", { className: "p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-white/[0.03] transition-colors", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3.5", children: [
              /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0 border border-violet-500/20 text-violet-400", children: /* @__PURE__ */ jsx(MessageSquare, { size: 16 }) }),
              /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap mb-1", children: [
                  /* @__PURE__ */ jsx("span", { className: "font-bold text-white text-sm", children: chat.visitor_name }),
                  /* @__PURE__ */ jsx("span", { className: "text-3xs bg-slate-800 border border-slate-700 text-slate-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider", children: chat.tenant_name }),
                  chat.sub_status && /* @__PURE__ */ jsx("span", { className: `text-4xs font-black uppercase px-2 py-0.5 rounded-full ${chat.sub_status === "fixed" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"}`, children: chat.sub_status })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 truncate", children: chat.visitor_email }),
                /* @__PURE__ */ jsxs("p", { className: "text-2xs text-slate-600 mt-1 flex items-center gap-1", children: [
                  /* @__PURE__ */ jsx(Clock, { size: 10 }),
                  " Active: ",
                  new Date(chat.last_message_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs(Link, { href: chat.url, className: "shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 hover:border-violet-400/40 text-violet-400 hover:text-violet-300 font-bold text-xs transition-all", children: [
              "Open Conversation ",
              /* @__PURE__ */ jsx(ArrowRight, { size: 12 })
            ] })
          ] }, chat.id)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "rounded-[2rem] bg-gradient-to-b from-white/[0.03] to-white/[0.01] border border-white/[0.06] p-6 shadow-2xl", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-6", children: [
            /* @__PURE__ */ jsxs("h2", { className: "font-black text-white text-base tracking-tight flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(ListTodo, { size: 18, className: "text-violet-400" }),
              " Platform Duties"
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "text-2xs bg-slate-800 text-slate-400 font-bold px-2 py-0.5 rounded-full", children: [
              activeTasks.filter((t) => t.completed).length,
              "/",
              activeTasks.length,
              " Completed"
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "space-y-3.5", children: activeTasks.map((task) => /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => toggleTask(task.id),
              className: `w-full text-left p-4 rounded-xl border flex items-start gap-3 transition-all duration-300 group ${task.completed ? "bg-emerald-500/[0.02] border-emerald-500/15 text-slate-500 line-through" : "bg-white/[0.01] border-white/[0.05] hover:border-white/[0.1] text-slate-300"}`,
              children: [
                /* @__PURE__ */ jsx("div", { className: "shrink-0 mt-0.5", children: task.completed ? /* @__PURE__ */ jsx(CheckCircle2, { size: 16, className: "text-emerald-500" }) : /* @__PURE__ */ jsx("div", { className: "w-4 h-4 rounded border border-slate-700 flex items-center justify-center group-hover:border-violet-500 transition-colors" }) }),
                /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-xs leading-relaxed font-medium", children: task.text }),
                  /* @__PURE__ */ jsxs("span", { className: `text-4xs font-black uppercase tracking-widest mt-1.5 inline-block ${task.priority === "high" ? "text-red-400" : task.priority === "medium" ? "text-violet-400" : "text-slate-500"}`, children: [
                    task.priority,
                    " Priority"
                  ] })
                ] })
              ]
            },
            task.id
          )) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-[2rem] bg-white/[0.02] border border-white/[0.05] p-6 relative overflow-hidden", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute -top-12 -right-12 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" }),
          /* @__PURE__ */ jsxs("h3", { className: "font-bold text-white text-xs tracking-wide uppercase mb-2 flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsx(ShieldAlert, { size: 14, className: "text-violet-400" }),
            " Platform Security"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-slate-500 text-xs leading-relaxed", children: "Support agent logs, learning database inputs, and co-pilot suggestions are audited under platform administration standards to maintain VenQore system integrity." })
        ] })
      ] })
    ] }),
    employee.role === "owner" && /* @__PURE__ */ jsx("section", { className: "relative z-10 w-full max-w-7xl mx-auto px-6 pb-24 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500", children: /* @__PURE__ */ jsxs("div", { className: "border-t border-white/[0.04] pt-12", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h2", { className: "text-2xl font-black text-white tracking-tight flex items-center gap-2.5", style: { fontFamily: "'Space Grotesk', sans-serif" }, children: [
            /* @__PURE__ */ jsx(Sparkles, { className: "text-purple-400", size: 24 }),
            " Vena AI Autonomy Dashboard"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-slate-400 text-xs mt-1", children: "Monitor autonomous resolve rates and manage self-improving escalation boundaries" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex items-center gap-4 bg-white/[0.02] border border-white/[0.05] p-3 rounded-2xl shrink-0", children: /* @__PURE__ */ jsx("span", { className: "text-2xs bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider", children: "Learning Active" }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2 rounded-[2rem] bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.06] p-6 shadow-2xl flex flex-col justify-between h-[360px]", children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
            /* @__PURE__ */ jsx("h3", { className: "font-bold text-white text-sm", children: "Resolution Over Time" }),
            /* @__PURE__ */ jsx("p", { className: "text-slate-500 text-2xs", children: "AI vs Human ticket closures" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex-1 min-h-0 w-full", children: loadingStats ? /* @__PURE__ */ jsx("div", { className: "h-full w-full flex items-center justify-center text-slate-500 text-xs gap-2", children: /* @__PURE__ */ jsx("span", { className: "animate-pulse", children: "Loading charts..." }) }) : autonomyStats.length === 0 ? /* @__PURE__ */ jsx("div", { className: "h-full w-full flex items-center justify-center text-slate-550 text-xs", children: "No resolved session data available yet" }) : /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(BarChart, { data: autonomyStats, margin: { top: 10, right: 10, left: -25, bottom: 0 }, children: [
            /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.03)", vertical: false }),
            /* @__PURE__ */ jsx(XAxis, { dataKey: "date", stroke: "rgba(255,255,255,0.3)", fontSize: 10, tickLine: false, axisLine: false }),
            /* @__PURE__ */ jsx(YAxis, { stroke: "rgba(255,255,255,0.3)", fontSize: 10, tickLine: false, axisLine: false }),
            /* @__PURE__ */ jsx(
              Tooltip,
              {
                contentStyle: { backgroundColor: vq.slate[950], borderColor: "rgba(255,255,255,0.08)", borderRadius: "1rem", color: "#fff" },
                itemStyle: { fontSize: "11px", fontWeight: "bold" },
                labelStyle: { fontSize: "10px", color: vq.purple[500], fontWeight: "black", textTransform: "uppercase" }
              }
            ),
            /* @__PURE__ */ jsx(Legend, { iconSize: 8, iconType: "circle", wrapperStyle: { fontSize: "10px", color: vq.slate[400] } }),
            /* @__PURE__ */ jsx(Bar, { dataKey: "AI", name: "Vena AI", stackId: "a", fill: vq.violet[500], radius: [0, 0, 0, 0] }),
            /* @__PURE__ */ jsx(Bar, { dataKey: "Human", name: "Human Support", stackId: "a", fill: vq.slate[600], radius: [4, 4, 0, 0] })
          ] }) }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-[2rem] bg-gradient-to-b from-white/[0.03] to-white/[0.01] border border-white/[0.06] p-6 shadow-2xl flex flex-col justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
            /* @__PURE__ */ jsx("h3", { className: "font-bold text-white text-sm", children: "Escalation Controls" }),
            /* @__PURE__ */ jsx("p", { className: "text-slate-500 text-2xs", children: "Define boundaries where Vena answers autonomously" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-1", children: loadingStats ? /* @__PURE__ */ jsx("div", { className: "h-48 w-full flex items-center justify-center text-slate-500 text-xs gap-2", children: /* @__PURE__ */ jsx("span", { className: "animate-pulse", children: "Loading controls..." }) }) : categoryStats.map((cat) => /* @__PURE__ */ jsxs("div", { className: "bg-white/[0.01] border border-white/[0.04] rounded-2xl p-4 flex items-center justify-between gap-4 hover:border-white/[0.08] transition-colors", children: [
            /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
              /* @__PURE__ */ jsx("span", { className: "text-xs font-black uppercase text-slate-200 tracking-wide block", children: cat.category }),
              /* @__PURE__ */ jsxs("span", { className: "text-2xs text-slate-500 block mt-0.5", children: [
                cat.ai_handled_rate,
                "% autonomous handle rate (",
                cat.total_chats,
                " chats)"
              ] })
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => handleToggleAutonomy(cat.category, cat.ai_autonomous),
                className: `px-3 py-1.5 rounded-xl text-3xs font-black uppercase tracking-wider transition-all border shrink-0 ${cat.ai_autonomous ? "bg-purple-600/10 border-purple-500/30 text-purple-400 shadow-lg shadow-purple-500/5" : "bg-slate-900 border-white/5 text-slate-400 hover:text-white hover:border-white/10"}`,
                children: cat.ai_autonomous ? "Autonomous" : "Let AI handle"
              }
            )
          ] }, cat.category)) })
        ] })
      ] })
    ] }) })
  ] });
}
export {
  StaffHub as default
};

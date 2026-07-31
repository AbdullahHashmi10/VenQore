import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-BqRkhJQJ.js";
import { Head } from "@inertiajs/react";
import { Shield, Search, RefreshCw, FileText, AlertOctagon, AlertTriangle, CheckCircle, Filter, Clock, Terminal, Info } from "lucide-react";
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
function AdminLogs({ logs = [] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");
  const displayLogs = useMemo(() => {
    if (!logs || logs.length === 0) return [];
    return logs.map((log) => {
      let level = "info";
      const act = (log.action || "").toLowerCase();
      const desc = (log.description || "").toLowerCase();
      if (act.includes("fail") || act.includes("error") || act.includes("delet") || act.includes("destroy") || act.includes("alert")) {
        level = "error";
      } else if (act.includes("warn") || desc.includes("warn")) {
        level = "warning";
      } else if (act.includes("succ") || act.includes("create") || act.includes("add") || act.includes("update") || act.includes("sale") || act.includes("purchase")) {
        level = "success";
      }
      return {
        ...log,
        id: log.id,
        action: log.action || "Unknown Action",
        description: log.description || "No details provided",
        level,
        user: log.user ? log.user.name : "System/Guest",
        ip: log.properties?.ip || "-",
        created_at: log.created_at
      };
    });
  }, [logs]);
  const filteredLogs = useMemo(() => {
    return displayLogs.filter((log) => {
      const matchesSearch = log.action.toLowerCase().includes(searchQuery.toLowerCase()) || log.description.toLowerCase().includes(searchQuery.toLowerCase()) || log.user.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterLevel === "all" || log.level === filterLevel;
      return matchesSearch && matchesFilter;
    });
  }, [displayLogs, searchQuery, filterLevel]);
  const getLevelConfig = (level) => {
    switch (level) {
      case "error":
        return { color: "text-rose-500", bg: "bg-rose-100 dark:bg-rose-900/20", icon: AlertOctagon, label: "Critical" };
      case "warning":
        return { color: "text-amber-500", bg: "bg-amber-100 dark:bg-amber-900/20", icon: AlertTriangle, label: "Warning" };
      case "success":
        return { color: "text-emerald-500", bg: "bg-emerald-100 dark:bg-emerald-900/20", icon: CheckCircle, label: "Success" };
      default:
        return { color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-900/20", icon: Info, label: "Info" };
    }
  };
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  };
  const refreshPage = () => {
    window.location.reload();
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Security Command Center", mode: "admin", children: [
    /* @__PURE__ */ jsx(Head, { title: "Security Logs" }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-[1600px] mx-auto h-full flex flex-col gap-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Shield, { className: "text-indigo-500" }),
            "Security Audit Log"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: "Real-time system activity tracking" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 w-full md:w-auto", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative flex-1 md:w-64 group", children: [
            /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors", size: 16 }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                placeholder: "Search logs...",
                value: searchQuery,
                onChange: (e) => setSearchQuery(e.target.value),
                className: "w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
              }
            )
          ] }),
          /* @__PURE__ */ jsx("button", { onClick: refreshPage, className: "p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 hover:text-indigo-500 transition-colors", title: "Refresh Logs", children: /* @__PURE__ */ jsx(RefreshCw, { size: 20 }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4", children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600", children: /* @__PURE__ */ jsx(FileText, { size: 24 }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Total Events" }),
            /* @__PURE__ */ jsx("p", { className: "text-2xl font-black text-slate-800 dark:text-white", children: displayLogs.length })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4", children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/20 flex items-center justify-center text-rose-600", children: /* @__PURE__ */ jsx(AlertOctagon, { size: 24 }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Critical" }),
            /* @__PURE__ */ jsx("p", { className: "text-2xl font-black text-slate-800 dark:text-white", children: displayLogs.filter((l) => l.level === "error").length })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4", children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center text-amber-600", children: /* @__PURE__ */ jsx(AlertTriangle, { size: 24 }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Warnings" }),
            /* @__PURE__ */ jsx("p", { className: "text-2xl font-black text-slate-800 dark:text-white", children: displayLogs.filter((l) => l.level === "warning").length })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4", children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600", children: /* @__PURE__ */ jsx(CheckCircle, { size: 24 }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Success" }),
            /* @__PURE__ */ jsx("p", { className: "text-2xl font-black text-slate-800 dark:text-white", children: displayLogs.filter((l) => l.level === "success").length })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm flex flex-col overflow-hidden min-h-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Filter, { size: 16, className: "text-slate-400" }),
          /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-slate-600 dark:text-slate-300 mr-2", children: "Status:" }),
          ["all", "info", "success", "warning", "error"].map((level) => /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setFilterLevel(level),
              className: `px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all
                                    ${filterLevel === level ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"}
                                `,
              children: level
            },
            level
          ))
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-auto custom-scrollbar", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
          /* @__PURE__ */ jsx("thead", { className: "bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10 backdrop-blur-md", children: /* @__PURE__ */ jsxs("tr", { className: "text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800", children: [
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 w-48", children: "Timestamp" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 w-32", children: "Status" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: "Activity" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: "User" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: filteredLogs.length > 0 ? filteredLogs.map((log) => {
            const status = getLevelConfig(log.level);
            const StatusIcon = status.icon;
            return /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group", children: [
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm font-mono", children: [
                /* @__PURE__ */ jsx(Clock, { size: 14, className: "text-slate-300" }),
                formatDate(log.created_at)
              ] }) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsxs("span", { className: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${status.color} ${status.bg}`, children: [
                /* @__PURE__ */ jsx(StatusIcon, { size: 12 }),
                status.label
              ] }) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-700 dark:text-slate-200 mb-0.5", children: log.action }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 font-mono", children: log.description })
              ] }) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("div", { className: "w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-500 uppercase", children: log.user.charAt(0) }),
                /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-slate-600 dark:text-slate-300", children: log.user })
              ] }) })
            ] }, log.id);
          }) : /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: "5", className: "py-32 text-center", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center text-slate-400 opacity-60", children: [
            /* @__PURE__ */ jsx(Terminal, { size: 48, className: "mb-4 stroke-1" }),
            /* @__PURE__ */ jsx("p", { className: "text-lg font-medium", children: "No system logs found" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm", children: "Activities will appear here once recorded by the system." })
          ] }) }) }) })
        ] }) })
      ] })
    ] })
  ] });
}
export {
  AdminLogs as default
};

import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-D0x15wPs.js";
import { usePage, Head, router } from "@inertiajs/react";
import { Server, RefreshCw, Plus, Database, HardDrive, Activity, Save, FileCode, Clock, Shield, Mail } from "lucide-react";
import { M as MidnightNebula } from "./MidnightNebula-BQ5hjMmA.js";
import "react-dom";
import "./plans-CxabWI_P.js";
import "./runtime-DwSFgQZq.js";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "dexie";
import "@headlessui/react";
import "./Input-BO7OpFmF.js";
import "./AiIsland-Ccw9HuV0.js";
import "motion/react";
import "./ThinkingOrb-DGYTy5s1.js";
import "./terms-DwYjlWsV.js";
import "laravel-echo";
import "pusher-js";
import "driver.js";
import "./utils-H80jjgLf.js";
import "clsx";
import "tailwind-merge";
function AdminDatabase({ stats, backups }) {
  const { store } = usePage().props;
  const safeStats = stats || { size: "0 MB", tables: 0, db_name: "Loading...", driver: "-" };
  const safeBackups = backups || [];
  const [processing, setProcessing] = useState(false);
  const handleCreateBackup = () => {
    if (confirm("Are you sure you want to create a new database backup? This might take a few moments.")) {
      setProcessing(true);
      router.post(route("store.backups.store", { store_slug: store.slug }), {}, {
        onFinish: () => setProcessing(false),
        preserveScroll: true
      });
    }
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Database Center", mode: "admin", children: [
    /* @__PURE__ */ jsx(Head, { title: "Database Management" }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-[1600px] mx-auto h-full flex flex-col gap-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold text-ink flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Server, { className: "text-brand-500" }),
            "Database Operations"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted", children: "Manage backups, monitor size, and optimize performance" })
        ] }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: handleCreateBackup,
            disabled: processing,
            className: "px-6 py-3 bg-brand-600 hover:bg-brand-500 disabled:bg-sunken disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all active:scale-95",
            children: [
              processing ? /* @__PURE__ */ jsx(RefreshCw, { className: "animate-spin", size: 20 }) : /* @__PURE__ */ jsx(Plus, { size: 20 }),
              "Create New Backup"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6 shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-surface p-6 rounded-2xl border border-line shadow-sm relative overflow-hidden group", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-full -mr-16 -mt-16 transition-transform" }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 relative z-10", children: [
            /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-2xl bg-brand-100 dark:bg-brand-900/20 flex items-center justify-center text-brand-600", children: /* @__PURE__ */ jsx(Database, { size: 24 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase tracking-wider", children: "Database Name" }),
              /* @__PURE__ */ jsx("p", { className: "text-xl font-bold text-ink truncate max-w-[150px]", title: safeStats.db_name, children: safeStats.db_name })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-surface p-6 rounded-2xl border border-line shadow-sm relative overflow-hidden group", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 transition-transform" }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 relative z-10", children: [
            /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600", children: /* @__PURE__ */ jsx(HardDrive, { size: 24 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase tracking-wider", children: "Total Size" }),
              /* @__PURE__ */ jsx("p", { className: "text-xl font-bold text-ink", children: safeStats.size })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-surface p-6 rounded-2xl border border-line shadow-sm relative overflow-hidden group", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-16 -mt-16 transition-transform" }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 relative z-10", children: [
            /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center text-amber-600", children: /* @__PURE__ */ jsx(Activity, { size: 24 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase tracking-wider", children: "Total Tables" }),
              /* @__PURE__ */ jsx("p", { className: "text-xl font-bold text-ink", children: safeStats.tables })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-surface p-6 rounded-2xl border border-line shadow-sm relative overflow-hidden group", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-full -mr-16 -mt-16 transition-transform" }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 relative z-10", children: [
            /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-2xl bg-brand-100 dark:bg-brand-900/20 flex items-center justify-center text-brand-600", children: /* @__PURE__ */ jsx(Server, { size: 24 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase tracking-wider", children: "Connection" }),
              /* @__PURE__ */ jsx("p", { className: "text-xl font-bold text-ink capitalize", children: safeStats.driver })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2 bg-surface border border-line rounded-2xl shadow-sm flex flex-col overflow-hidden", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-line flex justify-between items-center", children: [
            /* @__PURE__ */ jsxs("h3", { className: "font-bold text-lg text-ink flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Save, { size: 20, className: "text-ink-muted" }),
              "Available Backups"
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "text-xs font-bold bg-sunken text-ink-muted px-3 py-1 rounded-full", children: [
              safeBackups.length,
              " Files"
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-auto custom-scrollbar", children: safeBackups.length > 0 ? /* @__PURE__ */ jsxs("table", { className: "w-full text-left", children: [
            /* @__PURE__ */ jsx("thead", { className: "bg-app sticky top-0 z-10 backdrop-blur-md", children: /* @__PURE__ */ jsxs("tr", { className: "text-xs font-bold text-ink-muted uppercase tracking-wider border-b border-line", children: [
              /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: "Filename" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: "Size" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: "Created At" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-right", children: "Actions" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-line", children: safeBackups.map((backup, i) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors group", children: [
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsx("div", { className: "p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-500", children: /* @__PURE__ */ jsx(FileCode, { size: 18 }) }),
                /* @__PURE__ */ jsx("span", { className: "font-bold text-sm text-ink-secondary dark:text-ink", children: backup.name })
              ] }) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsx("span", { className: "text-sm font-mono text-ink-muted", children: backup.size }) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-ink-muted text-sm", children: [
                /* @__PURE__ */ jsx(Clock, { size: 14 }),
                backup.date
              ] }) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx("span", { className: "px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-semibold", children: "Encrypted & Stored" }) }) })
            ] }, i)) })
          ] }) : /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center py-20 text-ink-muted opacity-60", children: [
            /* @__PURE__ */ jsx(Shield, { size: 48, className: "mb-4 stroke-1" }),
            /* @__PURE__ */ jsx("p", { className: "text-lg font-medium", children: "No backups found" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm", children: "Create your first backup to secure your data." })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-6", children: [
          /* @__PURE__ */ jsx(MidnightNebula, { className: "rounded-2xl p-6", primaryColor: "indigo", secondaryColor: "cyan", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4", children: [
            /* @__PURE__ */ jsx("div", { className: "p-3 bg-white/10 rounded-xl backdrop-blur-sm", children: /* @__PURE__ */ jsx(Shield, { className: "text-white", size: 24 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h4", { className: "font-bold text-white mb-1", children: "Data Safety" }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-brand-100 leading-relaxed opacity-90", children: "Regular backups are critical. We recommend running a backup:" }),
              /* @__PURE__ */ jsxs("ul", { className: "text-xs text-brand-100 mt-2 list-disc list-inside opacity-90", children: [
                /* @__PURE__ */ jsx("li", { children: "Before running any updates" }),
                /* @__PURE__ */ jsx("li", { children: "After significant data entry" }),
                /* @__PURE__ */ jsx("li", { children: "At least once a week" })
              ] })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxs("div", { className: "bg-surface border border-line rounded-2xl p-6 shadow-sm", children: [
            /* @__PURE__ */ jsx("h3", { className: "font-bold text-sm text-ink mb-4 uppercase tracking-wide", children: "Backup Settings" }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-3 bg-app rounded-xl", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex gap-2 items-center text-sm font-bold text-ink-secondary", children: [
                  /* @__PURE__ */ jsx(Mail, { size: 16, className: "text-ink-muted" }),
                  " Auto-Email"
                ] }),
                /* @__PURE__ */ jsx("div", { className: "px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-2xs font-bold uppercase rounded", children: "Enabled" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-3 bg-app rounded-xl", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex gap-2 items-center text-sm font-bold text-ink-secondary", children: [
                  /* @__PURE__ */ jsx(Clock, { size: 16, className: "text-ink-muted" }),
                  " Schedule"
                ] }),
                /* @__PURE__ */ jsx("span", { className: "text-xs text-ink-muted", children: "Daily @ 12:00 AM" })
              ] })
            ] })
          ] })
        ] })
      ] })
    ] })
  ] });
}
export {
  AdminDatabase as default
};

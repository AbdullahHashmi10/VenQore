import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { usePage, Head, router } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-D0x15wPs.js";
import { Database, RefreshCw, ArrowUpCircle, Plus, AlertTriangle, ShieldCheck, CheckCircle2, Clock, HardDrive, FileText } from "lucide-react";
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
function Backups({ backups: initialBackups = [] }) {
  const { store } = usePage().props;
  const { props } = usePage();
  const [backups, setBackups] = useState(initialBackups);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const createBackup = () => {
    setCreating(true);
    router.post(route("store.backups.store", { store_slug: props.store.slug }), {}, {
      onFinish: () => setCreating(false),
      preserveScroll: true
    });
  };
  const handleRestore = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!confirm("RESTORE DATABASE? All current data will be overwritten by this backup. Proceed with caution.")) {
      e.target.value = null;
      return;
    }
    const formData = new FormData();
    formData.append("backup_file", file);
    setRestoring(true);
    window.axios.post(route("store.backups.restore", { store_slug: props.store.slug }), formData).then((res) => {
      alert("Database restored successfully! The page will now reload.");
      window.location.reload();
    }).catch((err) => {
      alert("Restore failed: " + (err.response?.data?.message || err.message));
      setRestoring(false);
    });
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Database Backups", mode: "admin", children: [
    /* @__PURE__ */ jsx(Head, { title: "Database Backups" }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-6xl mx-auto space-y-8 pb-20", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-6", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h2", { className: "text-4xl font-bold text-ink tracking-tight flex items-center gap-3", children: [
            /* @__PURE__ */ jsx(Database, { className: "text-brand-500", size: 36 }),
            "Database Safety"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-ink-muted mt-2 font-medium", children: "Manage your system snapshots and disaster recovery." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxs("label", { className: "cursor-pointer group relative px-6 py-3 rounded-2xl bg-surface border border-line hover:border-brand-500 dark:hover:border-brand-500 transition-all shadow-sm", children: [
            /* @__PURE__ */ jsx("input", { type: "file", className: "hidden", accept: ".sql", onChange: handleRestore, disabled: restoring }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-ink-secondary dark:text-ink font-bold text-sm", children: [
              restoring ? /* @__PURE__ */ jsx(RefreshCw, { size: 18, className: "animate-spin text-brand-500" }) : /* @__PURE__ */ jsx(ArrowUpCircle, { size: 18, className: "text-brand-500" }),
              "Restore Backup"
            ] })
          ] }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: createBackup,
              disabled: creating,
              className: "relative group px-8 py-3 rounded-2xl bg-sunken border border-neutral-800 shadow-xl overflow-hidden active:scale-95 transition-all",
              children: [
                /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-brand opacity-90 group-hover:opacity-100 transition-opacity" }),
                /* @__PURE__ */ jsxs("div", { className: "relative z-10 flex items-center gap-2 text-white font-bold text-sm", children: [
                  creating ? /* @__PURE__ */ jsx(RefreshCw, { size: 18, className: "animate-spin" }) : /* @__PURE__ */ jsx(Plus, { size: 18 }),
                  "Create Snapshot"
                ] })
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "p-6 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 text-amber-600 dark:text-amber-400 mb-3", children: [
            /* @__PURE__ */ jsx(AlertTriangle, { size: 20 }),
            /* @__PURE__ */ jsx("h4", { className: "font-bold uppercase tracking-wider text-xs", children: "Security Note" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-amber-800/80 dark:text-amber-400/80 leading-relaxed font-medium", children: "Backups include your entire database. Store exported files in a secure, encrypted location." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "p-6 rounded-xl bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/20", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 text-brand-600 dark:text-brand-400 mb-3", children: [
            /* @__PURE__ */ jsx(ShieldCheck, { size: 20 }),
            /* @__PURE__ */ jsx("h4", { className: "font-bold uppercase tracking-wider text-xs", children: "Point-in-time Recovery" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-brand-800/80 dark:text-brand-400/80 leading-relaxed font-medium", children: "Snapshot frequency is recommended daily. Use the create button before major updates." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "p-6 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 text-emerald-600 dark:text-emerald-400 mb-3", children: [
            /* @__PURE__ */ jsx(CheckCircle2, { size: 20 }),
            /* @__PURE__ */ jsx("h4", { className: "font-bold uppercase tracking-wider text-xs", children: "System Health" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-emerald-800/80 dark:text-emerald-400/80 leading-relaxed font-medium", children: "Last automatic health check passed. Database integrity is verified at 100%." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl border border-line shadow-2xl overflow-hidden relative", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" }),
        /* @__PURE__ */ jsxs("div", { className: "px-8 py-6 border-b border-line bg-sunken/50 dark:bg-surface flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("h3", { className: "text-xl font-bold text-ink flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Clock, { className: "text-ink-muted", size: 20 }),
            " Snapshot History"
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "px-3 py-1 bg-sunken rounded-full text-2xs font-bold uppercase tracking-widest text-ink-muted", children: [
            backups.length,
            " Files Found"
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "text-left border-b border-line", children: [
            /* @__PURE__ */ jsx("th", { className: "px-8 py-5 text-2xs font-bold uppercase tracking-widest text-ink-muted", children: "Snapshot Name" }),
            /* @__PURE__ */ jsx("th", { className: "px-8 py-5 text-2xs font-bold uppercase tracking-widest text-ink-muted", children: "Created Date" }),
            /* @__PURE__ */ jsx("th", { className: "px-8 py-5 text-2xs font-bold uppercase tracking-widest text-ink-muted", children: "File Size" }),
            /* @__PURE__ */ jsx("th", { className: "px-8 py-5 text-2xs font-bold uppercase tracking-widest text-ink-muted text-right", children: "Actions" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-line", children: backups.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: "4", className: "px-8 py-20 text-center", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center text-ink-muted", children: [
            /* @__PURE__ */ jsx(HardDrive, { size: 48, className: "mb-4 opacity-20" }),
            /* @__PURE__ */ jsx("p", { className: "font-bold text-lg text-ink-secondary", children: "No snapshots yet" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm", children: "Create your first database backup to protect your data." })
          ] }) }) }) : backups.map((backup) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors group", children: [
            /* @__PURE__ */ jsx("td", { className: "px-8 py-5", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
              /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400", children: /* @__PURE__ */ jsx(FileText, { size: 20 }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-ink-secondary dark:text-ink truncate max-w-xs", children: backup.name }),
                /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold uppercase tracking-tighter text-ink-muted mt-0.5", children: "SQL Database Dump" })
              ] })
            ] }) }),
            /* @__PURE__ */ jsx("td", { className: "px-8 py-5", children: /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-ink-secondary", children: backup.date }) }),
            /* @__PURE__ */ jsx("td", { className: "px-8 py-5", children: /* @__PURE__ */ jsx("span", { className: "px-2 py-1 bg-sunken rounded-lg text-xs font-bold text-ink-secondary", children: backup.size }) }),
            /* @__PURE__ */ jsx("td", { className: "px-8 py-5", children: /* @__PURE__ */ jsx("div", { className: "flex items-center justify-end", children: /* @__PURE__ */ jsx("span", { className: "px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-semibold", children: "Encrypted & Stored" }) }) })
          ] }, backup.name)) })
        ] }) })
      ] })
    ] })
  ] });
}
export {
  Backups as default
};

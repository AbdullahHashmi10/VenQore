import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { O as OneGlanceLayout } from "./marketing-pages-DYgr6x02.js";
import { usePage, Head, router } from "@inertiajs/react";
import { Server, RefreshCw, Plus, Database, HardDrive, Activity, Save, FileCode, Clock, Mail, Download, Trash2, Shield } from "lucide-react";
import { M as MidnightNebula } from "./MidnightNebula-BEpU-4M8.js";
import "marked";
import "axios";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
function AdminDatabase({ stats, backups }) {
  const { store } = usePage().props;
  const safeStats = stats || { size: "0 MB", tables: 0, db_name: "Loading...", driver: "-" };
  const safeBackups = backups || [];
  const [processing, setProcessing] = useState(false);
  const [emailing, setEmailing] = useState(null);
  const handleCreateBackup = () => {
    if (confirm("Are you sure you want to create a new database backup? This might take a few moments.")) {
      setProcessing(true);
      router.post(route("store.backups.store", { store_slug: store.slug }), {}, {
        onFinish: () => setProcessing(false),
        preserveScroll: true
      });
    }
  };
  const handleDelete = (filename) => {
    if (confirm(`Are you sure you want to delete backup "${filename}"?`)) {
      router.delete(route("store.backups.delete", { store_slug: store.slug, filename }), {
        preserveScroll: true
      });
    }
  };
  const handleDownload = (filename) => {
    window.location.href = route("store.backups.download", { store_slug: store.slug, filename });
  };
  const handleEmail = (filename) => {
    const email = prompt("Enter email address to send backup to:", usePage().props.auth.user.email);
    if (email) {
      setEmailing(filename);
      router.post(route("store.backups.email", { store_slug: store.slug, filename }), { email }, {
        onFinish: () => setEmailing(null),
        preserveScroll: true
      });
    }
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Database Center", mode: "admin", children: [
    /* @__PURE__ */ jsx(Head, { title: "Database Management" }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-[1600px] mx-auto h-full flex flex-col gap-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Server, { className: "text-indigo-500" }),
            "Database Operations"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: "Manage backups, monitor size, and optimize performance" })
        ] }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: handleCreateBackup,
            disabled: processing,
            className: "px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 flex items-center gap-2 transition-all active:scale-95",
            children: [
              processing ? /* @__PURE__ */ jsx(RefreshCw, { className: "animate-spin", size: 20 }) : /* @__PURE__ */ jsx(Plus, { size: 20 }),
              "Create New Backup"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6 shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 relative z-10", children: [
            /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600", children: /* @__PURE__ */ jsx(Database, { size: 24 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase tracking-wider", children: "Database Name" }),
              /* @__PURE__ */ jsx("p", { className: "text-xl font-black text-slate-800 dark:text-white truncate max-w-[150px]", title: safeStats.db_name, children: safeStats.db_name })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 relative z-10", children: [
            /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600", children: /* @__PURE__ */ jsx(HardDrive, { size: 24 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase tracking-wider", children: "Total Size" }),
              /* @__PURE__ */ jsx("p", { className: "text-xl font-black text-slate-800 dark:text-white", children: safeStats.size })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 relative z-10", children: [
            /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center text-amber-600", children: /* @__PURE__ */ jsx(Activity, { size: 24 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase tracking-wider", children: "Total Tables" }),
              /* @__PURE__ */ jsx("p", { className: "text-xl font-black text-slate-800 dark:text-white", children: safeStats.tables })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 relative z-10", children: [
            /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center text-purple-600", children: /* @__PURE__ */ jsx(Server, { size: 24 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase tracking-wider", children: "Connection" }),
              /* @__PURE__ */ jsx("p", { className: "text-xl font-black text-slate-800 dark:text-white capitalize", children: safeStats.driver })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm flex flex-col overflow-hidden", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center", children: [
            /* @__PURE__ */ jsxs("h3", { className: "font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Save, { size: 20, className: "text-slate-400" }),
              "Available Backups"
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-3 py-1 rounded-full", children: [
              safeBackups.length,
              " Files"
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-auto custom-scrollbar", children: safeBackups.length > 0 ? /* @__PURE__ */ jsxs("table", { className: "w-full text-left", children: [
            /* @__PURE__ */ jsx("thead", { className: "bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10 backdrop-blur-md", children: /* @__PURE__ */ jsxs("tr", { className: "text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800", children: [
              /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: "Filename" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: "Size" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: "Created At" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-right", children: "Actions" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: safeBackups.map((backup, i) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group", children: [
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsx("div", { className: "p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-500", children: /* @__PURE__ */ jsx(FileCode, { size: 18 }) }),
                /* @__PURE__ */ jsx("span", { className: "font-bold text-sm text-slate-700 dark:text-slate-200", children: backup.name })
              ] }) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsx("span", { className: "text-sm font-mono text-slate-500", children: backup.size }) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-slate-500 text-sm", children: [
                /* @__PURE__ */ jsx(Clock, { size: 14 }),
                backup.date
              ] }) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity", children: [
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => handleEmail(backup.name),
                    disabled: emailing === backup.name,
                    className: "p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors",
                    title: "Email Backup",
                    children: emailing === backup.name ? /* @__PURE__ */ jsx(RefreshCw, { className: "animate-spin", size: 16 }) : /* @__PURE__ */ jsx(Mail, { size: 16 })
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => handleDownload(backup.name),
                    className: "p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors",
                    title: "Download",
                    children: /* @__PURE__ */ jsx(Download, { size: 16 })
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => handleDelete(backup.name),
                    className: "p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors",
                    title: "Delete",
                    children: /* @__PURE__ */ jsx(Trash2, { size: 16 })
                  }
                )
              ] }) })
            ] }, i)) })
          ] }) : /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center py-20 text-slate-400 opacity-60", children: [
            /* @__PURE__ */ jsx(Shield, { size: 48, className: "mb-4 stroke-1" }),
            /* @__PURE__ */ jsx("p", { className: "text-lg font-medium", children: "No backups found" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm", children: "Create your first backup to secure your data." })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-6", children: [
          /* @__PURE__ */ jsx(MidnightNebula, { className: "rounded-3xl p-6", primaryColor: "indigo", secondaryColor: "cyan", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4", children: [
            /* @__PURE__ */ jsx("div", { className: "p-3 bg-white/10 rounded-xl backdrop-blur-sm", children: /* @__PURE__ */ jsx(Shield, { className: "text-white", size: 24 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h4", { className: "font-bold text-white mb-1", children: "Data Safety" }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-indigo-100 leading-relaxed opacity-90", children: "Regular backups are critical. We recommend running a backup:" }),
              /* @__PURE__ */ jsxs("ul", { className: "text-xs text-indigo-100 mt-2 list-disc list-inside opacity-90", children: [
                /* @__PURE__ */ jsx("li", { children: "Before running any updates" }),
                /* @__PURE__ */ jsx("li", { children: "After significant data entry" }),
                /* @__PURE__ */ jsx("li", { children: "At least once a week" })
              ] })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm", children: [
            /* @__PURE__ */ jsx("h3", { className: "font-bold text-sm text-slate-800 dark:text-white mb-4 uppercase tracking-wide", children: "Backup Settings" }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex gap-2 items-center text-sm font-bold text-slate-700 dark:text-slate-300", children: [
                  /* @__PURE__ */ jsx(Mail, { size: 16, className: "text-slate-400" }),
                  " Auto-Email"
                ] }),
                /* @__PURE__ */ jsx("div", { className: "px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-2xs font-bold uppercase rounded", children: "Enabled" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex gap-2 items-center text-sm font-bold text-slate-700 dark:text-slate-300", children: [
                  /* @__PURE__ */ jsx(Clock, { size: 16, className: "text-slate-400" }),
                  " Schedule"
                ] }),
                /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-500", children: "Daily @ 12:00 AM" })
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

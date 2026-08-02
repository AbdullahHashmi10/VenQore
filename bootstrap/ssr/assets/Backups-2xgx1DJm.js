import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { usePage, Head, router } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./marketing-pages-DYgr6x02.js";
import { Database, RefreshCw, ArrowUpCircle, Plus, AlertTriangle, ShieldCheck, CheckCircle2, Clock, HardDrive, FileText, Download, Mail, Trash2 } from "lucide-react";
import "marked";
import "axios";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
function Backups({ backups: initialBackups = [] }) {
  const { store } = usePage().props;
  const { props } = usePage();
  const [backups, setBackups] = useState(initialBackups);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [mailing, setMailing] = useState(null);
  const createBackup = () => {
    setCreating(true);
    router.post(route("store.backups.store", { store_slug: props.store.slug }), {}, {
      onFinish: () => setCreating(false),
      preserveScroll: true
    });
  };
  const deleteBackup = (filename) => {
    if (!confirm("Are you sure you want to delete this backup? This cannot be undone.")) return;
    setDeleting(filename);
    router.delete(route("store.backups.delete", { store_slug: props.store.slug, filename }), {
      onFinish: () => setDeleting(null),
      preserveScroll: true
    });
  };
  const emailBackup = (filename) => {
    setMailing(filename);
    router.post(route("store.backups.email", { store_slug: props.store.slug, filename }), {}, {
      onFinish: () => setMailing(null),
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
          /* @__PURE__ */ jsxs("h2", { className: "text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3", children: [
            /* @__PURE__ */ jsx(Database, { className: "text-indigo-500", size: 36 }),
            "Database Safety"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-slate-500 dark:text-slate-400 mt-2 font-medium", children: "Manage your system snapshots and disaster recovery." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxs("label", { className: "cursor-pointer group relative px-6 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all shadow-sm", children: [
            /* @__PURE__ */ jsx("input", { type: "file", className: "hidden", accept: ".sql", onChange: handleRestore, disabled: restoring }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-slate-700 dark:text-slate-200 font-bold text-sm", children: [
              restoring ? /* @__PURE__ */ jsx(RefreshCw, { size: 18, className: "animate-spin text-indigo-500" }) : /* @__PURE__ */ jsx(ArrowUpCircle, { size: 18, className: "text-indigo-500" }),
              "Restore Backup"
            ] })
          ] }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: createBackup,
              disabled: creating,
              className: "relative group px-8 py-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden active:scale-95 transition-all",
              children: [
                /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-indigo-600 to-violet-700 opacity-90 group-hover:opacity-100 transition-opacity" }),
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
        /* @__PURE__ */ jsxs("div", { className: "p-6 rounded-[2rem] bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 text-amber-600 dark:text-amber-400 mb-3", children: [
            /* @__PURE__ */ jsx(AlertTriangle, { size: 20 }),
            /* @__PURE__ */ jsx("h4", { className: "font-bold uppercase tracking-wider text-xs", children: "Security Note" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-amber-800/80 dark:text-amber-400/80 leading-relaxed font-medium", children: "Backups include your entire database. Store exported files in a secure, encrypted location." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "p-6 rounded-[2rem] bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 text-indigo-600 dark:text-indigo-400 mb-3", children: [
            /* @__PURE__ */ jsx(ShieldCheck, { size: 20 }),
            /* @__PURE__ */ jsx("h4", { className: "font-bold uppercase tracking-wider text-xs", children: "Point-in-time Recovery" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-indigo-800/80 dark:text-indigo-400/80 leading-relaxed font-medium", children: "Snapshot frequency is recommended daily. Use the create button before major updates." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "p-6 rounded-[2rem] bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 text-emerald-600 dark:text-emerald-400 mb-3", children: [
            /* @__PURE__ */ jsx(CheckCircle2, { size: 20 }),
            /* @__PURE__ */ jsx("h4", { className: "font-bold uppercase tracking-wider text-xs", children: "System Health" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-emerald-800/80 dark:text-emerald-400/80 leading-relaxed font-medium", children: "Last automatic health check passed. Database integrity is verified at 100%." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden relative", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" }),
        /* @__PURE__ */ jsxs("div", { className: "px-8 py-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("h3", { className: "text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Clock, { className: "text-slate-400", size: 20 }),
            " Snapshot History"
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "px-3 py-1 bg-slate-200 dark:bg-slate-700 rounded-full text-2xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400", children: [
            backups.length,
            " Files Found"
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "text-left border-b border-slate-100 dark:border-slate-800", children: [
            /* @__PURE__ */ jsx("th", { className: "px-8 py-5 text-2xs font-black uppercase tracking-widest text-slate-400", children: "Snapshot Name" }),
            /* @__PURE__ */ jsx("th", { className: "px-8 py-5 text-2xs font-black uppercase tracking-widest text-slate-400", children: "Created Date" }),
            /* @__PURE__ */ jsx("th", { className: "px-8 py-5 text-2xs font-black uppercase tracking-widest text-slate-400", children: "File Size" }),
            /* @__PURE__ */ jsx("th", { className: "px-8 py-5 text-2xs font-black uppercase tracking-widest text-slate-400 text-right", children: "Actions" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-50 dark:divide-slate-800/50", children: backups.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: "4", className: "px-8 py-20 text-center", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center text-slate-400", children: [
            /* @__PURE__ */ jsx(HardDrive, { size: 48, className: "mb-4 opacity-20" }),
            /* @__PURE__ */ jsx("p", { className: "font-bold text-lg text-slate-600 dark:text-slate-400", children: "No snapshots yet" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm", children: "Create your first database backup to protect your data." })
          ] }) }) }) : backups.map((backup) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group", children: [
            /* @__PURE__ */ jsx("td", { className: "px-8 py-5", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
              /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400", children: /* @__PURE__ */ jsx(FileText, { size: 20 }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-700 dark:text-slate-200 truncate max-w-xs", children: backup.name }),
                /* @__PURE__ */ jsx("p", { className: "text-2xs font-black uppercase tracking-tighter text-slate-400 mt-0.5", children: "SQL Database Dump" })
              ] })
            ] }) }),
            /* @__PURE__ */ jsx("td", { className: "px-8 py-5", children: /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-slate-600 dark:text-slate-400", children: backup.date }) }),
            /* @__PURE__ */ jsx("td", { className: "px-8 py-5", children: /* @__PURE__ */ jsx("span", { className: "px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300", children: backup.size }) }),
            /* @__PURE__ */ jsx("td", { className: "px-8 py-5", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-2", children: [
              /* @__PURE__ */ jsx(
                "a",
                {
                  href: route("store.backups.download", { store_slug: props.store.slug, filename: backup.name }),
                  className: "p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-indigo-500 hover:border-indigo-500 dark:hover:text-indigo-400 dark:hover:border-indigo-500 transition-all",
                  title: "Download SQL",
                  children: /* @__PURE__ */ jsx(Download, { size: 18 })
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => emailBackup(backup.name),
                  disabled: mailing === backup.name,
                  className: "p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-emerald-500 hover:border-emerald-500 dark:hover:text-emerald-400 dark:hover:border-emerald-500 transition-all disabled:opacity-50",
                  title: "Email Backup",
                  children: mailing === backup.name ? /* @__PURE__ */ jsx(RefreshCw, { size: 18, className: "animate-spin" }) : /* @__PURE__ */ jsx(Mail, { size: 18 })
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => deleteBackup(backup.name),
                  disabled: deleting === backup.name,
                  className: "p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-red-500 hover:border-red-500 dark:hover:text-red-400 dark:hover:border-red-500 transition-all disabled:opacity-50",
                  title: "Delete permanently",
                  children: deleting === backup.name ? /* @__PURE__ */ jsx(RefreshCw, { size: 18, className: "animate-spin" }) : /* @__PURE__ */ jsx(Trash2, { size: 18 })
                }
              )
            ] }) })
          ] }, backup.name)) })
        ] }) })
      ] })
    ] })
  ] });
}
export {
  Backups as default
};

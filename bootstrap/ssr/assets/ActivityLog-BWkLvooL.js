import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import { Head } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-C-94hBqK.js";
import { P as PageHeader } from "./PageHeader-CyOCUwIe.js";
import { History, Trash2, RefreshCw, FileText, Clock, User } from "lucide-react";
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
function ActivityLog({ logs }) {
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Activity Log", children: [
    /* @__PURE__ */ jsx(Head, { title: "Activity Log" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full gap-6 p-6 overflow-hidden", children: [
      /* @__PURE__ */ jsx(
        PageHeader,
        {
          title: "Activity Log",
          subtitle: "Track changes and important events",
          icon: History,
          breadcrumbs: [
            { label: "Activity Log" }
          ]
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "overflow-y-auto flex-1", children: /* @__PURE__ */ jsx("div", { className: "space-y-4", children: logs.data.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700", children: [
        /* @__PURE__ */ jsx(History, { size: 48, className: "mx-auto text-slate-300 dark:text-slate-600 mb-3" }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-500 dark:text-slate-400 font-medium", children: "No activity recorded yet" })
      ] }) : logs.data.map((log) => /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start gap-4", children: [
        /* @__PURE__ */ jsx("div", { className: `p-2 rounded-lg mt-1 ${log.action === "delete" || log.action === "force_delete" ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" : log.action === "restore" ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"}`, children: log.action === "delete" || log.action === "force_delete" ? /* @__PURE__ */ jsx(Trash2, { size: 18 }) : log.action === "restore" ? /* @__PURE__ */ jsx(RefreshCw, { size: 18 }) : /* @__PURE__ */ jsx(FileText, { size: 18 }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start", children: [
            /* @__PURE__ */ jsx("h3", { className: "font-bold text-slate-900 dark:text-white", children: log.description }),
            /* @__PURE__ */ jsxs("span", { className: "text-xs font-medium text-slate-400 flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(Clock, { size: 12 }),
              new Date(log.created_at).toLocaleString()
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-1 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400", children: [
            /* @__PURE__ */ jsx(User, { size: 14 }),
            /* @__PURE__ */ jsx("span", { children: log.user?.name || "Unknown User" }),
            /* @__PURE__ */ jsx("span", { className: "px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-xs font-mono uppercase", children: log.action })
          ] })
        ] })
      ] }, log.id)) }) })
    ] })
  ] });
}
export {
  ActivityLog as default
};

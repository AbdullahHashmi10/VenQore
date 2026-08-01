import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-KMWHwZqK.js";
import { usePage, Head, Link } from "@inertiajs/react";
import { ArrowLeft, User, Calendar, AlertTriangle } from "lucide-react";
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
function Show({ staffMember, attendanceHistory }) {
  const { store } = usePage().props;
  const formatTime = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: `Attendance: ${staffMember.name}`, activeMenu: "Staff Attendance", mode: "admin", children: [
    /* @__PURE__ */ jsx(Head, { title: `Attendance - ${staffMember.name}` }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-5xl mx-auto space-y-6 p-4", children: [
      /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsx(Link, { href: route("store.staff-attendance.index", { store_slug: store.slug }), className: "p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 transition-colors", children: /* @__PURE__ */ jsx(ArrowLeft, { size: 20 }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(User, { className: "text-indigo-600" }),
            staffMember.name
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-slate-500 dark:text-slate-400 font-medium", children: [
            staffMember.role || "Staff Member",
            " • ",
            staffMember.email
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden", children: [
        /* @__PURE__ */ jsx("div", { className: "px-6 py-4 border-b border-slate-100 dark:border-slate-800", children: /* @__PURE__ */ jsx("h3", { className: "font-bold text-lg text-slate-800 dark:text-white", children: "Attendance History" }) }),
        /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
          /* @__PURE__ */ jsx("thead", { className: "bg-slate-50 dark:bg-slate-800/50", children: /* @__PURE__ */ jsxs("tr", { className: "text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider", children: [
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: "Date" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-center", children: "Status" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-center", children: "Check In" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-center", children: "Check Out" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-center", children: "Hours" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-center", children: "Gaps" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: attendanceHistory.data.length > 0 ? attendanceHistory.data.map((record) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors", children: [
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 font-medium text-slate-800 dark:text-slate-200", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Calendar, { size: 14, className: "text-slate-400" }),
              formatDate(record.check_in)
            ] }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-center", children: /* @__PURE__ */ jsx("span", { className: `inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase
                                                    ${record.status === "present" ? "bg-emerald-100 text-emerald-700" : record.status === "absent" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"}`, children: record.status || "Unknown" }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-center font-mono text-sm text-slate-600 dark:text-slate-400", children: formatTime(record.check_in) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-center font-mono text-sm text-slate-600 dark:text-slate-400", children: formatTime(record.check_out) }),
            /* @__PURE__ */ jsxs("td", { className: "px-6 py-4 text-center font-bold text-slate-700 dark:text-slate-300", children: [
              record.hours_worked ? parseFloat(record.hours_worked).toFixed(1) : "0.0",
              "h"
            ] }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-center", children: record.total_gap_minutes > 0 ? /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 text-amber-600 font-bold text-xs", children: [
              /* @__PURE__ */ jsx(AlertTriangle, { size: 12 }),
              record.total_gap_minutes,
              "m"
            ] }) : /* @__PURE__ */ jsx("span", { className: "text-slate-300", children: "-" }) })
          ] }, record.id)) : /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: "6", className: "px-6 py-12 text-center text-slate-400", children: "No attendance records found." }) }) })
        ] }) }),
        attendanceHistory.links.length > 3 && /* @__PURE__ */ jsx("div", { className: "px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-center", children: /* @__PURE__ */ jsx("div", { className: "flex gap-1", children: attendanceHistory.links.map((link, i) => /* @__PURE__ */ jsx(
          Link,
          {
            href: link.url,
            className: `px-3 py-1 rounded-lg text-sm font-bold ${link.active ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"} ${!link.url && "opacity-50 pointer-events-none"}`,
            children: (link.label || "").replace(/<[^>]*>/g, "").replace(/&laquo;/g, "«").replace(/&raquo;/g, "»").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ")
          },
          i
        )) }) })
      ] })
    ] })
  ] });
}
export {
  Show as default
};

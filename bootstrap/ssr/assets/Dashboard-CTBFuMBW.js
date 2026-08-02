import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import { R as ReportsLayout } from "./ReportsLayout-Dg4OWYWu.js";
import { Head } from "@inertiajs/react";
import { FileText, BarChart, Clock, PieChart, Download, ArrowRight } from "lucide-react";
import { M as MidnightNebula } from "./MidnightNebula-BEpU-4M8.js";
import "./marketing-pages-DYgr6x02.js";
import "marked";
import "axios";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
function ReportsDashboard({ stats, recentReports }) {
  const StatCard = ({ title, value, icon: Icon, color, subValue }) => /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-4", children: [
      /* @__PURE__ */ jsx("div", { className: `p-3 rounded-xl ${color} bg-opacity-10 dark:bg-opacity-20`, children: /* @__PURE__ */ jsx(Icon, { className: `w-6 h-6 ${color.replace("bg-", "text-")}` }) }),
      subValue && /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-lg", children: subValue })
    ] }),
    /* @__PURE__ */ jsx("h3", { className: "text-slate-500 dark:text-slate-400 text-sm font-medium mb-1", children: title }),
    /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-slate-800 dark:text-white group-hover:scale-105 transition-transform origin-left", children: value })
  ] });
  return /* @__PURE__ */ jsxs(ReportsLayout, { title: "Reports Dashboard", children: [
    /* @__PURE__ */ jsx(Head, { title: "Reports Dashboard" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: [
        /* @__PURE__ */ jsx(
          StatCard,
          {
            title: "Total Reports",
            value: stats.total_reports,
            icon: FileText,
            color: "bg-indigo-500"
          }
        ),
        /* @__PURE__ */ jsx(
          StatCard,
          {
            title: "Generated Today",
            value: stats.generated_today,
            icon: BarChart,
            color: "bg-emerald-500"
          }
        ),
        /* @__PURE__ */ jsx(
          StatCard,
          {
            title: "Scheduled",
            value: stats.scheduled_reports,
            icon: Clock,
            color: "bg-amber-500"
          }
        ),
        /* @__PURE__ */ jsx(
          StatCard,
          {
            title: "Archived",
            value: stats.archived_reports,
            icon: PieChart,
            color: "bg-slate-500"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center", children: [
            /* @__PURE__ */ jsxs("h3", { className: "font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(FileText, { className: "w-5 h-5 text-indigo-500" }),
              "Recent Reports"
            ] }),
            /* @__PURE__ */ jsx("button", { className: "text-sm text-indigo-600 hover:text-indigo-700 font-medium", children: "View All" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-sm", children: [
            /* @__PURE__ */ jsx("thead", { className: "bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400", children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("th", { className: "px-6 py-4 font-medium", children: "Report Name" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-4 font-medium", children: "Type" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-4 font-medium", children: "Date" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-4 font-medium text-right", children: "Status" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-4 font-medium text-right", children: "Action" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-700", children: recentReports.length > 0 ? recentReports.map((report) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors", children: [
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4 font-medium text-slate-800 dark:text-white", children: report.name }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-slate-600 dark:text-slate-300", children: report.type }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-slate-500 dark:text-slate-400", children: new Date(report.date).toLocaleDateString() }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right", children: /* @__PURE__ */ jsx("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                                        ${report.status === "Ready" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"}
                                                    `, children: report.status }) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right", children: /* @__PURE__ */ jsx("button", { className: "text-slate-400 hover:text-indigo-600 transition-colors", children: /* @__PURE__ */ jsx(Download, { size: 16 }) }) })
            ] }, report.id)) : /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: "5", className: "px-6 py-8 text-center text-slate-400", children: "No reports found." }) }) })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs(MidnightNebula, { className: "rounded-2xl p-6 shadow-xl h-full", primaryColor: "indigo", secondaryColor: "pink", children: [
          /* @__PURE__ */ jsx("h3", { className: "font-bold text-xl mb-2 text-white", children: "Generate Reports" }),
          /* @__PURE__ */ jsx("p", { className: "text-indigo-100 mb-6 text-sm", children: "Create custom reports for your business." }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxs("button", { className: "w-full flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm border border-white/10 text-white", children: [
              /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Sales Report" }),
              /* @__PURE__ */ jsx(ArrowRight, { size: 16 })
            ] }),
            /* @__PURE__ */ jsxs("button", { className: "w-full flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm border border-white/10 text-white", children: [
              /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Inventory Report" }),
              /* @__PURE__ */ jsx(ArrowRight, { size: 16 })
            ] }),
            /* @__PURE__ */ jsxs("button", { className: "w-full flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm border border-white/10 text-white", children: [
              /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Financial Statement" }),
              /* @__PURE__ */ jsx(ArrowRight, { size: 16 })
            ] })
          ] })
        ] })
      ] })
    ] })
  ] });
}
export {
  ReportsDashboard as default
};

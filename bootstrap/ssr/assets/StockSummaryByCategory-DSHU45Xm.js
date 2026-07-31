import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import React from "react";
import ReportPage from "./ReportPage-CIfs9UJy.js";
import { AlertTriangle, CheckCircle2, Info, Layers } from "lucide-react";
import { usePage } from "@inertiajs/react";
import { f as formatCurrency } from "./format-B_ph0Qec.js";
import "./ReportsLayout-CCBXGMSb.js";
import "./OneGlanceLayout-BqRkhJQJ.js";
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
import "./PageHeader-CyOCUwIe.js";
import "./FilterPanel-BxGIbnsP.js";
function OfflineWarningBanner() {
  const { terminals } = usePage().props;
  const [isBrowserOnline, setIsBrowserOnline] = React.useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  React.useEffect(() => {
    const handleStatusChange = () => {
      setIsBrowserOnline(navigator.onLine);
    };
    window.addEventListener("online", handleStatusChange);
    window.addEventListener("offline", handleStatusChange);
    return () => {
      window.removeEventListener("online", handleStatusChange);
      window.removeEventListener("offline", handleStatusChange);
    };
  }, []);
  if (!isBrowserOnline) {
    return /* @__PURE__ */ jsx("div", { className: "bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 p-4 mb-6 rounded-r shadow-sm animate-in fade-in slide-in-from-top-2", children: /* @__PURE__ */ jsxs("div", { className: "flex", children: [
      /* @__PURE__ */ jsx("div", { className: "flex-shrink-0", children: /* @__PURE__ */ jsx(AlertTriangle, { className: "h-5 w-5 text-red-500" }) }),
      /* @__PURE__ */ jsxs("div", { className: "ml-3", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-red-800 dark:text-red-200 font-bold", children: "⚠️ OFFLINE MODE: Showing Local Data Only." }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-red-700 dark:text-red-300/80 mt-1 leading-relaxed", children: [
          /* @__PURE__ */ jsx("strong", { className: "font-extrabold", children: "Data from other branches or historical archives is unavailable." }),
          /* @__PURE__ */ jsx("span", { className: "block mt-1", children: "You are currently viewing data stored on this device only. Sales made now will sync when connection returns." })
        ] })
      ] })
    ] }) });
  }
  if (!terminals || terminals.length === 0) return null;
  const terminal = terminals[0];
  const lastHeartbeat = terminal.last_heartbeat_at ? new Date(terminal.last_heartbeat_at) : null;
  const now = /* @__PURE__ */ new Date();
  const diffMinutes = lastHeartbeat ? (now.getTime() - lastHeartbeat.getTime()) / 1e3 / 60 : 999;
  const isClosed = terminal.status === "CLOSED_NORMALLY" || terminal.status === "CLOSED";
  const isStrike = terminal.status === "STRIKE";
  const isLive = diffMinutes < 2.5;
  if (!isLive && !isClosed && !isStrike) {
    return /* @__PURE__ */ jsx("div", { className: "bg-amber-50 dark:bg-amber-900/10 border-l-4 border-amber-500 p-4 mb-6 rounded-r shadow-sm animate-in fade-in slide-in-from-top-2", children: /* @__PURE__ */ jsxs("div", { className: "flex", children: [
      /* @__PURE__ */ jsx("div", { className: "flex-shrink-0", children: /* @__PURE__ */ jsx(AlertTriangle, { className: "h-5 w-5 text-amber-500" }) }),
      /* @__PURE__ */ jsxs("div", { className: "ml-3", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-amber-800 dark:text-amber-200 font-bold", children: "⚠️ WARNING: SHOP IS OFFLINE" }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-amber-700 dark:text-amber-300/80 mt-1 leading-relaxed", children: [
          "The data below is ",
          /* @__PURE__ */ jsx("strong", { className: "font-extrabold", children: "outdated" }),
          " (Last seen: ",
          Math.floor(diffMinutes),
          " mins ago). The shop may have made transactions that are not reflected here yet.",
          /* @__PURE__ */ jsx("span", { className: "block mt-1 font-medium", children: "Please proceed with caution when making inventory decisions." })
        ] })
      ] })
    ] }) });
  }
  if (isClosed) {
    return /* @__PURE__ */ jsx("div", { className: "bg-slate-50 dark:bg-slate-800/50 border-l-4 border-slate-400 dark:border-slate-500 p-4 mb-6 rounded-r shadow-sm", children: /* @__PURE__ */ jsxs("div", { className: "flex", children: [
      /* @__PURE__ */ jsx("div", { className: "flex-shrink-0", children: /* @__PURE__ */ jsx(CheckCircle2, { className: "h-5 w-5 text-slate-500 dark:text-slate-400" }) }),
      /* @__PURE__ */ jsxs("div", { className: "ml-3", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-700 dark:text-slate-200 font-bold", children: "Shop is Closed. Safe to edit." }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-600 dark:text-slate-400 mt-1", children: "The register was closed normally. You can safely make inventory updates or price changes. Changes will sync automatically when the shop opens." })
      ] })
    ] }) });
  }
  if (isStrike) {
    return /* @__PURE__ */ jsx("div", { className: "bg-orange-50 dark:bg-orange-900/10 border-l-4 border-orange-500 p-4 mb-6 rounded-r shadow-sm", children: /* @__PURE__ */ jsxs("div", { className: "flex", children: [
      /* @__PURE__ */ jsx("div", { className: "flex-shrink-0", children: /* @__PURE__ */ jsx(Info, { className: "h-5 w-5 text-orange-500" }) }),
      /* @__PURE__ */ jsxs("div", { className: "ml-3", children: [
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-orange-800 dark:text-orange-200 font-bold", children: [
          "Shop Closed: ",
          terminal.last_status_reason || "Strike / Emergency"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-orange-700 dark:text-orange-300/80 mt-1", children: "No active transactions are expected. Safe to review data." })
      ] })
    ] }) });
  }
  return null;
}
function StockSummaryByCategory({ categories }) {
  const { store } = usePage().props;
  const totalValue = categories.reduce((sum, cat) => sum + cat.value, 0);
  const totalProducts = categories.reduce((sum, cat) => sum + cat.products, 0);
  return /* @__PURE__ */ jsxs(
    ReportPage,
    {
      title: "Stock Summary by Category",
      subtitle: "Inventory valuation breakdown by product categories",
      icon: Layers,
      stats: /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700", children: [
          /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1", children: "Total Categories" }),
          /* @__PURE__ */ jsx("p", { className: "text-lg font-black text-slate-800 dark:text-white", children: categories.length })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700", children: [
          /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1", children: "Total Products" }),
          /* @__PURE__ */ jsx("p", { className: "text-lg font-black text-slate-800 dark:text-white", children: totalProducts })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "col-span-2 bg-indigo-600 p-4 rounded-xl shadow-lg shadow-indigo-500/20", children: [
          /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-indigo-100 uppercase tracking-widest mb-1", children: "Total Inventory Value" }),
          /* @__PURE__ */ jsx("p", { className: "text-lg font-black text-white", children: formatCurrency(totalValue) })
        ] })
      ] }),
      children: [
        /* @__PURE__ */ jsx(OfflineWarningBanner, {}),
        /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800", children: [
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider", children: "Category Name" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center", children: "Product Count" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right", children: "Total Value (Retail)" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right", children: "Value Share" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: categories.map((cat, idx) => {
            const share = totalValue > 0 ? cat.value / totalValue * 100 : 0;
            return /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors", children: [
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4 font-bold text-slate-800 dark:text-white", children: cat.name }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-center text-sm text-slate-600 dark:text-slate-400", children: cat.products }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right text-sm font-bold text-slate-800 dark:text-white", children: formatCurrency(cat.value) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-3", children: [
                /* @__PURE__ */ jsx("div", { className: "w-24 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "bg-indigo-500 h-full", style: { width: `${share}% ` } }) }),
                /* @__PURE__ */ jsxs("span", { className: "text-xs font-bold text-slate-500", children: [
                  share.toFixed(1),
                  "%"
                ] })
              ] }) })
            ] }, idx);
          }) })
        ] }) })
      ]
    }
  );
}
export {
  StockSummaryByCategory as default
};

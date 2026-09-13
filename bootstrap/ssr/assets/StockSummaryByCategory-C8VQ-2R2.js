import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import React from "react";
import ReportPage from "./ReportPage-2DW3nAtZ.js";
import { AlertTriangle, CheckCircle2, Info, Layers } from "lucide-react";
import { usePage } from "@inertiajs/react";
import { f as formatCurrency } from "./format-131Nyq79.js";
import { u as useTermText } from "./terms-DwYjlWsV.js";
import "./ReportsLayout-C08V7Mxf.js";
import "./OneGlanceLayout-D0x15wPs.js";
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
import "laravel-echo";
import "pusher-js";
import "driver.js";
import "./utils-H80jjgLf.js";
import "clsx";
import "tailwind-merge";
import "./PageHeader-qaWJfzfS.js";
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
          /* @__PURE__ */ jsx("strong", { className: "font-bold", children: "Data from other branches or historical archives is unavailable." }),
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
          /* @__PURE__ */ jsx("strong", { className: "font-bold", children: "outdated" }),
          " (Last seen: ",
          Math.floor(diffMinutes),
          " mins ago). The shop may have made transactions that are not reflected here yet.",
          /* @__PURE__ */ jsx("span", { className: "block mt-1 font-medium", children: "Please proceed with caution when making inventory decisions." })
        ] })
      ] })
    ] }) });
  }
  if (isClosed) {
    return /* @__PURE__ */ jsx("div", { className: "bg-app border-l-4 border-line-strong dark:border-line p-4 mb-6 rounded-r shadow-sm", children: /* @__PURE__ */ jsxs("div", { className: "flex", children: [
      /* @__PURE__ */ jsx("div", { className: "flex-shrink-0", children: /* @__PURE__ */ jsx(CheckCircle2, { className: "h-5 w-5 text-ink-muted" }) }),
      /* @__PURE__ */ jsxs("div", { className: "ml-3", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-secondary dark:text-ink font-bold", children: "Shop is Closed. Safe to edit." }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-secondary mt-1", children: "The register was closed normally. You can safely make inventory updates or price changes. Changes will sync automatically when the shop opens." })
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
  const tt = useTermText();
  const totalValue = categories.reduce((sum, cat) => sum + cat.value, 0);
  const totalProducts = categories.reduce((sum, cat) => sum + cat.products, 0);
  return /* @__PURE__ */ jsxs(
    ReportPage,
    {
      title: "Stock Summary by Category",
      subtitle: tt("Inventory valuation breakdown by product categories"),
      icon: Layers,
      stats: /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-surface p-4 rounded-xl border border-line", children: [
          /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold text-ink-muted uppercase tracking-widest mb-1", children: "Total Categories" }),
          /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-ink", children: categories.length })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-surface p-4 rounded-xl border border-line", children: [
          /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold text-ink-muted uppercase tracking-widest mb-1", children: tt("Total Products") }),
          /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-ink", children: totalProducts })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "col-span-2 bg-brand-600 p-4 rounded-xl shadow-lg ", children: [
          /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold text-brand-100 uppercase tracking-widest mb-1", children: "Total Inventory Value" }),
          /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-white", children: formatCurrency(totalValue) })
        ] })
      ] }),
      children: [
        /* @__PURE__ */ jsx(OfflineWarningBanner, {}),
        /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-app border-b border-line", children: [
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider", children: "Category Name" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider text-center", children: tt("Product Count") }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider text-right", children: "Total Value (Retail)" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider text-right", children: "Value Share" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-line", children: categories.map((cat, idx) => {
            const share = totalValue > 0 ? cat.value / totalValue * 100 : 0;
            return /* @__PURE__ */ jsxs("tr", { className: "hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors", children: [
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4 font-bold text-ink", children: cat.name }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-center text-sm text-ink-secondary", children: cat.products }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right text-sm font-bold text-ink", children: formatCurrency(cat.value) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-3", children: [
                /* @__PURE__ */ jsx("div", { className: "w-24 bg-sunken h-1.5 rounded-full overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "bg-brand-500 h-full", style: { width: `${share}%` } }) }),
                /* @__PURE__ */ jsxs("span", { className: "text-xs font-bold text-ink-muted", children: [
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

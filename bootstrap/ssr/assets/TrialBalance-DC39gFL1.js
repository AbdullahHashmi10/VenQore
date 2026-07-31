import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Scale, CheckCircle2, AlertTriangle, Calendar } from "lucide-react";
import { M as MasterReport } from "./MasterReport-CaoE_ZJR.js";
import { R as ReportsLayout } from "./ReportsLayout-CCBXGMSb.js";
import { usePage, Head, router } from "@inertiajs/react";
import { f as formatCurrency } from "./format-B_ph0Qec.js";
import "recharts";
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
function TrialBalance({
  accounts = [],
  totalDebits = 0,
  totalCredits = 0,
  isBalanced = true,
  asOf = ""
}) {
  const {
    store
  } = usePage().props;
  if (!store?.slug) return null;
  const [dateInput, setDateInput] = useState(asOf);
  const applyDate = () => {
    router.get(route("store.reports.trial-balance", {
      store_slug: store.slug
    }), { date: dateInput }, { preserveScroll: true });
  };
  const difference = totalDebits - totalCredits;
  const reportStats = [
    {
      label: "Total Debits",
      value: formatCurrency(totalDebits),
      icon: /* @__PURE__ */ jsx(ArrowDownLeft, { size: 18 }),
      type: "neutral"
    },
    {
      label: "Total Credits",
      value: formatCurrency(totalCredits),
      icon: /* @__PURE__ */ jsx(ArrowUpRight, { size: 18 }),
      type: "neutral"
    },
    {
      label: "Difference",
      value: formatCurrency(Math.abs(difference)),
      subValue: isBalanced ? "BALANCED ✓" : "UNBALANCED ✗",
      icon: /* @__PURE__ */ jsx(Scale, { size: 18 }),
      type: isBalanced ? "up" : "down"
    }
  ];
  const columns = [
    {
      key: "code",
      label: "Code",
      sortable: true,
      render: (row) => /* @__PURE__ */ jsx("span", { className: "font-mono text-sm text-slate-500 dark:text-slate-400", children: row.code })
    },
    {
      key: "name",
      label: "Account Name",
      sortable: true,
      render: (row) => /* @__PURE__ */ jsx("span", { className: "font-medium text-slate-900 dark:text-white", children: row.name })
    },
    {
      key: "type",
      label: "Type",
      sortable: true,
      render: (row) => /* @__PURE__ */ jsx("span", { className: "capitalize text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300", children: row.type })
    },
    {
      key: "debit",
      label: "Debit",
      align: "right",
      sortable: true,
      render: (row) => /* @__PURE__ */ jsx("span", { className: "font-bold tabular-nums text-slate-800 dark:text-slate-200", children: row.debit > 0 ? formatCurrency(row.debit) : "—" })
    },
    {
      key: "credit",
      label: "Credit",
      align: "right",
      sortable: true,
      render: (row) => /* @__PURE__ */ jsx("span", { className: "font-bold tabular-nums text-slate-800 dark:text-slate-200", children: row.credit > 0 ? formatCurrency(row.credit) : "—" })
    },
    {
      key: "net",
      label: "Net (Dr − Cr)",
      align: "right",
      sortable: true,
      render: (row) => {
        const net = row.net ?? row.debit - row.credit;
        const positive = net >= 0;
        return /* @__PURE__ */ jsxs("span", { className: `font-semibold tabular-nums ${positive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`, children: [
          positive ? "" : "−",
          formatCurrency(Math.abs(net))
        ] });
      }
    }
  ];
  const filters = [
    {
      key: "date",
      label: "As Of Date",
      type: "custom",
      render: () => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Calendar, { size: 15, className: "text-slate-400" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "date",
            value: dateInput,
            max: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
            onChange: (e) => setDateInput(e.target.value),
            onBlur: applyDate,
            onKeyDown: (e) => e.key === "Enter" && applyDate(),
            className: "border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm\r\n                                   bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200\r\n                                   focus:ring-2 focus:ring-violet-500 outline-none"
          }
        )
      ] })
    }
  ];
  return /* @__PURE__ */ jsxs(ReportsLayout, { title: "Trial Balance", children: [
    /* @__PURE__ */ jsx(Head, { title: "Trial Balance" }),
    /* @__PURE__ */ jsxs(
      "div",
      {
        className: `mb-4 flex items-center gap-3 px-4 py-3 rounded-xl border
                ${isBalanced ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300" : "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300"}`,
        children: [
          isBalanced ? /* @__PURE__ */ jsx(CheckCircle2, { size: 20, className: "shrink-0" }) : /* @__PURE__ */ jsx(AlertTriangle, { size: 20, className: "shrink-0" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "font-bold", children: isBalanced ? "Ledger is Balanced" : "LEDGER IS UNBALANCED" }),
            /* @__PURE__ */ jsx("span", { className: "ml-2 font-normal text-sm opacity-80", children: isBalanced ? `Total Debits = Total Credits = ${formatCurrency(totalDebits)} — as of ${asOf}` : `Difference of ${formatCurrency(Math.abs(difference))} between Debits and Credits — as of ${asOf}. Investigate immediately.` })
          ] })
        ]
      }
    ),
    /* @__PURE__ */ jsx(
      MasterReport,
      {
        title: "Trial Balance",
        stats: reportStats,
        columns,
        data: accounts,
        filters,
        onExport: () => alert("Export feature coming soon")
      }
    )
  ] });
}
export {
  TrialBalance as default
};

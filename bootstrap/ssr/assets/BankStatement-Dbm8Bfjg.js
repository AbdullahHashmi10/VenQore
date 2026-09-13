import { jsx, jsxs } from "react/jsx-runtime";
import "react";
import { usePage, Head, router } from "@inertiajs/react";
import { Wallet, ArrowDownLeft, ArrowUpRight, Landmark } from "lucide-react";
import { M as MasterReport } from "./MasterReport-DM-pFLtH.js";
import { R as ReportsLayout } from "./ReportsLayout-C08V7Mxf.js";
import { f as formatCurrency } from "./format-131Nyq79.js";
import "recharts";
import "./runtime-DwSFgQZq.js";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "./OneGlanceLayout-D0x15wPs.js";
import "./plans-CxabWI_P.js";
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
function BankStatement({ transactions = [], stats = {}, filters = {}, bank_accounts = [] }) {
  const {
    store
  } = usePage().props;
  const reportStats = [
    {
      label: "Opening Balance",
      value: formatCurrency(stats.opening_balance, store),
      icon: /* @__PURE__ */ jsx(Wallet, { size: 18 }),
      type: "neutral"
    },
    {
      label: "Total Deposits",
      value: formatCurrency(stats.total_deposits, store),
      icon: /* @__PURE__ */ jsx(ArrowDownLeft, { size: 18 }),
      type: "up"
    },
    {
      label: "Total Withdrawals",
      value: formatCurrency(stats.total_withdrawals, store),
      icon: /* @__PURE__ */ jsx(ArrowUpRight, { size: 18 }),
      type: "down"
    },
    {
      label: "Closing Balance",
      value: formatCurrency(stats.closing_balance, store),
      icon: /* @__PURE__ */ jsx(Landmark, { size: 18 }),
      type: "neutral"
    }
  ];
  const columns = [
    {
      key: "date",
      label: "Date",
      type: "date",
      sortable: true
    },
    {
      key: "reference",
      label: "Reference",
      render: (row) => /* @__PURE__ */ jsx("span", { className: "font-mono text-xs text-ink-muted", children: row.reference })
    },
    {
      key: "description",
      label: "Description"
    },
    {
      key: "type",
      label: "Type",
      sortable: true,
      render: (row) => /* @__PURE__ */ jsx("span", { className: `px-2 py-1 rounded-full text-xs font-medium ${row.type === "credit" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30" : "bg-red-100 text-red-600 dark:bg-red-900/30"}`, children: row.type === "credit" ? "Deposit" : "Withdrawal" })
    },
    {
      key: "amount",
      label: "Amount",
      align: "right",
      sortable: true,
      render: (row) => /* @__PURE__ */ jsx("span", { className: `font-bold ${row.type === "credit" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`, children: formatCurrency(row.amount, store) })
    },
    {
      key: "balance",
      label: "Balance",
      align: "right",
      render: (row) => /* @__PURE__ */ jsx("span", { className: "font-medium text-ink-secondary", children: formatCurrency(row.balance, store) })
    }
  ];
  const filterDefs = [
    {
      key: "bank_account_id",
      type: "select",
      label: "Bank Account",
      options: bank_accounts.map((b) => ({ value: b.id, label: `${b.bank_name} - ${b.account_number}` }))
    },
    {
      key: "start_date",
      type: "date",
      label: "Start Date"
    },
    {
      key: "end_date",
      type: "date",
      label: "End Date"
    }
  ];
  const handleFilterChange = (newValues) => {
    router.get(route("store.reports.bank-statement", {
      store_slug: store.slug
    }), newValues, { preserveState: true, replace: true });
  };
  return /* @__PURE__ */ jsxs(ReportsLayout, { title: "Bank Statement", children: [
    /* @__PURE__ */ jsx(Head, { title: "Bank Statement" }),
    /* @__PURE__ */ jsx(
      MasterReport,
      {
        title: "Bank Statement",
        stats: reportStats,
        columns,
        data: transactions,
        filters: filterDefs,
        filterValues: filters,
        onFilterChange: handleFilterChange,
        onExport: () => alert("Export feature coming soon")
      }
    )
  ] });
}
export {
  BankStatement as default
};

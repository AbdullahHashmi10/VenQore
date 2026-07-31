import { jsx, jsxs } from "react/jsx-runtime";
import "react";
import { usePage, Head, router } from "@inertiajs/react";
import { BookOpen, ArrowLeft, ArrowRight, CreditCard } from "lucide-react";
import { M as MasterReport } from "./MasterReport-CaoE_ZJR.js";
import { R as ReportsLayout } from "./ReportsLayout-CCBXGMSb.js";
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
function AccountLedger({ account, transactions = [], openingBalance = 0, filters = {}, accounts = [] }) {
  const {
    store
  } = usePage().props;
  const totalDebit = transactions.reduce((sum, t) => sum + (Number(t.debit) || 0), 0);
  const totalCredit = transactions.reduce((sum, t) => sum + (Number(t.credit) || 0), 0);
  const closingBalance = transactions.length > 0 ? transactions[transactions.length - 1].balance : openingBalance;
  const reportStats = account ? [
    {
      label: "Opening Balance",
      value: formatCurrency(openingBalance, store),
      icon: /* @__PURE__ */ jsx(BookOpen, { size: 18 }),
      type: "neutral"
    },
    {
      label: "Total Debits",
      value: formatCurrency(totalDebit, store),
      icon: /* @__PURE__ */ jsx(ArrowLeft, { size: 18 }),
      type: "neutral"
    },
    {
      label: "Total Credits",
      value: formatCurrency(totalCredit, store),
      icon: /* @__PURE__ */ jsx(ArrowRight, { size: 18 }),
      type: "neutral"
    },
    {
      label: "Closing Balance",
      value: formatCurrency(closingBalance, store),
      icon: /* @__PURE__ */ jsx(CreditCard, { size: 18 }),
      type: "neutral"
    }
  ] : [];
  const columns = [
    {
      key: "date",
      label: "Date",
      type: "date",
      render: (row) => row.type === "opening" ? /* @__PURE__ */ jsx("span", { className: "italic text-slate-400", children: filters.start_date || "-" }) : new Date(row.date).toLocaleDateString("en-PK")
    },
    {
      key: "reference",
      label: "Reference",
      render: (row) => /* @__PURE__ */ jsx("span", { className: "font-mono text-xs text-slate-500", children: row.reference || "-" })
    },
    {
      key: "description",
      label: "Description",
      render: (row) => row.type === "opening" ? /* @__PURE__ */ jsx("span", { className: "italic font-medium text-slate-500", children: "Opening Balance" }) : /* @__PURE__ */ jsx("span", { className: "text-slate-700 dark:text-slate-300", children: row.description })
    },
    {
      key: "debit",
      label: "Debit",
      align: "right",
      render: (row) => row.debit > 0 ? formatCurrency(row.debit, store) : "-"
    },
    {
      key: "credit",
      label: "Credit",
      align: "right",
      render: (row) => row.credit > 0 ? formatCurrency(row.credit, store) : "-"
    },
    {
      key: "balance",
      label: "Balance",
      align: "right",
      render: (row) => /* @__PURE__ */ jsx("span", { className: "font-bold text-slate-700 dark:text-slate-300", children: formatCurrency(row.balance, store) })
    }
  ];
  const filterDefs = [
    {
      key: "account_id",
      type: "select",
      label: "Account",
      options: accounts.map((a) => ({ value: a.id, label: `${a.code} - ${a.name}` }))
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
    router.get(route("store.reports.account-ledger", {
      store_slug: store.slug
    }), newValues, { preserveState: true, replace: true });
  };
  const reportData = account ? [
    { id: "op", type: "opening", balance: openingBalance },
    ...transactions
  ] : [];
  return /* @__PURE__ */ jsxs(ReportsLayout, { title: "Account Ledger", children: [
    /* @__PURE__ */ jsx(Head, { title: "Account Ledger" }),
    !account ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center h-[60vh] bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700", children: [
      /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mb-4", children: /* @__PURE__ */ jsx(BookOpen, { size: 32 }) }),
      /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-slate-900 dark:text-white mb-2", children: "Select an Account" }),
      /* @__PURE__ */ jsx("p", { className: "text-slate-500 mb-6 text-center max-w-md", children: "Please select an account from the filters above to view its detailed general ledger transactions." }),
      /* @__PURE__ */ jsx("div", { className: "w-64", children: /* @__PURE__ */ jsxs(
        "select",
        {
          className: "w-full rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800",
          onChange: (e) => handleFilterChange({ ...filters, account_id: e.target.value }),
          children: [
            /* @__PURE__ */ jsx("option", { value: "", children: "Select Account..." }),
            accounts.map((a) => /* @__PURE__ */ jsxs("option", { value: a.id, children: [
              a.code,
              " - ",
              a.name
            ] }, a.id))
          ]
        }
      ) })
    ] }) : /* @__PURE__ */ jsx(
      MasterReport,
      {
        title: account ? `${account.name} Ledger` : "General Ledger",
        stats: reportStats,
        columns,
        data: reportData,
        filters: filterDefs,
        filterValues: filters,
        onFilterChange: handleFilterChange,
        onExport: () => alert("Export feature coming soon")
      }
    )
  ] });
}
export {
  AccountLedger as default
};

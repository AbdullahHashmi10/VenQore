import { jsx, jsxs } from "react/jsx-runtime";
import "react";
import { usePage, Head, router } from "@inertiajs/react";
import { ArrowRight, ArrowLeft, CreditCard, Users } from "lucide-react";
import { M as MasterReport } from "./MasterReport-DW_Px1Kd.js";
import { R as ReportsLayout } from "./ReportsLayout-SZbN0U_-.js";
import { f as formatCurrency } from "./format-B_ph0Qec.js";
import "recharts";
import "./marketing-pages-CTBAvetE.js";
import "marked";
import "axios";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
function PartyStatement({ party, transactions = [], openingBalance = 0, filters = {}, parties = [] }) {
  const {
    store
  } = usePage().props;
  const totalDebit = transactions.reduce((sum, t) => sum + (Number(t.debit) || 0), 0);
  const totalCredit = transactions.reduce((sum, t) => sum + (Number(t.credit) || 0), 0);
  let closingBalance = openingBalance + totalDebit - totalCredit;
  const reportStats = party ? [
    {
      label: "Opening Balance",
      value: formatCurrency(Math.abs(openingBalance)),
      subValue: openingBalance >= 0 ? "Receivable (Dr)" : "Payable (Cr)",
      icon: /* @__PURE__ */ jsx(ArrowRight, { size: 18 }),
      type: "neutral"
    },
    {
      label: "Total Debits",
      value: formatCurrency(totalDebit),
      icon: /* @__PURE__ */ jsx(ArrowLeft, { size: 18 }),
      type: "neutral"
      // Debit isn't inherently good or bad without context
    },
    {
      label: "Total Credits",
      value: formatCurrency(totalCredit),
      icon: /* @__PURE__ */ jsx(ArrowRight, { size: 18 }),
      type: "neutral"
    },
    {
      label: "Closing Balance",
      value: formatCurrency(Math.abs(closingBalance)),
      subValue: closingBalance >= 0 ? "Receivable (Dr)" : "Payable (Cr)",
      icon: /* @__PURE__ */ jsx(CreditCard, { size: 18 }),
      type: closingBalance > 0 ? "up" : "down"
    }
  ] : [];
  let runningBalance = openingBalance;
  const dataWithBalance = transactions.map((t) => {
    runningBalance = runningBalance + (Number(t.debit) || 0) - (Number(t.credit) || 0);
    return { ...t, balance: runningBalance };
  });
  const columns = [
    {
      key: "date",
      label: "Date",
      type: "date",
      sortable: true,
      render: (row) => new Date(row.date).toLocaleDateString("en-PK")
    },
    {
      key: "type",
      label: "Type",
      render: (row) => /* @__PURE__ */ jsx("span", { className: "font-medium text-slate-700 dark:text-slate-300", children: row.type })
    },
    {
      key: "ref",
      label: "Reference",
      render: (row) => /* @__PURE__ */ jsx("span", { className: "font-mono text-xs text-slate-500", children: row.ref })
    },
    {
      key: "debit",
      label: "Debit",
      align: "right",
      render: (row) => row.debit > 0 ? /* @__PURE__ */ jsx("span", { className: "font-bold text-slate-700 dark:text-slate-300", children: formatCurrency(row.debit) }) : "-"
    },
    {
      key: "credit",
      label: "Credit",
      align: "right",
      render: (row) => row.credit > 0 ? /* @__PURE__ */ jsx("span", { className: "font-bold text-slate-700 dark:text-slate-300", children: formatCurrency(row.credit) }) : "-"
    },
    {
      key: "balance",
      label: "Balance",
      align: "right",
      render: (row) => {
        const isNegative = row.balance < 0;
        const label = isNegative ? "Cr" : "Dr";
        return /* @__PURE__ */ jsxs("span", { className: `font-bold ${isNegative ? "text-red-600" : "text-emerald-600"}`, children: [
          formatCurrency(Math.abs(row.balance)),
          " ",
          label
        ] });
      }
    }
  ];
  const filterDefs = [
    {
      key: "party_id",
      type: "select",
      label: "Select Party",
      options: parties.map((p) => ({ value: p.id, label: p.name }))
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
    router.get(route("store.reports.party-statement", {
      store_slug: store.slug
    }), newValues, { preserveState: true, replace: true });
  };
  return /* @__PURE__ */ jsxs(ReportsLayout, { title: "Party Statement", children: [
    /* @__PURE__ */ jsx(Head, { title: "Party Statement" }),
    !party ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center h-[60vh] bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700", children: [
      /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 rounded-full flex items-center justify-center mb-4", children: /* @__PURE__ */ jsx(Users, { size: 32 }) }),
      /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-slate-900 dark:text-white mb-2", children: "Select a Party" }),
      /* @__PURE__ */ jsx("p", { className: "text-slate-500 mb-6 text-center max-w-md", children: "Please select a customer or supplier from the filters above to generate their detailed ledger statement." }),
      /* @__PURE__ */ jsx("div", { className: "w-64", children: /* @__PURE__ */ jsxs(
        "select",
        {
          className: "w-full rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800",
          onChange: (e) => handleFilterChange({ ...filters, party_id: e.target.value }),
          children: [
            /* @__PURE__ */ jsx("option", { value: "", children: "Select Party..." }),
            parties.map((p) => /* @__PURE__ */ jsx("option", { value: p.id, children: p.name }, p.id))
          ]
        }
      ) })
    ] }) : /* @__PURE__ */ jsx(
      MasterReport,
      {
        title: `Statement: ${party.name}`,
        stats: reportStats,
        columns,
        data: dataWithBalance,
        filters: filterDefs,
        filterValues: filters,
        onFilterChange: handleFilterChange,
        onExport: () => alert("Export feature coming soon")
      }
    )
  ] });
}
export {
  PartyStatement as default
};

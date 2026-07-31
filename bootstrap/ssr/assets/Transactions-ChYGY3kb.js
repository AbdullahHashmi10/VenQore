import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from "react";
import { usePage, Head, router } from "@inertiajs/react";
import axios from "axios";
import { M as MasterReport } from "./MasterReport-CaoE_ZJR.js";
import { R as ReportsLayout } from "./ReportsLayout-j-C8vueA.js";
import { f as formatCurrency } from "./format-B_ph0Qec.js";
import "lucide-react";
import "recharts";
import "./OneGlanceLayout-C-94hBqK.js";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "laravel-echo";
import "pusher-js";
import "driver.js";
function TransactionsReport({ transactions = {}, filters = {} }) {
  const {
    store
  } = usePage().props;
  const [allTransactions, setAllTransactions] = useState(transactions.data || []);
  const [nextPageUrl, setNextPageUrl] = useState(transactions.next_page_url);
  const [loadingMore, setLoadingMore] = useState(false);
  useEffect(() => {
    setAllTransactions(transactions.data || []);
    setNextPageUrl(transactions.next_page_url);
  }, [transactions]);
  const loadMore = useCallback(async () => {
    if (!nextPageUrl || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await axios.get(nextPageUrl, { headers: { Accept: "application/json" } });
      setAllTransactions((prev) => {
        const existingIds = new Set(prev.map((p) => p.id + "-" + p.type));
        const uniqueNew = res.data.data.filter((p) => !existingIds.has(p.id + "-" + p.type));
        return [...prev, ...uniqueNew];
      });
      setNextPageUrl(res.data.next_page_url);
    } catch (e) {
      console.error("Failed to load more transactions", e);
    } finally {
      setLoadingMore(false);
    }
  }, [nextPageUrl, loadingMore]);
  const columns = [
    {
      key: "date",
      label: "Date",
      type: "date",
      sortable: true
    },
    {
      key: "type",
      label: "Type",
      sortable: true,
      render: (row) => /* @__PURE__ */ jsx("span", { className: "font-medium text-slate-700 dark:text-slate-300", children: row.type })
    },
    {
      key: "ref",
      // Using 'ref' or 'id'
      label: "Reference",
      render: (row) => /* @__PURE__ */ jsx("span", { className: "font-mono text-xs text-slate-500", children: row.id })
    },
    {
      key: "party",
      label: "Party",
      render: (row) => row.party || "-"
    },
    {
      key: "amount",
      label: "Amount",
      align: "right",
      sortable: true,
      render: (row) => {
        row.type === "Sale" || row.type === "Payment In";
        row.type === "Expense" || row.type === "Purchase";
        const colorClass = row.type === "Sale" || row.type === "Payment In" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-700 dark:text-slate-300";
        return /* @__PURE__ */ jsx("span", { className: `font-bold ${colorClass}`, children: formatCurrency(row.amount) });
      }
    },
    {
      key: "status",
      label: "Status",
      render: (row) => /* @__PURE__ */ jsx("span", { className: "px-2 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase", children: row.status || "-" })
    }
  ];
  const filterDefs = [
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
    // Removing Type filter for now as generic Union query complicates specific filtering unless handling in controller
  ];
  const handleFilterChange = (newValues) => {
    router.get(route("store.reports.transactions", {
      store_slug: store.slug
    }), newValues, { preserveState: true, replace: true });
  };
  return /* @__PURE__ */ jsxs(ReportsLayout, { title: "All Transactions", children: [
    /* @__PURE__ */ jsx(Head, { title: "All Transactions" }),
    /* @__PURE__ */ jsx(
      MasterReport,
      {
        title: "All Transactions",
        stats: [],
        columns,
        data: allTransactions,
        filters: filterDefs,
        filterValues: filters,
        onFilterChange: handleFilterChange,
        onExport: () => alert("Export feature coming soon"),
        enableInfiniteScroll: true,
        onLoadMore: loadMore,
        hasMore: !!nextPageUrl,
        loadingMore
      }
    )
  ] });
}
export {
  TransactionsReport as default
};

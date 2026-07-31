import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import { f as formatCurrency } from "./format-B_ph0Qec.js";
import { usePage, Head, router } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-C-94hBqK.js";
import { P as PageHeader } from "./PageHeader-CyOCUwIe.js";
import { S as StatCardGrid, a as StatCard, D as DataTable } from "./StatCard-BYl0cT52.js";
import { PauseCircle, DollarSign, Clock, Users, Play, Trash2 } from "lucide-react";
import axios from "axios";
import { S as SellModuleTabs } from "./SellModuleTabs-C4il-xpk.js";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "laravel-echo";
import "pusher-js";
import "driver.js";
import "./SmartCombobox-D6m7UWTk.js";
import "use-debounce";
function ParkedSalesIndex({ parkedSales = [], stats = {} }) {
  const { store } = usePage().props;
  const columns = [
    {
      key: "reference",
      label: "Reference",
      render: (value) => /* @__PURE__ */ jsx("span", { className: "font-mono text-sm font-semibold text-indigo-600 dark:text-indigo-400", children: value || "No Ref" })
    },
    {
      key: "created_at",
      label: "Parked At",
      render: (value) => {
        const date = new Date(value);
        return /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm", children: date.toLocaleDateString("en-PK", {
            day: "2-digit",
            month: "short"
          }) }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: date.toLocaleTimeString("en-PK", {
            hour: "2-digit",
            minute: "2-digit"
          }) })
        ] });
      }
    },
    {
      key: "customer",
      label: "Customer",
      render: (value) => /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "font-semibold text-slate-800 dark:text-white", children: value?.name || "Walk-in" }),
        value?.phone && /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: value.phone })
      ] })
    },
    {
      key: "items_count",
      label: "Items",
      render: (value) => /* @__PURE__ */ jsxs("span", { className: "px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold", children: [
        value || 0,
        " items"
      ] })
    },
    {
      key: "total",
      label: "Total",
      render: (value) => /* @__PURE__ */ jsx("span", { className: "font-bold text-slate-800 dark:text-white", children: formatCurrency(value, store) })
    },
    {
      key: "parked_by",
      label: "Parked By",
      render: (value) => /* @__PURE__ */ jsx("span", { className: "text-sm text-slate-500", children: value?.name || "Unknown" })
    },
    {
      key: "note",
      label: "Note",
      render: (value) => /* @__PURE__ */ jsx("span", { className: "text-sm text-slate-400 truncate max-w-[150px] block", children: value || "-" })
    }
  ];
  const handleRecall = (sale) => {
    router.visit(route("store.pos", { store_slug: store?.slug }) + `?recall=${sale.id}`);
  };
  const handleDelete = async (sale) => {
    if (!confirm("Are you sure you want to delete this parked sale?")) return;
    try {
      await axios.delete(route("store.parked-sales.destroy", { store_slug: store?.slug, sale: sale.id }));
      router.reload();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete parked sale");
    }
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Parked Sales", activeMenu: "Sell", children: [
    /* @__PURE__ */ jsx(Head, { title: "Parked Sales" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full", children: [
      /* @__PURE__ */ jsx(SellModuleTabs, { activeTab: "parked" }),
      /* @__PURE__ */ jsxs("div", { className: "pb-8 h-full flex flex-col gap-6 overflow-auto", children: [
        /* @__PURE__ */ jsx(
          PageHeader,
          {
            title: "Parked Sales",
            subtitle: "View and recall held transactions",
            icon: PauseCircle,
            breadcrumbs: [
              { label: "Sales" },
              { label: "Parked Sales" }
            ]
          }
        ),
        /* @__PURE__ */ jsxs(StatCardGrid, { columns: 4, children: [
          /* @__PURE__ */ jsx(
            StatCard,
            {
              title: "Total Parked",
              value: stats.total || 0,
              icon: PauseCircle,
              iconColor: "amber",
              subtitle: "Held transactions"
            }
          ),
          /* @__PURE__ */ jsx(
            StatCard,
            {
              title: "Total Value",
              value: formatCurrency(stats.total_value, store),
              icon: DollarSign,
              iconColor: "emerald",
              subtitle: "In parked sales"
            }
          ),
          /* @__PURE__ */ jsx(
            StatCard,
            {
              title: "Today's Parked",
              value: stats.today || 0,
              icon: Clock,
              iconColor: "blue",
              subtitle: "Parked today"
            }
          ),
          /* @__PURE__ */ jsx(
            StatCard,
            {
              title: "With Customers",
              value: stats.with_customer || 0,
              icon: Users,
              iconColor: "purple",
              subtitle: "Has customer info"
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex-1 min-h-0", children: /* @__PURE__ */ jsx(
          DataTable,
          {
            data: parkedSales,
            columns,
            searchable: true,
            emptyMessage: "No parked sales",
            actions: [
              {
                icon: Play,
                label: "Recall",
                onClick: handleRecall,
                className: "text-emerald-600 hover:text-emerald-700"
              },
              {
                icon: Trash2,
                label: "Delete",
                onClick: handleDelete,
                className: "text-red-600 hover:text-red-700"
              }
            ]
          }
        ) })
      ] })
    ] })
  ] });
}
export {
  ParkedSalesIndex as default
};

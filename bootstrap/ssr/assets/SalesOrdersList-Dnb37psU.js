import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { f as formatCurrency } from "./format-B_ph0Qec.js";
import { usePage, Head, router } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-C-94hBqK.js";
import { P as PageHeader } from "./PageHeader-CyOCUwIe.js";
import { S as StatCardGrid, a as StatCard, D as DataTable } from "./StatCard-BYl0cT52.js";
import { F as FilterPanel } from "./FilterPanel-BxGIbnsP.js";
import { ClipboardList, Plus, Clock, Package, CheckCircle, XCircle, Truck } from "lucide-react";
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
function SalesOrdersIndex({ orders = [], stats = {}, customers = [] }) {
  const { store } = usePage().props;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState({});
  const [formData, setFormData] = useState({
    customer_id: "",
    expected_date: "",
    notes: "",
    items: []
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const columns = [
    {
      key: "order_number",
      label: "Order #",
      render: (value) => /* @__PURE__ */ jsx("span", { className: "font-mono text-sm font-semibold text-indigo-600 dark:text-indigo-400", children: value })
    },
    {
      key: "created_at",
      label: "Date",
      render: (value) => new Date(value).toLocaleDateString("en-PK", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      })
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
      key: "status",
      label: "Status",
      render: (value) => {
        const statuses = {
          pending: { label: "Pending", color: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400", icon: Clock },
          confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400", icon: CheckCircle },
          processing: { label: "Processing", color: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400", icon: Package },
          shipped: { label: "Shipped", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400", icon: Truck },
          completed: { label: "Completed", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400", icon: CheckCircle },
          cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400", icon: XCircle }
        };
        const s = statuses[value] || statuses.pending;
        const Icon = s.icon;
        return /* @__PURE__ */ jsxs("span", { className: `px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 w-fit ${s.color}`, children: [
          /* @__PURE__ */ jsx(Icon, { size: 12 }),
          s.label
        ] });
      }
    },
    {
      key: "expected_date",
      label: "Expected",
      render: (value) => value ? new Date(value).toLocaleDateString("en-PK", {
        day: "2-digit",
        month: "short"
      }) : "-"
    },
    {
      key: "total",
      label: "Total",
      render: (value) => /* @__PURE__ */ jsx("span", { className: "font-bold text-slate-800 dark:text-white", children: formatCurrency(value, store) })
    }
  ];
  const filterDefs = [
    {
      key: "date",
      type: "dateRange",
      label: "Date Range"
    },
    {
      key: "status",
      type: "select",
      label: "Status",
      options: [
        { value: "pending", label: "Pending" },
        { value: "confirmed", label: "Confirmed" },
        { value: "processing", label: "Processing" },
        { value: "shipped", label: "Shipped" },
        { value: "completed", label: "Completed" },
        { value: "cancelled", label: "Cancelled" }
      ]
    },
    {
      key: "customer",
      type: "search",
      label: "Customer",
      placeholder: "Search customer..."
    }
  ];
  const handleView = (order) => {
    router.visit(route("store.sales.orders.show", { store_slug: store?.slug, order: order.id }));
  };
  const handleCreate = () => {
    router.visit(route("store.pre-sales.create", { store_slug: store?.slug }));
  };
  const handleConvertToSale = async (order) => {
    if (!confirm("Convert this order to a sale invoice?")) return;
    try {
      await axios.post(route("store.sales-orders.convert", { store_slug: store?.slug, salesOrder: order.id }));
      router.reload();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to convert order");
    }
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Sales Orders", activeMenu: "Sell", children: [
    /* @__PURE__ */ jsx(Head, { title: "Sales Orders" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full", children: [
      /* @__PURE__ */ jsx(SellModuleTabs, { activeTab: "orders" }),
      /* @__PURE__ */ jsxs("div", { className: "pb-8 h-full flex flex-col gap-6 overflow-auto", children: [
        /* @__PURE__ */ jsx(
          PageHeader,
          {
            title: "Sales Orders",
            subtitle: "Manage customer orders before invoicing",
            icon: ClipboardList,
            breadcrumbs: [
              { label: "Sales" },
              { label: "Orders" }
            ],
            actions: /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: handleCreate,
                className: "px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-indigo-500/25",
                children: [
                  /* @__PURE__ */ jsx(Plus, { size: 18 }),
                  "New Order"
                ]
              }
            )
          }
        ),
        /* @__PURE__ */ jsxs(StatCardGrid, { columns: 4, children: [
          /* @__PURE__ */ jsx(
            StatCard,
            {
              title: "Pending Orders",
              value: stats.pending || 0,
              icon: Clock,
              iconColor: "amber",
              subtitle: "Awaiting confirmation"
            }
          ),
          /* @__PURE__ */ jsx(
            StatCard,
            {
              title: "Processing",
              value: stats.processing || 0,
              icon: Package,
              iconColor: "purple",
              subtitle: "Being prepared"
            }
          ),
          /* @__PURE__ */ jsx(
            StatCard,
            {
              title: "This Month",
              value: formatCurrency(stats.month_total, store),
              icon: ClipboardList,
              iconColor: "blue",
              subtitle: "Order value"
            }
          ),
          /* @__PURE__ */ jsx(
            StatCard,
            {
              title: "Completed",
              value: stats.completed || 0,
              icon: CheckCircle,
              iconColor: "emerald",
              subtitle: "This month"
            }
          )
        ] }),
        /* @__PURE__ */ jsx(
          FilterPanel,
          {
            filters: filterDefs,
            values: filters,
            onChange: setFilters,
            onReset: () => setFilters({})
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "flex-1 min-h-0", children: /* @__PURE__ */ jsx(
          DataTable,
          {
            data: orders,
            columns,
            onView: handleView,
            searchable: true,
            emptyMessage: "No sales orders yet",
            actions: [
              {
                icon: CheckCircle,
                label: "Convert to Sale",
                onClick: handleConvertToSale
              }
            ]
          }
        ) })
      ] })
    ] })
  ] });
}
export {
  SalesOrdersIndex as default
};

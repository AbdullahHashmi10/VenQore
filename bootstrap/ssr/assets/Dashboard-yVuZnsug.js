import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { u as useTermText } from "./terms-DwYjlWsV.js";
function RestaurantDashboard({ storeSlug, tables = [], kitchenQueueCount = 0 }) {
  const tt = useTermText();
  const [filter, setFilter] = useState("all");
  const [loadingId, setLoadingId] = useState(null);
  const filteredTables = filter === "all" ? tables : tables.filter((t) => t.status === filter);
  const handleStatusChange = (tableId, newStatus) => {
    setLoadingId(tableId);
    router.post(
      `/${storeSlug}/restaurant/table/${tableId}/status`,
      { status: newStatus },
      {
        preserveScroll: true,
        onFinish: () => setLoadingId(null)
      }
    );
  };
  const statusBadge = (status) => {
    switch (status) {
      case "available":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      case "occupied":
        return "bg-rose-500/15 text-rose-400 border-rose-500/30";
      case "reserved":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "cleaning":
        return "bg-blue-500/15 text-blue-400 border-blue-500/30";
      default:
        return "bg-neutral-500/15 text-ink-muted border-line-strong";
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-neutral-950 text-neutral-100 p-6", children: [
    /* @__PURE__ */ jsx(Head, { title: "Restaurant Floor & Tables" }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8", children: [
      /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("span", { className: "p-2 rounded-xl bg-brand-600/20 text-brand-400 border border-brand-500/30 text-xl", children: "🍽️" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold tracking-tight text-white", children: "Restaurant Floor Management" }),
          /* @__PURE__ */ jsx("p", { className: "text-ink-muted text-sm", children: "Real-time table status, capacities, and active orders" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-3", children: /* @__PURE__ */ jsxs(
        Link,
        {
          href: `/${storeSlug}/restaurant/kitchen`,
          className: "relative px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-sm transition-all shadow-lg flex items-center gap-2",
          children: [
            /* @__PURE__ */ jsx("span", { children: "🍳 Kitchen Display System" }),
            kitchenQueueCount > 0 && /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 text-xs bg-rose-500 text-white font-bold rounded-full animate-pulse", children: kitchenQueueCount })
          ]
        }
      ) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto mb-6 flex flex-wrap gap-2", children: ["all", "available", "occupied", "reserved", "cleaning"].map((st) => /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => setFilter(st),
        className: `px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize border ${filter === st ? "bg-neutral-800 text-white border-neutral-600 shadow-sm" : "bg-neutral-900/60 text-ink-muted border-neutral-800 hover:border-line-strong hover:text-neutral-200"}`,
        children: [
          st,
          " ",
          st !== "all" && `(${tables.filter((t) => t.status === st).length})`
        ]
      },
      st
    )) }),
    /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5", children: filteredTables.map((table) => /* @__PURE__ */ jsxs(
      "div",
      {
        className: "bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 hover:border-line-strong transition-all flex flex-col justify-between shadow-xl",
        children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
              /* @__PURE__ */ jsx("span", { className: "text-lg font-bold text-white", children: table.name || `${tt("Table")} ${table.table_number}` }),
              /* @__PURE__ */ jsx("span", { className: `px-2.5 py-1 text-xs font-semibold rounded-full border capitalize ${statusBadge(table.status)}`, children: table.status })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-1.5 text-sm text-ink-muted mb-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsx("span", { children: "Capacity:" }),
                /* @__PURE__ */ jsxs("span", { className: "text-neutral-200 font-medium", children: [
                  table.capacity,
                  " Seats"
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsx("span", { children: "Current Bill:" }),
                /* @__PURE__ */ jsxs("span", { className: "text-emerald-400 font-bold", children: [
                  "$",
                  Number(table.order_total || 0).toFixed(2)
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "pt-3 border-t border-neutral-800/80", children: [
            /* @__PURE__ */ jsx("label", { className: "block text-xs font-medium text-ink-muted mb-1.5", children: "Change Status" }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                value: table.status,
                disabled: loadingId === table.id,
                onChange: (e) => handleStatusChange(table.id, e.target.value),
                className: "w-full bg-sunken border border-neutral-800 text-ink-faint text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 capitalize",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "available", children: "Available" }),
                  /* @__PURE__ */ jsx("option", { value: "occupied", children: "Occupied" }),
                  /* @__PURE__ */ jsx("option", { value: "reserved", children: "Reserved" }),
                  /* @__PURE__ */ jsx("option", { value: "cleaning", children: "Cleaning" })
                ]
              }
            )
          ] })
        ]
      },
      table.id
    )) })
  ] });
}
export {
  RestaurantDashboard as default
};

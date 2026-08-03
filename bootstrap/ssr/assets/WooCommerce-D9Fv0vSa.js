import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { Head } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./marketing-pages-CTBAvetE.js";
import { RefreshCw, CheckCircle, AlertCircle, ShoppingCart, Settings, Package, Upload, Download, Users } from "lucide-react";
import { u as useAlert } from "../ssr.js";
import "marked";
import "axios";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "dexie";
import "react-dom";
import "laravel-echo";
import "pusher-js";
function WooCommerceSyncIndex({ settings = {}, lastSync = null }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const { showAlert } = useAlert();
  const handleSync = (type) => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      showAlert({ title: "Sync Completed", message: `${type} synced successfully with WooCommerce`, type: "success" });
    }, 2e3);
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "WooCommerce Sync", activeMenu: "Marketing", children: [
    /* @__PURE__ */ jsx(Head, { title: "WooCommerce Integration" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "p-2 bg-violet-100 dark:bg-violet-900/30 rounded-xl", children: /* @__PURE__ */ jsx(RefreshCw, { className: "text-violet-600 dark:text-violet-400", size: 24 }) }),
            "WooCommerce Integration"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-slate-500 text-sm mt-1", children: "Sync products, orders, and customers with your WooCommerce store" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2", children: /* @__PURE__ */ jsxs("span", { className: `flex items-center gap-1 text-sm font-medium ${settings.connected ? "text-emerald-600" : "text-slate-400"}`, children: [
          settings.connected ? /* @__PURE__ */ jsx(CheckCircle, { size: 14 }) : /* @__PURE__ */ jsx(AlertCircle, { size: 14 }),
          settings.connected ? "Connected" : "Not Connected"
        ] }) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row items-center justify-between gap-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center", children: /* @__PURE__ */ jsx(ShoppingCart, { size: 32, className: "text-slate-400" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-slate-800 dark:text-white", children: "Store Connection" }),
            /* @__PURE__ */ jsx("p", { className: "text-slate-500 text-sm", children: settings.store_url || "No store connected" }),
            /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-400 mt-1", children: [
              "Last synced: ",
              lastSync ? new Date(lastSync).toLocaleString() : "Never"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("button", { className: "px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-bold flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Settings, { size: 18 }),
          "Configure Settings"
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 hover:border-violet-200 dark:hover:border-violet-800 transition-colors group", children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-violet-50 dark:bg-violet-900/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform", children: /* @__PURE__ */ jsx(Package, { className: "text-violet-600 dark:text-violet-400", size: 24 }) }),
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-slate-800 dark:text-white mb-2", children: "Products" }),
          /* @__PURE__ */ jsx("p", { className: "text-slate-500 text-sm mb-6", children: "Sync inventory levels, prices, and product details." }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => handleSync("Products Export"),
                disabled: isSyncing,
                className: "flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm font-medium hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-700 dark:hover:text-violet-300 transition-colors text-slate-600 dark:text-slate-400",
                children: [
                  /* @__PURE__ */ jsx("span", { children: "Export to WooCommerce" }),
                  /* @__PURE__ */ jsx(Upload, { size: 16 })
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => handleSync("Products Import"),
                disabled: isSyncing,
                className: "flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm font-medium hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-700 dark:hover:text-violet-300 transition-colors text-slate-600 dark:text-slate-400",
                children: [
                  /* @__PURE__ */ jsx("span", { children: "Import from WooCommerce" }),
                  /* @__PURE__ */ jsx(Download, { size: 16 })
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800 transition-colors group", children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform", children: /* @__PURE__ */ jsx(ShoppingCart, { className: "text-blue-600 dark:text-blue-400", size: 24 }) }),
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-slate-800 dark:text-white mb-2", children: "Orders" }),
          /* @__PURE__ */ jsx("p", { className: "text-slate-500 text-sm mb-6", children: "Import new orders and update order statuses." }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => handleSync("Orders Import"),
                disabled: isSyncing,
                className: "flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-300 transition-colors text-slate-600 dark:text-slate-400",
                children: [
                  /* @__PURE__ */ jsx("span", { children: "Import New Orders" }),
                  /* @__PURE__ */ jsx(Download, { size: 16 })
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => handleSync("Order Status Update"),
                disabled: isSyncing,
                className: "flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-300 transition-colors text-slate-600 dark:text-slate-400",
                children: [
                  /* @__PURE__ */ jsx("span", { children: "Update Statuses" }),
                  /* @__PURE__ */ jsx(RefreshCw, { size: 16 })
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors group", children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform", children: /* @__PURE__ */ jsx(Users, { className: "text-emerald-600 dark:text-emerald-400", size: 24 }) }),
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-slate-800 dark:text-white mb-2", children: "Customers" }),
          /* @__PURE__ */ jsx("p", { className: "text-slate-500 text-sm mb-6", children: "Sync customer data and loyalty points." }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => handleSync("Customers Import"),
                disabled: isSyncing,
                className: "flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm font-medium hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors text-slate-600 dark:text-slate-400",
                children: [
                  /* @__PURE__ */ jsx("span", { children: "Import Customers" }),
                  /* @__PURE__ */ jsx(Download, { size: 16 })
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => handleSync("Customers Export"),
                disabled: isSyncing,
                className: "flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm font-medium hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors text-slate-600 dark:text-slate-400",
                children: [
                  /* @__PURE__ */ jsx("span", { children: "Export Customers" }),
                  /* @__PURE__ */ jsx(Upload, { size: 16 })
                ]
              }
            )
          ] })
        ] })
      ] })
    ] })
  ] });
}
export {
  WooCommerceSyncIndex as default
};

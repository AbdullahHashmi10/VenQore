import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { Head } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-C-94hBqK.js";
import { ShoppingBag, ToggleRight, ToggleLeft, Settings, Package, Globe, ExternalLink } from "lucide-react";
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
function OnlineStoreIndex() {
  const [storeEnabled, setStoreEnabled] = useState(false);
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Online Store", activeMenu: "Marketing", children: [
    /* @__PURE__ */ jsx(Head, { title: "Online Store Management" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl", children: /* @__PURE__ */ jsx(ShoppingBag, { className: "text-indigo-600 dark:text-indigo-400", size: 24 }) }),
            "Online Store"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-slate-500 text-sm mt-1", children: "Manage your public storefront and settings" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxs("span", { className: "text-sm font-medium text-slate-600 dark:text-slate-400", children: [
            "Store Status: ",
            storeEnabled ? "Live" : "Hidden"
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setStoreEnabled(!storeEnabled),
              className: `text-3xl transition-colors ${storeEnabled ? "text-emerald-500" : "text-slate-300"}`,
              children: storeEnabled ? /* @__PURE__ */ jsx(ToggleRight, { size: 40 }) : /* @__PURE__ */ jsx(ToggleLeft, { size: 40 })
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 hover:shadow-lg transition-shadow", children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center mb-4", children: /* @__PURE__ */ jsx(Settings, { className: "text-slate-600 dark:text-slate-400", size: 24 }) }),
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-slate-800 dark:text-white mb-2", children: "Store Settings" }),
          /* @__PURE__ */ jsx("p", { className: "text-slate-500 text-sm mb-4", children: "Configure store name, logo, currency, and contact details." }),
          /* @__PURE__ */ jsx("button", { className: "px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-medium w-full", children: "Configure" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 hover:shadow-lg transition-shadow", children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center mb-4", children: /* @__PURE__ */ jsx(Package, { className: "text-indigo-600 dark:text-indigo-400", size: 24 }) }),
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-slate-800 dark:text-white mb-2", children: "Store Products" }),
          /* @__PURE__ */ jsx("p", { className: "text-slate-500 text-sm mb-4", children: "Select which products to display on your online store." }),
          /* @__PURE__ */ jsx("button", { className: "px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors font-medium w-full", children: "Manage Products" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white hover:shadow-lg hover:shadow-indigo-500/30 transition-all", children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4", children: /* @__PURE__ */ jsx(Globe, { className: "text-white", size: 24 }) }),
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold mb-2", children: "My Public Store" }),
          /* @__PURE__ */ jsx("p", { className: "text-white/80 text-sm mb-4", children: "Visit your live store as a customer sees it." }),
          /* @__PURE__ */ jsxs("a", { href: "#", className: "flex items-center justify-center gap-2 px-4 py-2 bg-white text-indigo-600 rounded-lg hover:bg-white/90 transition-colors font-bold w-full", children: [
            "Visit Store ",
            /* @__PURE__ */ jsx(ExternalLink, { size: 16 })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-slate-700 dark:text-slate-300", children: "More Features Coming Soon" }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-500 mt-2", children: "Themes, Custom Domain, and Advanced SEO tools will be available in the next update." })
      ] })
    ] })
  ] });
}
export {
  OnlineStoreIndex as default
};

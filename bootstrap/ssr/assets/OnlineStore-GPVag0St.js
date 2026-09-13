import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { Head } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-D0x15wPs.js";
import { ShoppingBag, ToggleRight, ToggleLeft, Settings, Package, Globe, ExternalLink } from "lucide-react";
import { u as useTermText } from "./terms-DwYjlWsV.js";
import "react-dom";
import "./plans-CxabWI_P.js";
import "./runtime-DwSFgQZq.js";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "dexie";
import "@headlessui/react";
import "./Input-BO7OpFmF.js";
import "./AiIsland-Ccw9HuV0.js";
import "motion/react";
import "./ThinkingOrb-DGYTy5s1.js";
import "laravel-echo";
import "pusher-js";
import "driver.js";
import "./utils-H80jjgLf.js";
import "clsx";
import "tailwind-merge";
function OnlineStoreIndex() {
  const [storeEnabled, setStoreEnabled] = useState(false);
  const tt = useTermText();
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Online Store", activeMenu: "Marketing", children: [
    /* @__PURE__ */ jsx(Head, { title: "Online Store Management" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold text-ink flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "p-2 bg-brand-100 dark:bg-brand-900/30 rounded-xl", children: /* @__PURE__ */ jsx(ShoppingBag, { className: "text-brand-600 dark:text-brand-400", size: 24 }) }),
            "Online Store"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-ink-muted text-sm mt-1", children: "Manage your public storefront and settings" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxs("span", { className: "text-sm font-medium text-ink-secondary", children: [
            "Store Status: ",
            storeEnabled ? "Live" : "Hidden"
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setStoreEnabled(!storeEnabled),
              className: `text-3xl transition-colors ${storeEnabled ? "text-emerald-500" : "text-neutral-300"}`,
              children: storeEnabled ? /* @__PURE__ */ jsx(ToggleRight, { size: 40 }) : /* @__PURE__ */ jsx(ToggleLeft, { size: 40 })
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl p-6 border border-line hover:shadow-lg transition-shadow", children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-sunken rounded-xl flex items-center justify-center mb-4", children: /* @__PURE__ */ jsx(Settings, { className: "text-ink-secondary", size: 24 }) }),
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-ink mb-2", children: "Store Settings" }),
          /* @__PURE__ */ jsx("p", { className: "text-ink-muted text-sm mb-4", children: "Configure store name, logo, currency, and contact details." }),
          /* @__PURE__ */ jsx("button", { className: "px-4 py-2 bg-sunken text-ink-secondary rounded-lg hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors font-medium w-full", children: "Configure" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl p-6 border border-line hover:shadow-lg transition-shadow", children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-brand-100 dark:bg-brand-900/30 rounded-xl flex items-center justify-center mb-4", children: /* @__PURE__ */ jsx(Package, { className: "text-brand-600 dark:text-brand-400", size: 24 }) }),
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-ink mb-2", children: tt("Store Products") }),
          /* @__PURE__ */ jsx("p", { className: "text-ink-muted text-sm mb-4", children: tt("Select which products to display on your online store.") }),
          /* @__PURE__ */ jsx("button", { className: "px-4 py-2 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-colors font-medium w-full", children: tt("Manage Products") })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-gradient-brand rounded-2xl p-6 text-white hover:shadow-lg transition-all", children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4", children: /* @__PURE__ */ jsx(Globe, { className: "text-white", size: 24 }) }),
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold mb-2", children: "My Public Store" }),
          /* @__PURE__ */ jsx("p", { className: "text-white/80 text-sm mb-4", children: "Visit your live store as a customer sees it." }),
          /* @__PURE__ */ jsxs("a", { href: "#", className: "flex items-center justify-center gap-2 px-4 py-2 bg-white text-brand-600 rounded-lg hover:bg-white/90 transition-colors font-bold w-full", children: [
            "Visit Store ",
            /* @__PURE__ */ jsx(ExternalLink, { size: 16 })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-8 bg-app rounded-2xl border border-dashed border-line dark:border-line text-center", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-ink-secondary", children: "More Features Coming Soon" }),
        /* @__PURE__ */ jsx("p", { className: "text-ink-muted mt-2", children: "Themes, Custom Domain, and Advanced SEO tools will be available in the next update." })
      ] })
    ] })
  ] });
}
export {
  OnlineStoreIndex as default
};

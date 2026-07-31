import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import "react";
import { Head } from "@inertiajs/react";
const CURRENCY_SYMBOLS = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  CAD: "CA$",
  AUD: "AU$",
  PKR: "Rs",
  INR: "₹",
  AED: "AED",
  SAR: "SAR",
  JPY: "¥"
};
function QrMenuPublic({ restaurant_name, logo_base64, theme_color = "#4f46e5", currency = "USD", categories = [] }) {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs(Head, { children: [
      /* @__PURE__ */ jsxs("title", { children: [
        restaurant_name,
        " — Menu"
      ] }),
      /* @__PURE__ */ jsx("meta", { name: "description", content: `View the menu for ${restaurant_name}.` }),
      /* @__PURE__ */ jsx("meta", { name: "robots", content: "noindex, nofollow" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-slate-50", style: { "--theme": theme_color }, children: [
      /* @__PURE__ */ jsxs(
        "header",
        {
          className: "px-5 pt-10 pb-8 text-center text-white",
          style: { background: `linear-gradient(135deg, ${theme_color}, ${theme_color}cc)` },
          children: [
            logo_base64 && /* @__PURE__ */ jsx("img", { src: logo_base64, alt: `${restaurant_name} logo`, className: "w-16 h-16 object-contain rounded-full bg-white mx-auto mb-3 p-1.5" }),
            /* @__PURE__ */ jsx("h1", { className: "text-2xl font-black tracking-tight", children: restaurant_name }),
            /* @__PURE__ */ jsx("p", { className: "text-xs uppercase tracking-widest font-bold opacity-80 mt-1", children: "Menu" })
          ]
        }
      ),
      /* @__PURE__ */ jsxs("main", { className: "max-w-lg mx-auto px-4 py-6 pb-16", children: [
        categories.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-center text-slate-400 py-16", children: "This menu doesn't have any items yet." }),
        categories.map((cat, ci) => /* @__PURE__ */ jsxs("section", { className: "mb-8", children: [
          /* @__PURE__ */ jsx(
            "h2",
            {
              className: "text-lg font-black mb-3 pb-2 border-b-2",
              style: { color: theme_color, borderColor: `${theme_color}33` },
              children: cat.name
            }
          ),
          /* @__PURE__ */ jsx("div", { className: "space-y-4", children: cat.items.map((item, ii) => /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-4 bg-white rounded-2xl p-4 shadow-sm", children: [
            /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
              /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-900 text-base leading-snug", children: item.name }),
              item.description && /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 mt-1 leading-snug", children: item.description })
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "font-black text-lg shrink-0", style: { color: theme_color }, children: [
              symbol,
              Number(item.price).toFixed(2)
            ] })
          ] }, ii)) })
        ] }, ci))
      ] }),
      /* @__PURE__ */ jsxs("footer", { className: "text-center text-[11px] text-slate-400 pb-8 px-4", children: [
        "Menu powered by ",
        /* @__PURE__ */ jsx("a", { href: "/tools/qr-menu-generator", className: "underline font-semibold", children: "VenQore" }),
        " — free QR menus for restaurants."
      ] })
    ] })
  ] });
}
export {
  QrMenuPublic as default
};

import { jsx, jsxs } from "react/jsx-runtime";
import "react";
import { Link } from "@inertiajs/react";
import { Check, ArrowRight } from "lucide-react";
function HousePromo() {
  const points = [
    "Describe your business — Blueprint proposes the system",
    "46 modules in, only the ones you use out",
    "Every document here, issued automatically from live stock",
    "One Core Ledger, so no two screens disagree on a number",
    "A photo of a bill in, a posted transaction out"
  ];
  const stats = [
    { value: "$49", label: "a month to start" },
    { value: "14", label: "day free trial" }
  ];
  return /* @__PURE__ */ jsx("aside", { className: "vq-tools-promo", "aria-label": "About VenQore", children: /* @__PURE__ */ jsxs("div", { className: "vq-card vq-tools-promo__card", children: [
    /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent", children: "From the makers of this tool" }),
    /* @__PURE__ */ jsx("h3", { className: "vq-tools-promo__title", children: "You just built one document. VenQore builds the system that issues them." }),
    /* @__PURE__ */ jsx("p", { className: "vq-tools-promo__body", children: "VenQore is the AI ERP builder. Describe your business in a sentence and it assembles a working system — till, stock, purchasing and a real double-entry ledger — from the 46 modules it ships with. No consultant, no implementation fee." }),
    /* @__PURE__ */ jsx("ul", { className: "vq-tools-promo__list", children: points.map((p) => /* @__PURE__ */ jsxs("li", { children: [
      /* @__PURE__ */ jsx(Check, { size: 15, "aria-hidden": "true" }),
      /* @__PURE__ */ jsx("span", { children: p })
    ] }, p)) }),
    /* @__PURE__ */ jsx("div", { className: "vq-tools-promo__stats", children: stats.map((s) => /* @__PURE__ */ jsxs("div", { className: "vq-tools-promo__stat", children: [
      /* @__PURE__ */ jsx("span", { className: "vq-num", children: s.value }),
      /* @__PURE__ */ jsx("span", { className: "vq-caption", children: s.label })
    ] }, s.label)) }),
    /* @__PURE__ */ jsxs("div", { className: "vq-tools-promo__actions", children: [
      /* @__PURE__ */ jsxs(Link, { href: "/build-workspace", className: "vq-btn vq-btn--primary vq-btn--block", children: [
        "Start building ",
        /* @__PURE__ */ jsx(ArrowRight, { size: 16, className: "vq-btn__arrow", "aria-hidden": "true" })
      ] }),
      /* @__PURE__ */ jsx(Link, { href: "/demo", className: "vq-btn vq-btn--ghost vq-btn--block", children: "Or try the live demo" })
    ] })
  ] }) });
}
export {
  HousePromo as default
};

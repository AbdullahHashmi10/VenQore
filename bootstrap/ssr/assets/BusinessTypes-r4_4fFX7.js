import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useId } from "react";
import { Factory, Truck, UtensilsCrossed, ShoppingBag, Briefcase, ArrowRight } from "lucide-react";
import { b as SECTORS, d as SECTOR_COUNT, B as BUSINESS_TYPE_CLAIM } from "./CookieConsent-DgIWvNoO.js";
const ICONS = { services: Briefcase, retail: ShoppingBag, food: UtensilsCrossed, wholesale: Truck, manufacturing: Factory };
function TypeGrid({ sector }) {
  return /* @__PURE__ */ jsx("ul", { className: "vq-bt__types", children: sector.types.map((t) => /* @__PURE__ */ jsxs("li", { className: "vq-bt__type", children: [
    /* @__PURE__ */ jsx("b", { children: t.name }),
    t.note && /* @__PURE__ */ jsx("span", { children: t.note })
  ] }, t.name)) });
}
function Modules({ sector }) {
  return /* @__PURE__ */ jsxs("p", { className: "vq-bt__mods", children: [
    /* @__PURE__ */ jsx("span", { children: "Unlocked by" }),
    sector.modules.map((m) => /* @__PURE__ */ jsx("code", { children: m }, m))
  ] });
}
function BusinessTypes({ variant = "tabs", id = "business-types", className = "" }) {
  const [active, setActive] = useState(SECTORS[0].key);
  const uid = useId();
  const sector = SECTORS.find((s) => s.key === active) || SECTORS[0];
  const head = /* @__PURE__ */ jsxs("div", { className: "vq-section-head vq-bt__head", children: [
    /* @__PURE__ */ jsxs("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: [
      "One engine · ",
      SECTOR_COUNT,
      " sectors"
    ] }),
    /* @__PURE__ */ jsxs("h2", { className: "vq-h2 vq-mt-4", children: [
      "Software for ",
      BUSINESS_TYPE_CLAIM,
      " kinds of business."
    ] }),
    /* @__PURE__ */ jsx("p", { className: "vq-lede vq-mt-4", children: "Repair shops and pharmacies, cafés and cement dealers, agencies and bakeries. Describe yours and VenQore assembles the system for it from the same modules and the same double-entry ledger — no custom build, no consultant." })
  ] });
  if (variant === "directory") {
    return /* @__PURE__ */ jsx("section", { id, className: `vq-section vq-bt vq-bt--directory ${className}`, children: /* @__PURE__ */ jsxs("div", { className: "vq-container", children: [
      head,
      /* @__PURE__ */ jsx("div", { className: "vq-bt__dir", children: SECTORS.map((s) => {
        const Icon = ICONS[s.key] || Briefcase;
        return /* @__PURE__ */ jsxs("article", { className: "vq-card vq-bt__sector", id: `sector-${s.key}`, children: [
          /* @__PURE__ */ jsxs("header", { className: "vq-bt__sector-head", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-bt__icon", children: /* @__PURE__ */ jsx(Icon, { size: 20, "aria-hidden": "true" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: s.name }),
              /* @__PURE__ */ jsxs("p", { className: "vq-bt__count", children: [
                s.types.length,
                " business types"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "vq-bt__pitch", children: s.pitch }),
          /* @__PURE__ */ jsx(TypeGrid, { sector: s }),
          /* @__PURE__ */ jsx(Modules, { sector: s })
        ] }, s.key);
      }) }),
      /* @__PURE__ */ jsxs("div", { className: "vq-bt__cta", children: [
        /* @__PURE__ */ jsx("p", { children: "Yours isn't listed? It is probably a mix of these." }),
        /* @__PURE__ */ jsxs("a", { className: "vq-btn vq-btn--primary vq-btn--lg", href: "/build-workspace", children: [
          "Describe your business ",
          /* @__PURE__ */ jsx(ArrowRight, { size: 16, className: "vq-btn__arrow", "aria-hidden": "true" })
        ] })
      ] })
    ] }) });
  }
  return /* @__PURE__ */ jsx("section", { id, className: `vq-section vq-bt ${className}`, children: /* @__PURE__ */ jsxs("div", { className: "vq-container", children: [
    head,
    /* @__PURE__ */ jsx("div", { className: "vq-bt__tabs", role: "tablist", "aria-label": "Sectors", children: SECTORS.map((s) => {
      const Icon = ICONS[s.key] || Briefcase;
      const on = s.key === active;
      return /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          role: "tab",
          id: `${uid}-tab-${s.key}`,
          "aria-selected": on,
          "aria-controls": `${uid}-panel`,
          className: `vq-bt__tab${on ? " is-on" : ""}`,
          onClick: () => setActive(s.key),
          children: [
            /* @__PURE__ */ jsx(Icon, { size: 18, "aria-hidden": "true" }),
            /* @__PURE__ */ jsx("span", { className: "vq-bt__tab-name", children: s.short }),
            /* @__PURE__ */ jsx("span", { className: "vq-bt__tab-n", children: s.types.length })
          ]
        },
        s.key
      );
    }) }),
    /* @__PURE__ */ jsxs("div", { className: "vq-card vq-bt__panel", role: "tabpanel", id: `${uid}-panel`, "aria-labelledby": `${uid}-tab-${sector.key}`, children: [
      /* @__PURE__ */ jsxs("div", { className: "vq-bt__panel-head", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: sector.name }),
          /* @__PURE__ */ jsx("p", { className: "vq-bt__pitch", children: sector.pitch })
        ] }),
        /* @__PURE__ */ jsxs("a", { className: "vq-link", href: `/solutions#sector-${sector.key}`, children: [
          "See all ",
          sector.types.length,
          " ",
          /* @__PURE__ */ jsx(ArrowRight, { size: 15, "aria-hidden": "true" })
        ] })
      ] }),
      /* @__PURE__ */ jsx(TypeGrid, { sector }),
      /* @__PURE__ */ jsx(Modules, { sector })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "vq-bt__cta", children: [
      /* @__PURE__ */ jsx("p", { children: "Don't see your business? Most are a mix of these." }),
      /* @__PURE__ */ jsxs("a", { className: "vq-btn vq-btn--primary vq-btn--lg", href: "/build-workspace", children: [
        "Describe yours ",
        /* @__PURE__ */ jsx(ArrowRight, { size: 16, className: "vq-btn__arrow", "aria-hidden": "true" })
      ] })
    ] })
  ] }) });
}
export {
  BusinessTypes as B
};

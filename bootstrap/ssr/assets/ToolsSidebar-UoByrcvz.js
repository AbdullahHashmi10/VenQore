import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { Link } from "@inertiajs/react";
import { X, Menu, Sparkles } from "lucide-react";
function ToolsSidebar({ groups = [], currentSlug = null }) {
  const [open, setOpen] = useState(false);
  const Item = ({ tool }) => {
    const isCurrent = tool.slug === currentSlug;
    if (tool.status !== "live" || !tool.href) {
      return /* @__PURE__ */ jsxs("div", { className: "vq-tools-nav__item vq-tools-nav__item--soon", title: "Coming soon", children: [
        /* @__PURE__ */ jsx("span", { className: "vq-tools-nav__label", children: tool.short }),
        /* @__PURE__ */ jsx("span", { className: "vq-badge vq-badge--soon", children: "Soon" })
      ] });
    }
    return /* @__PURE__ */ jsx(
      Link,
      {
        href: tool.href,
        onClick: () => setOpen(false),
        "aria-current": isCurrent ? "page" : void 0,
        className: "vq-tools-nav__item",
        children: /* @__PURE__ */ jsx("span", { className: "vq-tools-nav__label", children: tool.short })
      }
    );
  };
  const Nav = () => {
    let smartCaptureTool = null;
    const filteredGroups = groups.map((group) => {
      const sc = group.tools.find((t) => t.slug === "smart-capture");
      if (sc) {
        smartCaptureTool = sc;
      }
      return {
        ...group,
        tools: group.tools.filter((t) => t.slug !== "smart-capture")
      };
    }).filter((group) => group.tools.length > 0);
    return /* @__PURE__ */ jsxs("nav", { className: "vq-tools-nav", "aria-label": "Free tools", children: [
      smartCaptureTool && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "vq-tools-nav__group-label vq-tools-nav__group-label--accent", children: "AI feature" }),
        /* @__PURE__ */ jsxs(
          Link,
          {
            href: smartCaptureTool.href,
            onClick: () => setOpen(false),
            "aria-current": currentSlug === "smart-capture" ? "page" : void 0,
            className: "vq-tools-nav__item vq-tools-nav__item--feature",
            children: [
              /* @__PURE__ */ jsxs("span", { className: "vq-tools-nav__label", children: [
                /* @__PURE__ */ jsx(Sparkles, { size: 15, "aria-hidden": "true" }),
                smartCaptureTool.short
              ] }),
              /* @__PURE__ */ jsx("span", { className: "vq-badge vq-badge--accent", children: "Pro" })
            ]
          }
        )
      ] }),
      filteredGroups.map((group) => /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "vq-tools-nav__group-label", children: group.label }),
        /* @__PURE__ */ jsx("div", { className: "vq-tools-nav__list", children: group.tools.map((tool) => /* @__PURE__ */ jsx(Item, { tool }, tool.slug)) })
      ] }, group.key))
    ] });
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("div", { className: "vq-tools-nav__toggle", children: [
      /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: () => setOpen((v) => !v),
          "aria-expanded": open,
          className: "vq-btn vq-btn--secondary",
          style: { alignSelf: "flex-start" },
          children: [
            open ? /* @__PURE__ */ jsx(X, { size: 16 }) : /* @__PURE__ */ jsx(Menu, { size: 16 }),
            "All free tools"
          ]
        }
      ),
      open && /* @__PURE__ */ jsx("div", { className: "vq-tools-nav__drawer", children: /* @__PURE__ */ jsx(Nav, {}) })
    ] }),
    /* @__PURE__ */ jsx("aside", { className: "vq-tools-nav__rail", children: /* @__PURE__ */ jsx(Nav, {}) })
  ] });
}
export {
  ToolsSidebar as default
};

import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import { useForm, Head } from "@inertiajs/react";
import { ArrowLeft, Shield, Briefcase, User, ShoppingCart, Calculator, Eye, ArrowRight, RefreshCw } from "lucide-react";
import { S as SiteChrome } from "./SiteChrome-CBP-bGRL.js";
import "./CookieConsent-DgIWvNoO.js";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "motion/react";
function DemoLanding() {
  const { post, processing } = useForm();
  const roles = [
    { id: "owner", name: "Store Owner", icon: Shield, desc: "Full access to all features", tone: "var(--vq-accent-text)" },
    { id: "admin", name: "Store Admin", icon: Briefcase, desc: "Operations & staff management", tone: "var(--vq-accent-text)" },
    { id: "manager", name: "Manager", icon: User, desc: "Reports and floor supervision", tone: "var(--vq-info)" },
    { id: "cashier", name: "Cashier", icon: ShoppingCart, desc: "POS checkout only", tone: "var(--vq-success)" },
    { id: "accountant", name: "Accountant", icon: Calculator, desc: "Finance and journals", tone: "var(--vq-danger)" },
    { id: "viewer", name: "Viewer", icon: Eye, desc: "Read-only reports", tone: "var(--vq-text-2)" }
  ];
  const loginAs = (roleId) => {
    window.location.href = route("demo.login", { role: roleId });
  };
  return /* @__PURE__ */ jsxs(SiteChrome, { underHeader: true, children: [
    /* @__PURE__ */ jsx(Head, { title: "VenQore Live Demo" }),
    /* @__PURE__ */ jsxs("section", { className: "vq-section vq-mc-top", children: [
      /* @__PURE__ */ jsx("div", { className: "vq-amb", "aria-hidden": "true", children: /* @__PURE__ */ jsx("span", { className: "vq-amb__aurora", style: { opacity: 0.26 } }) }),
      /* @__PURE__ */ jsxs("div", { className: "vq-container", style: { position: "relative" }, children: [
        /* @__PURE__ */ jsx("div", { className: "vq-mc-back", children: /* @__PURE__ */ jsxs("a", { href: "/", className: "vq-link", children: [
          /* @__PURE__ */ jsx(ArrowLeft, { size: 16, "aria-hidden": "true" }),
          " Back to VenQore"
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "vq-mc-head", children: [
          /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "Live demo · no sign-up" }),
          /* @__PURE__ */ jsxs("h1", { className: "vq-display vq-mt-4", children: [
            "Live demo ",
            /* @__PURE__ */ jsx("em", { className: "vq-italic", children: "store." })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "vq-lede vq-mt-6", children: "A real, shared environment with sample data. No sign-up required. Choose a role below to see exactly what that staff member sees." })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("section", { className: "vq-section vq-mc-body", children: /* @__PURE__ */ jsxs("div", { className: "vq-container", children: [
      /* @__PURE__ */ jsx("div", { className: "vq-mc-rowhead", children: /* @__PURE__ */ jsx("h2", { className: "vq-h2", children: "Choose a role" }) }),
      /* @__PURE__ */ jsx("div", { className: "vq-grid vq-grid--3", children: roles.map((role) => {
        const Icon = role.icon;
        return /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => loginAs(role.id),
            disabled: processing,
            className: "vq-card vq-card--interactive vq-mc-role",
            children: [
              /* @__PURE__ */ jsx("span", { className: "vq-mc-icon", style: { "--tone": role.tone }, children: /* @__PURE__ */ jsx(Icon, { size: 22, "aria-hidden": "true" }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-mc-lcard__title", children: role.name }),
              /* @__PURE__ */ jsx("span", { className: "vq-body vq-text-2", children: role.desc }),
              /* @__PURE__ */ jsxs("span", { className: "vq-mc-lcard__cta vq-mc-role__go", children: [
                "Enter as ",
                role.name,
                " ",
                /* @__PURE__ */ jsx(ArrowRight, { size: 15, "aria-hidden": "true" })
              ] })
            ]
          },
          role.id
        );
      }) }),
      /* @__PURE__ */ jsxs("div", { className: "vq-mc-callout vq-mc-callout--warning vq-mt-12", role: "note", children: [
        /* @__PURE__ */ jsx(RefreshCw, { size: 20, "aria-hidden": "true" }),
        /* @__PURE__ */ jsx("p", { style: { color: "var(--vq-text)", maxWidth: "none" }, children: "The demo store resets automatically every 24 hours. Data is shared among all active demo visitors." })
      ] })
    ] }) })
  ] });
}
export {
  DemoLanding as default
};

import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import { useForm } from "@inertiajs/react";
import { u as useTurnstile } from "./useTurnstile-4WiJ80s8.js";
import MarketingLayout from "./MarketingLayout-cwTDSbNB.js";
import { Globe, Code, Key, Briefcase, ShieldAlert, CheckCircle2, Send } from "lucide-react";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "./CookieConsent-DgIWvNoO.js";
import "motion/react";
import "./SiteChrome-CBP-bGRL.js";
function Partners() {
  const { data, setData, post, processing, wasSuccessful, reset, errors, transform } = useForm({
    name: "",
    email: "",
    company: "",
    partnership_type: "White-Label Reseller",
    message: ""
  });
  const getTurnstileToken = useTurnstile();
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = await getTurnstileToken();
    transform((d) => ({ ...d, turnstile_token: token || "" }));
    post(route("marketing.partners.store"), {
      onSuccess: () => reset()
    });
  };
  const Tiers = [
    {
      icon: Globe,
      title: "White-Label Reseller",
      type: "Recurring Revenue Share",
      desc: "Rebrand the entire offline-first VenQore platform under your own domain name and logo. The default answer for resellers and marketing agencies who want to offer SaaS tools without hosting, security, or maintenance overhead.",
      color: "emerald"
    },
    {
      icon: Code,
      title: "Source-Code License",
      type: "Non-Exclusive Deployment",
      desc: "Acquire a full source-code license to host and deploy VenQore on your own server infrastructure. Ideal for regional hardware distributors or software operators seeking full operational independence.",
      color: "indigo"
    },
    {
      icon: Key,
      title: "Vertical/Region Exclusivity",
      type: "Exclusive IP Rights",
      desc: "Secure exclusive rights to operate VenQore POS within a specific industry vertical (e.g. Pharmacy Chains) or geographical country. Governed by a dedicated B2B distribution contract and evaluated on a six-figure model.",
      color: "violet"
    },
    {
      icon: Briefcase,
      title: "Strategic Acquisition",
      type: "Full Intellectual Property",
      desc: "Complete IP, brand, and asset acquisition. We discuss full buyout proposals only with qualified strategic buyers under revenue-multiple valuations. VenQore does not participate in code-broker or lowball source code bids.",
      color: "rose"
    }
  ];
  const toneBadge = {
    emerald: "vq-badge--success",
    indigo: "vq-badge--accent",
    violet: "vq-badge--accent",
    rose: "vq-badge--warning"
  };
  return /* @__PURE__ */ jsxs(
    MarketingLayout,
    {
      title: "B2B Partnership & Licensing Programs — VenQore",
      description: "Explore white-label reseller opportunities, non-exclusive source-code licensing, and regional exclusive partnerships for our offline-first Business OS.",
      children: [
        /* @__PURE__ */ jsx("section", { className: "vq-section vq-mkt-hero", children: /* @__PURE__ */ jsx("div", { className: "vq-container", children: /* @__PURE__ */ jsxs("div", { className: "vq-section-head vq-section-head--center", style: { marginBottom: 0 }, children: [
          /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "Licensing & partnerships" }),
          /* @__PURE__ */ jsx("h1", { className: "vq-display vq-mt-4", children: "The licensing ladder program" }),
          /* @__PURE__ */ jsx("p", { className: "vq-lede", children: "VenQore licenses its double-entry retail operating system. The company is not for sale; serious partnership and licensing conversations are welcome." })
        ] }) }) }),
        /* @__PURE__ */ jsx("section", { className: "vq-section", style: { paddingTop: 0 }, children: /* @__PURE__ */ jsxs("div", { className: "vq-container", children: [
          /* @__PURE__ */ jsx("div", { className: "vq-grid vq-grid--2", children: Tiers.map((t, idx) => {
            const Icon = t.icon;
            return /* @__PURE__ */ jsxs("article", { className: "vq-card vq-card--xl vq-tile", children: [
              /* @__PURE__ */ jsxs("div", { className: "vq-row", style: { justifyContent: "space-between", alignItems: "flex-start", gap: 12 }, children: [
                /* @__PURE__ */ jsx("span", { className: "vq-tile__icon", children: /* @__PURE__ */ jsx(Icon, { "aria-hidden": "true" }) }),
                /* @__PURE__ */ jsx("span", { className: `vq-badge ${toneBadge[t.color] || ""}`, children: t.type })
              ] }),
              /* @__PURE__ */ jsx("h2", { className: "vq-tile__title", children: t.title }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body", children: t.desc })
            ] }, idx);
          }) }),
          /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-mt-8 vq-mkt-note", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-tile__icon vq-mkt-note__icon", children: /* @__PURE__ */ jsx(ShieldAlert, { "aria-hidden": "true" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h2", { className: "vq-h3", children: "IP & technical moat integrity" }),
              /* @__PURE__ */ jsxs("p", { className: "vq-small vq-text-2 vq-mt-2", style: { lineHeight: 1.65 }, children: [
                "VenQore is governed by strict developer-owner copyrights, no third-party contested intellectual property, and contains a locked database integrity engine tested under ",
                /* @__PURE__ */ jsx("strong", { children: "eight correctness laws run on every release" }),
                ". All partnership inquiries route directly to our founding team."
              ] })
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx("section", { className: "vq-section vq-section--alt", children: /* @__PURE__ */ jsxs("div", { className: "vq-container vq-container--narrow", children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-section-head vq-section-head--center", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "Talk to the founders" }),
            /* @__PURE__ */ jsx("h2", { className: "vq-h1 vq-mt-4", children: "Partnership inquiry" }),
            /* @__PURE__ */ jsx("p", { className: "vq-lede", children: "Select your licensing tier below. Qualified inquiries receive a response within one business day from our founders." })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "vq-card vq-card--xl vq-mkt-form", children: wasSuccessful ? /* @__PURE__ */ jsxs("div", { className: "vq-center", style: { paddingBlock: "var(--vq-space-8)" }, children: [
            /* @__PURE__ */ jsx("span", { className: "vq-lead__icon vq-lead__icon--ok", children: /* @__PURE__ */ jsx(CheckCircle2, { size: 28, "aria-hidden": "true" }) }),
            /* @__PURE__ */ jsx("h3", { className: "vq-h2 vq-mt-6", children: "Inquiry submitted" }),
            /* @__PURE__ */ jsx("p", { className: "vq-body vq-text-2 vq-mt-3", style: { marginInline: "auto" }, children: "Thank you! Your partnership inquiry has been securely stored and routed to the founding team. We will review your company profile and respond shortly." })
          ] }) : /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "vq-mkt-form__grid", children: [
            /* @__PURE__ */ jsxs("div", { className: "vq-field", children: [
              /* @__PURE__ */ jsxs("label", { htmlFor: "pt-name", className: "vq-label", children: [
                "Your name ",
                /* @__PURE__ */ jsx("span", { className: "vq-accent-text", children: "*" })
              ] }),
              /* @__PURE__ */ jsx("input", { id: "pt-name", type: "text", required: true, value: data.name, onChange: (e) => setData("name", e.target.value), className: "vq-input", placeholder: "e.g. Alexander Wright" }),
              errors.name && /* @__PURE__ */ jsx("span", { className: "vq-mkt-form__error", children: errors.name })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-field", children: [
              /* @__PURE__ */ jsxs("label", { htmlFor: "pt-email", className: "vq-label", children: [
                "Business email ",
                /* @__PURE__ */ jsx("span", { className: "vq-accent-text", children: "*" })
              ] }),
              /* @__PURE__ */ jsx("input", { id: "pt-email", type: "email", required: true, value: data.email, onChange: (e) => setData("email", e.target.value), className: "vq-input", placeholder: "e.g. alex@distributor.com" }),
              errors.email && /* @__PURE__ */ jsx("span", { className: "vq-mkt-form__error", children: errors.email })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-field", children: [
              /* @__PURE__ */ jsxs("label", { htmlFor: "pt-company", className: "vq-label", children: [
                "Company name ",
                /* @__PURE__ */ jsx("span", { className: "vq-accent-text", children: "*" })
              ] }),
              /* @__PURE__ */ jsx("input", { id: "pt-company", type: "text", required: true, value: data.company, onChange: (e) => setData("company", e.target.value), className: "vq-input", placeholder: "e.g. Wright Retail Group" }),
              errors.company && /* @__PURE__ */ jsx("span", { className: "vq-mkt-form__error", children: errors.company })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-field", children: [
              /* @__PURE__ */ jsxs("label", { htmlFor: "pt-type", className: "vq-label", children: [
                "Licensing program ",
                /* @__PURE__ */ jsx("span", { className: "vq-accent-text", children: "*" })
              ] }),
              /* @__PURE__ */ jsxs("select", { id: "pt-type", value: data.partnership_type, onChange: (e) => setData("partnership_type", e.target.value), className: "vq-select", children: [
                /* @__PURE__ */ jsx("option", { children: "White-Label Reseller" }),
                /* @__PURE__ */ jsx("option", { children: "Source-Code License" }),
                /* @__PURE__ */ jsx("option", { children: "Vertical/Region Exclusivity" }),
                /* @__PURE__ */ jsx("option", { children: "Strategic Acquisition" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-field vq-mkt-form__full", children: [
              /* @__PURE__ */ jsxs("label", { htmlFor: "pt-message", className: "vq-label", children: [
                "Inquiry & use case description ",
                /* @__PURE__ */ jsx("span", { className: "vq-accent-text", children: "*" })
              ] }),
              /* @__PURE__ */ jsx("textarea", { id: "pt-message", required: true, rows: 5, value: data.message, onChange: (e) => setData("message", e.target.value), className: "vq-textarea", placeholder: "Detail your target market, operating region, and why you are interested in licensing VenQore..." }),
              errors.message && /* @__PURE__ */ jsx("span", { className: "vq-mkt-form__error", children: errors.message })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "vq-mkt-form__full vq-mkt-form__actions", children: /* @__PURE__ */ jsxs("button", { type: "submit", disabled: processing, className: "vq-btn vq-btn--primary vq-btn--lg", children: [
              processing ? "Submitting…" : "Submit inquiry",
              /* @__PURE__ */ jsx(Send, { size: 16, "aria-hidden": "true" })
            ] }) })
          ] }) })
        ] }) })
      ]
    }
  );
}
export {
  Partners as default
};

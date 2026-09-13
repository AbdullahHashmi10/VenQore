import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useForm } from "@inertiajs/react";
import MarketingLayout, { RevealOnScroll, SectionLabel, MagneticButton } from "./MarketingLayout-cwTDSbNB.js";
import { Mail, CheckCircle2, Loader2, Send } from "lucide-react";
import { u as useTurnstile } from "./useTurnstile-4WiJ80s8.js";
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
function Newsletter() {
  const getTurnstileToken = useTurnstile();
  const { data, setData, post, processing, errors, reset, wasSuccessful, transform } = useForm({
    name: "",
    email: "",
    interest: "cloud"
  });
  const [submitted, setSubmitted] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    const turnstileToken = await getTurnstileToken();
    transform((d) => turnstileToken ? { ...d, "cf-turnstile-response": turnstileToken } : d);
    post(route("marketing.newsletter.submit"), {
      onSuccess: () => {
        setSubmitted(true);
        reset();
      }
    });
  };
  const options = [
    { id: "cloud", label: "Cloud Updates", desc: "New updates on the Cloud Website" },
    { id: "digital", label: "Digital Products", desc: "Digital products only (Offline standalones)" },
    { id: "both", label: "Both channels", desc: "Get updates on both systems" }
  ];
  return /* @__PURE__ */ jsx(
    MarketingLayout,
    {
      title: "Newsletter Subscription — VenQore",
      description: "Subscribe to the VenQore Master Operation Suite newsletter to receive product updates, scaling strategies, and offline module blueprints.",
      children: /* @__PURE__ */ jsxs("section", { className: "vq-section vq-mc-top", children: [
        /* @__PURE__ */ jsx("div", { className: "vq-amb", "aria-hidden": "true", children: /* @__PURE__ */ jsx("span", { className: "vq-amb__aurora", style: { opacity: 0.22 } }) }),
        /* @__PURE__ */ jsx("div", { className: "vq-container", style: { position: "relative" }, children: /* @__PURE__ */ jsxs("div", { className: "vq-grid", style: { gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 380px), 1fr))", gap: "clamp(40px, 6vw, 88px)", alignItems: "start" }, children: [
          /* @__PURE__ */ jsx(RevealOnScroll, { children: /* @__PURE__ */ jsxs("div", { className: "vq-mc-head", children: [
            /* @__PURE__ */ jsx(SectionLabel, { icon: Mail, children: "Stay Ahead" }),
            /* @__PURE__ */ jsxs("h1", { className: "vq-display", children: [
              "Subscribe to ",
              /* @__PURE__ */ jsx("em", { className: "vq-italic", children: "VenQore Insights." })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "vq-lede vq-mt-6", children: "Get direct notifications about standalone offline releases, exclusive Etsy coupon updates, and enterprise database schemas." })
          ] }) }),
          /* @__PURE__ */ jsx(RevealOnScroll, { delay: 0.1, children: /* @__PURE__ */ jsx("div", { className: "vq-card vq-card--xl", style: { padding: "clamp(28px, 4vw, 40px)", boxShadow: "var(--vq-elev-2)" }, children: submitted ? /* @__PURE__ */ jsxs("div", { className: "vq-center", style: { paddingBlock: "var(--vq-space-8)" }, children: [
            /* @__PURE__ */ jsx("span", { className: "vq-mc-icon vq-mc-icon--lg vq-mc-icon--round", style: { "--tone": "var(--vq-success)" }, children: /* @__PURE__ */ jsx(CheckCircle2, { size: 30, "aria-hidden": "true" }) }),
            /* @__PURE__ */ jsx("h2", { className: "vq-h2 vq-mt-6", children: "Check your inbox" }),
            /* @__PURE__ */ jsx("p", { className: "vq-body vq-text-2 vq-mt-3", style: { marginInline: "auto", maxWidth: "40ch" }, children: "Click the confirmation link we sent before we add you to the newsletter." }),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setSubmitted(false),
                className: "vq-btn vq-btn--quiet vq-mt-6",
                children: "Subscribe another email"
              }
            )
          ] }) : /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, children: [
            /* @__PURE__ */ jsxs("div", { className: "vq-mc-field", children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "newsletter-name", className: "vq-mc-label", children: "Your Name" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  id: "newsletter-name",
                  type: "text",
                  value: data.name,
                  onChange: (e) => setData("name", e.target.value),
                  placeholder: "John Doe",
                  className: "vq-input",
                  autoComplete: "name"
                }
              ),
              errors.name && /* @__PURE__ */ jsx("p", { className: "vq-mc-error", children: errors.name })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-mc-field", children: [
              /* @__PURE__ */ jsxs("label", { htmlFor: "newsletter-email", className: "vq-mc-label", children: [
                "Email Address ",
                /* @__PURE__ */ jsx("span", { className: "req", children: "*" })
              ] }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  id: "newsletter-email",
                  type: "email",
                  required: true,
                  value: data.email,
                  onChange: (e) => setData("email", e.target.value),
                  placeholder: "john@example.com",
                  className: "vq-input",
                  autoComplete: "email"
                }
              ),
              errors.email && /* @__PURE__ */ jsx("p", { className: "vq-mc-error", children: errors.email })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-mc-field", role: "group", "aria-labelledby": "newsletter-interest", children: [
              /* @__PURE__ */ jsx("div", { id: "newsletter-interest", className: "vq-mc-label", children: "Get updates for" }),
              /* @__PURE__ */ jsx("div", { className: "vq-mc-options", children: options.map((opt) => /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => setData("interest", opt.id),
                  className: "vq-mc-option",
                  "aria-pressed": data.interest === opt.id,
                  children: [
                    /* @__PURE__ */ jsx("span", { className: "vq-mc-option__radio", "aria-hidden": "true" }),
                    /* @__PURE__ */ jsxs("span", { children: [
                      /* @__PURE__ */ jsx("span", { className: "vq-mc-option__label", children: opt.label }),
                      /* @__PURE__ */ jsx("span", { className: "vq-mc-option__desc", children: opt.desc })
                    ] })
                  ]
                },
                opt.id
              )) }),
              errors.interest && /* @__PURE__ */ jsx("p", { className: "vq-mc-error", children: errors.interest })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "vq-mt-8", children: /* @__PURE__ */ jsx(
              MagneticButton,
              {
                type: "submit",
                disabled: processing,
                variant: "primary",
                className: "vq-btn--lg vq-btn--block",
                style: { opacity: processing ? 0.6 : void 0 },
                children: processing ? /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx(Loader2, { size: 16, className: "animate-spin", "aria-hidden": "true" }),
                  "Processing..."
                ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                  "Subscribe Now",
                  /* @__PURE__ */ jsx("span", { className: "vq-btn__arrow", children: /* @__PURE__ */ jsx(Send, { size: 16, "aria-hidden": "true" }) })
                ] })
              }
            ) })
          ] }) }) })
        ] }) })
      ] })
    }
  );
}
export {
  Newsletter as default
};

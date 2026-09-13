import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import { Link } from "@inertiajs/react";
import { Sparkles, ArrowRight } from "lucide-react";
function SmartCaptureNudge({ documentType = "invoice" }) {
  return /* @__PURE__ */ jsxs("div", { className: "vq-nudge", children: [
    /* @__PURE__ */ jsxs("div", { className: "vq-nudge__body", children: [
      /* @__PURE__ */ jsx("div", { className: "vq-tile__icon", "aria-hidden": "true", children: /* @__PURE__ */ jsx(Sparkles, { size: 20 }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("p", { className: "vq-nudge__title", children: [
          "Create this ",
          documentType,
          " with Smart Capture AI"
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "vq-nudge__text", children: [
          "Tired of typing line items by hand? Upload any vendor bill, handwritten list or photo and let AI read it in seconds. The free tier includes ",
          /* @__PURE__ */ jsx("strong", { children: "5 pages a month" }),
          "."
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Link, { href: "/tools/smart-capture", className: "vq-btn vq-btn--quiet", children: [
      "Use Smart Capture ",
      /* @__PURE__ */ jsx(ArrowRight, { size: 16, className: "vq-btn__arrow", "aria-hidden": "true" })
    ] })
  ] });
}
export {
  SmartCaptureNudge as default
};

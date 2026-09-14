import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useForm } from "@inertiajs/react";
import { X, Mail } from "lucide-react";
function EmailGate({ open, onClose, toolSlug, toolName, deliverable, context = {}, onSuccess, title, subtitle }) {
  const [submitted, setSubmitted] = useState(false);
  const { data, setData, post, processing, errors, reset } = useForm({
    email: "",
    name: "",
    marketing_consent: false,
    tool_slug: toolSlug,
    tool_name: toolName,
    deliverable: deliverable || null,
    context
  });
  if (!open) return null;
  const submit = (e) => {
    e.preventDefault();
    post("/tools/lead", {
      preserveScroll: true,
      onSuccess: () => {
        setSubmitted(true);
        onSuccess?.();
      }
    });
  };
  const handleClose = () => {
    setSubmitted(false);
    reset();
    onClose?.();
  };
  return /* @__PURE__ */ jsx("div", { className: "vq-gate", onClick: handleClose, children: /* @__PURE__ */ jsxs(
    "div",
    {
      className: "vq-gate__card",
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": "vq-gate-title",
      onClick: (e) => e.stopPropagation(),
      children: [
        /* @__PURE__ */ jsx("button", { type: "button", onClick: handleClose, className: "vq-gate__close", "aria-label": "Close", children: /* @__PURE__ */ jsx(X, { size: 20 }) }),
        !submitted ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("div", { className: "vq-tile__icon", "aria-hidden": "true", children: /* @__PURE__ */ jsx(Mail, { size: 20 }) }),
          /* @__PURE__ */ jsx("h3", { id: "vq-gate-title", className: "vq-h3 vq-mt-2", children: title || "Where should we send it?" }),
          /* @__PURE__ */ jsx("p", { className: "vq-small vq-text-2 vq-mt-2", children: subtitle || "Your PDF downloads straight away — we'll email you a copy so you can find it later." }),
          /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "vq-gate__form", children: [
            /* @__PURE__ */ jsxs("div", { className: "vq-field", children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "vq-gate-email", className: "vq-label", children: "Email" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  id: "vq-gate-email",
                  type: "email",
                  required: true,
                  placeholder: "you@company.com",
                  value: data.email,
                  onChange: (e) => setData("email", e.target.value),
                  className: "vq-input"
                }
              ),
              errors.email && /* @__PURE__ */ jsx("p", { className: "vq-gate__error", children: errors.email })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-field", children: [
              /* @__PURE__ */ jsxs("label", { htmlFor: "vq-gate-name", className: "vq-label", children: [
                "Name ",
                /* @__PURE__ */ jsx("span", { className: "vq-text-3", children: "(optional)" })
              ] }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  id: "vq-gate-name",
                  type: "text",
                  placeholder: "Your name",
                  value: data.name,
                  onChange: (e) => setData("name", e.target.value),
                  className: "vq-input"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("label", { className: "vq-gate__consent", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "checkbox",
                  checked: data.marketing_consent,
                  onChange: (e) => setData("marketing_consent", e.target.checked)
                }
              ),
              /* @__PURE__ */ jsx("span", { children: "Also send me occasional retail and POS tips from VenQore. No spam, unsubscribe anytime." })
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "submit",
                disabled: processing,
                className: "vq-btn vq-btn--primary vq-btn--lg vq-btn--block",
                children: processing ? "Sending…" : "Download my PDF"
              }
            ),
            /* @__PURE__ */ jsxs("p", { className: "vq-caption vq-center", style: { marginInline: "auto" }, children: [
              "We'll email your file right away. We never sell your data.",
              " ",
              /* @__PURE__ */ jsx("a", { href: "/privacy", children: "Privacy Policy" })
            ] })
          ] })
        ] }) : /* @__PURE__ */ jsxs("div", { className: "vq-center", style: { paddingBlock: "var(--vq-space-4)" }, children: [
          /* @__PURE__ */ jsx("div", { className: "vq-gate__done", "aria-hidden": "true", children: /* @__PURE__ */ jsx(Mail, { size: 22 }) }),
          /* @__PURE__ */ jsx("h3", { id: "vq-gate-title", className: "vq-h3", children: "Check your email" }),
          /* @__PURE__ */ jsxs("p", { className: "vq-small vq-text-2 vq-mt-2", style: { marginInline: "auto" }, children: [
            "We've sent your file to ",
            data.email,
            "."
          ] }),
          /* @__PURE__ */ jsx("button", { type: "button", onClick: handleClose, className: "vq-btn vq-btn--secondary vq-mt-6", children: "Close" })
        ] })
      ]
    }
  ) });
}
export {
  EmailGate as default
};

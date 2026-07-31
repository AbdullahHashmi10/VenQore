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
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm", onClick: handleClose, children: /* @__PURE__ */ jsxs(
    "div",
    {
      className: "w-full max-w-md rounded-3xl bg-[#0b0918] border border-white/10 p-8 relative",
      onClick: (e) => e.stopPropagation(),
      children: [
        /* @__PURE__ */ jsx("button", { onClick: handleClose, className: "absolute top-5 right-5 text-slate-500 hover:text-white transition-colors", "aria-label": "Close", children: /* @__PURE__ */ jsx(X, { size: 20 }) }),
        !submitted ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-400/20 flex items-center justify-center mb-5", children: /* @__PURE__ */ jsx(Mail, { size: 20, className: "text-indigo-300" }) }),
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-black text-white mb-2", children: title || "Where should we send it?" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400 mb-6", children: subtitle || "Your PDF downloads straight away — we'll email you a copy so you can find it later." }),
          /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "email",
                  required: true,
                  placeholder: "you@company.com",
                  value: data.email,
                  onChange: (e) => setData("email", e.target.value),
                  className: "w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-400/50"
                }
              ),
              errors.email && /* @__PURE__ */ jsx("p", { className: "text-xs text-red-400 mt-1.5", children: errors.email })
            ] }),
            /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                placeholder: "Name (optional)",
                value: data.name,
                onChange: (e) => setData("name", e.target.value),
                className: "w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-400/50"
              }
            ) }),
            /* @__PURE__ */ jsxs("label", { className: "flex items-start gap-3 cursor-pointer", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "checkbox",
                  checked: data.marketing_consent,
                  onChange: (e) => setData("marketing_consent", e.target.checked),
                  className: "mt-0.5 w-4 h-4 rounded border-white/20 bg-white/[0.04] accent-indigo-500"
                }
              ),
              /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-400 leading-relaxed", children: "Also send me occasional retail and POS tips from VenQore. No spam, unsubscribe anytime." })
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "submit",
                disabled: processing,
                className: "w-full py-3.5 bg-white text-[#05030f] rounded-xl text-sm font-black uppercase tracking-wide hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100",
                children: processing ? "Sending…" : "Download my PDF"
              }
            ),
            /* @__PURE__ */ jsxs("p", { className: "text-[11px] text-slate-600 text-center leading-relaxed", children: [
              "We'll email your file right away. We never sell your data.",
              " ",
              /* @__PURE__ */ jsx("a", { href: "/privacy", className: "underline hover:text-slate-400", children: "Privacy Policy" })
            ] })
          ] })
        ] }) : /* @__PURE__ */ jsxs("div", { className: "text-center py-6", children: [
          /* @__PURE__ */ jsx("div", { className: "w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center mx-auto mb-5", children: /* @__PURE__ */ jsx(Mail, { size: 22, className: "text-emerald-400" }) }),
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-black text-white mb-2", children: "Check your email" }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-400 mb-6", children: [
            "We've sent your file to ",
            data.email,
            "."
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: handleClose,
              className: "px-6 py-2.5 bg-white/[0.06] border border-white/15 text-white rounded-full text-sm font-bold hover:bg-white/[0.1] transition-colors",
              children: "Close"
            }
          )
        ] })
      ]
    }
  ) });
}
export {
  EmailGate as default
};

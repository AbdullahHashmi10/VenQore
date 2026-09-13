import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useForm, Link } from "@inertiajs/react";
import { Mail, Loader2, ArrowRight } from "lucide-react";
import { A as AuthLayout, a as AuthStack, f as AuthNotice, b as AuthForm, c as AuthField, d as AuthButton } from "./index-BhXucrH4.js";
import "react";
import "./Input-BO7OpFmF.js";
function ForgotPassword({ status }) {
  const { data, setData, post, processing, errors } = useForm({ email: "" });
  const submit = (e) => {
    e.preventDefault();
    post("/forgot-password", {
      preserveState: true,
      preserveScroll: true
    });
  };
  return /* @__PURE__ */ jsx(
    AuthLayout,
    {
      title: "Reset your password",
      heading: "Reset your password",
      subheading: "We'll send you a secure reset link.",
      footer: /* @__PURE__ */ jsxs(Fragment, { children: [
        "Remembered it?",
        " ",
        /* @__PURE__ */ jsx(
          Link,
          {
            href: route("login"),
            className: "font-medium text-accent-text transition-colors duration-fast hover:text-accent-fill-hover",
            children: "Sign in →"
          }
        )
      ] }),
      children: /* @__PURE__ */ jsxs(AuthStack, { gap: 6, children: [
        status ? /* @__PURE__ */ jsx(AuthNotice, { tone: "success", children: status }) : null,
        /* @__PURE__ */ jsxs(AuthForm, { onSubmit: submit, children: [
          /* @__PURE__ */ jsx(
            AuthField,
            {
              label: "Email address",
              type: "email",
              name: "email",
              value: data.email,
              onChange: (e) => setData("email", e.target.value),
              placeholder: "you@company.com",
              autoComplete: "username",
              autoFocus: true,
              required: true,
              prefix: /* @__PURE__ */ jsx(Mail, { size: 16 }),
              error: errors.email
            }
          ),
          /* @__PURE__ */ jsx(
            AuthButton,
            {
              type: "submit",
              disabled: processing,
              iconAfter: processing ? null : /* @__PURE__ */ jsx(ArrowRight, { size: 16 }),
              children: processing ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Loader2, { size: 16, className: "animate-spin" }),
                " Sending…"
              ] }) : "Send reset link"
            }
          )
        ] })
      ] })
    }
  );
}
export {
  ForgotPassword as default
};

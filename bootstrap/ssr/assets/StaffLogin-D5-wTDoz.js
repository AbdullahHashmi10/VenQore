import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useForm, Link } from "@inertiajs/react";
import { Mail, Lock, Loader2, ArrowRight, EyeOff, Eye } from "lucide-react";
import { A as AuthLayout, a as AuthStack, f as AuthNotice, b as AuthForm, c as AuthField, g as AuthCheckbox, d as AuthButton } from "./index-BhXucrH4.js";
import { u as useTermText } from "./terms-DwYjlWsV.js";
import "./Input-BO7OpFmF.js";
function StaffLogin({ status, flash }) {
  const tt = useTermText();
  const { data, setData, post, processing, errors, reset } = useForm({
    email: "",
    password: "",
    remember: false
  });
  const [showPassword, setShowPassword] = useState(false);
  useEffect(() => () => reset("password"), []);
  const submit = (e) => {
    e.preventDefault();
    post("/staff-login", {
      preserveState: true,
      preserveScroll: true
    });
  };
  return /* @__PURE__ */ jsx(
    AuthLayout,
    {
      title: tt("Staff sign-in"),
      heading: tt("Staff sign-in"),
      subheading: "Please authenticate using your credentials to enter the cockpit.",
      footer: /* @__PURE__ */ jsx(
        Link,
        {
          href: route("login"),
          className: "font-medium text-accent-text transition-colors duration-fast hover:text-accent-fill-hover",
          children: "← Regular store account login"
        }
      ),
      children: /* @__PURE__ */ jsxs(AuthStack, { gap: 6, children: [
        status ? /* @__PURE__ */ jsx(AuthNotice, { tone: "success", children: status }) : null,
        flash?.error ? /* @__PURE__ */ jsx(AuthNotice, { tone: "danger", children: flash.error }) : null,
        /* @__PURE__ */ jsxs(AuthForm, { onSubmit: submit, children: [
          /* @__PURE__ */ jsx(
            AuthField,
            {
              label: "Email address",
              type: "email",
              name: "email",
              value: data.email,
              onChange: (e) => setData("email", e.target.value),
              placeholder: "yourname@venqore.com",
              autoComplete: "username",
              autoFocus: true,
              prefix: /* @__PURE__ */ jsx(Mail, { size: 16 }),
              error: errors.email
            }
          ),
          /* @__PURE__ */ jsx(
            AuthField,
            {
              label: "Password",
              type: showPassword ? "text" : "password",
              name: "password",
              value: data.password,
              onChange: (e) => setData("password", e.target.value),
              placeholder: "••••••••",
              autoComplete: "current-password",
              prefix: /* @__PURE__ */ jsx(Lock, { size: 16 }),
              suffix: /* @__PURE__ */ jsx(RevealToggle, { shown: showPassword, onToggle: () => setShowPassword((v) => !v) }),
              error: errors.password
            }
          ),
          /* @__PURE__ */ jsx(
            AuthCheckbox,
            {
              checked: data.remember,
              onChange: (v) => setData("remember", v),
              label: "Remember me"
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
                " Authorizing…"
              ] }) : tt("Enter Staff Hub")
            }
          )
        ] })
      ] })
    }
  );
}
function RevealToggle({ shown, onToggle }) {
  return /* @__PURE__ */ jsx(
    "button",
    {
      type: "button",
      onClick: onToggle,
      "aria-label": shown ? "Hide password" : "Show password",
      className: "flex items-center text-ink-muted transition-colors duration-fast hover:text-ink-secondary",
      children: shown ? /* @__PURE__ */ jsx(EyeOff, { size: 16 }) : /* @__PURE__ */ jsx(Eye, { size: 16 })
    }
  );
}
export {
  StaffLogin as default
};

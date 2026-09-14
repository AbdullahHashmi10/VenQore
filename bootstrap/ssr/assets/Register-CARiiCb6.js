import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useForm, Link } from "@inertiajs/react";
import { User, Mail, Lock, Loader2, ArrowRight } from "lucide-react";
import { A as AuthLayout, a as AuthStack, b as AuthForm, c as AuthField, g as AuthCheckbox, d as AuthButton, h as AuthDivider } from "./index-BhXucrH4.js";
import "./Input-BO7OpFmF.js";
function Register() {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const { data, setData, post, processing, errors, setError, reset } = useForm({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    shared_catalog_opt_in: false
  });
  const submit = (e) => {
    e.preventDefault();
    if (data.password.length < 8) {
      setError("password", "Password must be at least 8 characters.");
      return;
    }
    post("/register", {
      preserveState: true,
      preserveScroll: true,
      onFinish: () => reset("password", "password_confirmation")
    });
  };
  return /* @__PURE__ */ jsx(
    AuthLayout,
    {
      title: "Create your system",
      heading: "Create your system",
      subheading: "14 days, the full product, cancel anytime. You will see what it becomes before you decide anything.",
      footer: /* @__PURE__ */ jsxs(Fragment, { children: [
        "Already have a system?",
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
        /* @__PURE__ */ jsxs(AuthForm, { onSubmit: submit, children: [
          /* @__PURE__ */ jsx(
            AuthField,
            {
              label: "Your name",
              type: "text",
              name: "name",
              value: data.name,
              onChange: (e) => setData("name", e.target.value),
              autoComplete: "name",
              autoFocus: true,
              required: true,
              prefix: /* @__PURE__ */ jsx(User, { size: 16 }),
              error: errors.name
            }
          ),
          /* @__PURE__ */ jsx(
            AuthField,
            {
              label: "Work email",
              type: "email",
              name: "email",
              value: data.email,
              onChange: (e) => setData("email", e.target.value),
              placeholder: "you@company.com",
              autoComplete: "username",
              required: true,
              prefix: /* @__PURE__ */ jsx(Mail, { size: 16 }),
              error: errors.email,
              hint: "We'll email your sign-in code here."
            }
          ),
          /* @__PURE__ */ jsx(
            AuthField,
            {
              label: "Password",
              type: "password",
              name: "password",
              value: data.password,
              onChange: (e) => setData("password", e.target.value),
              autoComplete: "new-password",
              minLength: 8,
              required: true,
              prefix: /* @__PURE__ */ jsx(Lock, { size: 16 }),
              error: errors.password,
              hint: "At least 8 characters. This is the account that owns your ledger — make it a real one."
            }
          ),
          /* @__PURE__ */ jsx(
            AuthField,
            {
              label: "Confirm password",
              type: "password",
              name: "password_confirmation",
              value: data.password_confirmation,
              onChange: (e) => setData("password_confirmation", e.target.value),
              autoComplete: "new-password",
              required: true,
              prefix: /* @__PURE__ */ jsx(Lock, { size: 16 }),
              error: errors.password_confirmation
            }
          ),
          /* @__PURE__ */ jsx("div", { className: "rounded-xl border border-line bg-app/50 p-3 text-xs text-ink-muted", children: /* @__PURE__ */ jsx(
            AuthCheckbox,
            {
              id: "shared-catalog-checkbox",
              checked: data.shared_catalog_opt_in,
              onChange: (checked) => setData("shared_catalog_opt_in", checked),
              label: /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsx("span", { className: "font-semibold text-ink", children: "Help build the shared product catalogue" }),
                /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-secondary leading-relaxed", children: "Get thousands of common products pre-filled in your catalogue, confirmed by other shops. In return, product names you confirm are added to the shared pool." }),
                /* @__PURE__ */ jsxs("p", { className: "text-2xs text-ink-faint", children: [
                  /* @__PURE__ */ jsx("strong", { className: "text-ink-muted", children: "Never shared:" }),
                  " your prices, costs, stock, margins, customers, suppliers, or your business identity."
                ] })
              ] })
            }
          ) }),
          /* @__PURE__ */ jsx(
            AuthCheckbox,
            {
              id: "terms-checkbox",
              checked: agreedToTerms,
              onChange: setAgreedToTerms,
              label: /* @__PURE__ */ jsxs("span", { children: [
                "I agree to the",
                " ",
                /* @__PURE__ */ jsx(
                  Link,
                  {
                    href: route("terms"),
                    target: "_blank",
                    onClick: (e) => e.stopPropagation(),
                    className: "font-medium text-accent-text transition-colors duration-fast hover:text-accent-fill-hover",
                    children: "Terms"
                  }
                ),
                " ",
                "and the",
                " ",
                /* @__PURE__ */ jsx(
                  Link,
                  {
                    href: route("privacy"),
                    target: "_blank",
                    onClick: (e) => e.stopPropagation(),
                    className: "font-medium text-accent-text transition-colors duration-fast hover:text-accent-fill-hover",
                    children: "Privacy Policy"
                  }
                ),
                "."
              ] })
            }
          ),
          /* @__PURE__ */ jsx(
            AuthButton,
            {
              id: "register-submit",
              type: "submit",
              disabled: processing || !agreedToTerms,
              iconAfter: processing ? null : /* @__PURE__ */ jsx(ArrowRight, { size: 16 }),
              children: processing ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Loader2, { size: 16, className: "animate-spin" }),
                " Creating your system…"
              ] }) : "Create my system"
            }
          ),
          /* @__PURE__ */ jsx("p", { className: "text-center text-sm text-ink-muted", children: "14-day free trial. We'll remind you before the trial ends." })
        ] }),
        /* @__PURE__ */ jsx(AuthDivider, {}),
        /* @__PURE__ */ jsx(
          AuthButton,
          {
            variant: "secondary",
            onClick: () => {
              window.location.href = route("auth.google");
            },
            icon: /* @__PURE__ */ jsx(GoogleMark, {}),
            children: "Continue with Google"
          }
        )
      ] })
    }
  );
}
function GoogleMark() {
  return /* @__PURE__ */ jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", "aria-hidden": "true", children: [
    /* @__PURE__ */ jsx("path", { fill: "#4285F4", d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" }),
    /* @__PURE__ */ jsx("path", { fill: "#34A853", d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" }),
    /* @__PURE__ */ jsx("path", { fill: "#FBBC05", d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" }),
    /* @__PURE__ */ jsx("path", { fill: "#EA4335", d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" })
  ] });
}
export {
  Register as default
};

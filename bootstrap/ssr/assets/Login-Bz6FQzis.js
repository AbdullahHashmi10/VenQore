import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useEffect } from "react";
import { usePage, useForm, Link } from "@inertiajs/react";
import { Mail, Lock, Loader2, ArrowRight, Delete } from "lucide-react";
import { A as AuthLayout, a as AuthStack, f as AuthNotice, b as AuthForm, c as AuthField, g as AuthCheckbox, d as AuthButton, h as AuthDivider } from "./index-BhXucrH4.js";
import "./Input-BO7OpFmF.js";
function Login({ status, canResetPassword, passcode_login_available, flash }) {
  const page = usePage();
  const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
    email: "",
    password: "",
    remember: false,
    loginMethod: "email",
    passcode: ""
  });
  const displayErrors = { ...page.props.errors, ...errors };
  useEffect(() => () => reset("password"), []);
  const submitPasscode = () => {
    if (!processing && data.passcode) {
      post("/login/passcode", {
        preserveState: true,
        preserveScroll: true,
        onError: () => setData("passcode", "")
      });
    }
  };
  const handlePasscodeChange = (next) => {
    setData("passcode", next);
    if (errors.passcode) clearErrors("passcode");
  };
  useEffect(() => {
    const onKeyDown = (e) => {
      if (data.loginMethod !== "passcode") return;
      if (/^[0-9]$/.test(e.key)) {
        const c = data.passcode || "";
        if (c.length < 10) handlePasscodeChange(c + e.key);
      } else if (e.key === "Backspace") {
        handlePasscodeChange((data.passcode || "").slice(0, -1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        submitPasscode();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [data.loginMethod, data.passcode, processing]);
  const submit = (e) => {
    e.preventDefault();
    if (data.loginMethod === "email") {
      post("/login", { preserveState: true, preserveScroll: true });
    }
  };
  const isPasscode = data.loginMethod === "passcode";
  return /* @__PURE__ */ jsx(
    AuthLayout,
    {
      title: "Sign in",
      heading: "Sign in",
      subheading: isPasscode ? "Enter your cashier PIN." : "Welcome back.",
      footer: /* @__PURE__ */ jsxs(Fragment, { children: [
        "Don't have a system yet?",
        " ",
        /* @__PURE__ */ jsx(
          Link,
          {
            href: route("register"),
            className: "font-medium text-accent-text transition-colors duration-fast hover:text-accent-fill-hover",
            children: "Start building →"
          }
        )
      ] }),
      children: /* @__PURE__ */ jsxs(AuthStack, { gap: 6, children: [
        status ? /* @__PURE__ */ jsx(AuthNotice, { tone: "success", children: status }) : null,
        flash?.error ? /* @__PURE__ */ jsx(AuthNotice, { tone: "danger", children: flash.error }) : null,
        isPasscode ? /* @__PURE__ */ jsx(
          PasscodePad,
          {
            passcode: data.passcode || "",
            error: displayErrors.passcode,
            onChange: handlePasscodeChange,
            onSubmit: submitPasscode,
            onCancel: () => setData("loginMethod", "email")
          }
        ) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs(AuthForm, { onSubmit: submit, children: [
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
                error: displayErrors.email
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
                autoComplete: "current-password",
                required: true,
                prefix: /* @__PURE__ */ jsx(Lock, { size: 16 }),
                error: displayErrors.password,
                action: canResetPassword ? /* @__PURE__ */ jsx(Link, { href: route("password.request"), className: "text-sm font-medium text-accent-text transition-colors duration-fast hover:text-accent-fill-hover", children: "Forgot?" }) : null
              }
            ),
            /* @__PURE__ */ jsx(
              AuthCheckbox,
              {
                checked: data.remember,
                onChange: (v) => setData("remember", v),
                label: "Keep me signed in on this device"
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
                  " Signing in…"
                ] }) : "Sign in"
              }
            )
          ] }),
          /* @__PURE__ */ jsx(AuthDivider, {}),
          /* @__PURE__ */ jsxs(AuthStack, { gap: 2, children: [
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
            ),
            passcode_login_available ? /* @__PURE__ */ jsx(
              AuthButton,
              {
                variant: "ghost",
                onClick: () => setData("loginMethod", "passcode"),
                icon: /* @__PURE__ */ jsx(Lock, { size: 16 }),
                children: "Sign in with a cashier PIN"
              }
            ) : null
          ] })
        ] })
      ] })
    }
  );
}
function PasscodePad({ passcode, error, onChange, onSubmit, onCancel }) {
  const key = "h-14 rounded-md bg-sunken text-xl font-semibold text-ink transition-colors duration-fast hover:bg-interactive-hover active:bg-interactive-active";
  return /* @__PURE__ */ jsxs(AuthStack, { gap: 6, children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsx("div", { className: "flex min-h-[14px] items-center justify-center gap-2.5", "aria-hidden": "true", children: passcode.split("").map((_, i) => /* @__PURE__ */ jsx(
        "span",
        {
          className: `h-3 w-3 rounded-full ${error ? "bg-danger-500" : "bg-accent-fill"}`
        },
        i
      )) }),
      error ? /* @__PURE__ */ jsx("p", { className: "mt-4 text-sm font-medium text-danger-600", children: error }) : null
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto grid w-full max-w-[280px] grid-cols-3 gap-3", children: [
      [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          className: key,
          onClick: () => passcode.length < 10 && onChange(passcode + n),
          children: n
        },
        n
      )),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          "aria-label": "Delete last digit",
          className: `${key} flex items-center justify-center text-ink-muted`,
          onClick: () => onChange(passcode.slice(0, -1)),
          children: /* @__PURE__ */ jsx(Delete, { size: 20 })
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          className: key,
          onClick: () => passcode.length < 10 && onChange(passcode + "0"),
          children: "0"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          "aria-label": "Sign in",
          onClick: onSubmit,
          className: "flex h-14 items-center justify-center rounded-md bg-accent-fill text-accent-on transition-colors duration-fast hover:bg-accent-fill-hover",
          children: /* @__PURE__ */ jsx(ArrowRight, { size: 20 })
        }
      )
    ] }),
    /* @__PURE__ */ jsx(AuthButton, { variant: "ghost", onClick: onCancel, children: "← Back to email sign-in" })
  ] });
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
  Login as default
};

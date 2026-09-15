import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import { useForm } from "@inertiajs/react";
import { Shield, Hash, Lock, Mail, Loader2, ArrowRight, Delete, EyeOff, Eye } from "lucide-react";
import { A as AuthLayout, a as AuthStack, f as AuthNotice, b as AuthForm, c as AuthField, d as AuthButton } from "./index-BhXucrH4.js";
import { B as Button } from "./Input-BO7OpFmF.js";
const EMAIL_FIELD_ID = "hq-email";
function PlatformOwnerLogin({ status, has_pin_enabled = false, flash }) {
  const [mode, setMode] = useState(has_pin_enabled ? "pin" : "password");
  const [showPassword, setShowPassword] = useState(false);
  const pinInputRef = useRef(null);
  const submitPinRef = useRef(null);
  const pinValueRef = useRef("");
  const pwForm = useForm({ email: "", password: "", remember: true });
  const pinForm = useForm({ pin: "" });
  const focusEmail = () => document.getElementById(EMAIL_FIELD_ID)?.focus();
  useEffect(() => {
    if (mode === "password") {
      setTimeout(focusEmail, 600);
    }
  }, []);
  useEffect(() => {
    if (mode === "password") {
      setTimeout(focusEmail, 200);
    }
  }, [mode]);
  useEffect(() => {
    if (mode !== "pin") return;
    setTimeout(() => pinInputRef.current?.focus(), 150);
    const onKeyDown = (e) => {
      const current = pinValueRef.current;
      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        if (current.length < 8) pinForm.setData("pin", current + e.key);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        pinForm.setData("pin", current.slice(0, -1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        submitPinRef.current?.();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mode]);
  const submitPassword = (e) => {
    e.preventDefault();
    pwForm.post("/VenQore-login", {
      preserveState: true,
      preserveScroll: true
    });
  };
  const submitPin = () => {
    if (pinForm.data.pin.length < 4) return;
    pinForm.post("/VenQore-login/pin", {
      preserveState: true,
      preserveScroll: true,
      onError: () => pinForm.setData("pin", "")
    });
  };
  useEffect(() => {
    submitPinRef.current = submitPin;
    pinValueRef.current = pinForm.data.pin;
  });
  const handlePinKey = (key) => {
    if (key === "del") {
      pinForm.setData("pin", pinForm.data.pin.slice(0, -1));
    } else if (pinForm.data.pin.length < 8) {
      const next = pinForm.data.pin + key;
      pinForm.setData("pin", next);
    }
  };
  return /* @__PURE__ */ jsx(
    AuthLayout,
    {
      title: "VenQore — Secure Access",
      heading: "Welcome back, Abdullah",
      subheading: "Secure access to your command center",
      back: false,
      footer: /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Shield, { size: 12 }),
        "Rate-limited · Session-encrypted · Platform-restricted"
      ] }),
      children: /* @__PURE__ */ jsxs(AuthStack, { gap: 6, children: [
        /* @__PURE__ */ jsxs("span", { className: "inline-flex w-fit items-center gap-2 rounded-full bg-accent-quiet px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-accent-text", children: [
          /* @__PURE__ */ jsx(Shield, { size: 12 }),
          "VenQore Platform HQ"
        ] }),
        has_pin_enabled && /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsx(
            Button,
            {
              full: true,
              type: "button",
              variant: mode === "pin" ? "soft" : "ghost",
              onClick: () => setMode("pin"),
              icon: /* @__PURE__ */ jsx(Hash, { size: 14 }),
              children: "PIN Login"
            }
          ) }),
          /* @__PURE__ */ jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsx(
            Button,
            {
              full: true,
              type: "button",
              variant: mode === "password" ? "soft" : "ghost",
              onClick: () => setMode("password"),
              icon: /* @__PURE__ */ jsx(Lock, { size: 14 }),
              children: "Password"
            }
          ) })
        ] }),
        status ? /* @__PURE__ */ jsx(AuthNotice, { tone: "success", children: status }) : null,
        flash?.error ? /* @__PURE__ */ jsx(AuthNotice, { tone: "danger", children: flash.error }) : null,
        mode === "pin" ? /* @__PURE__ */ jsx(
          PinPad,
          {
            pin: pinForm.data.pin,
            error: pinForm.errors.pin,
            processing: pinForm.processing,
            inputRef: pinInputRef,
            onKey: handlePinKey,
            onChange: (digits) => pinForm.setData("pin", digits),
            onSubmit: submitPin,
            onUsePassword: has_pin_enabled ? null : () => setMode("password")
          }
        ) : /* @__PURE__ */ jsxs(AuthForm, { onSubmit: submitPassword, children: [
          /* @__PURE__ */ jsx(
            AuthField,
            {
              id: EMAIL_FIELD_ID,
              label: "Email Address",
              type: "email",
              name: "email",
              value: pwForm.data.email,
              onChange: (e) => pwForm.setData("email", e.target.value),
              placeholder: "your@email.com",
              autoComplete: "email",
              prefix: /* @__PURE__ */ jsx(Mail, { size: 16 }),
              error: pwForm.errors.email
            }
          ),
          /* @__PURE__ */ jsx(
            AuthField,
            {
              label: "Password",
              type: showPassword ? "text" : "password",
              name: "password",
              value: pwForm.data.password,
              onChange: (e) => pwForm.setData("password", e.target.value),
              placeholder: "••••••••••••",
              autoComplete: "current-password",
              prefix: /* @__PURE__ */ jsx(Lock, { size: 16 }),
              suffix: /* @__PURE__ */ jsx(RevealToggle, { shown: showPassword, onToggle: () => setShowPassword((v) => !v) }),
              error: pwForm.errors.password
            }
          ),
          /* @__PURE__ */ jsx(
            AuthButton,
            {
              type: "submit",
              disabled: pwForm.processing,
              iconAfter: pwForm.processing ? null : /* @__PURE__ */ jsx(ArrowRight, { size: 16 }),
              children: pwForm.processing ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Loader2, { size: 16, className: "animate-spin" }),
                " Authenticating…"
              ] }) : "Enter Command Center"
            }
          ),
          has_pin_enabled && /* @__PURE__ */ jsx(
            AuthButton,
            {
              variant: "ghost",
              onClick: () => setMode("pin"),
              icon: /* @__PURE__ */ jsx(Hash, { size: 14 }),
              children: "Switch to PIN login"
            }
          )
        ] })
      ] })
    }
  );
}
function PinPad({ pin, error, processing, inputRef, onKey, onChange, onSubmit, onUsePassword }) {
  const key = "h-14 rounded-md bg-sunken text-xl font-semibold text-ink transition-colors duration-fast hover:bg-interactive-hover active:bg-interactive-active";
  return /* @__PURE__ */ jsxs(AuthStack, { gap: 6, children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsx("p", { className: "mb-4 text-xs font-semibold uppercase tracking-wider text-ink-muted", children: "Enter your PIN" }),
      /* @__PURE__ */ jsx("div", { className: "flex min-h-[14px] items-center justify-center gap-2.5", "aria-hidden": "true", children: pin.split("").map((_, i) => /* @__PURE__ */ jsx(
        "span",
        {
          className: `h-3 w-3 rounded-full ${error ? "bg-danger-500" : "bg-accent-fill"}`
        },
        i
      )) }),
      /* @__PURE__ */ jsx(
        "input",
        {
          ref: inputRef,
          type: "text",
          inputMode: "numeric",
          autoComplete: "one-time-code",
          "aria-label": "Enter your PIN",
          className: "sr-only",
          value: pin,
          onChange: (e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 8))
        }
      ),
      error ? /* @__PURE__ */ jsx("p", { className: "mt-4 text-sm font-medium text-danger-600", children: error }) : null
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto grid w-full max-w-[280px] grid-cols-3 gap-3", children: [
      [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          className: key,
          onClick: () => onKey(String(n)),
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
          onClick: () => onKey("del"),
          children: /* @__PURE__ */ jsx(Delete, { size: 20 })
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          className: key,
          onClick: () => onKey("0"),
          children: "0"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          "aria-label": "Sign in",
          onClick: onSubmit,
          disabled: pin.length < 4 || processing,
          className: "flex h-14 items-center justify-center rounded-md bg-accent-fill text-accent-on transition-colors duration-fast hover:bg-accent-fill-hover disabled:cursor-not-allowed disabled:opacity-40",
          children: processing ? /* @__PURE__ */ jsx(Loader2, { size: 20, className: "animate-spin" }) : /* @__PURE__ */ jsx(ArrowRight, { size: 20 })
        }
      )
    ] }),
    onUsePassword ? /* @__PURE__ */ jsx(AuthButton, { variant: "ghost", onClick: onUsePassword, icon: /* @__PURE__ */ jsx(Lock, { size: 14 }), children: "Use password instead" }) : null
  ] });
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
  PlatformOwnerLogin as default
};

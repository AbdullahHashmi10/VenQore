import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useForm, router } from "@inertiajs/react";
import { Mail, Loader2, ArrowRight } from "lucide-react";
import { A as AuthLayout, a as AuthStack, f as AuthNotice, b as AuthForm, c as AuthField, d as AuthButton, e as AuthLink } from "./index-BhXucrH4.js";
import "./Input-BO7OpFmF.js";
const HEADINGS = {
  signup: { heading: "Confirm your email", sub: "One last step to create your account" },
  link_google: { heading: "Link your Google account", sub: "Confirm it is really you" },
  login: { heading: "Check your email", sub: "Enter your sign-in code" }
};
function VerifyCode({ purpose = "login", maskedEmail = "", ttlMinutes = 5, resendIn = 60, status, devCode = null }) {
  const { data, setData, post, processing, errors, reset } = useForm({ code: "" });
  const [wait, setWait] = useState(Math.max(0, Number(resendIn) || 0));
  const [resending, setResending] = useState(false);
  const copy = HEADINGS[purpose] || HEADINGS.login;
  const minLength = devCode ? Math.min(6, String(devCode).length) : 6;
  useEffect(() => {
    setWait(Math.max(0, Number(resendIn) || 0));
  }, [resendIn]);
  useEffect(() => {
    if (wait <= 0) return void 0;
    const t = window.setTimeout(() => setWait((w) => Math.max(0, w - 1)), 1e3);
    return () => window.clearTimeout(t);
  }, [wait]);
  const submit = (e) => {
    e.preventDefault();
    post(route("otp.verify"), { onError: () => reset("code") });
  };
  const resend = () => {
    setResending(true);
    router.post(route("otp.resend"), {}, {
      preserveScroll: true,
      onFinish: () => setResending(false)
    });
  };
  const cancel = (e) => {
    e.preventDefault();
    router.post(route("otp.cancel"));
  };
  return /* @__PURE__ */ jsx(AuthLayout, { title: `${copy.heading} — VenQore`, heading: copy.heading, subheading: copy.sub, back: false, children: /* @__PURE__ */ jsxs(AuthStack, { gap: 6, children: [
    /* @__PURE__ */ jsxs("p", { className: "flex items-start gap-2 text-sm text-ink-secondary", children: [
      /* @__PURE__ */ jsx(Mail, { size: 16, className: "mt-0.5 shrink-0 text-accent-text", "aria-hidden": "true" }),
      /* @__PURE__ */ jsxs("span", { children: [
        "We sent a 6-digit code to",
        " ",
        /* @__PURE__ */ jsx("strong", { className: "font-semibold text-ink", children: maskedEmail || "your email" }),
        ". It expires in ",
        ttlMinutes,
        " minutes and works once."
      ] })
    ] }),
    /* @__PURE__ */ jsx(AuthNotice, { tone: "success", children: status }),
    devCode && /* @__PURE__ */ jsxs("p", { className: "rounded-md border border-dashed border-line-strong bg-sunken px-3 py-2 text-xs text-ink-secondary", children: [
      "Local testing: enter ",
      /* @__PURE__ */ jsx("strong", { className: "font-mono text-ink", children: devCode }),
      " — no email needed."
    ] }),
    /* @__PURE__ */ jsxs(AuthForm, { onSubmit: submit, children: [
      /* @__PURE__ */ jsx(
        AuthField,
        {
          id: "otp-code",
          label: "6-digit code",
          type: "text",
          name: "code",
          value: data.code,
          onChange: (e) => setData("code", e.target.value.replace(/\D/g, "").slice(0, 6)),
          placeholder: "000000",
          inputMode: "numeric",
          autoComplete: "one-time-code",
          pattern: devCode ? void 0 : "[0-9]{6}",
          maxLength: 6,
          className: "text-center tracking-[0.5em]",
          error: errors.code,
          required: true,
          autoFocus: true
        }
      ),
      /* @__PURE__ */ jsx(
        AuthButton,
        {
          type: "submit",
          disabled: processing || data.code.length < minLength,
          iconAfter: processing ? null : /* @__PURE__ */ jsx(ArrowRight, { size: 16 }),
          children: processing ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(Loader2, { size: 16, className: "animate-spin" }),
            " Checking…"
          ] }) : "Continue"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2 text-sm text-ink-muted", children: [
      /* @__PURE__ */ jsxs("p", { "aria-live": "polite", children: [
        "Didn't get it? Check spam, or",
        " ",
        wait > 0 ? /* @__PURE__ */ jsxs("span", { children: [
          "request a new code in ",
          wait,
          "s."
        ] }) : /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: resend,
            disabled: resending,
            className: "font-semibold text-accent-text underline-offset-2 hover:underline disabled:opacity-60",
            children: resending ? "sending…" : "send a new code"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("p", { children: [
        "Wrong email?",
        " ",
        /* @__PURE__ */ jsx(AuthLink, { href: "#", onClick: cancel, children: "Start again" })
      ] })
    ] })
  ] }) });
}
export {
  VerifyCode as default
};

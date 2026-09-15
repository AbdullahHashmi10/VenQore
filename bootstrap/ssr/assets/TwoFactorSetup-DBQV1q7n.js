import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useForm, router } from "@inertiajs/react";
import { QRCodeSVG } from "qrcode.react";
import { ArrowRight, KeyRound, Loader2 } from "lucide-react";
import { A as AuthLayout, a as AuthStack, d as AuthButton, b as AuthForm, c as AuthField } from "./index-BhXucrH4.js";
import "react";
import "./Input-BO7OpFmF.js";
function TwoFactorSetup({ secret, otpauthUrl, recoveryCodes = null, continueUrl = "/" }) {
  const { data, setData, post, processing, errors } = useForm({
    code: ""
  });
  if (Array.isArray(recoveryCodes) && recoveryCodes.length > 0) {
    return /* @__PURE__ */ jsx(
      AuthLayout,
      {
        title: "Save your recovery codes",
        heading: "Save your recovery codes",
        subheading: "Two-factor authentication is on",
        back: false,
        children: /* @__PURE__ */ jsxs(AuthStack, { gap: 6, children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-secondary", children: "Each code works once if you lose your phone. Store them somewhere safe — they will not be shown again." }),
          /* @__PURE__ */ jsx("ul", { className: "grid grid-cols-2 gap-2 rounded-md border border-line bg-surface p-4", children: recoveryCodes.map((code) => /* @__PURE__ */ jsx("li", { className: "select-all text-center font-numeric text-sm text-ink", children: code }, code)) }),
          /* @__PURE__ */ jsx(AuthButton, { type: "button", onClick: () => router.visit(continueUrl), iconAfter: /* @__PURE__ */ jsx(ArrowRight, { size: 16 }), children: "I have saved them" })
        ] })
      }
    );
  }
  const submit = (e) => {
    e.preventDefault();
    post("/2fa/confirm");
  };
  return /* @__PURE__ */ jsx(
    AuthLayout,
    {
      title: "Setup Two-Factor Authentication",
      heading: "Secure your account",
      subheading: "Enable two-factor authentication",
      back: false,
      children: /* @__PURE__ */ jsxs(AuthStack, { gap: 6, children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-secondary", children: "To protect your store and financial data, 2FA is required for your role." }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-4 rounded-md border border-line bg-surface p-6", children: [
          /* @__PURE__ */ jsx("div", { className: "rounded-md bg-white p-2", children: /* @__PURE__ */ jsx(QRCodeSVG, { value: otpauthUrl, size: 176, level: "M", "aria-label": "Authenticator QR code" }) }),
          /* @__PURE__ */ jsxs("span", { className: "select-all text-center text-xs text-ink-muted", children: [
            "Key:",
            " ",
            /* @__PURE__ */ jsx("code", { className: "rounded-sm bg-sunken px-2 py-1 font-numeric text-ink", children: secret })
          ] })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-xs leading-relaxed text-ink-muted", children: "Scan the QR code with an authenticator app (Google Authenticator, Authy, etc.), then enter the 6-digit code below to confirm setup." }),
        /* @__PURE__ */ jsxs(AuthForm, { onSubmit: submit, children: [
          /* @__PURE__ */ jsx(
            AuthField,
            {
              label: "Verification code",
              type: "text",
              name: "code",
              value: data.code,
              onChange: (e) => setData("code", e.target.value),
              placeholder: "000000",
              maxLength: 6,
              inputMode: "numeric",
              autoComplete: "one-time-code",
              className: "tracking-widest",
              prefix: /* @__PURE__ */ jsx(KeyRound, { size: 16 }),
              error: errors.code,
              required: true,
              autoFocus: true
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
                " Confirming…"
              ] }) : "Confirm & Enable"
            }
          )
        ] })
      ] })
    }
  );
}
export {
  TwoFactorSetup as default
};

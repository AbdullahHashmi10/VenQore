import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useForm } from "@inertiajs/react";
import { KeyRound, Loader2, ArrowRight } from "lucide-react";
import { A as AuthLayout, a as AuthStack, b as AuthForm, c as AuthField, d as AuthButton } from "./index-BhXucrH4.js";
import "react";
import "./Input-BO7OpFmF.js";
function TwoFactorVerify() {
  const { data, setData, post, processing, errors } = useForm({
    code: ""
  });
  const submit = (e) => {
    e.preventDefault();
    post("/2fa/verify");
  };
  return /* @__PURE__ */ jsx(
    AuthLayout,
    {
      title: "Two-Factor Authentication Verify",
      heading: "Verification required",
      subheading: "Two-factor authentication code",
      back: false,
      children: /* @__PURE__ */ jsxs(AuthStack, { gap: 6, children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-secondary", children: "Please enter the 6-digit authentication code from your authenticator app, or a secure recovery code." }),
        /* @__PURE__ */ jsxs(AuthForm, { onSubmit: submit, children: [
          /* @__PURE__ */ jsx(
            AuthField,
            {
              label: "Authentication code",
              type: "text",
              name: "code",
              value: data.code,
              onChange: (e) => setData("code", e.target.value),
              placeholder: "000000",
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
                " Verifying…"
              ] }) : "Verify Code"
            }
          )
        ] })
      ] })
    }
  );
}
export {
  TwoFactorVerify as default
};

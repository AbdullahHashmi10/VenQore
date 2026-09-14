import { jsx, jsxs } from "react/jsx-runtime";
import { useForm, router } from "@inertiajs/react";
import { Loader2, RefreshCw, LogOut } from "lucide-react";
import { A as AuthLayout, a as AuthStack, f as AuthNotice, d as AuthButton } from "./index-BhXucrH4.js";
import "react";
import "./Input-BO7OpFmF.js";
function VerifyEmail({ status }) {
  const { post, processing } = useForm({});
  const submit = () => {
    post("/email/verification-notification", {
      preserveState: true,
      preserveScroll: true
    });
  };
  return /* @__PURE__ */ jsx(
    AuthLayout,
    {
      title: "Verify your email",
      heading: "Verify your email",
      subheading: "We've sent a verification link to your email address. Click the link to activate your account and get started.",
      back: false,
      footer: "Didn't receive the email? Check your spam folder or try resending.",
      children: /* @__PURE__ */ jsxs(AuthStack, { gap: 6, children: [
        status === "verification-link-sent" ? /* @__PURE__ */ jsx(AuthNotice, { tone: "success", children: "A new verification link has been sent!" }) : null,
        /* @__PURE__ */ jsxs(AuthStack, { gap: 2, children: [
          /* @__PURE__ */ jsx(
            AuthButton,
            {
              disabled: processing,
              onClick: submit,
              icon: processing ? /* @__PURE__ */ jsx(Loader2, { size: 16, className: "animate-spin" }) : /* @__PURE__ */ jsx(RefreshCw, { size: 16 }),
              children: processing ? "Sending…" : "Resend verification email"
            }
          ),
          /* @__PURE__ */ jsx(
            AuthButton,
            {
              variant: "ghost",
              onClick: () => router.post(route("logout")),
              icon: /* @__PURE__ */ jsx(LogOut, { size: 16 }),
              children: "Log out"
            }
          )
        ] })
      ] })
    }
  );
}
export {
  VerifyEmail as default
};

import { jsx, jsxs } from "react/jsx-runtime";
import { router } from "@inertiajs/react";
import { Clock, ShieldX, ArrowLeft } from "lucide-react";
import { A as AuthLayout, a as AuthStack, d as AuthButton } from "./index-BhXucrH4.js";
import "react";
import "./Input-BO7OpFmF.js";
const MESSAGES = {
  expired: { title: "Invite Expired", body: "This invite link was only valid for 48 hours. Ask your store admin to resend it." },
  not_found: { title: "Invalid Link", body: "This invite link doesn't exist or has already been used. Contact your store admin for a new one." },
  revoked: { title: "Invite Revoked", body: "The store admin has cancelled this invitation. Contact them for a new invite." }
};
function InviteInvalid({ reason = "not_found" }) {
  const msg = MESSAGES[reason] || MESSAGES.not_found;
  return /* @__PURE__ */ jsx(AuthLayout, { title: "Invalid Invitation — VenQore", heading: msg.title, subheading: msg.body, children: /* @__PURE__ */ jsxs(AuthStack, { gap: 6, children: [
    /* @__PURE__ */ jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsx("span", { className: "flex h-14 w-14 items-center justify-center rounded-md bg-danger-50 text-danger-600 dark:bg-danger-500/10 dark:text-danger-300", children: reason === "expired" ? /* @__PURE__ */ jsx(Clock, { size: 24 }) : /* @__PURE__ */ jsx(ShieldX, { size: 24 }) }) }),
    /* @__PURE__ */ jsx(AuthButton, { variant: "secondary", onClick: () => router.visit("/login"), icon: /* @__PURE__ */ jsx(ArrowLeft, { size: 16 }), children: "Back to Login" })
  ] }) });
}
export {
  InviteInvalid as default
};

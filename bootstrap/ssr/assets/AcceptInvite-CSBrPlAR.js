import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useForm } from "@inertiajs/react";
import { Users, Store, Zap, Crown, Mail, Loader2, ArrowRight, CheckCircle, EyeOff, Eye } from "lucide-react";
import { A as AuthLayout, a as AuthStack, b as AuthForm, c as AuthField, d as AuthButton, e as AuthLink } from "./index-BhXucrH4.js";
import { u as useTermText } from "./terms-DwYjlWsV.js";
import "./Input-BO7OpFmF.js";
const ROLE_INFO = {
  owner: { label: "Owner", icon: Crown, tone: "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-300" },
  admin: { label: "Admin", icon: Zap, tone: "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300" },
  manager: { label: "Manager", icon: Users, tone: "bg-info-50 text-info-700 dark:bg-info-500/10 dark:text-info-300" },
  cashier: { label: "Cashier", icon: Store, tone: "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-300" },
  viewer: { label: "Viewer", icon: Users, tone: "bg-sunken text-ink-secondary" }
};
function AcceptInvite({ token, invite_email, store_name, role }) {
  const [showPass, setShowPass] = useState(false);
  const tt = useTermText();
  const roleInfo = ROLE_INFO[role] ?? ROLE_INFO.viewer;
  const RoleIcon = roleInfo.icon;
  const { data, setData, post, processing, errors } = useForm({
    token,
    name: "",
    password: ""
  });
  const submit = (e) => {
    e.preventDefault();
    post("/invite/accept", {
      preserveState: true,
      preserveScroll: true
    });
  };
  return /* @__PURE__ */ jsx(
    AuthLayout,
    {
      title: `Join ${store_name} — VenQore`,
      heading: store_name ? `Join ${store_name}` : "You're invited!",
      subheading: /* @__PURE__ */ jsxs(Fragment, { children: [
        "You've been invited to join as a",
        " ",
        /* @__PURE__ */ jsx("strong", { className: "font-semibold text-ink", children: roleInfo.label }),
        "."
      ] }),
      footer: /* @__PURE__ */ jsxs(Fragment, { children: [
        "By joining, you agree to VenQore's",
        " ",
        /* @__PURE__ */ jsx(AuthLink, { href: "/terms", children: tt("Terms of Service") }),
        ". If you weren't expecting this invite, you can safely close this page."
      ] }),
      children: /* @__PURE__ */ jsxs(AuthStack, { gap: 6, children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
          /* @__PURE__ */ jsxs("span", { className: `inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${roleInfo.tone}`, children: [
            /* @__PURE__ */ jsx(RoleIcon, { size: 14 }),
            roleInfo.label
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-2 text-xs text-ink-muted", children: [
            /* @__PURE__ */ jsx(Mail, { size: 12 }),
            "Sent to: ",
            /* @__PURE__ */ jsx("span", { className: "text-ink-secondary", children: invite_email })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(AuthForm, { onSubmit: submit, children: [
          /* @__PURE__ */ jsx("input", { type: "hidden", value: token, name: "token" }),
          /* @__PURE__ */ jsx(
            AuthField,
            {
              id: "invite-name",
              label: "Your name",
              type: "text",
              name: "name",
              value: data.name,
              onChange: (e) => setData("name", e.target.value),
              placeholder: "How should we call you?",
              autoComplete: "name",
              required: true,
              autoFocus: true,
              error: errors.name
            }
          ),
          /* @__PURE__ */ jsx(
            AuthField,
            {
              id: "invite-password",
              label: "Set a password",
              type: showPass ? "text" : "password",
              name: "password",
              value: data.password,
              onChange: (e) => setData("password", e.target.value),
              placeholder: "Min 8 characters",
              autoComplete: "new-password",
              hint: "Skip if you already have an account.",
              suffix: /* @__PURE__ */ jsx(RevealToggle, { shown: showPass, onToggle: () => setShowPass((v) => !v) }),
              error: errors.password
            }
          ),
          /* @__PURE__ */ jsx(
            AuthButton,
            {
              id: "accept-invite-submit",
              type: "submit",
              disabled: processing || !data.name,
              icon: processing ? null : /* @__PURE__ */ jsx(CheckCircle, { size: 16 }),
              iconAfter: processing ? null : /* @__PURE__ */ jsx(ArrowRight, { size: 16 }),
              children: processing ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Loader2, { size: 16, className: "animate-spin" }),
                " Joining…"
              ] }) : "Accept & Enter Store"
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
  AcceptInvite as default
};

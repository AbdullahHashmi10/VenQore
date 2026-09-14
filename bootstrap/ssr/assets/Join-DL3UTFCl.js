import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useForm, Link, router } from "@inertiajs/react";
import { Mail, Store, Key, Loader2, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";
import { A as AuthLayout, a as AuthStack, d as AuthButton, b as AuthForm, c as AuthField, f as AuthNotice } from "./index-BhXucrH4.js";
import { B as Button } from "./Input-BO7OpFmF.js";
import { u as useTermText } from "./terms-DwYjlWsV.js";
function JoinStore({ pending_invites = [] }) {
  const tt = useTermText();
  const { data, setData, post, processing, errors } = useForm({
    join_code: ""
  });
  const [invites, setInvites] = useState(pending_invites);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [checkingCode, setCheckingCode] = useState(false);
  const [codeError, setCodeError] = useState("");
  useEffect(() => {
    if (invites.length > 0) {
      setShowCodeModal(true);
    }
  }, []);
  const handleSubmit = (e) => {
    e.preventDefault();
    post(route("store.join.submit"));
  };
  const handleCheckCode = async (e) => {
    e.preventDefault();
    setCheckingCode(true);
    setCodeError("");
    try {
      const response = await window.axios.post(route("invite.validate-code"), { code: inviteCode });
      if (response.data.valid) {
        router.visit(route("invite.accept", { token: response.data.invitation.token }));
      }
    } catch (error) {
      setCodeError(error.response?.data?.message || "Invalid or expired invite code.");
      setCheckingCode(false);
    }
  };
  const dismissInvite = (token) => {
    setInvites((prev) => prev.filter((i) => i.token !== token));
  };
  const formatCode = (raw) => {
    const cleaned = raw.toUpperCase().replace(/[^A-Z0-9-]/g, "");
    return cleaned;
  };
  return /* @__PURE__ */ jsxs(
    AuthLayout,
    {
      title: "Join a Store — VenQore",
      heading: "Join a Store",
      subheading: "Ask your store owner for the 7-character join code.",
      back: false,
      footer: /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("span", { className: "block", children: [
          "Want to create your own store?",
          " ",
          /* @__PURE__ */ jsx(
            Link,
            {
              href: route("store.create"),
              className: "font-medium text-accent-text transition-colors duration-fast hover:text-accent-fill-hover",
              children: "Create a store"
            }
          )
        ] }),
        /* @__PURE__ */ jsx("span", { className: "mt-3 block", children: /* @__PURE__ */ jsxs(
          Link,
          {
            href: route("store.create-or-join"),
            className: "inline-flex items-center gap-1.5 text-ink-faint transition-colors duration-fast hover:text-ink-muted",
            children: [
              /* @__PURE__ */ jsx(ArrowLeft, { size: 14 }),
              " Back"
            ]
          }
        ) })
      ] }),
      children: [
        /* @__PURE__ */ jsxs(AuthStack, { gap: 6, children: [
          /* @__PURE__ */ jsx(
            AuthButton,
            {
              variant: "soft",
              onClick: () => setShowCodeModal(true),
              icon: /* @__PURE__ */ jsx(Mail, { size: 16 }),
              children: invites.length > 0 ? `View Pending Invites (${invites.length})` : "Check for Invites"
            }
          ),
          /* @__PURE__ */ jsxs(AuthForm, { onSubmit: handleSubmit, children: [
            /* @__PURE__ */ jsx(
              AuthField,
              {
                id: "join-code",
                label: "Store join code",
                type: "text",
                name: "join_code",
                value: data.join_code,
                onChange: (e) => setData("join_code", formatCode(e.target.value)),
                placeholder: "VQ-XXXX-XXXX",
                maxLength: 16,
                required: true,
                autoFocus: true,
                className: "text-center uppercase tracking-widest",
                error: errors.join_code
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2 rounded-lg bg-sunken p-4 text-xs text-ink-muted", children: [
              /* @__PURE__ */ jsxs("p", { className: "flex items-start gap-2", children: [
                /* @__PURE__ */ jsx(Store, { size: 12, className: "mt-0.5 shrink-0 text-accent-text" }),
                /* @__PURE__ */ jsxs("span", { children: [
                  "You'll join as a ",
                  /* @__PURE__ */ jsx("strong", { className: "font-semibold text-ink-secondary", children: "Cashier" }),
                  " ",
                  "by default. The store owner can update your role."
                ] })
              ] }),
              /* @__PURE__ */ jsxs("p", { className: "flex items-start gap-2", children: [
                /* @__PURE__ */ jsx(Key, { size: 12, className: "mt-0.5 shrink-0 text-accent-text" }),
                /* @__PURE__ */ jsxs("span", { children: [
                  "The code can be found in the store's",
                  " ",
                  /* @__PURE__ */ jsx("strong", { className: "font-semibold text-ink-secondary", children: tt("Staff Settings") }),
                  " page."
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsx(
              AuthButton,
              {
                id: "join-store-submit",
                type: "submit",
                disabled: processing || data.join_code.length < 6,
                icon: processing ? null : /* @__PURE__ */ jsx(Key, { size: 16 }),
                iconAfter: processing ? null : /* @__PURE__ */ jsx(ArrowRight, { size: 16 }),
                children: processing ? /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx(Loader2, { size: 16, className: "animate-spin" }),
                  " Joining…"
                ] }) : "Join Store"
              }
            )
          ] })
        ] }),
        showCodeModal && /* @__PURE__ */ jsx(
          InviteDialog,
          {
            invites,
            onDismissInvite: dismissInvite,
            onClose: () => setShowCodeModal(false),
            code: inviteCode,
            onCodeChange: setInviteCode,
            codeError,
            checking: checkingCode,
            onCheck: handleCheckCode
          }
        )
      ]
    }
  );
}
function InviteDialog({ invites, onDismissInvite, onClose, code, onCodeChange, codeError, checking, onCheck }) {
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-modal-scrim bg-scrim", "aria-hidden": "true" }),
    /* @__PURE__ */ jsx(
      "div",
      {
        role: "dialog",
        "aria-modal": "true",
        "aria-label": "Pending Invitations",
        className: "fixed inset-0 z-modal flex items-center justify-center p-4",
        children: /* @__PURE__ */ jsxs("div", { className: "flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-surface shadow-xl", children: [
          /* @__PURE__ */ jsxs("div", { className: "shrink-0 p-6 sm:p-8", children: [
            /* @__PURE__ */ jsx("h2", { className: "font-display text-xl font-bold text-ink", children: "Pending Invitations" }),
            /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-ink-muted", children: "Manage your pending store invitations or join via short code." })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex min-h-0 flex-col gap-3 overflow-y-auto px-6 pb-4 sm:px-8", children: invites.length > 0 ? invites.map((invite) => /* @__PURE__ */ jsx(
            InviteCard,
            {
              invite,
              onDismiss: () => onDismissInvite(invite.token)
            },
            invite.token
          )) : /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-sunken py-6 text-center", children: [
            /* @__PURE__ */ jsx(Mail, { size: 24, className: "mx-auto mb-2 text-ink-faint" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted", children: "You have no pending invitations." })
          ] }) }),
          /* @__PURE__ */ jsx("div", { className: "shrink-0 border-t border-line bg-sunken p-6 sm:p-8", children: /* @__PURE__ */ jsxs("form", { onSubmit: onCheck, className: "flex flex-col gap-5", children: [
            /* @__PURE__ */ jsx(
              AuthField,
              {
                label: "Have a short code?",
                type: "text",
                value: code,
                onChange: (e) => onCodeChange(e.target.value.toUpperCase()),
                placeholder: "e.g. VQ-A3X9",
                className: "text-center uppercase tracking-widest"
              }
            ),
            codeError ? /* @__PURE__ */ jsx(AuthNotice, { tone: "danger", children: codeError }) : null,
            /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsx(AuthButton, { variant: "secondary", onClick: onClose, children: "Close" }) }),
              /* @__PURE__ */ jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsx(AuthButton, { type: "submit", disabled: checking || !code, children: checking ? "Checking..." : "Check Code" }) })
            ] })
          ] }) })
        ] })
      }
    )
  ] });
}
function InviteCard({ invite, onDismiss }) {
  const [accepting, setAccepting] = useState(false);
  return /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 rounded-lg bg-success-50 p-4 dark:bg-success-500/10", children: [
    /* @__PURE__ */ jsx(Mail, { size: 16, className: "mt-0.5 shrink-0 text-success-600 dark:text-success-400" }),
    /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
      /* @__PURE__ */ jsxs("p", { className: "text-sm font-semibold text-ink", children: [
        "Invited to",
        " ",
        /* @__PURE__ */ jsx("span", { className: "text-success-700 dark:text-success-300", children: invite.store_name })
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "mt-0.5 text-xs text-ink-muted", children: [
        "As ",
        /* @__PURE__ */ jsx("span", { className: "font-medium capitalize text-ink-secondary", children: invite.role }),
        " ·",
        " ",
        invite.plan,
        " plan"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-3 flex gap-2", children: [
        /* @__PURE__ */ jsx(
          Button,
          {
            size: "sm",
            icon: /* @__PURE__ */ jsx(CheckCircle, { size: 12 }),
            disabled: accepting,
            onClick: () => {
              setAccepting(true);
              router.visit(invite.accept_url);
            },
            children: "Accept"
          }
        ),
        /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", onClick: onDismiss, children: "Ignore" })
      ] })
    ] })
  ] });
}
export {
  JoinStore as default
};

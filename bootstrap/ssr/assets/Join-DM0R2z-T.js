import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useForm, Head, Link, router } from "@inertiajs/react";
import { ArrowLeft, Key, Mail, AlertCircle, Store, Loader2, ArrowRight, CheckCircle } from "lucide-react";
function InviteCard({ invite, onDismiss }) {
  const [accepting, setAccepting] = useState(false);
  return /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-start gap-3", children: [
    /* @__PURE__ */ jsx("div", { className: "w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(Mail, { size: 16, className: "text-emerald-400" }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
      /* @__PURE__ */ jsxs("p", { className: "text-sm font-semibold text-white", children: [
        "Invited to ",
        /* @__PURE__ */ jsx("span", { className: "text-emerald-300", children: invite.store_name })
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-400 mt-0.5", children: [
        "As ",
        /* @__PURE__ */ jsx("span", { className: "capitalize font-medium text-slate-300", children: invite.role }),
        " · ",
        invite.plan,
        " plan"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2 mt-3", children: [
        /* @__PURE__ */ jsxs(
          Link,
          {
            href: invite.accept_url,
            onClick: () => setAccepting(true),
            className: "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-400 transition-colors",
            children: [
              /* @__PURE__ */ jsx(CheckCircle, { size: 12 }),
              " Accept"
            ]
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: onDismiss,
            className: "px-3 py-1.5 rounded-lg text-slate-400 text-xs hover:text-slate-200 hover:bg-white/5 transition-colors",
            children: "Ignore"
          }
        )
      ] })
    ] })
  ] });
}
function JoinStore({ pending_invites = [] }) {
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
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-[#02000f] text-white font-sans flex flex-col", children: [
    /* @__PURE__ */ jsx(Head, { title: "Join a Store — VenQore" }),
    /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 pointer-events-none", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute top-1/4 right-1/3 w-[500px] h-[500px] bg-emerald-900/15 rounded-full blur-[120px]" }),
      /* @__PURE__ */ jsx("div", { className: "absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-indigo-900/10 rounded-full blur-[100px]" })
    ] }),
    /* @__PURE__ */ jsxs("header", { className: "relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("img", { src: "/images/logo.png", alt: "VenQore", className: "h-8 w-8 object-contain" }),
        /* @__PURE__ */ jsxs("span", { className: "font-black text-lg text-white", children: [
          "VenQore",
          /* @__PURE__ */ jsx("span", { className: "text-indigo-400", children: "." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(
        Link,
        {
          href: route("store.create-or-join"),
          className: "flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors",
          children: [
            /* @__PURE__ */ jsx(ArrowLeft, { size: 14 }),
            " Back"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { className: "relative z-10 flex-1 flex items-center justify-center p-6", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-md", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-10", children: [
        /* @__PURE__ */ jsx("div", { className: "inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 mb-5", children: /* @__PURE__ */ jsx(Key, { size: 24, className: "text-emerald-400" }) }),
        /* @__PURE__ */ jsx("h1", { className: "text-3xl font-black tracking-tight text-white mb-2", children: "Join a Store" }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-400 text-sm", children: "Ask your store owner for the 7-character join code." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex justify-center mb-10", children: /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: (e) => {
            e.preventDefault();
            setShowCodeModal(true);
          },
          className: "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold text-sm hover:bg-indigo-500/20 transition-all relative",
          children: [
            /* @__PURE__ */ jsx(Mail, { size: 16 }),
            invites.length > 0 ? `View Pending Invites (${invites.length})` : "Check for Invites",
            invites.length > 0 && /* @__PURE__ */ jsxs("span", { className: "absolute -top-1.5 -right-1.5 flex h-3 w-3", children: [
              /* @__PURE__ */ jsx("span", { className: "animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" }),
              /* @__PURE__ */ jsx("span", { className: "relative inline-flex rounded-full h-3 w-3 bg-indigo-500" })
            ] })
          ]
        }
      ) }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-5", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("label", { className: "block text-sm font-semibold text-slate-300 mb-2", children: [
            "Store Join Code ",
            /* @__PURE__ */ jsx("span", { className: "text-red-400", children: "*" })
          ] }),
          /* @__PURE__ */ jsx(
            "input",
            {
              id: "join-code",
              type: "text",
              value: data.join_code,
              onChange: (e) => setData("join_code", formatCode(e.target.value)),
              placeholder: "VQ-XXXX",
              maxLength: 7,
              className: `w-full px-5 py-4 rounded-xl bg-white/5 border text-white placeholder-slate-500
                                    font-mono text-2xl tracking-[0.25em] text-center uppercase
                                    focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-colors
                                    ${errors.join_code ? "border-red-500 bg-red-500/5" : "border-white/10 hover:border-white/20"}`,
              autoFocus: true
            }
          ),
          errors.join_code && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mt-2 text-red-400 text-xs", children: [
            /* @__PURE__ */ jsx(AlertCircle, { size: 12 }),
            " ",
            errors.join_code
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-white/8 bg-white/3 p-4 text-xs text-slate-400 space-y-1.5", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2", children: [
            /* @__PURE__ */ jsx(Store, { size: 12, className: "text-emerald-400 mt-0.5 shrink-0" }),
            /* @__PURE__ */ jsxs("span", { children: [
              "You'll join as a ",
              /* @__PURE__ */ jsx("strong", { className: "text-slate-200", children: "Cashier" }),
              " by default. The store owner can update your role."
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2", children: [
            /* @__PURE__ */ jsx(Key, { size: 12, className: "text-emerald-400 mt-0.5 shrink-0" }),
            /* @__PURE__ */ jsxs("span", { children: [
              "The code can be found in the store's ",
              /* @__PURE__ */ jsx("strong", { className: "text-slate-200", children: "Staff Settings" }),
              " page."
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            id: "join-store-submit",
            type: "submit",
            disabled: processing || data.join_code.length < 6,
            className: "w-full flex items-center justify-center gap-3 py-4 rounded-xl\n                                bg-gradient-to-r from-emerald-500 to-teal-600\n                                hover:from-emerald-400 hover:to-teal-500\n                                text-white font-bold text-base transition-all\n                                hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-500/25\n                                disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed",
            children: processing ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Loader2, { size: 18, className: "animate-spin" }),
              " Joining…"
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Key, { size: 18 }),
              " Join Store ",
              /* @__PURE__ */ jsx(ArrowRight, { size: 16 })
            ] })
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "text-center text-xs text-slate-500 mt-6", children: [
        "Want to create your own store?",
        " ",
        /* @__PURE__ */ jsx(Link, { href: route("store.create"), className: "text-slate-400 hover:text-indigo-400 transition-colors underline underline-offset-2", children: "Create a store" })
      ] })
    ] }) }),
    showCodeModal && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm", children: /* @__PURE__ */ jsxs("div", { className: "bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg relative overflow-hidden flex flex-col max-h-[85vh]", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 p-8 pt-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mt-10 -mr-10 pointer-events-none" }),
      /* @__PURE__ */ jsxs("div", { className: "p-5 sm:p-8 shrink-0", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-black text-white mb-2", children: "Pending Invitations" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400", children: "Manage your pending store invitations or join via short code." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "px-8 pb-4 overflow-y-auto min-h-0 space-y-3 custom-scrollbar text-left", children: invites.length > 0 ? invites.map((invite) => /* @__PURE__ */ jsx(
        InviteCard,
        {
          invite,
          onDismiss: () => dismissInvite(invite.token)
        },
        invite.token
      )) : /* @__PURE__ */ jsxs("div", { className: "text-center py-6 rounded-2xl border border-slate-800 bg-slate-800/30", children: [
        /* @__PURE__ */ jsx(Mail, { size: 24, className: "text-slate-500 mx-auto mb-2" }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-400 text-sm", children: "You have no pending invitations." })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "p-5 sm:p-8 shrink-0 border-t border-slate-800 bg-slate-900/50", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-slate-300 mb-3 text-left", children: "Have a short code?" }),
        /* @__PURE__ */ jsxs("form", { onSubmit: handleCheckCode, children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              placeholder: "e.g. VQ-A3X9",
              value: inviteCode,
              onChange: (e) => setInviteCode(e.target.value.toUpperCase()),
              className: "w-full bg-slate-800 border items-center text-center font-mono tracking-[0.2em] border-slate-700 text-white text-lg rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors shadow-inner"
            }
          ),
          codeError && /* @__PURE__ */ jsxs("p", { className: "text-xs font-bold text-red-400 mt-2 flex items-center gap-1 justify-center", children: [
            /* @__PURE__ */ jsx(AlertCircle, { size: 12 }),
            " ",
            codeError
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-3 mt-6", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setShowCodeModal(false),
                className: "flex-1 py-3 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-bold transition-colors",
                children: "Close"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "submit",
                disabled: checkingCode || !inviteCode,
                className: "flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold transition-colors shadow-lg shadow-indigo-600/20",
                children: checkingCode ? "Checking..." : "Check Code"
              }
            )
          ] })
        ] })
      ] })
    ] }) })
  ] });
}
export {
  JoinStore as default
};

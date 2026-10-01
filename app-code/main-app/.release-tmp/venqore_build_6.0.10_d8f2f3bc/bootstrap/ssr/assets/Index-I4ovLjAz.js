import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { usePage, Head, Link, router } from "@inertiajs/react";
import { Zap, Mail, AlertCircle, Plus, ArrowRight, Clock, RefreshCw, ChevronRight, CheckCircle, ShoppingBag, Calculator, Building2, Store, Users, Crown } from "lucide-react";
const PLAN_CONFIG = {
  trial: { label: "Trial", color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" },
  starter: { label: "Starter", color: "text-neutral-300", bg: "bg-neutral-400/10", border: "border-line-strong" },
  growth: { label: "Growth", color: "text-brand-300", bg: "bg-brand-400/10", border: "border-brand-400/20" },
  business: { label: "Business", color: "text-brand-300", bg: "bg-brand-400/10", border: "border-brand-400/20" },
  ltd: { label: "Lifetime", color: "text-emerald-300", bg: "bg-emerald-400/10", border: "border-emerald-400/20" }
};
const ROLE_LABELS = {
  owner: { label: "Owner", icon: Crown, color: "text-amber-400" },
  admin: { label: "Admin", icon: Zap, color: "text-brand-400" },
  manager: { label: "Manager", icon: Users, color: "text-blue-400" },
  cashier: { label: "Cashier", icon: Store, color: "text-emerald-400" },
  viewer: { label: "Viewer", icon: Building2, color: "text-ink-muted" },
  // PROBLEM 8 FIX: Added missing roles so they don't fall back to "Viewer"
  accountant: { label: "Accountant", icon: Calculator, color: "text-blue-400" },
  purchasing_officer: { label: "Purchasing Officer", icon: ShoppingBag, color: "text-orange-400" }
};
function PlanBadge({ plan }) {
  const cfg = PLAN_CONFIG[plan] ?? PLAN_CONFIG.starter;
  return /* @__PURE__ */ jsx("span", { className: `inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${cfg.color} ${cfg.bg} ${cfg.border}`, children: cfg.label });
}
function RoleChip({ role, customRoleName }) {
  const cfg = ROLE_LABELS[role] ?? ROLE_LABELS.viewer;
  const Icon = cfg.icon;
  const label = (role === "custom" || !role) && customRoleName ? customRoleName : cfg.label;
  return /* @__PURE__ */ jsxs("span", { className: `inline-flex items-center gap-1 text-xs font-medium ${cfg.color}`, children: [
    /* @__PURE__ */ jsx(Icon, { size: 11 }),
    " ",
    label
  ] });
}
function StoreCard({ membership, isLast }) {
  const [navigating, setNavigating] = useState(false);
  const daysLeft = membership.status === "trial" && membership.trial_ends_at ? Math.max(0, Math.ceil((new Date(membership.trial_ends_at) - Date.now()) / 864e5)) : null;
  const go = () => {
    setNavigating(true);
    router.visit(membership.url);
  };
  return /* @__PURE__ */ jsx(
    "button",
    {
      onClick: go,
      disabled: navigating,
      className: `group w-full text-left rounded-2xl border p-5 transition-all duration-normal hover:shadow-xl active:scale-[0.99] disabled:opacity-60 ${isLast ? "border-brand-500/40 bg-brand-500/5 hover:bg-brand-500/10 hover:border-brand-400/60" : "border-white/8 bg-white/3 hover:bg-white/6 hover:border-white/15"}`,
      children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsx("div", { className: `w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shrink-0 ${isLast ? "bg-brand-500/20 text-brand-300" : "bg-white/8 text-white"}`, children: membership.store_name.charAt(0).toUpperCase() }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap mb-1", children: [
            /* @__PURE__ */ jsx("span", { className: "font-bold text-white truncate", children: membership.store_name }),
            isLast && /* @__PURE__ */ jsx("span", { className: "text-2xs font-bold text-brand-400 bg-brand-400/10 border border-brand-400/20 rounded-full px-2 py-0.5", children: "Last used" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 flex-wrap", children: [
            /* @__PURE__ */ jsx(PlanBadge, { plan: membership.plan }),
            /* @__PURE__ */ jsx(RoleChip, { role: membership.role, customRoleName: membership.custom_role_name }),
            daysLeft !== null && daysLeft <= 7 && /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 text-xs text-amber-400", children: [
              /* @__PURE__ */ jsx(Clock, { size: 10 }),
              daysLeft === 0 ? "Trial expired" : `${Math.ceil(daysLeft)}d left`
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: `shrink-0 transition-transform duration-normal group-hover:translate-x-1 ${navigating ? "opacity-0" : ""}`, children: navigating ? /* @__PURE__ */ jsx(RefreshCw, { size: 18, className: "text-brand-400 animate-spin" }) : /* @__PURE__ */ jsx(ChevronRight, { size: 18, className: "text-ink-muted group-hover:text-brand-400" }) })
      ] })
    }
  );
}
function InviteCard({ invite, onDismiss }) {
  const [accepting, setAccepting] = useState(false);
  return /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-start gap-3", children: [
    /* @__PURE__ */ jsx("div", { className: "w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(Mail, { size: 16, className: "text-emerald-400" }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
      /* @__PURE__ */ jsxs("p", { className: "text-sm font-semibold text-white", children: [
        "Invited to ",
        /* @__PURE__ */ jsx("span", { className: "text-emerald-300", children: invite.store_name })
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "text-xs text-ink-muted mt-0.5", children: [
        "As ",
        /* @__PURE__ */ jsx("span", { className: "capitalize font-medium text-neutral-300", children: invite.role }),
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
            className: "px-3 py-1.5 rounded-lg text-ink-muted text-xs hover:text-neutral-200 hover:bg-white/5 transition-colors",
            children: "Ignore"
          }
        )
      ] })
    ] })
  ] });
}
function HubIndex({ memberships = [], pending_invites = [] }) {
  const { props } = usePage();
  const settings = props.settings || {};
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
  const dismissInvite = (token) => {
    setInvites((prev) => prev.filter((i) => i.token !== token));
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
  const activeMemberships = memberships.filter((m) => m.status !== "suspended");
  memberships.find((m) => m.is_last_used);
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-void-950 text-white font-sans", children: [
    /* @__PURE__ */ jsx(Head, { title: "Your Stores — VenQore" }),
    /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 pointer-events-none overflow-hidden", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-brand-900/20 rounded-full blur-[120px]" }),
      /* @__PURE__ */ jsx("div", { className: "absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-brand-900/15 rounded-full blur-[100px]" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "relative z-10 min-h-screen flex flex-col items-center justify-center p-6", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-lg", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 p-6", children: /* @__PURE__ */ jsxs(
        Link,
        {
          href: route("logout"),
          method: "post",
          as: "button",
          className: "text-xs font-bold text-ink-muted hover:text-white transition-colors flex items-center gap-2 group",
          children: [
            /* @__PURE__ */ jsx("span", { className: "opacity-0 group-hover:opacity-100 transition-opacity", children: "Sign out" }),
            /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-red-500/20 group-hover:border-red-500/40 transition-all", children: /* @__PURE__ */ jsx(Zap, { size: 14, className: "group-hover:text-red-400" }) })
          ]
        }
      ) }),
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-10", children: [
        /* @__PURE__ */ jsx("div", { className: "inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mb-5 shadow-xl overflow-hidden", children: /* @__PURE__ */ jsx("img", { src: settings.logo_url || "/images/logo.png", alt: "Logo", className: "w-10 h-10 object-contain" }) }),
        /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold text-white tracking-tight", children: [
          "Welcome back to ",
          settings.app_name || "VenQore"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-ink-muted text-sm mt-1", children: "Select a store to continue" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex justify-center mb-6", children: /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setShowCodeModal(true),
          className: "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 font-bold text-sm hover:bg-brand-500/20 transition-all relative",
          children: [
            /* @__PURE__ */ jsx(Mail, { size: 16 }),
            invites.length > 0 ? `View Pending Invites (${invites.length})` : "Check for Invites",
            invites.length > 0 && /* @__PURE__ */ jsxs("span", { className: "absolute -top-1.5 -right-1.5 flex h-3 w-3", children: [
              /* @__PURE__ */ jsx("span", { className: "animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" }),
              /* @__PURE__ */ jsx("span", { className: "relative inline-flex rounded-full h-3 w-3 bg-brand-500" })
            ] })
          ]
        }
      ) }),
      /* @__PURE__ */ jsx("div", { className: "space-y-2 mb-6", children: activeMemberships.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-12 rounded-2xl border border-white/8 bg-white/3", children: [
        /* @__PURE__ */ jsx(AlertCircle, { size: 32, className: "text-ink-muted mx-auto mb-3" }),
        /* @__PURE__ */ jsx("p", { className: "text-ink-muted text-sm", children: "No active stores found" })
      ] }) : activeMemberships.map((m) => /* @__PURE__ */ jsx(
        StoreCard,
        {
          membership: m,
          isLast: m.is_last_used
        },
        m.store_id
      )) }),
      /* @__PURE__ */ jsx("div", { className: "border-t border-white/8 pt-5", children: /* @__PURE__ */ jsxs(
        Link,
        {
          href: route("store.create"),
          className: "group flex items-center justify-between w-full px-5 py-4 rounded-2xl border border-dashed border-white/15 hover:border-brand-500/40 hover:bg-brand-500/5 transition-all duration-normal",
          children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: "w-9 h-9 rounded-xl bg-white/5 group-hover:bg-brand-500/15 border border-white/10 group-hover:border-brand-500/30 flex items-center justify-center transition-all", children: /* @__PURE__ */ jsx(Plus, { size: 16, className: "text-ink-muted group-hover:text-brand-400 transition-colors" }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-neutral-300 group-hover:text-white transition-colors", children: "Create a new store" }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted", children: "Pick a plan · 14-day free trial · Cancel anytime" })
              ] })
            ] }),
            /* @__PURE__ */ jsx(ArrowRight, { size: 16, className: "text-ink-muted group-hover:text-brand-400 group-hover:translate-x-0.5 transition-all" })
          ]
        }
      ) }),
      /* @__PURE__ */ jsxs("p", { className: "text-center text-xs text-ink-secondary mt-4", children: [
        "Have a permanent store code?",
        "",
        /* @__PURE__ */ jsx(Link, { href: route("store.join"), className: "text-ink-muted hover:text-brand-400 transition-colors underline underline-offset-2", children: "Join via link" })
      ] })
    ] }) }),
    showCodeModal && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm", children: /* @__PURE__ */ jsxs("div", { className: "bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl w-full max-w-lg relative overflow-hidden flex flex-col max-h-[85vh]", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 p-8 pt-0 w-32 h-32 bg-brand-500/10 rounded-full blur-2xl -mt-10 -mr-10 pointer-events-none" }),
      /* @__PURE__ */ jsxs("div", { className: "p-8 shrink-0", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-white mb-2", children: "Pending Invitations" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted", children: "Manage your pending store invitations or join via short code." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "px-8 pb-4 overflow-y-auto min-h-0 space-y-3 custom-scrollbar", children: invites.length > 0 ? invites.map((invite) => /* @__PURE__ */ jsx(
        InviteCard,
        {
          invite,
          onDismiss: () => dismissInvite(invite.token)
        },
        invite.token
      )) : /* @__PURE__ */ jsxs("div", { className: "text-center py-6 rounded-2xl border border-neutral-800 bg-neutral-800/30", children: [
        /* @__PURE__ */ jsx(Mail, { size: 24, className: "text-ink-secondary mx-auto mb-2" }),
        /* @__PURE__ */ jsx("p", { className: "text-ink-muted text-sm", children: "You have no pending invitations." })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "p-8 shrink-0 border-t border-neutral-800 bg-neutral-900/50", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-neutral-300 mb-3", children: "Have a short code?" }),
        /* @__PURE__ */ jsxs("form", { onSubmit: handleCheckCode, children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              placeholder: "e.g. VQ-A3X9",
              value: inviteCode,
              onChange: (e) => setInviteCode(e.target.value.toUpperCase()),
              className: "w-full bg-neutral-800 border items-center text-center font-mono tracking-[0.2em] border-neutral-700 text-white text-lg rounded-xl px-4 py-3 focus:outline-none focus:border-brand-500 transition-colors shadow-inner"
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
                className: "flex-1 py-3 rounded-xl border border-neutral-700 hover:bg-interactive-hover text-neutral-300 font-bold transition-colors",
                children: "Close"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "submit",
                disabled: checkingCode || !inviteCode,
                className: "flex-1 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-bold transition-colors shadow-lg ",
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
  HubIndex as default
};

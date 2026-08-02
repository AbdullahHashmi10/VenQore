import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import { useForm, Head, router } from "@inertiajs/react";
import { Shield, Building2, User, Briefcase, CheckCircle, XCircle } from "lucide-react";
function InviteAccept({ invitation, store, admin_name, token }) {
  const { post, processing } = useForm({ token });
  const accept = () => post("/invite/accept", { preserveState: true, preserveScroll: true });
  const decline = () => router.post("/invite/decline", { token }, { preserveState: true, preserveScroll: true });
  const roles = invitation?.roles || ["cashier"];
  const roleLabels = {
    admin: "Admin",
    manager: "Manager",
    cashier: "Cashier",
    inventory_staff: "Inventory Staff",
    accountant: "Accountant",
    support: "Support",
    custom: "Custom",
    viewer: "Viewer"
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4 sm:p-6", children: [
    /* @__PURE__ */ jsx(Head, { title: "Accept Invitation — VenQore" }),
    /* @__PURE__ */ jsxs("div", { className: "w-full max-w-md", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-6 sm:mb-8", children: [
        /* @__PURE__ */ jsx("div", { className: "w-12 h-12 sm:w-16 sm:h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-2xl shadow-indigo-500/40", children: /* @__PURE__ */ jsx(Shield, { className: "text-white w-6 h-6 sm:w-8 sm:h-8" }) }),
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-black text-white", children: "VenQore" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-8 shadow-2xl", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-white mb-1", children: "You're invited!" }),
        /* @__PURE__ */ jsxs("p", { className: "text-slate-400 text-sm mb-6 sm:mb-8", children: [
          /* @__PURE__ */ jsx("strong", { className: "text-indigo-400", children: admin_name }),
          " has invited you to join their store on VenQore."
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 bg-white/5 rounded-2xl border border-white/10 mb-3 sm:mb-4", children: [
          /* @__PURE__ */ jsx("div", { className: "w-10 h-10 sm:w-12 sm:h-12 bg-indigo-600/30 rounded-xl flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(Building2, { className: "text-indigo-400 w-5 h-5 sm:w-[22px] sm:h-[22px]" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-2xs sm:text-xs text-slate-400 uppercase tracking-wider", children: "Store" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm sm:text-base font-bold text-white leading-tight", children: store?.name })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 bg-white/5 rounded-2xl border border-white/10 mb-3 sm:mb-4", children: [
          /* @__PURE__ */ jsx("div", { className: "w-10 h-10 sm:w-12 sm:h-12 bg-emerald-600/30 rounded-xl flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(User, { className: "text-emerald-400 w-5 h-5 sm:w-[22px] sm:h-[22px]" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-2xs sm:text-xs text-slate-400 uppercase tracking-wider", children: "Invited As" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm sm:text-base font-bold text-white leading-tight", children: invitation?.invitee_name }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400/90 leading-tight mt-0.5", children: invitation?.invitee_email })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 sm:gap-4 p-3.5 sm:p-4 bg-white/5 rounded-2xl border border-white/10 mb-6 sm:mb-8", children: [
          /* @__PURE__ */ jsx("div", { className: "w-10 h-10 sm:w-12 sm:h-12 bg-violet-600/30 rounded-xl flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(Briefcase, { className: "text-violet-400 w-5 h-5 sm:w-[22px] sm:h-[22px]" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-2xs sm:text-xs text-slate-400 uppercase tracking-wider mb-2", children: "Your Role(s)" }),
            /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1.5 sm:gap-2", children: roles.map((r) => /* @__PURE__ */ jsx("span", { className: "px-2.5 py-0.5 sm:px-3 sm:py-1 bg-indigo-600/40 text-indigo-200 rounded-full text-2xs sm:text-xs font-bold border border-indigo-500/30", children: roleLabels[r] || r }, r)) })
          ] })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 mb-5 sm:mb-6 text-center leading-relaxed", children: "After accepting, you will be redirected to the store hub to access your dashboard." }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-3", children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: accept,
              disabled: processing,
              className: "w-full sm:flex-1 order-1 sm:order-2 flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-500/30 transition-all active:scale-95",
              children: [
                /* @__PURE__ */ jsx(CheckCircle, { size: 18 }),
                processing ? "Accepting..." : "Accept Invite"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: decline,
              disabled: processing,
              className: "w-full sm:flex-1 order-2 sm:order-1 flex items-center justify-center gap-2 py-3.5 bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-slate-300 hover:text-red-300 rounded-2xl font-bold text-sm transition-all",
              children: [
                /* @__PURE__ */ jsx(XCircle, { size: 18 }),
                " Decline"
              ]
            }
          )
        ] })
      ] })
    ] })
  ] });
}
export {
  InviteAccept as default
};

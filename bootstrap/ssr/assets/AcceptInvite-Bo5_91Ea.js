import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useForm, Head } from "@inertiajs/react";
import { Users, Store, Zap, Crown, Mail, EyeOff, Eye, Loader2, CheckCircle, ArrowRight } from "lucide-react";
const ROLE_INFO = {
  owner: { label: "Owner", icon: Crown, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" },
  admin: { label: "Admin", icon: Zap, color: "text-indigo-400", bg: "bg-indigo-400/10", border: "border-indigo-400/20" },
  manager: { label: "Manager", icon: Users, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" },
  cashier: { label: "Cashier", icon: Store, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
  viewer: { label: "Viewer", icon: Users, color: "text-slate-400", bg: "bg-slate-400/10", border: "border-slate-400/20" }
};
function AcceptInvite({ token, invite_email, store_name, role }) {
  const [showPass, setShowPass] = useState(false);
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
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-void-950 text-white font-sans flex flex-col items-center justify-center p-6", children: [
    /* @__PURE__ */ jsx(Head, { title: `Join ${store_name} — VenQore` }),
    /* @__PURE__ */ jsx("div", { className: "fixed inset-0 pointer-events-none", children: /* @__PURE__ */ jsx("div", { className: "absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-indigo-900/15 rounded-full blur-[120px]" }) }),
    /* @__PURE__ */ jsxs("div", { className: "relative z-10 w-full max-w-md", children: [
      /* @__PURE__ */ jsx("div", { className: "flex justify-center mb-8", children: /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center", children: /* @__PURE__ */ jsx("img", { src: "/images/logo.png", alt: "VenQore", className: "w-10 h-10 object-contain" }) }) }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/3 p-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-center mb-8", children: [
          /* @__PURE__ */ jsxs("div", { className: `inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium mb-4 ${roleInfo.color} ${roleInfo.bg} ${roleInfo.border}`, children: [
            /* @__PURE__ */ jsx(RoleIcon, { size: 14 }),
            roleInfo.label
          ] }),
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-black text-white tracking-tight mb-2", children: "You're invited!" }),
          /* @__PURE__ */ jsxs("p", { className: "text-slate-300 text-sm", children: [
            /* @__PURE__ */ jsx("strong", { className: "text-white", children: store_name }),
            " has invited you to join as a",
            " ",
            /* @__PURE__ */ jsx("strong", { className: roleInfo.color, children: roleInfo.label }),
            "."
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-2 mt-3 text-xs text-slate-500", children: [
            /* @__PURE__ */ jsx(Mail, { size: 12 }),
            /* @__PURE__ */ jsxs("span", { children: [
              "Sent to: ",
              /* @__PURE__ */ jsx("span", { className: "text-slate-300", children: invite_email })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "space-y-4", children: [
          /* @__PURE__ */ jsx("input", { type: "hidden", value: token, name: "token" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("label", { className: "block text-sm font-semibold text-slate-300 mb-2", children: [
              "Your Name ",
              /* @__PURE__ */ jsx("span", { className: "text-red-400", children: "*" })
            ] }),
            /* @__PURE__ */ jsx(
              "input",
              {
                id: "invite-name",
                type: "text",
                value: data.name,
                onChange: (e) => setData("name", e.target.value),
                placeholder: "How should we call you?",
                className: `w-full px-4 py-3 rounded-xl bg-white/5 border text-white placeholder-slate-600
                                    focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors
                                    ${errors.name ? "border-red-500" : "border-white/10 hover:border-white/20"}`,
                autoFocus: true
              }
            ),
            errors.name && /* @__PURE__ */ jsx("p", { className: "text-red-400 text-xs mt-1", children: errors.name })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("label", { className: "block text-sm font-semibold text-slate-300 mb-2", children: [
              "Set a Password ",
              /* @__PURE__ */ jsx("span", { className: "text-slate-500 font-normal", children: "(skip if you already have an account)" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  id: "invite-password",
                  type: showPass ? "text" : "password",
                  value: data.password,
                  onChange: (e) => setData("password", e.target.value),
                  placeholder: "Min 8 characters",
                  className: `w-full px-4 py-3 pr-11 rounded-xl bg-white/5 border text-white placeholder-slate-600
                                        focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors
                                        ${errors.password ? "border-red-500" : "border-white/10 hover:border-white/20"}`
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => setShowPass(!showPass),
                  className: "absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors",
                  children: showPass ? /* @__PURE__ */ jsx(EyeOff, { size: 16 }) : /* @__PURE__ */ jsx(Eye, { size: 16 })
                }
              )
            ] }),
            errors.password && /* @__PURE__ */ jsx("p", { className: "text-red-400 text-xs mt-1", children: errors.password })
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              id: "accept-invite-submit",
              type: "submit",
              disabled: processing || !data.name,
              className: "w-full flex items-center justify-center gap-3 py-4 rounded-xl\n                                bg-gradient-to-r from-indigo-500 to-purple-600\n                                hover:from-indigo-400 hover:to-purple-500\n                                text-white font-bold text-base transition-all\n                                hover:scale-[1.02] hover:shadow-xl hover:shadow-indigo-500/25\n                                disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed mt-2",
              children: processing ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Loader2, { size: 18, className: "animate-spin" }),
                " Joining…"
              ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(CheckCircle, { size: 18 }),
                " Accept & Enter Store ",
                /* @__PURE__ */ jsx(ArrowRight, { size: 16 })
              ] })
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-center text-xs text-slate-600 mt-5", children: [
          "By joining, you agree to VenQore's",
          " ",
          /* @__PURE__ */ jsx("a", { href: "/terms", className: "text-slate-500 hover:text-slate-300 underline", children: "Terms of Service" }),
          "."
        ] })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-center text-xs text-slate-600 mt-4", children: "If you weren't expecting this invite, you can safely close this page." })
    ] })
  ] });
}
export {
  AcceptInvite as default
};

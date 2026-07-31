import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import { useForm, Head } from "@inertiajs/react";
import { ArrowLeft, Shield, Briefcase, User, ShoppingCart, Calculator, Eye } from "lucide-react";
function DemoLanding() {
  const { post, processing } = useForm();
  const roles = [
    { id: "owner", name: "Store Owner", icon: Shield, desc: "Full access to all features", color: "text-purple-500", bg: "bg-purple-500/10" },
    { id: "admin", name: "Store Admin", icon: Briefcase, desc: "Operations & staff management", color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { id: "manager", name: "Manager", icon: User, desc: "Reports and floor supervision", color: "text-blue-500", bg: "bg-blue-500/10" },
    { id: "cashier", name: "Cashier", icon: ShoppingCart, desc: "POS checkout only", color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { id: "accountant", name: "Accountant", icon: Calculator, desc: "Finance and journals", color: "text-rose-500", bg: "bg-rose-500/10" },
    { id: "viewer", name: "Viewer", icon: Eye, desc: "Read-only reports", color: "text-slate-500", bg: "bg-slate-500/10" }
  ];
  const loginAs = (roleId) => {
    window.location.href = route("demo.login", { role: roleId });
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-[#020010] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden", children: [
    /* @__PURE__ */ jsx(Head, { title: "VenQore Live Demo" }),
    /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[url('/images/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" }),
    /* @__PURE__ */ jsx("div", { className: "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none" }),
    /* @__PURE__ */ jsxs("div", { className: "relative z-10 w-full max-w-4xl", children: [
      /* @__PURE__ */ jsxs("a", { href: "/", className: "inline-flex items-center gap-2 text-indigo-400 hover:text-white mb-12 transition-colors font-bold tracking-widest uppercase text-xs", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { size: 16 }),
        " Back to VenQore"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-16", children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-5xl md:text-7xl font-black tracking-tighter mb-6 uppercase leading-none", children: [
          "Live Demo ",
          /* @__PURE__ */ jsx("span", { className: "text-indigo-500", children: "Store." })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-xl text-slate-400 max-w-2xl mx-auto", children: "A real, shared environment with sample data. No sign-up required. Choose a role below to see exactly what that staff member sees." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: roles.map((role) => {
        const Icon = role.icon;
        return /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => loginAs(role.id),
            disabled: processing,
            className: "group p-6 text-left rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/10 hover:border-indigo-500/50 transition-all active:scale-95",
            children: [
              /* @__PURE__ */ jsx("div", { className: `w-12 h-12 rounded-2xl ${role.bg} ${role.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`, children: /* @__PURE__ */ jsx(Icon, { size: 24 }) }),
              /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold mb-2", children: role.name }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400", children: role.desc })
            ]
          },
          role.id
        );
      }) }),
      /* @__PURE__ */ jsx("div", { className: "mt-20 text-center text-slate-500 text-sm", children: "⚠️ The demo store resets automatically every 24 hours. Data is shared among all active demo visitors." })
    ] })
  ] });
}
export {
  DemoLanding as default
};

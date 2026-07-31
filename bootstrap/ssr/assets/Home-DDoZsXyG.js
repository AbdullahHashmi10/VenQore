import { jsxs, jsx } from "react/jsx-runtime";
import { useRef } from "react";
import { usePage, Head, Link } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-C-94hBqK.js";
import { T as TodaysOpportunities } from "./TodaysOpportunities-B1Ak229A.js";
import { Zap, ShoppingCart, ShoppingBag, DollarSign, Users, Package, Activity, ArrowRight } from "lucide-react";
import "axios";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "laravel-echo";
import "pusher-js";
import "driver.js";
import "./format-B_ph0Qec.js";
const FeatureCard = ({ icon: Icon, title, description, colorClass, glowColor, routeName }) => {
  const cardRef = useRef(null);
  const glowRef = useRef(null);
  const handleMouseMove = (e) => {
    if (!cardRef.current || !glowRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / centerY * -10;
    const rotateY = (x - centerX) / centerX * 10;
    cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    const glowX = x / rect.width * 100;
    const glowY = y / rect.height * 100;
    glowRef.current.style.opacity = "1";
    glowRef.current.style.background = `radial-gradient(circle at ${glowX}% ${glowY}%, rgba(255,255,255,0.2), transparent 70%)`;
  };
  const handleMouseLeave = () => {
    if (!cardRef.current || !glowRef.current) return;
    cardRef.current.style.transform = "perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)";
    glowRef.current.style.opacity = "0";
  };
  return /* @__PURE__ */ jsxs(
    Link,
    {
      href: typeof route === "function" ? route(routeName, { store_slug: usePage().props.store?.slug }) : "#",
      className: "group relative w-full h-full min-h-[220px] cursor-pointer block",
      onMouseMove: handleMouseMove,
      onMouseLeave: handleMouseLeave,
      children: [
        /* @__PURE__ */ jsx("div", { className: `absolute inset-0 ${colorClass} rounded-3xl blur-[60px] opacity-10 group-hover:opacity-30 transition-opacity duration-500` }),
        /* @__PURE__ */ jsxs(
          "div",
          {
            ref: cardRef,
            className: "relative h-full w-full bg-white dark:bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-white/10 p-6 flex flex-col items-center text-center transition-transform duration-100 ease-out will-change-transform shadow-sm group-hover:shadow-xl dark:shadow-none",
            style: { transformStyle: "preserve-3d" },
            children: [
              /* @__PURE__ */ jsx("div", { ref: glowRef, className: "absolute inset-0 transition-opacity duration-300 pointer-events-none opacity-0 mix-blend-soft-light z-20 rounded-3xl" }),
              /* @__PURE__ */ jsxs("div", { className: "relative z-10 flex-1 flex flex-col items-center justify-center", children: [
                /* @__PURE__ */ jsx("div", { className: `mb-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 ${glowColor} shadow-inner group-hover:scale-110 transition-transform duration-300`, children: /* @__PURE__ */ jsx(Icon, { size: 32 }) }),
                /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold mb-2 text-slate-800 dark:text-white group-hover:text-indigo-500 dark:group-hover:text-indigo-300 transition-colors", children: title }),
                /* @__PURE__ */ jsx("p", { className: "text-slate-500 dark:text-slate-400 text-sm font-light", children: description })
              ] })
            ]
          }
        )
      ]
    }
  );
};
function Home({ recentActivity = [] }) {
  const { props } = usePage();
  const user = props.auth.user;
  const store = props.store;
  const userRole = user?.role;
  const userPerms = user?.permissions || [];
  const isFullAccess = userRole === "owner" || userRole === "admin" || userRole === "manager";
  const hasPerm = (...keys) => isFullAccess || keys.some((k) => userPerms.some((p) => p === k || p.startsWith(k + ".")));
  const rawShortcuts = [
    {
      name: "Point of Sale",
      icon: Zap,
      route: "store.pos",
      description: "Process sales instantly.",
      colorClass: "bg-indigo-600",
      glowColor: "text-indigo-500 dark:text-indigo-400",
      perm: () => hasPerm("pos")
    },
    {
      name: "New Sale",
      icon: ShoppingCart,
      route: "store.sales.invoice.create",
      description: "Create detailed invoice.",
      colorClass: "bg-blue-600",
      glowColor: "text-blue-500 dark:text-blue-400",
      perm: () => hasPerm("sales")
    },
    {
      name: "New Purchase",
      icon: ShoppingBag,
      route: "store.purchases.create",
      description: "Stock up inventory.",
      colorClass: "bg-emerald-600",
      glowColor: "text-emerald-500 dark:text-emerald-400",
      perm: () => hasPerm("purchases")
    },
    {
      name: "New Expense",
      icon: DollarSign,
      route: "store.expenses.index",
      description: "Record business costs.",
      colorClass: "bg-amber-600",
      glowColor: "text-amber-500 dark:text-amber-400",
      perm: () => hasPerm("finance.expenses")
    },
    {
      name: "All Parties",
      icon: Users,
      route: "store.parties.index",
      description: "Manage customers & suppliers.",
      colorClass: "bg-purple-600",
      glowColor: "text-purple-500 dark:text-purple-400",
      perm: () => hasPerm("purchases.suppliers", "admin.staff_view", "sales")
    },
    {
      name: "All Inventory",
      icon: Package,
      route: "store.inventory.index",
      description: "View full product list.",
      colorClass: "bg-pink-600",
      glowColor: "text-pink-500 dark:text-pink-400",
      perm: () => hasPerm("inventory")
    }
  ];
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { activeMenu: "Home", children: [
    /* @__PURE__ */ jsx(Head, { title: "Home" }),
    /* @__PURE__ */ jsxs("div", { className: "h-full flex flex-col relative overflow-y-auto custom-scrollbar p-6 md:p-8", children: [
      /* @__PURE__ */ jsx("div", { className: "hidden dark:block fixed top-0 right-0 w-[800px] h-[800px] bg-indigo-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" }),
      /* @__PURE__ */ jsx("div", { className: "hidden dark:block fixed bottom-0 left-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 pointer-events-none" }),
      /* @__PURE__ */ jsx("div", { className: "hidden dark:block fixed inset-0 bg-[url('/images/noise.svg')] opacity-20 pointer-events-none" }),
      /* @__PURE__ */ jsxs("div", { className: "mb-10 relative z-10 shrink-0", children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold text-slate-800 dark:text-white tracking-tight mb-2 uppercase", children: [
          "Welcome back, ",
          user?.name?.split(" ")[0] || "Partner"
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px] font-black", children: [
          "Monitoring ",
          store?.name || "Your Store"
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex flex-wrap justify-center gap-8 mb-12 relative z-10 shrink-0", children: rawShortcuts.filter((s) => !s.perm || s.perm()).map((shortcut, index) => /* @__PURE__ */ jsx("div", { className: "w-full md:w-[300px]", children: /* @__PURE__ */ jsx(
        FeatureCard,
        {
          title: shortcut.name,
          icon: shortcut.icon,
          description: shortcut.description,
          routeName: shortcut.route,
          colorClass: shortcut.colorClass,
          glowColor: shortcut.glowColor
        }
      ) }, index)) }),
      hasPerm("reports") && /* @__PURE__ */ jsx("div", { className: "mb-8 relative z-10 shrink-0", children: /* @__PURE__ */ jsx(TodaysOpportunities, {}) }),
      hasPerm("sales", "reports") && /* @__PURE__ */ jsxs("div", { className: "flex-1 bg-white dark:bg-black/20 rounded-3xl p-8 border border-slate-200 dark:border-white/5 backdrop-blur-sm relative z-10 flex flex-col min-h-[400px] shadow-sm mb-6 xl:mb-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-6 shrink-0", children: [
          /* @__PURE__ */ jsxs("h2", { className: "text-xl font-bold text-slate-800 dark:text-white flex items-center gap-3", children: [
            /* @__PURE__ */ jsx(Activity, { size: 24, className: "text-indigo-500 dark:text-indigo-400" }),
            "Recent Activity"
          ] }),
          /* @__PURE__ */ jsx(Link, { href: route("store.sales.index", { store_slug: store?.slug }), className: "text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-bold transition-colors", children: "View All" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 xl:overflow-y-auto custom-scrollbar pr-2 space-y-4", children: [
          recentActivity.map((activity, i) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-100 dark:border-white/5 transition-colors group cursor-pointer", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
              /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400", children: /* @__PURE__ */ jsx(ArrowRight, { size: 20, className: "-rotate-45" }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-800 dark:text-white", children: activity.title }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 dark:text-slate-400 mt-1", children: activity.subtitle })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
              /* @__PURE__ */ jsx("p", { className: "font-bold text-emerald-600 dark:text-emerald-400", children: activity.amount }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 mt-1", children: activity.time })
            ] })
          ] }, i)),
          recentActivity.length === 0 && /* @__PURE__ */ jsx("div", { className: "py-12 text-center text-slate-400", children: /* @__PURE__ */ jsx("p", { children: "No recent activity found." }) })
        ] })
      ] })
    ] })
  ] });
}
export {
  Home as default
};

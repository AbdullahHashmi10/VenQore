import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useRef } from "react";
import { usePage, Head, Link } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-D0x15wPs.js";
import { Zap, ShoppingCart, Package, ShoppingBag, DollarSign, Users, LayoutDashboard, UserCog, Settings, BarChart2, ShieldCheck, Database, Activity, ArrowRight, ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";
import "react-dom";
import "./plans-CxabWI_P.js";
import "./runtime-DwSFgQZq.js";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "dexie";
import "@headlessui/react";
import "./Input-BO7OpFmF.js";
import "./AiIsland-Ccw9HuV0.js";
import "motion/react";
import "./ThinkingOrb-DGYTy5s1.js";
import "./terms-DwYjlWsV.js";
import "laravel-echo";
import "pusher-js";
import "driver.js";
import "./utils-H80jjgLf.js";
import "clsx";
import "tailwind-merge";
const FeatureCard = ({ icon: Icon, title, description, colorClass, glowColor, routeName }) => {
  const cardRef = useRef(null);
  const glowRef = useRef(null);
  const { store } = usePage().props;
  const handleMouseMove = (e) => {
    if (!cardRef.current || !glowRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / centerY * -8;
    const rotateY = (x - centerX) / centerX * 8;
    cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    const glowX = x / rect.width * 100;
    const glowY = y / rect.height * 100;
    glowRef.current.style.opacity = "1";
    glowRef.current.style.background = `radial-gradient(circle at ${glowX}% ${glowY}%, rgba(255,255,255,0.25), transparent 70%)`;
  };
  const handleMouseLeave = () => {
    if (!cardRef.current || !glowRef.current) return;
    cardRef.current.style.transform = "perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)";
    glowRef.current.style.opacity = "0";
  };
  const href = typeof route === "function" && routeName ? route(routeName.startsWith("store.") ? routeName : `store.${routeName}`, { store_slug: store?.slug }) : "#";
  return /* @__PURE__ */ jsxs(
    Link,
    {
      href,
      className: "group relative w-full h-full min-h-[210px] cursor-pointer block",
      onMouseMove: handleMouseMove,
      onMouseLeave: handleMouseLeave,
      children: [
        /* @__PURE__ */ jsx("div", { className: `absolute inset-0 ${colorClass} rounded-2xl blur-[50px] opacity-10 group-hover:opacity-25 transition-opacity duration-500` }),
        /* @__PURE__ */ jsxs(
          "div",
          {
            ref: cardRef,
            className: "relative h-full w-full bg-surface backdrop-blur-xl rounded-2xl border border-line dark:border-white/10 p-6 flex flex-col items-center text-center transition-all duration-200 ease-out will-change-transform shadow-sm group-hover:shadow-xl dark:shadow-none group-hover:border-brand-300 dark:group-hover:border-brand-500/40",
            style: { transformStyle: "preserve-3d" },
            children: [
              /* @__PURE__ */ jsx(
                "div",
                {
                  ref: glowRef,
                  className: "absolute inset-0 transition-opacity duration-300 pointer-events-none opacity-0 mix-blend-soft-light z-20 rounded-2xl"
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "relative z-10 flex-1 flex flex-col items-center justify-center", children: [
                /* @__PURE__ */ jsx("div", { className: `mb-4 p-4 rounded-2xl bg-surface dark:bg-white/5 border border-line dark:border-white/10 ${glowColor} shadow-inner transition-transform duration-300 group-hover:scale-110`, children: /* @__PURE__ */ jsx(Icon, { size: 30 }) }),
                /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold mb-2 text-ink group-hover:text-brand-600 dark:group-hover:text-brand-300 transition-colors", children: title }),
                /* @__PURE__ */ jsx("p", { className: "text-ink-muted text-sm font-light leading-relaxed", children: description })
              ] })
            ]
          }
        )
      ]
    }
  );
};
function Home({ recentActivity = [], systemLogs = [] }) {
  const { props } = usePage();
  const user = props.auth?.user;
  const store = props.store;
  const userRole = user?.role;
  const userPerms = user?.permissions || [];
  const isFullAccess = userRole === "owner" || userRole === "admin" || userRole === "manager" || !!user?.is_platform_admin;
  const hasPerm = (...keys) => isFullAccess || keys.some((k) => userPerms.some((p) => p === k || p.startsWith(k + ".")));
  const hasAdminPerm = (...keys) => isFullAccess || keys.some((k) => userPerms.includes(k));
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activityTab, setActivityTab] = useState("store");
  const allShortcuts = [
    // --- Core Operations ---
    {
      name: "Point of Sale",
      icon: Zap,
      route: "store.pos",
      description: "Process sales instantly at checkout.",
      colorClass: "bg-brand-600",
      glowColor: "text-brand-500 dark:text-brand-400",
      category: "operations",
      perm: () => hasPerm("pos")
    },
    {
      name: "New Sale",
      icon: ShoppingCart,
      route: "store.sales.invoice.create",
      description: "Create detailed invoices and orders.",
      colorClass: "bg-blue-600",
      glowColor: "text-blue-500 dark:text-blue-400",
      category: "operations",
      perm: () => hasPerm("sales")
    },
    {
      name: "All Inventory",
      icon: Package,
      route: "store.inventory.index",
      description: "View products, stock levels, and batches.",
      colorClass: "bg-emerald-600",
      glowColor: "text-emerald-500 dark:text-emerald-400",
      category: "operations",
      perm: () => hasPerm("inventory")
    },
    {
      name: "New Purchase",
      icon: ShoppingBag,
      route: "store.purchases.create",
      description: "Stock up inventory & manage purchase orders.",
      colorClass: "bg-teal-600",
      glowColor: "text-teal-500 dark:text-teal-400",
      category: "operations",
      perm: () => hasPerm("purchases")
    },
    {
      name: "New Expense",
      icon: DollarSign,
      route: "store.expenses.index",
      description: "Record operating expenses and business costs.",
      colorClass: "bg-amber-600",
      glowColor: "text-amber-500 dark:text-amber-400",
      category: "operations",
      perm: () => hasPerm("finance.expenses")
    },
    {
      name: "All Parties",
      icon: Users,
      route: "store.parties.index",
      description: "Manage customers, suppliers, and contacts.",
      colorClass: "bg-indigo-600",
      glowColor: "text-indigo-500 dark:text-indigo-400",
      category: "operations",
      perm: () => hasPerm("purchases.suppliers", "admin.staff_view", "sales")
    },
    // --- Store Management & Administration (Unified from /admin) ---
    {
      name: "Admin Dashboard",
      icon: LayoutDashboard,
      route: "store.admin.dashboard",
      description: "View system KPIs, cash flow snapshots, and metrics.",
      colorClass: "bg-brand-600",
      glowColor: "text-brand-500 dark:text-brand-400",
      category: "admin",
      perm: () => hasAdminPerm("admin.settings_manage")
    },
    {
      name: "User Management",
      icon: UserCog,
      route: "store.admin.users",
      description: "Add staff, invite teammates, and manage roles.",
      colorClass: "bg-emerald-600",
      glowColor: "text-emerald-500 dark:text-emerald-400",
      category: "admin",
      perm: () => hasAdminPerm("users.manage")
    },
    {
      name: "System Settings",
      icon: Settings,
      route: "store.admin.settings",
      description: "Configure store preferences and system defaults.",
      colorClass: "bg-neutral-600",
      glowColor: "text-ink-muted",
      category: "admin",
      perm: () => hasAdminPerm("admin.settings_manage")
    },
    {
      name: "Reports Center",
      icon: BarChart2,
      route: "store.reports.index",
      description: "Detailed analytics on sales, inventory, and finances.",
      colorClass: "bg-purple-600",
      glowColor: "text-purple-500 dark:text-purple-400",
      category: "admin",
      perm: () => hasPerm("reports")
    },
    {
      name: "Security Logs",
      icon: ShieldCheck,
      route: "store.admin.logs",
      description: "Monitor system access, audit trails, and actions.",
      colorClass: "bg-amber-600",
      glowColor: "text-amber-500 dark:text-amber-400",
      category: "admin",
      perm: () => hasAdminPerm("audit", "admin.settings_manage")
    },
    {
      name: "Database Management",
      icon: Database,
      route: "store.admin.data",
      description: "Perform exports, imports, and data maintenance.",
      colorClass: "bg-blue-600",
      glowColor: "text-blue-500 dark:text-blue-400",
      category: "admin",
      perm: () => hasAdminPerm("admin.settings_manage")
    }
  ];
  const authorizedShortcuts = allShortcuts.filter((s) => !s.perm || s.perm());
  const visibleShortcuts = authorizedShortcuts.filter((s) => {
    if (selectedCategory === "all") return true;
    return s.category === selectedCategory;
  });
  const hasAdminShortcuts = authorizedShortcuts.some((s) => s.category === "admin");
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { activeMenu: "Home", children: [
    /* @__PURE__ */ jsx(Head, { title: "Home" }),
    /* @__PURE__ */ jsxs("div", { className: "min-h-full flex flex-col relative p-6 md:p-8", children: [
      /* @__PURE__ */ jsx("div", { className: "hidden dark:block fixed top-0 right-0 w-[800px] h-[800px] bg-brand-600/15 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" }),
      /* @__PURE__ */ jsx("div", { className: "hidden dark:block fixed bottom-0 left-0 w-[600px] h-[600px] bg-brand-600/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 pointer-events-none" }),
      /* @__PURE__ */ jsx("div", { className: "hidden dark:block fixed inset-0 bg-[url('/images/noise.svg')] opacity-20 pointer-events-none" }),
      /* @__PURE__ */ jsxs("div", { className: "mb-8 relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold text-ink tracking-tight mb-1 uppercase", children: [
            "Welcome back, ",
            user?.name?.split(" ")[0] || "Partner"
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-ink-muted uppercase tracking-widest text-xs font-bold flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" }),
            "Monitoring ",
            store?.name || "Your Store"
          ] })
        ] }),
        hasAdminShortcuts && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 p-1 rounded-xl bg-surface border border-line self-start md:self-auto shadow-sm", children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setSelectedCategory("all"),
              className: `px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedCategory === "all" ? "bg-brand-600 text-white shadow-sm" : "text-ink-muted hover:text-ink hover:bg-neutral-100 dark:hover:bg-white/5"}`,
              children: [
                "All (",
                authorizedShortcuts.length,
                ")"
              ]
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setSelectedCategory("operations"),
              className: `px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedCategory === "operations" ? "bg-brand-600 text-white shadow-sm" : "text-ink-muted hover:text-ink hover:bg-neutral-100 dark:hover:bg-white/5"}`,
              children: "Operations"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setSelectedCategory("admin"),
              className: `px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedCategory === "admin" ? "bg-brand-600 text-white shadow-sm" : "text-ink-muted hover:text-ink hover:bg-neutral-100 dark:hover:bg-white/5"}`,
              children: "Administration"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10 mb-8 shrink-0", children: visibleShortcuts.map((shortcut, index) => /* @__PURE__ */ jsx(
        FeatureCard,
        {
          title: shortcut.name,
          icon: shortcut.icon,
          description: shortcut.description,
          routeName: shortcut.route,
          colorClass: shortcut.colorClass,
          glowColor: shortcut.glowColor
        },
        `${shortcut.name}-${index}`
      )) }),
      hasPerm("sales", "reports", "audit") && /* @__PURE__ */ jsxs("div", { className: "bg-surface backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-line dark:border-white/10 shadow-sm relative z-10 flex flex-col shrink-0 h-auto mb-10", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-line dark:border-white/5 shrink-0", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
            /* @__PURE__ */ jsx("div", { className: "p-2.5 rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400", children: /* @__PURE__ */ jsx(Activity, { size: 22 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold text-ink flex items-center gap-2", children: "Recent Activity" }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted", children: "Real-time event feed for your business store" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            systemLogs && systemLogs.length > 0 && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 p-1 rounded-lg bg-neutral-100 dark:bg-white/5 text-xs font-semibold", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setActivityTab("store"),
                  className: `px-3 py-1 rounded-md transition-colors ${activityTab === "store" ? "bg-surface text-ink shadow-sm font-bold" : "text-ink-muted hover:text-ink"}`,
                  children: "Store Operations"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setActivityTab("system"),
                  className: `px-3 py-1 rounded-md transition-colors ${activityTab === "system" ? "bg-surface text-ink shadow-sm font-bold" : "text-ink-muted hover:text-ink"}`,
                  children: "System Logs"
                }
              )
            ] }),
            activityTab === "store" ? /* @__PURE__ */ jsxs(
              Link,
              {
                href: route("store.sales.index", { store_slug: store?.slug }),
                className: "text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-bold flex items-center gap-1 transition-colors",
                children: [
                  "View All Sales ",
                  /* @__PURE__ */ jsx(ArrowRight, { size: 13 })
                ]
              }
            ) : /* @__PURE__ */ jsxs(
              Link,
              {
                href: route("store.admin.logs", { store_slug: store?.slug }),
                className: "text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-bold flex items-center gap-1 transition-colors",
                children: [
                  "View All Logs ",
                  /* @__PURE__ */ jsx(ArrowRight, { size: 13 })
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
          activityTab === "store" && /* @__PURE__ */ jsxs(Fragment, { children: [
            recentActivity.map((activity, i) => {
              const isPositive = activity.amount && activity.amount.includes("+");
              return /* @__PURE__ */ jsxs(
                "div",
                {
                  className: "flex items-center justify-between p-4 rounded-xl bg-surface dark:bg-white/5 hover:bg-neutral-50 dark:hover:bg-white/10 border border-line dark:border-white/5 transition-colors group",
                  children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
                      /* @__PURE__ */ jsx(
                        "div",
                        {
                          className: `w-10 h-10 rounded-xl flex items-center justify-center ${isPositive ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400"}`,
                          children: isPositive ? /* @__PURE__ */ jsx(ArrowUpRight, { size: 20 }) : /* @__PURE__ */ jsx(ArrowDownRight, { size: 20 })
                        }
                      ),
                      /* @__PURE__ */ jsxs("div", { children: [
                        /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-ink group-hover:text-brand-600 transition-colors", children: activity.title }),
                        /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted mt-0.5", children: activity.subtitle || "Transaction recorded" })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                      /* @__PURE__ */ jsx(
                        "p",
                        {
                          className: `text-sm font-bold ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-ink"}`,
                          children: activity.amount
                        }
                      ),
                      /* @__PURE__ */ jsxs("p", { className: "text-2xs text-ink-muted mt-0.5 flex items-center justify-end gap-1", children: [
                        /* @__PURE__ */ jsx(Clock, { size: 11 }),
                        " ",
                        activity.time
                      ] })
                    ] })
                  ]
                },
                activity.id || i
              );
            }),
            recentActivity.length === 0 && /* @__PURE__ */ jsxs("div", { className: "py-12 text-center text-ink-muted", children: [
              /* @__PURE__ */ jsx(Activity, { size: 32, className: "mx-auto mb-2 opacity-30" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold", children: "No recent transactions to display" }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted mt-1", children: "Sales, returns, and expenses will appear here automatically." })
            ] })
          ] }),
          activityTab === "system" && /* @__PURE__ */ jsxs(Fragment, { children: [
            systemLogs.map((log, i) => /* @__PURE__ */ jsxs(
              "div",
              {
                className: "flex items-center justify-between p-4 rounded-xl bg-surface dark:bg-white/5 hover:bg-neutral-50 dark:hover:bg-white/10 border border-line dark:border-white/5 transition-colors group",
                children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
                    /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center", children: /* @__PURE__ */ jsx(ShieldCheck, { size: 20 }) }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-ink", children: log.action }),
                      /* @__PURE__ */ jsxs("p", { className: "text-xs text-ink-muted mt-0.5", children: [
                        log.description,
                        " • ",
                        /* @__PURE__ */ jsx("span", { className: "text-brand-600 dark:text-brand-400 font-semibold", children: log.user })
                      ] })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: "text-right", children: /* @__PURE__ */ jsxs("p", { className: "text-2xs text-ink-muted flex items-center justify-end gap-1", children: [
                    /* @__PURE__ */ jsx(Clock, { size: 11 }),
                    " ",
                    log.time
                  ] }) })
                ]
              },
              log.id || i
            )),
            systemLogs.length === 0 && /* @__PURE__ */ jsxs("div", { className: "py-12 text-center text-ink-muted", children: [
              /* @__PURE__ */ jsx(ShieldCheck, { size: 32, className: "mx-auto mb-2 opacity-30" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold", children: "No recent security logs" }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted mt-1", children: "User logins and administrative actions will be logged here." })
            ] })
          ] })
        ] })
      ] })
    ] })
  ] });
}
export {
  Home as default
};

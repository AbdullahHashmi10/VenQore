import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useMemo, useState, useEffect, useRef } from "react";
import { usePage, router, Head, Link } from "@inertiajs/react";
import { u as useTheme } from "./marketing-pages-CTBAvetE.js";
import { t as tokens, h as ensurePlatformStyles, G as GRADIENTS, B as BRAND, b as Badge } from "./ui-CLtSftB2.js";
import { LayoutDashboard, Store, Users, SlidersHorizontal, UserCog, BadgeCheck, Boxes, Layers, Ticket, Gift, DollarSign, TrendingUp, Tag, Inbox, MessagesSquare, Bot, FlaskConical, Megaphone, Package, HeartPulse, ShieldCheck, Server, Webhook, HardDrive, ToggleRight, RefreshCw, Settings, KeyRound, Menu, Search, Sun, Moon, Bell, Sparkles, X, ChevronLeft, LogOut, ChevronsRight, ChevronsLeft, AlertTriangle, Mail, Command, ArrowRight } from "lucide-react";
function safeRoute(name, params) {
  try {
    if (typeof window !== "undefined" && typeof window.route === "function") {
      const has = window.route().has ? window.route().has(name) : true;
      if (has === false) return null;
      return window.route(name, params);
    }
  } catch (e) {
  }
  return null;
}
function isActive(name) {
  try {
    if (typeof window !== "undefined" && typeof window.route === "function") {
      return !!window.route().current(name);
    }
  } catch (e) {
  }
  return false;
}
const NAV_GROUPS = [
  {
    key: "overview",
    label: null,
    // ungrouped, top-level
    items: [
      { key: "overview", label: "Overview", icon: LayoutDashboard, route: "platform.dashboard", match: "platform.dashboard", desc: "KPIs, revenue vs GMV, trends & alerts" }
    ]
  },
  {
    key: "customers",
    label: "Customers",
    items: [
      { key: "stores", label: "Stores", icon: Store, route: "platform.stores", match: "platform.stores", desc: "All merchant stores — suspend, extend, impersonate" },
      { key: "users", label: "Platform Users", icon: Users, route: "platform.users", match: "platform.users", desc: "Owners, staff & platform admins" },
      { key: "overrides", label: "Tenant Overrides", icon: SlidersHorizontal, route: "platform.tenants.overrides", match: "platform.tenants.*", desc: "Per-tenant limit overrides with expiry" },
      { key: "impersonation", label: "Impersonation", icon: UserCog, page: "impersonation", desc: "Audited session takeover log" },
      { key: "pk-verify", label: "PK Verifications", icon: BadgeCheck, page: "pk-verifications", badge: "new", desc: "CNIC review queue for PKR pricing" }
    ]
  },
  {
    key: "monetization",
    label: "Monetization",
    items: [
      { key: "platforms", label: "Platforms", icon: Boxes, route: "platform.platforms.index", match: "platform.platforms.*", desc: "Product lines that own plans" },
      { key: "plans", label: "Plans & Limits", icon: Layers, route: "platform.plans.index", match: "platform.plans.*", desc: "Pricing, limits, trials, LTD" },
      { key: "coupons", label: "Coupons", icon: Ticket, route: "platform.coupons.index", match: "platform.coupons.*", desc: "Discounts & promotions" },
      { key: "access-grants", label: "Gift Links", icon: Gift, route: "platform.access-grants.index", match: "platform.access-grants.*", desc: "Grant any plan for any duration — no payment" },
      { key: "revenue", label: "Revenue", icon: DollarSign, page: "revenue", desc: "Paid subscription income (server-side)" },
      { key: "gmv", label: "Merchant GMV", icon: TrendingUp, page: "gmv", desc: "Merchant sales volume — not revenue" },
      { key: "appsumo", label: "AppSumo / LTD", icon: Tag, page: "appsumo", desc: "Lifetime deal codes" }
    ]
  },
  {
    key: "operations",
    label: "Operations",
    items: [
      { key: "support", label: "Support Inbox", icon: Inbox, page: "support", desc: "Unified V1 + Vena + Digital tickets" },
      { key: "agent", label: "Live Chat / Agent", icon: MessagesSquare, route: "platform.chatbot.inbox", desc: "Live-chat agent console" },
      { key: "chatbot", label: "Chatbot (Vena)", icon: Bot, route: "platform.chatbot.settings", desc: "AI assistant configuration" },
      { key: "demo", label: "Demo & Sandbox", icon: FlaskConical, page: "demo", desc: "Demo store status, reset & snapshots" },
      { key: "broadcasts", label: "Broadcasts", icon: Megaphone, route: "platform.newsletter-hub", desc: "Newsletter & campaigns" },
      { key: "digital", label: "Digital Products", icon: Package, route: "platform.digital-hub", desc: "Partner chats & product registry" }
    ]
  },
  {
    key: "system",
    label: "System",
    items: [
      { key: "health", label: "Health & Errors", icon: HeartPulse, route: "platform.health.errors", match: "platform.health.*", desc: "Error logs & contact submissions" },
      { key: "testing", label: "Testing Center", icon: ShieldCheck, page: "testing", desc: "One-click categorized health check" },
      { key: "jobs", label: "Jobs & Queues", icon: Server, page: "jobs", desc: "Horizon queue depth & failed jobs" },
      { key: "webhooks", label: "Webhooks", icon: Webhook, route: "platform.webhooks", desc: "Integration delivery log" },
      { key: "storage", label: "Storage", icon: HardDrive, page: "storage", badge: "soon", desc: "Per-tenant & total storage" },
      { key: "flags", label: "Feature Flags", icon: ToggleRight, page: "flags", badge: "soon", desc: "Per-store capability switches" },
      { key: "updates", label: "Updates & Version", icon: RefreshCw, href: "/updater", desc: "Run updates & view version history" },
      { key: "settings", label: "Platform Settings", icon: Settings, page: "settings", desc: "FX rates, fees, grace defaults" }
    ]
  },
  {
    key: "account",
    label: "Account",
    items: [
      { key: "profile", label: "Profile & Security", icon: KeyRound, href: "/account", desc: "Password, login PIN, action passcode" }
    ]
  }
];
function flatNav() {
  const out = [];
  for (const g of NAV_GROUPS) {
    for (const it of g.items) {
      out.push({ ...it, group: g.label || "Command Center" });
    }
  }
  return out;
}
function resolveHref(item) {
  if (item.href) return item.href;
  if (item.route) {
    const r = safeRoute(item.route, item.params);
    if (r) return r;
  }
  const base = safeRoute("platform.dashboard") || "/VenQore";
  return `${base}?view=${item.page || item.key}`;
}
const SIDEBAR_W = 264;
const SIDEBAR_COLLAPSED = 76;
function PlatformLayout({ children, title = "Command Center" }) {
  const { isDarkMode, toggleTheme } = useTheme();
  const t = useMemo(() => tokens(isDarkMode), [isDarkMode]);
  const { props } = usePage();
  const { auth, flash } = props;
  const stats = props.stats || {};
  const [collapsed, setCollapsed] = useState(() => typeof window !== "undefined" && localStorage.getItem("vq_sidebar") === "1");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  useEffect(() => {
    ensurePlatformStyles();
  }, []);
  useEffect(() => {
    localStorage.setItem("vq_sidebar", collapsed ? "1" : "0");
  }, [collapsed]);
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    const off = router.on("navigate", () => {
      setMobileOpen(false);
      setNotifOpen(false);
    });
    return off;
  }, []);
  const openErrors = stats.open_errors || 0;
  const newContacts = stats.new_contacts || 0;
  const notifCount = openErrors + newContacts;
  return /* @__PURE__ */ jsxs("div", { style: { display: "flex", minHeight: "100vh", background: t.appBg, color: t.ink, fontFamily: "'Figtree','Inter',system-ui,sans-serif" }, children: [
    /* @__PURE__ */ jsx(Head, { title: `${title} · VenQore HQ` }),
    /* @__PURE__ */ jsx("div", { style: { position: "fixed", inset: 0, background: t.aurora, pointerEvents: "none", zIndex: 0 } }),
    /* @__PURE__ */ jsx("div", { style: { position: "fixed", top: "-10%", right: "-5%", width: 480, height: 480, borderRadius: "50%", background: GRADIENTS.brand, filter: "blur(120px)", opacity: t.isDark ? 0.1 : 0.06, pointerEvents: "none", zIndex: 0, animation: "vq-drift 18s ease-in-out infinite" } }),
    /* @__PURE__ */ jsx(
      Sidebar,
      {
        t,
        collapsed,
        setCollapsed,
        mobileOpen,
        setMobileOpen
      }
    ),
    /* @__PURE__ */ jsxs("div", { style: { flex: 1, display: "flex", flexDirection: "column", minWidth: 0, position: "relative", zIndex: 1 }, children: [
      /* @__PURE__ */ jsxs("header", { style: {
        position: "sticky",
        top: 0,
        zIndex: 40,
        height: 64,
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "0 18px",
        background: t.shellBg,
        borderBottom: `1px solid ${t.border}`,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)"
      }, children: [
        /* @__PURE__ */ jsx("button", { className: "vq-press", onClick: () => setMobileOpen(true), style: { ...iconBtn(t), display: "none" }, "data-mobile-menu": true, "aria-label": "Menu", children: /* @__PURE__ */ jsx(Menu, { size: 19 }) }),
        /* @__PURE__ */ jsxs("button", { className: "vq-press", onClick: () => setPaletteOpen(true), style: {
          display: "flex",
          alignItems: "center",
          gap: 10,
          flex: "1 1 auto",
          maxWidth: 440,
          padding: "9px 13px",
          borderRadius: 12,
          background: t.inputBg,
          border: `1px solid ${t.border}`,
          color: t.muted,
          cursor: "pointer",
          fontSize: 13.5,
          fontFamily: "inherit"
        }, children: [
          /* @__PURE__ */ jsx(Search, { size: 16 }),
          /* @__PURE__ */ jsx("span", { style: { flex: 1, textAlign: "left" }, children: "Search stores, users, plans…" }),
          /* @__PURE__ */ jsx("kbd", { style: kbdStyle(t), children: "⌘K" })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }, children: [
          /* @__PURE__ */ jsx("button", { className: "vq-press", onClick: toggleTheme, style: iconBtn(t), "aria-label": "Toggle theme", title: "Toggle theme", children: isDarkMode ? /* @__PURE__ */ jsx(Sun, { size: 18 }) : /* @__PURE__ */ jsx(Moon, { size: 18 }) }),
          /* @__PURE__ */ jsxs("div", { style: { position: "relative" }, children: [
            /* @__PURE__ */ jsxs("button", { className: "vq-press", onClick: () => setNotifOpen((v) => !v), style: { ...iconBtn(t), ...notifCount ? { animation: "vq-pulse-ring 2.2s infinite" } : {} }, "aria-label": "Notifications", children: [
              /* @__PURE__ */ jsx(Bell, { size: 18 }),
              notifCount > 0 && /* @__PURE__ */ jsx("span", { style: { position: "absolute", top: 4, right: 4, minWidth: 16, height: 16, padding: "0 4px", borderRadius: 999, background: BRAND.rose, color: "#fff", fontSize: 9.5, fontWeight: 800, display: "grid", placeItems: "center" }, children: notifCount })
            ] }),
            notifOpen && /* @__PURE__ */ jsx(NotificationsPanel, { t, openErrors, newContacts, onClose: () => setNotifOpen(false) })
          ] }),
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 10, paddingLeft: 8, marginLeft: 2, borderLeft: `1px solid ${t.border}` }, children: [
            /* @__PURE__ */ jsxs("div", { style: { textAlign: "right", lineHeight: 1.2 }, className: "vq-hide-sm", children: [
              /* @__PURE__ */ jsx("div", { style: { fontSize: 13, fontWeight: 800, color: t.ink }, children: auth?.user?.name || "Owner" }),
              /* @__PURE__ */ jsx("div", { style: { fontSize: 10, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: BRAND.indigo2 }, children: "Hashmi Dashboard" })
            ] }),
            /* @__PURE__ */ jsx("div", { style: { width: 38, height: 38, borderRadius: 11, background: GRADIENTS.brand, color: "#fff", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 15, boxShadow: "0 6px 16px -6px rgba(99,102,241,.6)" }, children: (auth?.user?.name?.[0] || "A").toUpperCase() })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("main", { className: "vq-scroll", style: { flex: 1, overflowY: "auto", padding: "26px clamp(16px, 3vw, 34px) 60px" }, children: /* @__PURE__ */ jsx("div", { style: { maxWidth: 1320, margin: "0 auto", animation: "vq-fade .35s ease both" }, children }) })
    ] }),
    paletteOpen && /* @__PURE__ */ jsx(CommandPalette, { t, onClose: () => setPaletteOpen(false) }),
    /* @__PURE__ */ jsx(FlashToasts, { flash, t }),
    /* @__PURE__ */ jsx("style", { children: responsiveCss() })
  ] });
}
function Sidebar({ t, collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const width = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_W;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    mobileOpen && /* @__PURE__ */ jsx("div", { onClick: () => setMobileOpen(false), style: { position: "fixed", inset: 0, background: "rgba(2,4,10,.55)", zIndex: 59, backdropFilter: "blur(3px)" }, className: "vq-mobile-only" }),
    /* @__PURE__ */ jsxs("aside", { "data-sidebar": true, className: mobileOpen ? "vq-open" : "", style: {
      width,
      flexShrink: 0,
      position: "sticky",
      top: 0,
      height: "100vh",
      zIndex: 60,
      display: "flex",
      flexDirection: "column",
      background: t.isDark ? "rgba(8,10,18,0.82)" : "rgba(255,255,255,0.9)",
      borderRight: `1px solid ${t.border}`,
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      transition: "width .25s cubic-bezier(.2,.8,.2,1)"
    }, children: [
      /* @__PURE__ */ jsxs("div", { style: { height: 64, display: "flex", alignItems: "center", gap: 12, padding: collapsed ? "0" : "0 18px", justifyContent: collapsed ? "center" : "flex-start", borderBottom: `1px solid ${t.border}`, flexShrink: 0 }, children: [
        /* @__PURE__ */ jsx("div", { style: { width: 36, height: 36, borderRadius: 11, background: GRADIENTS.brand, display: "grid", placeItems: "center", boxShadow: "0 8px 20px -6px rgba(99,102,241,.6)", flexShrink: 0 }, children: /* @__PURE__ */ jsx(Sparkles, { size: 19, color: "#fff" }) }),
        !collapsed && /* @__PURE__ */ jsxs("div", { style: { lineHeight: 1.1, overflow: "hidden" }, children: [
          /* @__PURE__ */ jsx("div", { style: { fontSize: 17, fontWeight: 900, letterSpacing: "-0.03em", color: t.ink }, children: "VENQORE" }),
          /* @__PURE__ */ jsx("div", { style: { fontSize: 9.5, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: BRAND.indigo2 }, children: "Command Center" })
        ] }),
        /* @__PURE__ */ jsx("button", { className: "vq-press vq-mobile-only", onClick: () => setMobileOpen(false), style: { ...iconBtn(t), marginLeft: "auto" }, "aria-label": "Close menu", children: /* @__PURE__ */ jsx(X, { size: 18 }) })
      ] }),
      /* @__PURE__ */ jsx("nav", { className: "vq-scroll", style: { flex: 1, overflowY: "auto", overflowX: "hidden", padding: "12px 10px 8px" }, children: NAV_GROUPS.map((group) => /* @__PURE__ */ jsxs("div", { style: { marginBottom: 14 }, children: [
        group.label && !collapsed && /* @__PURE__ */ jsx("div", { style: { fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: t.faint, padding: "6px 12px 4px" }, children: group.label }),
        group.label && collapsed && /* @__PURE__ */ jsx("div", { style: { height: 1, background: t.border, margin: "8px 14px" } }),
        group.items.map((item) => /* @__PURE__ */ jsx(NavLink, { item, t, collapsed }, item.key))
      ] }, group.key)) }),
      /* @__PURE__ */ jsxs("div", { style: { padding: 10, borderTop: `1px solid ${t.border}`, flexShrink: 0 }, children: [
        /* @__PURE__ */ jsxs(Link, { href: "/", style: navBase(t, false, collapsed), className: "vq-press", children: [
          /* @__PURE__ */ jsx(ChevronLeft, { size: 19, style: { flexShrink: 0 } }),
          !collapsed && /* @__PURE__ */ jsx("span", { style: { fontSize: 13, fontWeight: 600 }, children: "Back to App" })
        ] }),
        /* @__PURE__ */ jsxs(Link, { href: route("logout"), method: "post", as: "button", style: { ...navBase(t, false, collapsed), width: "100%", color: BRAND.rose }, className: "vq-press", children: [
          /* @__PURE__ */ jsx(LogOut, { size: 19, style: { flexShrink: 0 } }),
          !collapsed && /* @__PURE__ */ jsx("span", { style: { fontSize: 13, fontWeight: 600 }, children: "Sign out" })
        ] }),
        /* @__PURE__ */ jsxs("button", { onClick: () => setCollapsed((v) => !v), className: "vq-press vq-desktop-only", style: { ...navBase(t, false, collapsed), width: "100%", color: t.muted, marginTop: 2 }, children: [
          collapsed ? /* @__PURE__ */ jsx(ChevronsRight, { size: 19 }) : /* @__PURE__ */ jsx(ChevronsLeft, { size: 19 }),
          !collapsed && /* @__PURE__ */ jsx("span", { style: { fontSize: 13, fontWeight: 600 }, children: "Collapse" })
        ] })
      ] })
    ] })
  ] });
}
function NavLink({ item, t, collapsed }) {
  const active = item.match ? isActive(item.match) : false;
  const href = resolveHref(item);
  const Icon = item.icon;
  const [hover, setHover] = useState(false);
  return /* @__PURE__ */ jsxs(
    Link,
    {
      href,
      title: collapsed ? item.label : void 0,
      onMouseEnter: () => setHover(true),
      onMouseLeave: () => setHover(false),
      style: {
        ...navBase(t, active, collapsed),
        background: active ? GRADIENTS.brand : hover ? t.hover : "transparent",
        color: active ? "#fff" : hover ? t.ink : t.sub,
        boxShadow: active ? "0 8px 20px -8px rgba(99,102,241,.6)" : "none",
        position: "relative"
      },
      children: [
        /* @__PURE__ */ jsx(Icon, { size: 19, style: { flexShrink: 0 } }),
        !collapsed && /* @__PURE__ */ jsx("span", { style: { fontSize: 13.5, fontWeight: active ? 700 : 600, flex: 1 }, children: item.label }),
        !collapsed && item.badge === "new" && /* @__PURE__ */ jsx(Badge, { color: BRAND.fuchsia, style: { fontSize: 9, padding: "1px 6px" }, children: "NEW" }),
        !collapsed && item.badge === "soon" && /* @__PURE__ */ jsx("span", { style: { fontSize: 9, fontWeight: 800, color: t.faint, letterSpacing: "0.04em" }, children: "SOON" })
      ]
    }
  );
}
function CommandPalette({ t, onClose }) {
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const inputRef = useRef(null);
  const items = useMemo(() => flatNav(), []);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((i) => (i.label + " " + (i.desc || "") + " " + (i.group || "")).toLowerCase().includes(s));
  }, [q, items]);
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 40);
  }, []);
  useEffect(() => {
    setIdx(0);
  }, [q]);
  const go = (item) => {
    onClose();
    router.visit(resolveHref(item));
  };
  const onKey = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[idx]) go(filtered[idx]);
    } else if (e.key === "Escape") {
      onClose();
    }
  };
  return /* @__PURE__ */ jsxs("div", { style: { position: "fixed", inset: 0, zIndex: 1200, display: "flex", justifyContent: "center", paddingTop: "12vh" }, children: [
    /* @__PURE__ */ jsx("div", { onClick: onClose, style: { position: "absolute", inset: 0, background: "rgba(2,4,10,0.6)", backdropFilter: "blur(6px)", animation: "vq-fade-soft .2s ease" } }),
    /* @__PURE__ */ jsxs("div", { style: { position: "relative", width: "min(620px, 92vw)", height: "fit-content", maxHeight: "70vh", background: t.panelSolid, border: `1px solid ${t.border2}`, borderRadius: 18, boxShadow: t.shadow, overflow: "hidden", animation: "vq-rise .22s ease both", display: "flex", flexDirection: "column" }, children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 12, padding: "16px 18px", borderBottom: `1px solid ${t.border}` }, children: [
        /* @__PURE__ */ jsx(Command, { size: 18, color: BRAND.indigo2 }),
        /* @__PURE__ */ jsx(
          "input",
          {
            ref: inputRef,
            value: q,
            onChange: (e) => setQ(e.target.value),
            onKeyDown: onKey,
            placeholder: "Jump to anywhere in the Command Center…",
            style: { flex: 1, background: "transparent", border: "none", outline: "none", color: t.ink, fontSize: 15.5, fontFamily: "inherit" }
          }
        ),
        /* @__PURE__ */ jsx("kbd", { style: kbdStyle(t), children: "ESC" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "vq-scroll", style: { overflowY: "auto", padding: 8 }, children: [
        filtered.length === 0 && /* @__PURE__ */ jsxs("div", { style: { padding: 30, textAlign: "center", color: t.muted, fontSize: 13.5 }, children: [
          "No matches for “",
          q,
          "”."
        ] }),
        filtered.map((item, i) => {
          const Icon = item.icon;
          const sel = i === idx;
          return /* @__PURE__ */ jsxs(
            "div",
            {
              onMouseEnter: () => setIdx(i),
              onClick: () => go(item),
              style: { display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 11, cursor: "pointer", background: sel ? t.hover : "transparent" },
              children: [
                /* @__PURE__ */ jsx("div", { style: { width: 34, height: 34, borderRadius: 9, background: sel ? `${BRAND.indigo}22` : t.inputBg, color: sel ? BRAND.indigo2 : t.muted, display: "grid", placeItems: "center", flexShrink: 0 }, children: /* @__PURE__ */ jsx(Icon, { size: 17 }) }),
                /* @__PURE__ */ jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
                  /* @__PURE__ */ jsx("div", { style: { fontSize: 13.5, fontWeight: 700, color: t.ink }, children: item.label }),
                  /* @__PURE__ */ jsx("div", { style: { fontSize: 11.5, color: t.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }, children: item.desc })
                ] }),
                /* @__PURE__ */ jsx("span", { style: { fontSize: 10.5, color: t.faint, fontWeight: 700 }, children: item.group }),
                sel && /* @__PURE__ */ jsx(ArrowRight, { size: 15, color: BRAND.indigo2 })
              ]
            },
            item.key
          );
        })
      ] })
    ] })
  ] });
}
function NotificationsPanel({ t, openErrors, newContacts, onClose }) {
  const items = [];
  if (openErrors) items.push({ icon: AlertTriangle, color: BRAND.rose, title: `${openErrors} open error${openErrors > 1 ? "s" : ""}`, sub: "System health needs attention", href: resolveHrefName("platform.health.errors") });
  if (newContacts) items.push({ icon: Mail, color: BRAND.sky, title: `${newContacts} new contact${newContacts > 1 ? "s" : ""}`, sub: "Unread contact submissions", href: resolveHrefName("platform.health.contacts") });
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("div", { onClick: onClose, style: { position: "fixed", inset: 0, zIndex: 49 } }),
    /* @__PURE__ */ jsxs("div", { style: { position: "absolute", right: 0, top: "calc(100% + 10px)", width: 320, zIndex: 50, background: t.panelSolid, border: `1px solid ${t.border2}`, borderRadius: 16, boxShadow: t.shadow, overflow: "hidden", animation: "vq-rise .2s ease both" }, children: [
      /* @__PURE__ */ jsx("div", { style: { padding: "13px 16px", borderBottom: `1px solid ${t.border}`, fontSize: 13, fontWeight: 800, color: t.ink }, children: "Notifications" }),
      items.length === 0 ? /* @__PURE__ */ jsx("div", { style: { padding: 26, textAlign: "center", color: t.muted, fontSize: 13 }, children: "You're all caught up ✨" }) : items.map((n, i) => /* @__PURE__ */ jsxs("a", { href: n.href, style: { display: "flex", gap: 12, padding: "13px 16px", textDecoration: "none", borderBottom: i < items.length - 1 ? `1px solid ${t.rowBorder}` : "none" }, className: "vq-row", children: [
        /* @__PURE__ */ jsx("div", { style: { width: 34, height: 34, borderRadius: 9, background: `${n.color}1f`, color: n.color, display: "grid", placeItems: "center", flexShrink: 0 }, children: /* @__PURE__ */ jsx(n.icon, { size: 16 }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { style: { fontSize: 13, fontWeight: 700, color: t.ink }, children: n.title }),
          /* @__PURE__ */ jsx("div", { style: { fontSize: 11.5, color: t.muted }, children: n.sub })
        ] })
      ] }, i))
    ] })
  ] });
}
function resolveHrefName(name) {
  try {
    return window.route(name);
  } catch {
    return "#";
  }
}
function FlashToasts({ flash, t }) {
  const [show, setShow] = useState(false);
  const msg = flash?.success || flash?.error;
  const isError = !!flash?.error;
  useEffect(() => {
    if (msg) {
      setShow(true);
      const id = setTimeout(() => setShow(false), 4e3);
      return () => clearTimeout(id);
    }
  }, [msg]);
  if (!msg || !show) return null;
  return /* @__PURE__ */ jsx("div", { style: { position: "fixed", bottom: 22, right: 22, zIndex: 1300, animation: "vq-rise .3s ease both" }, children: /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 12, padding: "13px 18px", borderRadius: 14, background: t.panelSolid, border: `1px solid ${isError ? "rgba(239,68,68,.4)" : "rgba(16,185,129,.4)"}`, boxShadow: t.shadow, maxWidth: 380 }, children: [
    /* @__PURE__ */ jsx("div", { style: { width: 26, height: 26, borderRadius: 8, background: isError ? "rgba(239,68,68,.16)" : "rgba(16,185,129,.16)", color: isError ? BRAND.rose : BRAND.emerald, display: "grid", placeItems: "center", flexShrink: 0 }, children: isError ? /* @__PURE__ */ jsx(AlertTriangle, { size: 15 }) : "✓" }),
    /* @__PURE__ */ jsx("span", { style: { fontSize: 13.5, color: t.ink, fontWeight: 600 }, children: msg })
  ] }) });
}
function navBase(t, active, collapsed) {
  return {
    display: "flex",
    alignItems: "center",
    gap: 11,
    padding: collapsed ? "11px 0" : "10px 12px",
    justifyContent: collapsed ? "center" : "flex-start",
    borderRadius: 12,
    marginBottom: 2,
    textDecoration: "none",
    cursor: "pointer",
    border: "none",
    background: "transparent",
    fontFamily: "inherit",
    color: t.sub,
    width: "100%",
    textAlign: "left"
  };
}
function iconBtn(t) {
  return { position: "relative", width: 38, height: 38, borderRadius: 11, background: t.inputBg, border: `1px solid ${t.border}`, color: t.sub, display: "grid", placeItems: "center", cursor: "pointer" };
}
function kbdStyle(t) {
  return { fontSize: 10.5, fontWeight: 700, padding: "2px 6px", borderRadius: 6, background: t.inputBg, border: `1px solid ${t.border}`, color: t.muted, fontFamily: "inherit" };
}
function responsiveCss(collapsed) {
  return `
      .vq-mobile-only{display:none;}
      @media (max-width: 920px){
        [data-sidebar]{position:fixed !important; left:0; top:0; transform:translateX(${"-110%"}); width:${SIDEBAR_W}px !important; box-shadow:0 0 60px rgba(0,0,0,.4);}
        [data-sidebar].vq-open{transform:translateX(0);}
        [data-mobile-menu]{display:grid !important;}
        .vq-desktop-only{display:none !important;}
        .vq-mobile-only{display:grid;}
      }
      @media (min-width: 921px){ .vq-mobile-only{display:none !important;} }
      @media (max-width: 560px){ .vq-hide-sm{display:none !important;} }
    `;
}
export {
  PlatformLayout as P
};

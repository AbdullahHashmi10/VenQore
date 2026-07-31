import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import "react";
import { router } from "@inertiajs/react";
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Area, PieChart, Pie, Cell } from "recharts";
import { Info, DollarSign, ShieldCheck, TrendingUp, Store, Users, UserPlus, AlertTriangle, Activity, Layers, Zap, Ticket, Building2, Clock, ArrowUpRight } from "lucide-react";
import { u as useT, B as BRAND, G as GRADIENTS, P as Panel, f as fmtCurrency, a as fmtNumber, K as KpiCard, b as Badge, E as EmptyState } from "./ui-Dd6dJcJr.js";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "laravel-echo";
import "pusher-js";
const PLAN_COLORS = [BRAND.indigo, BRAND.violet, BRAND.sky, BRAND.emerald, BRAND.amber, BRAND.fuchsia, BRAND.rose];
function Overview({ stats = {}, revenue = {}, store_trend = [], plan_distribution = [], recent_stores = [], expiring_stores = [], activity_feed = [] }) {
  const t = useT();
  const period = stats.period || "all";
  const mrr = revenue.mrr ?? stats.mrr ?? 0;
  const arr = revenue.arr ?? stats.arr ?? 0;
  const gmv = revenue.gmv ?? stats.total_volume ?? 0;
  const net = revenue.net_revenue ?? stats.net_revenue ?? 0;
  const paid = revenue.paid_count ?? stats.paid_subscribers ?? 0;
  const planRows = (plan_distribution || []).filter((p) => p.count > 0);
  const setPeriod = (p) => router.get(window.route("platform.dashboard"), { period: p }, { preserveState: true, preserveScroll: true, replace: true });
  const periods = [
    { value: "today", label: "Today" },
    { value: "month", label: "Month" },
    { value: "year", label: "Year" },
    { value: "all", label: "All time" }
  ];
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end", justifyContent: "space-between", marginBottom: 22 }, children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: /* @__PURE__ */ jsx("span", { style: { fontSize: 11.5, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: BRAND.indigo2 }, children: "Mission Control" }) }),
        /* @__PURE__ */ jsx("h1", { style: { margin: "4px 0 0", fontSize: 28, fontWeight: 900, letterSpacing: "-0.03em", color: t.ink }, children: "Platform Overview" }),
        /* @__PURE__ */ jsx("p", { style: { margin: "5px 0 0", fontSize: 13.5, color: t.muted }, children: "Everything that matters about VenQore, at a glance." })
      ] }),
      /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: 4, padding: 4, borderRadius: 12, background: t.inputBg, border: `1px solid ${t.border}` }, children: periods.map((p) => /* @__PURE__ */ jsx("button", { onClick: () => setPeriod(p.value), className: "vq-press", style: {
        padding: "7px 13px",
        borderRadius: 9,
        fontSize: 12.5,
        fontWeight: 700,
        cursor: "pointer",
        border: "none",
        fontFamily: "inherit",
        background: period === p.value ? GRADIENTS.brand : "transparent",
        color: period === p.value ? "#fff" : t.muted
      }, children: p.label }, p.value)) })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: 16, marginBottom: 16 }, children: [
      /* @__PURE__ */ jsxs(Panel, { hover: true, pad: 22, style: { position: "relative", overflow: "hidden" }, children: [
        /* @__PURE__ */ jsx("div", { style: { position: "absolute", inset: 0, background: GRADIENTS.revenue, opacity: t.isDark ? 0.13 : 0.08 } }),
        /* @__PURE__ */ jsxs("div", { style: { position: "relative" }, children: [
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" }, children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 7 }, children: [
                /* @__PURE__ */ jsx("span", { style: { fontSize: 11.5, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: BRAND.emerald }, children: "MRR · Revenue (paid)" }),
                /* @__PURE__ */ jsx(Info, { size: 13, color: t.faint, title: "Real paid subscriptions only — excludes internal & demo stores." })
              ] }),
              /* @__PURE__ */ jsx("div", { style: { fontSize: 40, fontWeight: 900, letterSpacing: "-0.04em", color: t.ink, marginTop: 6, lineHeight: 1 }, children: fmtCurrency(mrr) }),
              /* @__PURE__ */ jsxs("div", { style: { fontSize: 13, color: t.sub, marginTop: 8 }, children: [
                fmtCurrency(arr),
                " ARR · ",
                fmtCurrency(net),
                " net · ",
                fmtNumber(paid),
                " paid subscriber",
                paid === 1 ? "" : "s"
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { style: { width: 48, height: 48, borderRadius: 14, background: `${BRAND.emerald}22`, color: BRAND.emerald, display: "grid", placeItems: "center", border: `1px solid ${BRAND.emerald}33`, flexShrink: 0 }, children: /* @__PURE__ */ jsx(DollarSign, { size: 24 }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { style: { marginTop: 12, fontSize: 11, color: t.faint, display: "flex", alignItems: "center", gap: 6 }, children: [
            /* @__PURE__ */ jsx(ShieldCheck, { size: 12 }),
            " Computed server-side · excludes internal & demo"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Panel, { hover: true, pad: 22, style: { position: "relative", overflow: "hidden" }, children: [
        /* @__PURE__ */ jsx("div", { style: { position: "absolute", inset: 0, background: GRADIENTS.gmv, opacity: t.isDark ? 0.12 : 0.07 } }),
        /* @__PURE__ */ jsxs("div", { style: { position: "relative" }, children: [
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" }, children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("div", { style: { display: "flex", alignItems: "center", gap: 7 }, children: /* @__PURE__ */ jsx("span", { style: { fontSize: 11.5, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: BRAND.sky }, children: "Platform GMV (merchant volume)" }) }),
              /* @__PURE__ */ jsx("div", { style: { fontSize: 40, fontWeight: 900, letterSpacing: "-0.04em", color: t.ink, marginTop: 6, lineHeight: 1 }, children: fmtCurrency(gmv) }),
              /* @__PURE__ */ jsx("div", { style: { fontSize: 13, color: t.sub, marginTop: 8 }, children: "Total sales flowing through merchant stores" })
            ] }),
            /* @__PURE__ */ jsx("div", { style: { width: 48, height: 48, borderRadius: 14, background: `${BRAND.sky}22`, color: BRAND.sky, display: "grid", placeItems: "center", border: `1px solid ${BRAND.sky}33`, flexShrink: 0 }, children: /* @__PURE__ */ jsx(TrendingUp, { size: 24 }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { style: { marginTop: 12, fontSize: 11, color: t.faint, display: "flex", alignItems: "center", gap: 6 }, children: [
            /* @__PURE__ */ jsx(Info, { size: 12 }),
            " This is merchant turnover — ",
            /* @__PURE__ */ jsx("b", { style: { color: t.muted }, children: "not" }),
            " VenQore income"
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 14, marginBottom: 20 }, children: [
      /* @__PURE__ */ jsx(KpiCard, { label: "Total Stores", value: fmtNumber(stats.total_stores), sub: `${fmtNumber(stats.active_stores)} active · ${fmtNumber(stats.trial_stores)} trial`, icon: Store, accent: BRAND.indigo }),
      /* @__PURE__ */ jsx(KpiCard, { label: "Platform Users", value: fmtNumber(stats.total_users), sub: `${fmtNumber(stats.platform_admins)} admins`, icon: Users, accent: BRAND.violet }),
      /* @__PURE__ */ jsx(KpiCard, { label: "New This Month", value: fmtNumber(stats.new_this_month), sub: `${fmtNumber(stats.new_today)} today`, icon: UserPlus, accent: BRAND.emerald }),
      /* @__PURE__ */ jsx(KpiCard, { label: "Suspended", value: fmtNumber(stats.suspended_stores), sub: `${fmtNumber(stats.churned_stores)} churned`, icon: AlertTriangle, accent: BRAND.amber })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)", gap: 16, marginBottom: 20 }, className: "vq-grid-collapse", children: [
      /* @__PURE__ */ jsxs(Panel, { pad: 20, children: [
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }, children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { style: { fontSize: 15, fontWeight: 800, color: t.ink }, children: "Store Growth" }),
            /* @__PURE__ */ jsx("div", { style: { fontSize: 12, color: t.muted }, children: "New store registrations over time" })
          ] }),
          /* @__PURE__ */ jsxs(Badge, { color: BRAND.indigo, children: [
            /* @__PURE__ */ jsx(Activity, { size: 11 }),
            " Live"
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { style: { height: 240 }, children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(AreaChart, { data: store_trend, margin: { top: 6, right: 6, left: -18, bottom: 0 }, children: [
          /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("linearGradient", { id: "vqArea", x1: "0", y1: "0", x2: "0", y2: "1", children: [
            /* @__PURE__ */ jsx("stop", { offset: "0%", stopColor: BRAND.indigo, stopOpacity: 0.5 }),
            /* @__PURE__ */ jsx("stop", { offset: "100%", stopColor: BRAND.indigo, stopOpacity: 0 })
          ] }) }),
          /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: t.border, vertical: false }),
          /* @__PURE__ */ jsx(XAxis, { dataKey: "month", tick: { fontSize: 11, fill: t.muted }, axisLine: false, tickLine: false }),
          /* @__PURE__ */ jsx(YAxis, { tick: { fontSize: 11, fill: t.muted }, axisLine: false, tickLine: false, allowDecimals: false }),
          /* @__PURE__ */ jsx(Tooltip, { contentStyle: { background: t.panelSolid, border: `1px solid ${t.border2}`, borderRadius: 12, fontSize: 12, color: t.ink } }),
          /* @__PURE__ */ jsx(Area, { type: "monotone", dataKey: "stores", stroke: BRAND.indigo, strokeWidth: 2.5, fill: "url(#vqArea)", animationDuration: 700 })
        ] }) }) })
      ] }),
      /* @__PURE__ */ jsxs(Panel, { pad: 20, children: [
        /* @__PURE__ */ jsx("div", { style: { fontSize: 15, fontWeight: 800, color: t.ink, marginBottom: 2 }, children: "Plan Distribution" }),
        /* @__PURE__ */ jsx("div", { style: { fontSize: 12, color: t.muted, marginBottom: 10 }, children: "Active stores by plan" }),
        planRows.length === 0 ? /* @__PURE__ */ jsx(EmptyState, { icon: Layers, title: "No active plans yet" }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("div", { style: { height: 150 }, children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(PieChart, { children: [
            /* @__PURE__ */ jsx(Pie, { data: planRows, dataKey: "count", nameKey: "plan", cx: "50%", cy: "50%", innerRadius: 42, outerRadius: 64, paddingAngle: 3, stroke: "none", children: planRows.map((_, i) => /* @__PURE__ */ jsx(Cell, { fill: PLAN_COLORS[i % PLAN_COLORS.length] }, i)) }),
            /* @__PURE__ */ jsx(Tooltip, { contentStyle: { background: t.panelSolid, border: `1px solid ${t.border2}`, borderRadius: 12, fontSize: 12, color: t.ink } })
          ] }) }) }),
          /* @__PURE__ */ jsx("div", { style: { marginTop: 8 }, children: planRows.map((p, i) => /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8, padding: "5px 0", fontSize: 12.5 }, children: [
            /* @__PURE__ */ jsx("span", { style: { width: 9, height: 9, borderRadius: 3, background: PLAN_COLORS[i % PLAN_COLORS.length], flexShrink: 0 } }),
            /* @__PURE__ */ jsx("span", { style: { flex: 1, color: t.sub, textTransform: "capitalize", fontWeight: 600 }, children: p.plan }),
            /* @__PURE__ */ jsx("span", { style: { color: t.muted }, children: p.count }),
            /* @__PURE__ */ jsx("span", { style: { color: t.ink, fontWeight: 700, minWidth: 56, textAlign: "right" }, children: fmtCurrency(p.mrr) })
          ] }, p.plan)) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Panel, { pad: 18, style: { marginBottom: 20 }, children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }, children: [
        /* @__PURE__ */ jsx(Zap, { size: 16, color: BRAND.amber }),
        /* @__PURE__ */ jsx("span", { style: { fontSize: 14, fontWeight: 800, color: t.ink }, children: "Quick Actions" })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))", gap: 12 }, children: [
        /* @__PURE__ */ jsx(QuickAction, { t, icon: Layers, label: "Create a Plan", desc: "New pricing tier", color: BRAND.indigo, onClick: () => router.visit(window.route("platform.plans.index")) }),
        /* @__PURE__ */ jsx(QuickAction, { t, icon: Ticket, label: "New Coupon", desc: "Discount code", color: BRAND.violet, onClick: () => router.visit(window.route("platform.coupons.index")) }),
        /* @__PURE__ */ jsx(QuickAction, { t, icon: Building2, label: "Manage Stores", desc: "All merchants", color: BRAND.sky, onClick: () => router.visit(window.route("platform.stores")) }),
        /* @__PURE__ */ jsx(QuickAction, { t, icon: ShieldCheck, label: "Run Health Check", desc: "Test the platform", color: BRAND.emerald, onClick: () => router.visit(`${window.route("platform.dashboard")}?view=testing`) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)", gap: 16 }, className: "vq-grid-collapse", children: [
      /* @__PURE__ */ jsxs(Panel, { pad: 20, children: [
        /* @__PURE__ */ jsx("div", { style: { fontSize: 15, fontWeight: 800, color: t.ink, marginBottom: 14 }, children: "Recent Activity" }),
        (activity_feed || []).length === 0 ? /* @__PURE__ */ jsx(EmptyState, { icon: Activity, title: "No recent activity", message: "New signups and status changes will appear here." }) : /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: 2 }, children: activity_feed.map((a, i) => {
          const color = a.color === "amber" ? BRAND.amber : BRAND.indigo;
          return /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 12, padding: "11px 8px", borderRadius: 10, alignItems: "flex-start" }, className: "vq-row", children: [
            /* @__PURE__ */ jsx("div", { style: { width: 32, height: 32, borderRadius: 9, background: `${color}1f`, color, display: "grid", placeItems: "center", flexShrink: 0, marginTop: 1 }, children: a.icon === "alert" ? /* @__PURE__ */ jsx(AlertTriangle, { size: 15 }) : /* @__PURE__ */ jsx(Building2, { size: 15 }) }),
            /* @__PURE__ */ jsxs("div", { style: { minWidth: 0 }, children: [
              /* @__PURE__ */ jsx("div", { style: { fontSize: 13, fontWeight: 600, color: t.ink }, children: stripEmoji(a.message) }),
              /* @__PURE__ */ jsx("div", { style: { fontSize: 11.5, color: t.muted, marginTop: 1 }, children: a.sub })
            ] })
          ] }, i);
        }) })
      ] }),
      /* @__PURE__ */ jsxs(Panel, { pad: 20, children: [
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }, children: [
          /* @__PURE__ */ jsx(Clock, { size: 16, color: BRAND.amber }),
          /* @__PURE__ */ jsx("span", { style: { fontSize: 15, fontWeight: 800, color: t.ink }, children: "Trials Expiring Soon" })
        ] }),
        (expiring_stores || []).length === 0 ? /* @__PURE__ */ jsx(EmptyState, { icon: Clock, title: "No trials expiring", message: "Trials ending within 7 days show up here." }) : /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: 8 }, children: expiring_stores.map((s) => /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 11, background: t.inputBg, border: `1px solid ${t.border}` }, children: [
          /* @__PURE__ */ jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
            /* @__PURE__ */ jsx("div", { style: { fontSize: 13, fontWeight: 700, color: t.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }, children: s.name }),
            /* @__PURE__ */ jsx("div", { style: { fontSize: 11.5, color: t.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }, children: s.owner_email })
          ] }),
          /* @__PURE__ */ jsxs(Badge, { color: s.days_left <= 2 ? BRAND.rose : BRAND.amber, children: [
            s.days_left,
            "d left"
          ] })
        ] }, s.id)) })
      ] })
    ] }),
    /* @__PURE__ */ jsx("style", { children: `@media (max-width: 900px){ .vq-grid-collapse{ grid-template-columns: 1fr !important; } }` })
  ] });
}
function QuickAction({ t, icon: Icon, label, desc, color, onClick }) {
  return /* @__PURE__ */ jsxs("button", { onClick, className: "vq-press vq-card-hover", style: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "13px 15px",
    borderRadius: 13,
    background: t.inputBg,
    border: `1px solid ${t.border}`,
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "inherit",
    width: "100%"
  }, children: [
    /* @__PURE__ */ jsx("div", { style: { width: 38, height: 38, borderRadius: 11, background: `${color}1f`, color, display: "grid", placeItems: "center", flexShrink: 0 }, children: /* @__PURE__ */ jsx(Icon, { size: 18 }) }),
    /* @__PURE__ */ jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
      /* @__PURE__ */ jsx("div", { style: { fontSize: 13.5, fontWeight: 700, color: t.ink }, children: label }),
      /* @__PURE__ */ jsx("div", { style: { fontSize: 11.5, color: t.muted }, children: desc })
    ] }),
    /* @__PURE__ */ jsx(ArrowUpRight, { size: 16, color: t.faint })
  ] });
}
function stripEmoji(s) {
  return String(s || "").replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}️]/gu, "").trim();
}
export {
  Overview as default
};

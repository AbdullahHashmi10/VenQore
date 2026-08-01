import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import "react";
import { usePage, Head, router } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-KMWHwZqK.js";
import { f as formatCurrency } from "./format-B_ph0Qec.js";
import { Plus, ShoppingBag, Truck, AlertTriangle, DollarSign, ArrowRight, CheckCircle2 } from "lucide-react";
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
const STATUS = {
  ordered: { color: "#6366f1", bg: "#eef2ff", label: "Ordered" },
  partial: { color: "#f59e0b", bg: "#fffbeb", label: "Partial" },
  partially_received: { color: "#f59e0b", bg: "#fffbeb", label: "Partial" },
  received: { color: "#10b981", bg: "#f0fdf4", label: "Received" },
  cancelled: { color: "#ef4444", bg: "#fef2f2", label: "Cancelled" }
};
function StatusPill({ status }) {
  const cfg = STATUS[status] ?? { color: "#64748b", bg: "#f1f5f9", label: status };
  return /* @__PURE__ */ jsx("span", { style: { padding: "3px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.color, textTransform: "uppercase", letterSpacing: "0.04em" }, children: cfg.label });
}
function KpiCard({ icon: Icon, label, value, sub, color = "#6366f1" }) {
  return /* @__PURE__ */ jsxs("div", { style: { background: "var(--card-bg,#fff)", border: "1px solid var(--card-border,#f1f5f9)", borderRadius: 20, padding: "20px 22px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }, children: [
    /* @__PURE__ */ jsx("div", { style: { width: 38, height: 38, borderRadius: 11, background: color + "15", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }, children: /* @__PURE__ */ jsx(Icon, { size: 18, color }) }),
    /* @__PURE__ */ jsx("div", { style: { fontSize: 22, fontWeight: 800, color: "var(--text-main,#0f172a)", lineHeight: 1 }, children: value }),
    /* @__PURE__ */ jsx("div", { style: { fontSize: 12, color: "#64748b", marginTop: 5, fontWeight: 600 }, children: label }),
    sub && /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: "#94a3b8", marginTop: 2 }, children: sub })
  ] });
}
function PurchasingDashboard({
  openPurchaseOrders,
  pendingDeliveriesCount,
  reorderAlerts,
  supplierPayables,
  monthlySpend,
  budgetUsed,
  recentOrders
}) {
  const { store, my_display_name, auth } = usePage().props;
  store?.slug;
  const sym = store?.currency_symbol ?? "$ ";
  const fmt = (v) => formatCurrency ? formatCurrency(parseFloat(v || 0)) : sym + Number(v || 0).toLocaleString();
  const openCount = openPurchaseOrders ?? 0;
  const deliveries = pendingDeliveriesCount ?? 0;
  const alerts = reorderAlerts ?? [];
  const payables = supplierPayables ?? 0;
  const spend = monthlySpend ?? 0;
  const budget = budgetUsed ?? 0;
  const orders = recentOrders ?? [];
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { activeMenu: "Dashboard", children: [
    /* @__PURE__ */ jsx(Head, { title: "Purchasing Dashboard" }),
    /* @__PURE__ */ jsxs("div", { style: { padding: "24px 24px 48px", maxWidth: 1300, margin: "0 auto" }, children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }, children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { style: { fontSize: 22, fontWeight: 800, color: "var(--text-main,#0f172a)", margin: 0 }, children: "📦 Purchasing & Procurement" }),
          /* @__PURE__ */ jsxs("p", { style: { fontSize: 13, color: "#64748b", margin: "4px 0 0" }, children: [
            store?.name,
            " · ",
            (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", { month: "long", year: "numeric" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => router.visit(route("store.purchases.create", {
              store_slug: store.slug
            })),
            style: { display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 12, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(99,102,241,0.3)" },
            children: [
              /* @__PURE__ */ jsx(Plus, { size: 15 }),
              " New Purchase Order"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }, children: [
        /* @__PURE__ */ jsx(
          KpiCard,
          {
            icon: ShoppingBag,
            color: "#6366f1",
            label: "Open Purchase Orders",
            value: openCount,
            sub: "Not yet fully received"
          }
        ),
        /* @__PURE__ */ jsx(
          KpiCard,
          {
            icon: Truck,
            color: "#f59e0b",
            label: "Pending Deliveries",
            value: deliveries,
            sub: "Expected this week"
          }
        ),
        /* @__PURE__ */ jsx(
          KpiCard,
          {
            icon: AlertTriangle,
            color: "#ef4444",
            label: "Reorder Alerts",
            value: alerts.length,
            sub: alerts.length > 0 ? "Products below reorder point" : "All stock levels healthy"
          }
        ),
        /* @__PURE__ */ jsx(
          KpiCard,
          {
            icon: DollarSign,
            color: "#10b981",
            label: "Supplier Payables",
            value: fmt(payables),
            sub: `This month spend: ${fmt(spend)}`
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }, children: [
        /* @__PURE__ */ jsxs("div", { style: { background: "var(--card-bg,#fff)", border: "1px solid var(--card-border,#f1f5f9)", borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }, children: [
          /* @__PURE__ */ jsxs("div", { style: { padding: "18px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
            /* @__PURE__ */ jsx("div", { style: { fontWeight: 700, fontSize: 15, color: "var(--text-main,#0f172a)" }, children: "Purchase Orders" }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => router.visit(route("store.purchases.index", {
                  store_slug: store.slug
                })),
                style: { fontSize: 12, color: "#6366f1", fontWeight: 600, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 },
                children: [
                  "View All ",
                  /* @__PURE__ */ jsx(ArrowRight, { size: 12 })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("table", { style: { width: "100%", borderCollapse: "collapse" }, children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", { style: { borderBottom: "1px solid #f1f5f9" }, children: ["Order #", "Supplier", "Amount", "Status", "Expected"].map((h) => /* @__PURE__ */ jsx("th", { style: { padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }, children: h }, h)) }) }),
            /* @__PURE__ */ jsxs("tbody", { children: [
              orders.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 5, style: { padding: "32px", textAlign: "center", color: "#94a3b8", fontSize: 13 }, children: "No purchase orders yet." }) }),
              orders.map((po, i) => /* @__PURE__ */ jsxs(
                "tr",
                {
                  style: { borderBottom: "1px solid #f8fafc", transition: "background 0.12s" },
                  onMouseEnter: (e) => e.currentTarget.style.background = "#fafafa",
                  onMouseLeave: (e) => e.currentTarget.style.background = "transparent",
                  children: [
                    /* @__PURE__ */ jsxs("td", { style: { padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "var(--text-main,#0f172a)" }, children: [
                      "#",
                      po.id
                    ] }),
                    /* @__PURE__ */ jsx("td", { style: { padding: "12px 16px", fontSize: 13, color: "#475569" }, children: po.supplier_name ?? "—" }),
                    /* @__PURE__ */ jsx("td", { style: { padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#0f172a" }, children: fmt(po.total_amount ?? 0) }),
                    /* @__PURE__ */ jsx("td", { style: { padding: "12px 16px" }, children: /* @__PURE__ */ jsx(StatusPill, { status: po.status }) }),
                    /* @__PURE__ */ jsx("td", { style: { padding: "12px 16px", fontSize: 12, color: "#94a3b8" }, children: po.expected_date ?? "—" })
                  ]
                },
                i
              ))
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 16 }, children: [
          /* @__PURE__ */ jsxs("div", { style: { background: "var(--card-bg,#fff)", border: "1px solid var(--card-border,#f1f5f9)", borderRadius: 20, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }, children: [
            /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }, children: [
              /* @__PURE__ */ jsx("div", { style: { fontWeight: 700, fontSize: 15, color: "var(--text-main,#0f172a)" }, children: "⚠️ Reorder Alerts" }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => router.visit(route("store.inventory.index", {
                    store_slug: store.slug
                  })),
                  style: { fontSize: 12, color: "#6366f1", fontWeight: 600, background: "none", border: "none", cursor: "pointer" },
                  children: "View All"
                }
              )
            ] }),
            alerts.length === 0 ? /* @__PURE__ */ jsxs("div", { style: { textAlign: "center", padding: "16px 0" }, children: [
              /* @__PURE__ */ jsx(CheckCircle2, { size: 28, color: "#10b981", style: { margin: "0 auto 8px" } }),
              /* @__PURE__ */ jsx("p", { style: { fontSize: 13, color: "#64748b", margin: 0 }, children: "All stock levels are healthy." })
            ] }) : /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: 8 }, children: alerts.slice(0, 8).map((item, i) => /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 12, background: "#fef9f0", border: "1px solid #fed7aa" }, children: [
              /* @__PURE__ */ jsxs("div", { style: { minWidth: 0 }, children: [
                /* @__PURE__ */ jsx("div", { style: { fontSize: 13, fontWeight: 700, color: "#92400e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160 }, children: item.name }),
                /* @__PURE__ */ jsxs("div", { style: { fontSize: 11, color: "#b45309", marginTop: 2 }, children: [
                  "Stock: ",
                  item.stock,
                  " / Min: ",
                  item.min_stock
                ] })
              ] }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => router.visit(route("store.purchases.create", {
                    store_slug: store.slug,
                    product_id: item.id
                  })),
                  style: { padding: "5px 10px", borderRadius: 8, background: "#fff", border: "1px solid #e2e8f0", fontSize: 11, fontWeight: 700, color: "#6366f1", cursor: "pointer", flexShrink: 0 },
                  children: "Order"
                }
              )
            ] }, i)) })
          ] }),
          /* @__PURE__ */ jsxs("div", { style: { background: "var(--card-bg,#fff)", border: "1px solid var(--card-border,#f1f5f9)", borderRadius: 20, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }, children: [
            /* @__PURE__ */ jsx("div", { style: { fontWeight: 700, fontSize: 14, color: "var(--text-main,#0f172a)", marginBottom: 12 }, children: "Monthly Procurement Spend" }),
            /* @__PURE__ */ jsx("div", { style: { fontSize: 24, fontWeight: 800, color: "#0f172a" }, children: fmt(spend) }),
            /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: "#64748b", marginTop: 4, marginBottom: 14 }, children: "Total purchases this month" }),
            budget > 0 && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("div", { style: { height: 6, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }, children: /* @__PURE__ */ jsx("div", { style: { width: `${Math.min(100, spend / budget * 100)}%`, height: "100%", background: spend > budget ? "#ef4444" : "#6366f1", borderRadius: 4, transition: "width 0.6s" } }) }),
              /* @__PURE__ */ jsxs("div", { style: { fontSize: 11, color: "#94a3b8", marginTop: 6 }, children: [
                Math.round(spend / budget * 100),
                "% of ",
                fmt(budget),
                " budget used"
              ] })
            ] })
          ] })
        ] })
      ] })
    ] })
  ] });
}
export {
  PurchasingDashboard as default
};

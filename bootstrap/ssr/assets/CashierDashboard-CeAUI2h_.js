import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import { usePage, Head, router } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-BqRkhJQJ.js";
import { Zap, ArrowRight, RotateCcw, ShoppingCart, DollarSign, Clock, CheckCircle2, LogIn, Package } from "lucide-react";
import { f as formatCurrency } from "./format-B_ph0Qec.js";
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
function StatTile({ icon: Icon, label, value, sub, color = "#6366f1" }) {
  return /* @__PURE__ */ jsxs("div", { style: {
    background: "var(--card-bg, #fff)",
    border: "1px solid var(--card-border, #f1f5f9)",
    borderRadius: 20,
    padding: "20px 24px",
    display: "flex",
    alignItems: "center",
    gap: 16,
    boxShadow: "0 2px 12px rgba(0,0,0,0.04)"
  }, children: [
    /* @__PURE__ */ jsx("div", { style: {
      width: 48,
      height: 48,
      borderRadius: 14,
      background: color + "15",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0
    }, children: /* @__PURE__ */ jsx(Icon, { size: 22, color }) }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("div", { style: { fontSize: 22, fontWeight: 800, color: "var(--text-main, #0f172a)", lineHeight: 1 }, children: value }),
      /* @__PURE__ */ jsx("div", { style: { fontSize: 12, fontWeight: 600, color: "var(--text-sub, #64748b)", marginTop: 3 }, children: label }),
      sub && /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: "#94a3b8", marginTop: 2 }, children: sub })
    ] })
  ] });
}
function CashierDashboard({ session, attendance }) {
  const { auth, store, my_display_name } = usePage().props;
  const storeSlug = store?.slug;
  const txCount = session?.transaction_count ?? 0;
  const sessionAmt = session?.session_total ?? 0;
  const clockIn = attendance?.clock_in_time ?? null;
  const isWorking = !!clockIn;
  const fmt = (v) => formatCurrency(v, store);
  const hoursWorked = () => {
    if (!clockIn) return "—";
    const start = new Date(clockIn);
    const now = /* @__PURE__ */ new Date();
    const hrs = Math.floor((now - start) / 36e5);
    const mins = Math.floor((now - start) % 36e5 / 6e4);
    return `${hrs}h ${mins}m`;
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { activeMenu: "Dashboard", children: [
    /* @__PURE__ */ jsx(Head, { title: "My Dashboard" }),
    /* @__PURE__ */ jsxs("div", { style: { maxWidth: 760, margin: "0 auto", padding: "32px 24px" }, children: [
      /* @__PURE__ */ jsxs("div", { style: { marginBottom: 32 }, children: [
        /* @__PURE__ */ jsxs("div", { style: { fontSize: 24, fontWeight: 800, color: "var(--text-main, #0f172a)" }, children: [
          "👋 Hey, ",
          my_display_name ?? auth?.user?.name ?? "there"
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { fontSize: 14, color: "var(--text-sub, #64748b)", marginTop: 4 }, children: [
          store?.name,
          " · ",
          (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => router.visit(route("store.pos", { store_slug: storeSlug })),
          style: {
            width: "100%",
            padding: "22px 28px",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            border: "none",
            borderRadius: 20,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
            boxShadow: "0 8px 28px rgba(99,102,241,0.35)",
            transition: "transform 0.15s, box-shadow 0.15s"
          },
          onMouseEnter: (e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 12px 36px rgba(99,102,241,0.45)";
          },
          onMouseLeave: (e) => {
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = "0 8px 28px rgba(99,102,241,0.35)";
          },
          children: [
            /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 16 }, children: [
              /* @__PURE__ */ jsx("div", { style: { width: 52, height: 52, borderRadius: 16, background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ jsx(Zap, { size: 26, color: "#fff" }) }),
              /* @__PURE__ */ jsxs("div", { style: { textAlign: "left" }, children: [
                /* @__PURE__ */ jsx("div", { style: { fontSize: 20, fontWeight: 800, color: "#fff" }, children: "Open POS Terminal" }),
                /* @__PURE__ */ jsx("div", { style: { fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 2 }, children: "Process sales, payments & returns" })
              ] })
            ] }),
            /* @__PURE__ */ jsx(ArrowRight, { size: 22, color: "rgba(255,255,255,0.8)" })
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => router.visit(route("store.returns.create", { store_slug: storeSlug })),
          style: {
            width: "100%",
            padding: "16px 28px",
            background: "#f8fafc",
            border: "1.5px solid #e2e8f0",
            borderRadius: 20,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
            transition: "background 0.15s, border-color 0.15s"
          },
          onMouseEnter: (e) => {
            e.currentTarget.style.background = "#f1f5f9";
            e.currentTarget.style.borderColor = "#6366f1";
          },
          onMouseLeave: (e) => {
            e.currentTarget.style.background = "#f8fafc";
            e.currentTarget.style.borderColor = "#e2e8f0";
          },
          children: [
            /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 14 }, children: [
              /* @__PURE__ */ jsx("div", { style: { width: 44, height: 44, borderRadius: 12, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ jsx(RotateCcw, { size: 20, color: "#6366f1" }) }),
              /* @__PURE__ */ jsxs("div", { style: { textAlign: "left" }, children: [
                /* @__PURE__ */ jsx("div", { style: { fontSize: 16, fontWeight: 700, color: "var(--text-main, #0f172a)" }, children: "Process Return" }),
                /* @__PURE__ */ jsx("div", { style: { fontSize: 12, color: "var(--text-sub, #64748b)", marginTop: 2 }, children: "Handle customer item returns" })
              ] })
            ] }),
            /* @__PURE__ */ jsx(ArrowRight, { size: 18, color: "#94a3b8" })
          ]
        }
      ),
      /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }, children: [
        /* @__PURE__ */ jsx(
          StatTile,
          {
            icon: ShoppingCart,
            label: "Transactions Today",
            value: txCount,
            sub: "This session",
            color: "#6366f1"
          }
        ),
        /* @__PURE__ */ jsx(
          StatTile,
          {
            icon: DollarSign,
            label: "Session Total",
            value: fmt(sessionAmt),
            sub: "Cash collected",
            color: "#10b981"
          }
        ),
        /* @__PURE__ */ jsx(
          StatTile,
          {
            icon: Clock,
            label: "Time on Shift",
            value: hoursWorked(),
            sub: clockIn ? "Since " + new Date(clockIn).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "Not clocked in",
            color: isWorking ? "#f59e0b" : "#94a3b8"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { style: {
        background: "var(--card-bg, #fff)",
        border: "1px solid var(--card-border, #f1f5f9)",
        borderRadius: 20,
        padding: "20px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 2px 12px rgba(0,0,0,0.04)"
      }, children: [
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 14 }, children: [
          /* @__PURE__ */ jsx("div", { style: { width: 42, height: 42, borderRadius: 12, background: isWorking ? "#10b98115" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }, children: isWorking ? /* @__PURE__ */ jsx(CheckCircle2, { size: 20, color: "#10b981" }) : /* @__PURE__ */ jsx(LogIn, { size: 20, color: "#94a3b8" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { style: { fontWeight: 700, fontSize: 14, color: "var(--text-main, #0f172a)" }, children: isWorking ? "You're clocked in" : "Not yet clocked in" }),
            /* @__PURE__ */ jsx("div", { style: { fontSize: 12, color: "var(--text-sub, #64748b)", marginTop: 2 }, children: isWorking ? `Since ${new Date(clockIn).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}` : "Use the POS to start your shift" })
          ] })
        ] }),
        isWorking && /* @__PURE__ */ jsx("div", { style: { padding: "5px 12px", borderRadius: 8, background: "#10b98112", border: "1px solid #10b98125", color: "#10b981", fontSize: 12, fontWeight: 700 }, children: "Active" })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { marginTop: 24, padding: "14px 18px", borderRadius: 14, background: "#f8fafc", border: "1px solid #e2e8f0", fontSize: 13, color: "#64748b", display: "flex", alignItems: "center", gap: 10 }, children: [
        /* @__PURE__ */ jsx(Package, { size: 14, color: "#94a3b8" }),
        "Need access to reports, inventory, or finances? Contact your Store Manager or Owner."
      ] })
    ] })
  ] });
}
export {
  CashierDashboard as default
};

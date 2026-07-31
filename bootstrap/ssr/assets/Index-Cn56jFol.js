import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { useForm, router } from "@inertiajs/react";
import { P as PlatformShell } from "./PlatformShell-a5p7K_Zs.js";
import "./PlatformLayout-CV-DtcbF.js";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "lucide-react";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "laravel-echo";
import "pusher-js";
import "./ui-Dd6dJcJr.js";
function CouponRow({ coupon, i }) {
  const isValid = coupon.is_active && (!coupon.valid_until || new Date(coupon.valid_until) > /* @__PURE__ */ new Date()) && (!coupon.max_uses || coupon.used_count < coupon.max_uses);
  const toggle = () => {
    router.put(route("platform.coupons.update", { coupon: coupon.id }), { is_active: !coupon.is_active });
  };
  return /* @__PURE__ */ jsxs(
    "tr",
    {
      style: { borderTop: i > 0 ? "1px solid #1e293b" : "none" },
      onMouseEnter: (e) => e.currentTarget.style.background = "#131c2e",
      onMouseLeave: (e) => e.currentTarget.style.background = "",
      children: [
        /* @__PURE__ */ jsxs("td", { style: { padding: "14px 16px" }, children: [
          /* @__PURE__ */ jsx("div", { style: { fontFamily: "monospace", fontWeight: 800, fontSize: 15, color: "#f1f5f9", letterSpacing: 1 }, children: coupon.code }),
          /* @__PURE__ */ jsx("div", { style: { fontSize: 12, color: "#64748b", marginTop: 2 }, children: coupon.name })
        ] }),
        /* @__PURE__ */ jsxs("td", { style: { padding: "14px 16px", color: "#94a3b8", fontSize: 13 }, children: [
          coupon.discount_type === "percentage" ? `${coupon.discount_value}%` : `$${coupon.discount_value}`,
          coupon.max_discount ? ` (max $${coupon.max_discount})` : ""
        ] }),
        /* @__PURE__ */ jsx("td", { style: { padding: "14px 16px" }, children: /* @__PURE__ */ jsx("span", { style: {
          background: coupon.applies_to === "all" ? "#6366f122" : "#f59e0b22",
          color: coupon.applies_to === "all" ? "#6366f1" : "#f59e0b",
          padding: "3px 10px",
          borderRadius: 99,
          fontSize: 12,
          fontWeight: 600
        }, children: coupon.applies_to }) }),
        /* @__PURE__ */ jsxs("td", { style: { padding: "14px 16px", color: "#94a3b8", fontSize: 13 }, children: [
          coupon.used_count,
          " / ",
          coupon.max_uses ?? "∞"
        ] }),
        /* @__PURE__ */ jsxs("td", { style: { padding: "14px 16px", color: "#94a3b8", fontSize: 12 }, children: [
          /* @__PURE__ */ jsx("div", { children: coupon.valid_from ? new Date(coupon.valid_from).toLocaleDateString() : "Now" }),
          /* @__PURE__ */ jsx("div", { children: coupon.valid_until ? "→ " + new Date(coupon.valid_until).toLocaleDateString() : "(no end)" })
        ] }),
        /* @__PURE__ */ jsx("td", { style: { padding: "14px 16px" }, children: /* @__PURE__ */ jsx("span", { style: {
          background: isValid ? "#22c55e22" : "#ef444422",
          color: isValid ? "#22c55e" : "#ef4444",
          padding: "3px 10px",
          borderRadius: 99,
          fontSize: 12,
          fontWeight: 700
        }, children: isValid ? "✓ Valid" : "✗ Invalid" }) }),
        /* @__PURE__ */ jsx("td", { style: { padding: "14px 16px" }, children: /* @__PURE__ */ jsx(
          "button",
          {
            onClick: toggle,
            style: {
              background: coupon.is_active ? "#22c55e22" : "#47556922",
              color: coupon.is_active ? "#22c55e" : "#64748b",
              border: "none",
              padding: "4px 12px",
              borderRadius: 99,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer"
            },
            children: coupon.is_active ? "Active" : "Inactive"
          }
        ) })
      ]
    }
  );
}
function CouponForm({ onClose, plans }) {
  const { data, setData, post, processing, errors, reset } = useForm({
    code: "",
    name: "",
    description: "",
    discount_type: "percentage",
    discount_value: "",
    max_discount: "",
    applies_to: "all",
    platform_id: "",
    max_uses: "",
    max_uses_per_user: 1,
    valid_from: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    valid_until: "",
    plan_ids: []
  });
  const submit = (e) => {
    e.preventDefault();
    post(route("platform.coupons.store"), { onSuccess: () => {
      reset();
      onClose();
    } });
  };
  return /* @__PURE__ */ jsxs("div", { style: { position: "fixed", inset: 0, zIndex: 50, display: "flex" }, children: [
    /* @__PURE__ */ jsx("div", { style: { flex: 1, background: "rgba(0,0,0,0.5)" }, onClick: onClose }),
    /* @__PURE__ */ jsxs("div", { style: { width: 520, background: "#0f172a", overflowY: "auto", boxShadow: "-4px 0 32px rgba(0,0,0,0.5)" }, children: [
      /* @__PURE__ */ jsxs("div", { style: { padding: "24px 28px 16px", borderBottom: "1px solid #1e293b", display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
        /* @__PURE__ */ jsx("h2", { style: { margin: 0, fontSize: 18, fontWeight: 700, color: "#f1f5f9" }, children: "New Coupon" }),
        /* @__PURE__ */ jsx("button", { onClick: onClose, style: { background: "none", border: "none", color: "#94a3b8", fontSize: 22, cursor: "pointer" }, children: "✕" })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: submit, style: { padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16 }, children: [
        /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }, children: [
          /* @__PURE__ */ jsx(Field, { label: "Code", error: errors.code, children: /* @__PURE__ */ jsx("input", { style: inp, value: data.code, onChange: (e) => setData("code", e.target.value.toUpperCase()), placeholder: "WELCOME30" }) }),
          /* @__PURE__ */ jsx(Field, { label: "Name", error: errors.name, children: /* @__PURE__ */ jsx("input", { style: inp, value: data.name, onChange: (e) => setData("name", e.target.value), placeholder: "Welcome 30% Off" }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }, children: [
          /* @__PURE__ */ jsx(Field, { label: "Discount Type", error: errors.discount_type, children: /* @__PURE__ */ jsxs("select", { style: inp, value: data.discount_type, onChange: (e) => setData("discount_type", e.target.value), children: [
            /* @__PURE__ */ jsx("option", { value: "percentage", children: "Percentage (%)" }),
            /* @__PURE__ */ jsx("option", { value: "fixed", children: "Fixed ($)" })
          ] }) }),
          /* @__PURE__ */ jsx(Field, { label: data.discount_type === "percentage" ? "Discount %" : "Discount $", error: errors.discount_value, children: /* @__PURE__ */ jsx("input", { style: inp, type: "number", step: "0.01", value: data.discount_value, onChange: (e) => setData("discount_value", e.target.value), placeholder: "30" }) })
        ] }),
        /* @__PURE__ */ jsx(Field, { label: "Applies To", error: errors.applies_to, children: /* @__PURE__ */ jsx("select", { style: inp, value: data.applies_to, onChange: (e) => setData("applies_to", e.target.value), children: ["all", "subscription", "ltd", "specific_plans"].map((t) => /* @__PURE__ */ jsx("option", { value: t, children: t }, t)) }) }),
        data.applies_to === "specific_plans" && /* @__PURE__ */ jsx(Field, { label: "Restrict to Plans", error: errors.plan_ids, children: /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: 6, background: "#1e293b", borderRadius: 8, padding: 12 }, children: plans.map((p) => /* @__PURE__ */ jsxs("label", { style: { display: "flex", alignItems: "center", gap: 8, color: "#94a3b8", fontSize: 13, cursor: "pointer" }, children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "checkbox",
              checked: data.plan_ids.includes(p.id),
              onChange: (e) => {
                if (e.target.checked) setData("plan_ids", [...data.plan_ids, p.id]);
                else setData("plan_ids", data.plan_ids.filter((id) => id !== p.id));
              }
            }
          ),
          p.platform?.name,
          " – ",
          p.name
        ] }, p.id)) }) }),
        /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }, children: [
          /* @__PURE__ */ jsx(Field, { label: "Max Uses (total)", error: errors.max_uses, children: /* @__PURE__ */ jsx("input", { style: inp, type: "number", value: data.max_uses, onChange: (e) => setData("max_uses", e.target.value), placeholder: "unlimited" }) }),
          /* @__PURE__ */ jsx(Field, { label: "Max Per User", error: errors.max_uses_per_user, children: /* @__PURE__ */ jsx("input", { style: inp, type: "number", value: data.max_uses_per_user, onChange: (e) => setData("max_uses_per_user", +e.target.value) }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }, children: [
          /* @__PURE__ */ jsx(Field, { label: "Valid From", error: errors.valid_from, children: /* @__PURE__ */ jsx("input", { style: inp, type: "date", value: data.valid_from, onChange: (e) => setData("valid_from", e.target.value) }) }),
          /* @__PURE__ */ jsx(Field, { label: "Valid Until (blank = forever)", error: errors.valid_until, children: /* @__PURE__ */ jsx("input", { style: inp, type: "date", value: data.valid_until, onChange: (e) => setData("valid_until", e.target.value) }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "flex-end", gap: 12, paddingTop: 16, borderTop: "1px solid #1e293b" }, children: [
          /* @__PURE__ */ jsx("button", { type: "button", onClick: onClose, style: btnSec, children: "Cancel" }),
          /* @__PURE__ */ jsx("button", { type: "submit", disabled: processing, style: btnPri, children: processing ? "Creating…" : "Create Coupon" })
        ] })
      ] })
    ] })
  ] });
}
function CouponsIndex({ coupons, plans }) {
  const [showForm, setShowForm] = useState(false);
  return /* @__PURE__ */ jsxs(PlatformShell, { title: "Coupon Management", mode: "admin", activeMenu: "Coupons", children: [
    /* @__PURE__ */ jsxs("div", { style: { padding: "32px 40px", minHeight: "100vh", background: "#020617" }, children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }, children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { style: { margin: 0, fontSize: 28, fontWeight: 800, color: "#f1f5f9" }, children: "Coupon Management" }),
          /* @__PURE__ */ jsx("p", { style: { margin: "4px 0 0", color: "#64748b", fontSize: 14 }, children: "Create and manage discount codes for subscriptions and lifetime deals." })
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: () => setShowForm(true), style: btnPri, children: "+ New Coupon" })
      ] }),
      /* @__PURE__ */ jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }, children: [
        { label: "Total Coupons", value: coupons.length },
        { label: "Active Now", value: coupons.filter((c) => c.is_active).length, color: "#22c55e" },
        { label: "Total Redemptions", value: coupons.reduce((s, c) => s + (c.redemptions_count || 0), 0), color: "#6366f1" },
        { label: "Expiring Soon", value: coupons.filter((c) => c.valid_until && new Date(c.valid_until) < new Date(Date.now() + 14 * 864e5)).length, color: "#f59e0b" }
      ].map((stat) => /* @__PURE__ */ jsxs("div", { style: { background: "#0f172a", borderRadius: 12, border: "1px solid #1e293b", padding: "16px 20px" }, children: [
        /* @__PURE__ */ jsx("div", { style: { fontSize: 12, color: "#64748b", marginBottom: 4 }, children: stat.label }),
        /* @__PURE__ */ jsx("div", { style: { fontSize: 24, fontWeight: 800, color: stat.color || "#f1f5f9" }, children: stat.value })
      ] }, stat.label)) }),
      /* @__PURE__ */ jsx("div", { style: { background: "#0f172a", borderRadius: 16, border: "1px solid #1e293b", overflow: "hidden" }, children: /* @__PURE__ */ jsxs("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 14 }, children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", { style: { background: "#1e293b" }, children: ["Code", "Discount", "Applies To", "Uses", "Validity", "Valid?", "Status"].map((h) => /* @__PURE__ */ jsx("th", { style: { padding: "12px 16px", textAlign: "left", color: "#64748b", fontWeight: 600, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.5px" }, children: h }, h)) }) }),
        /* @__PURE__ */ jsx("tbody", { children: coupons.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 7, style: { padding: "48px 0", textAlign: "center", color: "#475569" }, children: "No coupons yet. Create your first one!" }) }) : coupons.map((c, i) => /* @__PURE__ */ jsx(CouponRow, { coupon: c, i }, c.id)) })
      ] }) })
    ] }),
    showForm && /* @__PURE__ */ jsx(CouponForm, { onClose: () => setShowForm(false), plans })
  ] });
}
const Field = ({ label, error, children }) => /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 4 }, children: [
  /* @__PURE__ */ jsx("label", { style: { fontSize: 12, color: "#64748b", fontWeight: 600 }, children: label }),
  children,
  error && /* @__PURE__ */ jsx("span", { style: { fontSize: 11, color: "#ef4444" }, children: error })
] });
const inp = {
  width: "100%",
  boxSizing: "border-box",
  background: "#1e293b",
  border: "1px solid #334155",
  color: "#f1f5f9",
  padding: "8px 12px",
  borderRadius: 8,
  fontSize: 14,
  outline: "none"
};
const btnPri = {
  background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
  color: "#fff",
  border: "none",
  padding: "10px 22px",
  borderRadius: 10,
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer"
};
const btnSec = {
  background: "#1e293b",
  color: "#94a3b8",
  border: "1px solid #334155",
  padding: "9px 20px",
  borderRadius: 10,
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer"
};
export {
  CouponsIndex as default
};

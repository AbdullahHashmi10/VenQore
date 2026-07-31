import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { router, Link, useForm } from "@inertiajs/react";
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
function OverrideDrawer({ open, tenant, availableKeys, onClose }) {
  const { data, setData, post, processing, errors, reset } = useForm({
    override_key: "",
    override_value: "",
    reason: "",
    expires_at: "",
    notify_user: true,
    notification_message: ""
  });
  const submit = (e) => {
    e.preventDefault();
    post(route("platform.tenants.overrides.apply", { tenant: tenant.id }), {
      onSuccess: () => {
        reset();
        onClose();
      }
    });
  };
  if (!open) return null;
  return /* @__PURE__ */ jsxs("div", { style: { position: "fixed", inset: 0, zIndex: 50, display: "flex" }, children: [
    /* @__PURE__ */ jsx("div", { style: { flex: 1, background: "rgba(0,0,0,0.5)" }, onClick: onClose }),
    /* @__PURE__ */ jsxs("div", { style: { width: 500, background: "#0f172a", overflowY: "auto", boxShadow: "-4px 0 32px rgba(0,0,0,0.5)" }, children: [
      /* @__PURE__ */ jsxs("div", { style: { padding: "24px 28px 16px", borderBottom: "1px solid #1e293b", display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { style: { margin: 0, fontSize: 18, fontWeight: 700, color: "#f1f5f9" }, children: "Apply Override" }),
          /* @__PURE__ */ jsxs("p", { style: { margin: "4px 0 0", fontSize: 13, color: "#64748b" }, children: [
            tenant.name,
            " · Plan: ",
            /* @__PURE__ */ jsx("b", { style: { color: "#94a3b8" }, children: tenant.plan })
          ] })
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: onClose, style: { background: "none", border: "none", color: "#94a3b8", fontSize: 22, cursor: "pointer" }, children: "✕" })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: submit, style: { padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16 }, children: [
        /* @__PURE__ */ jsxs("div", { style: { background: "#1e293b", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#94a3b8" }, children: [
          /* @__PURE__ */ jsx("b", { style: { color: "#f59e0b" }, children: "⚡ Live Override" }),
          " — This change takes effect immediately and invalidates the cache. The tenant will be able to use the new limit right away."
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }, children: [
          /* @__PURE__ */ jsx(Field, { label: "Limit Key", error: errors.override_key, children: /* @__PURE__ */ jsxs("select", { style: inp, value: data.override_key, onChange: (e) => setData("override_key", e.target.value), children: [
            /* @__PURE__ */ jsx("option", { value: "", children: "-- Select --" }),
            availableKeys.map((k) => /* @__PURE__ */ jsx("option", { value: k, children: k }, k))
          ] }) }),
          /* @__PURE__ */ jsx(Field, { label: "New Value (blank = unlimited)", error: errors.override_value, children: /* @__PURE__ */ jsx("input", { style: inp, value: data.override_value, onChange: (e) => setData("override_value", e.target.value), placeholder: "unlimited" }) })
        ] }),
        /* @__PURE__ */ jsx(Field, { label: "Reason (internal — not shown to tenant)", error: errors.reason, children: /* @__PURE__ */ jsx("input", { style: inp, value: data.reason, onChange: (e) => setData("reason", e.target.value), placeholder: "e.g. Sales concession, AppSumo special deal" }) }),
        /* @__PURE__ */ jsx(Field, { label: "Expires At (blank = permanent)", error: errors.expires_at, children: /* @__PURE__ */ jsx("input", { style: inp, type: "datetime-local", value: data.expires_at, onChange: (e) => setData("expires_at", e.target.value) }) }),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 8 }, children: [
          /* @__PURE__ */ jsxs("label", { style: { display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }, children: [
            /* @__PURE__ */ jsx("input", { type: "checkbox", checked: data.notify_user, onChange: (e) => setData("notify_user", e.target.checked) }),
            /* @__PURE__ */ jsx("span", { style: { fontSize: 14, color: "#94a3b8" }, children: "Send in-app notification to tenant" })
          ] }),
          data.notify_user && /* @__PURE__ */ jsx(Field, { label: "Custom Notification Message (optional)", error: errors.notification_message, children: /* @__PURE__ */ jsx(
            "textarea",
            {
              style: { ...inp, height: 80, resize: "vertical", fontFamily: "inherit" },
              value: data.notification_message,
              onChange: (e) => setData("notification_message", e.target.value),
              placeholder: "Leave blank for auto-generated message..."
            }
          ) })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "flex-end", gap: 12, paddingTop: 16, borderTop: "1px solid #1e293b" }, children: [
          /* @__PURE__ */ jsx("button", { type: "button", onClick: onClose, style: btnSec, children: "Cancel" }),
          /* @__PURE__ */ jsx("button", { type: "submit", disabled: processing || !data.override_key, style: btnPri, children: processing ? "Applying…" : "⚡ Apply Override" })
        ] })
      ] })
    ] })
  ] });
}
function TenantOverrides({ tenants, filters }) {
  const [drawerTenant, setDrawerTenant] = useState(null);
  const [search, setSearch] = useState(filters.search ?? "");
  const doSearch = (e) => {
    e.preventDefault();
    router.get(route("platform.tenants.overrides"), { search }, { preserveState: true });
  };
  const removeOverride = (tenantId, overrideId) => {
    if (confirm("Remove this override? The tenant reverts to the plan default immediately.")) {
      router.delete(route("platform.tenants.overrides.remove", { tenant: tenantId, override: overrideId }));
    }
  };
  return /* @__PURE__ */ jsxs(PlatformShell, { title: "Tenant Overrides", mode: "admin", activeMenu: "Tenant Overrides", children: [
    /* @__PURE__ */ jsxs("div", { style: { padding: "32px 40px", minHeight: "100vh", background: "#020617" }, children: [
      /* @__PURE__ */ jsx("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }, children: /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { style: { margin: 0, fontSize: 28, fontWeight: 800, color: "#f1f5f9" }, children: "Tenant Overrides" }),
        /* @__PURE__ */ jsx("p", { style: { margin: "4px 0 0", color: "#64748b", fontSize: 14 }, children: "Apply per-tenant limit overrides. These take priority over any plan default." })
      ] }) }),
      /* @__PURE__ */ jsxs("form", { onSubmit: doSearch, style: { display: "flex", gap: 10, marginBottom: 24 }, children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            style: { ...inp, maxWidth: 400 },
            value: search,
            onChange: (e) => setSearch(e.target.value),
            placeholder: "Search by store name or slug…"
          }
        ),
        /* @__PURE__ */ jsx("button", { type: "submit", style: btnPri, children: "Search" }),
        filters.search && /* @__PURE__ */ jsx("button", { type: "button", onClick: () => router.get(route("platform.tenants.overrides")), style: btnSec, children: "Clear" })
      ] }),
      /* @__PURE__ */ jsx("div", { style: { background: "#0f172a", borderRadius: 16, border: "1px solid #1e293b", overflow: "hidden" }, children: /* @__PURE__ */ jsxs("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 14 }, children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", { style: { background: "#1e293b" }, children: ["Store", "Plan", "Status", "Active Overrides", "Actions"].map((h) => /* @__PURE__ */ jsx("th", { style: { padding: "12px 16px", textAlign: "left", color: "#64748b", fontWeight: 600, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.5px" }, children: h }, h)) }) }),
        /* @__PURE__ */ jsx("tbody", { children: tenants.data?.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 5, style: { padding: "48px 0", textAlign: "center", color: "#475569" }, children: "No tenants found." }) }) : tenants.data?.map((tenant, i) => /* @__PURE__ */ jsxs(
          "tr",
          {
            style: { borderTop: i > 0 ? "1px solid #1e293b" : "none" },
            onMouseEnter: (e) => e.currentTarget.style.background = "#131c2e",
            onMouseLeave: (e) => e.currentTarget.style.background = "",
            children: [
              /* @__PURE__ */ jsxs("td", { style: { padding: "14px 16px" }, children: [
                /* @__PURE__ */ jsx("div", { style: { fontWeight: 700, color: "#f1f5f9" }, children: tenant.name }),
                /* @__PURE__ */ jsxs("div", { style: { fontSize: 11, color: "#475569" }, children: [
                  "ID #",
                  tenant.id
                ] })
              ] }),
              /* @__PURE__ */ jsx("td", { style: { padding: "14px 16px" }, children: /* @__PURE__ */ jsx("span", { style: { background: "#6366f122", color: "#6366f1", padding: "3px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600 }, children: tenant.plan }) }),
              /* @__PURE__ */ jsx("td", { style: { padding: "14px 16px" }, children: /* @__PURE__ */ jsx("span", { style: {
                background: tenant.status === "active" ? "#22c55e22" : "#f59e0b22",
                color: tenant.status === "active" ? "#22c55e" : "#f59e0b",
                padding: "3px 10px",
                borderRadius: 99,
                fontSize: 12,
                fontWeight: 700
              }, children: tenant.status }) }),
              /* @__PURE__ */ jsx("td", { style: { padding: "14px 16px" }, children: tenant.plan_overrides?.length > 0 ? /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: 4, flexWrap: "wrap" }, children: tenant.plan_overrides.map((o) => /* @__PURE__ */ jsxs("span", { style: {
                background: "#f59e0b22",
                color: "#f59e0b",
                padding: "2px 8px",
                borderRadius: 99,
                fontSize: 11,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 4
              }, children: [
                o.override_key,
                ": ",
                o.override_value ?? "∞",
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => removeOverride(tenant.id, o.id),
                    style: { background: "none", border: "none", color: "#f59e0b", cursor: "pointer", fontSize: 14, padding: 0, marginLeft: 2 },
                    title: "Remove override",
                    children: "×"
                  }
                )
              ] }, o.id)) }) : /* @__PURE__ */ jsx("span", { style: { color: "#475569", fontSize: 12 }, children: "No overrides" }) }),
              /* @__PURE__ */ jsx("td", { style: { padding: "14px 16px" }, children: /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 6 }, children: [
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => setDrawerTenant(tenant),
                    style: btnSmall,
                    children: "+ Override"
                  }
                ),
                /* @__PURE__ */ jsx(
                  Link,
                  {
                    href: route("platform.tenants.overrides.show", { tenant: tenant.id }),
                    style: { ...btnSmall, textDecoration: "none" },
                    children: "Detail →"
                  }
                )
              ] }) })
            ]
          },
          tenant.id
        )) })
      ] }) }),
      tenants.last_page > 1 && /* @__PURE__ */ jsx("div", { style: { display: "flex", justifyContent: "center", gap: 8, marginTop: 24 }, children: Array.from({ length: tenants.last_page }, (_, i) => i + 1).map((page) => /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => router.get(route("platform.tenants.overrides"), { search, page }),
          style: {
            background: page === tenants.current_page ? "#6366f1" : "#1e293b",
            color: page === tenants.current_page ? "#fff" : "#94a3b8",
            border: "1px solid #334155",
            padding: "6px 14px",
            borderRadius: 8,
            fontWeight: 600,
            cursor: "pointer"
          },
          children: page
        },
        page
      )) })
    ] }),
    drawerTenant && /* @__PURE__ */ jsx(
      OverrideDrawer,
      {
        open: !!drawerTenant,
        tenant: drawerTenant,
        availableKeys: ["transactions_per_month", "sku_limit", "locations", "staff_limit", "woocommerce", "api_access", "growth_engine", "multi_branch", "reports"],
        onClose: () => setDrawerTenant(null)
      }
    )
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
  outline: "none",
  fontFamily: "inherit"
};
const btnPri = {
  background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
  color: "#fff",
  border: "none",
  padding: "10px 22px",
  borderRadius: 10,
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
  whiteSpace: "nowrap"
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
const btnSmall = {
  background: "#1e293b",
  color: "#94a3b8",
  border: "1px solid #334155",
  padding: "5px 12px",
  borderRadius: 7,
  fontWeight: 600,
  fontSize: 12,
  cursor: "pointer",
  whiteSpace: "nowrap"
};
export {
  TenantOverrides as default
};

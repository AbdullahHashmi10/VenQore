import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { usePage, Head, useForm, router } from "@inertiajs/react";
import { O as OneGlanceLayout, v as vq } from "./marketing-pages-DYgr6x02.js";
import { CheckCircle2, Users, UserPlus, Copy, Eye, Zap, CreditCard, LayoutGrid, Shield, Crown, X, ChevronDown, Send, Key, MoreVertical, Edit2, Trash2, AlertTriangle, Mail } from "lucide-react";
import "marked";
import "axios";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
const ROLES = {
  owner: { label: "Owner", color: vq.amber[500], bg: vq.amber[50], border: vq.amber[300], Icon: Crown },
  admin: { label: "Admin", color: vq.indigo[500], bg: vq.indigo[50], border: vq.indigo[300], Icon: Shield },
  manager: { label: "Manager", color: vq.violet[500], bg: vq.violet[50], border: vq.violet[300], Icon: LayoutGrid },
  cashier: { label: "Cashier", color: vq.sky[500], bg: vq.sky[50], border: vq.sky[300], Icon: CreditCard },
  accountant: { label: "Accountant", color: vq.emerald[500], bg: vq.green[50], border: vq.emerald[300], Icon: Zap },
  purchasing_officer: { label: "Purchasing Officer", color: vq.orange[500], bg: vq.orange[50], border: vq.orange[300], Icon: CheckCircle2 },
  viewer: { label: "Viewer", color: vq.slate[500], bg: vq.slate[50], border: vq.slate[300], Icon: Eye }
};
const INVITABLE_ROLES = ["admin", "manager", "cashier", "accountant", "purchasing_officer", "viewer"];
const STATUS_CONFIG = {
  active: { color: vq.emerald[500], bg: vq.green[50], label: "Active", Icon: CheckCircle2 },
  invited: { color: vq.indigo[500], bg: vq.indigo[50], label: "Invited", Icon: Mail },
  suspended: { color: vq.red[500], bg: vq.red[50], label: "Suspended", Icon: AlertTriangle }
};
function RolePill({ role }) {
  const cfg = ROLES[role] ?? ROLES.viewer;
  const { Icon } = cfg;
  return /* @__PURE__ */ jsxs("span", { style: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "3px 10px",
    borderRadius: 8,
    background: cfg.bg,
    color: cfg.color,
    border: `1px solid ${cfg.border}`,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.03em",
    textTransform: "uppercase"
  }, children: [
    /* @__PURE__ */ jsx(Icon, { size: 10 }),
    cfg.label
  ] });
}
function StatusDot({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.suspended;
  return /* @__PURE__ */ jsxs("span", { style: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "2px 9px",
    borderRadius: 7,
    background: cfg.bg,
    color: cfg.color,
    fontSize: 11,
    fontWeight: 700
  }, children: [
    /* @__PURE__ */ jsx(cfg.Icon, { size: 10 }),
    cfg.label
  ] });
}
function Avatar({ name, role }) {
  const cfg = ROLES[role] ?? ROLES.viewer;
  const initial = (name ?? "?")[0].toUpperCase();
  return /* @__PURE__ */ jsx("div", { style: {
    width: 38,
    height: 38,
    borderRadius: 12,
    background: cfg.bg,
    border: `1.5px solid ${cfg.border}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: 15,
    color: cfg.color,
    flexShrink: 0
  }, children: initial });
}
function InviteModal({ storeId, onClose }) {
  const { data, setData, post, processing, errors, reset } = useForm({
    email: "",
    role: "cashier",
    display_name: ""
  });
  function submit(e) {
    e.preventDefault();
    post(route("store.staff.invite", { store_slug: usePage().props.store_slug }), {
      onSuccess: () => {
        reset();
        onClose();
      }
    });
  }
  return /* @__PURE__ */ jsx("div", { style: {
    position: "fixed",
    inset: 0,
    zIndex: 50,
    background: "rgba(0,0,0,0.5)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16
  }, children: /* @__PURE__ */ jsxs("div", { style: {
    background: "var(--card-bg,#fff)",
    border: "1px solid var(--card-border,#e2e8f0)",
    borderRadius: 24,
    padding: 32,
    width: "100%",
    maxWidth: 460,
    boxShadow: "0 24px 60px rgba(0,0,0,0.15)",
    animation: "slideUp 0.2s ease"
  }, children: [
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }, children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { style: { fontWeight: 800, fontSize: 18, color: "var(--text-main,#0f172a)" }, children: "Invite a Team Member" }),
        /* @__PURE__ */ jsx("div", { style: { fontSize: 13, color: vq.slate[500], marginTop: 4 }, children: "They'll receive an email with a 7-day invite link." })
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: onClose, style: { padding: 6, borderRadius: 8, border: "1px solid #e2e8f0", background: "transparent", cursor: "pointer", color: vq.slate[500] }, children: /* @__PURE__ */ jsx(X, { size: 16 }) })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: submit, style: { display: "flex", flexDirection: "column", gap: 16 }, children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { style: { fontSize: 12, fontWeight: 700, color: vq.slate[600], display: "block", marginBottom: 6 }, children: "Email Address *" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "email",
            required: true,
            value: data.email,
            onChange: (e) => setData("email", e.target.value),
            placeholder: "colleague@example.com",
            style: { width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${errors.email ? vq.red[500] : vq.slate[200]}`, background: "var(--input-bg,#f8fafc)", fontSize: 13, outline: "none", color: "var(--text-main,#0f172a)", boxSizing: "border-box" }
          }
        ),
        errors.email && /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: vq.red[500], marginTop: 4 }, children: errors.email })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { style: { fontSize: 12, fontWeight: 700, color: vq.slate[600], display: "block", marginBottom: 6 }, children: "Role *" }),
        /* @__PURE__ */ jsxs("div", { style: { position: "relative" }, children: [
          /* @__PURE__ */ jsx(
            "select",
            {
              value: data.role,
              onChange: (e) => setData("role", e.target.value),
              style: { width: "100%", padding: "10px 36px 10px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "var(--input-bg,#f8fafc)", fontSize: 13, outline: "none", color: "var(--text-main,#0f172a)", appearance: "none", cursor: "pointer", boxSizing: "border-box" },
              children: INVITABLE_ROLES.map((r) => /* @__PURE__ */ jsx("option", { value: r, children: ROLES[r]?.label ?? r }, r))
            }
          ),
          /* @__PURE__ */ jsx(ChevronDown, { size: 14, style: { position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: vq.slate[400], pointerEvents: "none" } })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { marginTop: 8, padding: "8px 12px", borderRadius: 8, background: ROLES[data.role]?.bg ?? vq.slate[50], border: `1px solid ${ROLES[data.role]?.border ?? vq.slate[200]}`, fontSize: 12, color: ROLES[data.role]?.color ?? vq.slate[500] }, children: [
          data.role === "admin" && "Full store access — same as owner, except billing and store deletion.",
          data.role === "manager" && "All operational access. Can view all 38 reports. Cannot manage staff roles.",
          data.role === "cashier" && "POS terminal only. Minimal dashboard. Cannot see financial data.",
          data.role === "accountant" && "Full financial access. Cannot access POS or manage staff.",
          data.role === "purchasing_officer" && "Purchase orders, suppliers, and stock receiving. No sales/finance access.",
          data.role === "viewer" && "Read-only access to P&L, Balance Sheet, and Inventory Valuation only."
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("label", { style: { fontSize: 12, fontWeight: 700, color: vq.slate[600], display: "block", marginBottom: 6 }, children: [
          "Display Name ",
          /* @__PURE__ */ jsx("span", { style: { color: vq.slate[400], fontWeight: 400 }, children: "(optional)" })
        ] }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            value: data.display_name,
            onChange: (e) => setData("display_name", e.target.value),
            placeholder: "How they appear in POS (e.g. Ali)",
            maxLength: 50,
            style: { width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "var(--input-bg,#f8fafc)", fontSize: 13, outline: "none", color: "var(--text-main,#0f172a)", boxSizing: "border-box" }
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 10, marginTop: 4 }, children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: onClose,
            style: { flex: 1, padding: "11px", borderRadius: 12, border: "1px solid #e2e8f0", background: "transparent", fontSize: 13, fontWeight: 600, color: vq.slate[500], cursor: "pointer" },
            children: "Cancel"
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "submit",
            disabled: processing,
            style: { flex: 2, padding: "11px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: processing ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: processing ? 0.7 : 1 },
            children: [
              /* @__PURE__ */ jsx(Send, { size: 14 }),
              " ",
              processing ? "Sending…" : "Send Invite"
            ]
          }
        )
      ] })
    ] })
  ] }) });
}
function EditMemberModal({ member, storeId, onClose }) {
  const { data, setData, patch, processing, errors } = useForm({
    role: member.role,
    display_name: member.display_name ?? "",
    status: member.status
  });
  function submit(e) {
    e.preventDefault();
    patch(route("store.admin.users.update", { store_slug: usePage().props.store_slug, member: member.id }), {
      onSuccess: onClose
    });
  }
  return /* @__PURE__ */ jsx("div", { style: { position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }, children: /* @__PURE__ */ jsxs("div", { style: { background: "var(--card-bg,#fff)", border: "1px solid #e2e8f0", borderRadius: 24, padding: 30, width: "100%", maxWidth: 400, boxShadow: "0 24px 60px rgba(0,0,0,0.15)" }, children: [
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }, children: [
      /* @__PURE__ */ jsxs("div", { style: { fontWeight: 800, fontSize: 16, color: "var(--text-main,#0f172a)" }, children: [
        "Edit ",
        member.name
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: onClose, style: { padding: 6, borderRadius: 8, border: "1px solid #e2e8f0", background: "transparent", cursor: "pointer", color: vq.slate[500] }, children: /* @__PURE__ */ jsx(X, { size: 14 }) })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: submit, style: { display: "flex", flexDirection: "column", gap: 14 }, children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { style: { fontSize: 12, fontWeight: 700, color: vq.slate[600], display: "block", marginBottom: 5 }, children: "Role" }),
        /* @__PURE__ */ jsx(
          "select",
          {
            value: data.role,
            onChange: (e) => setData("role", e.target.value),
            disabled: member.role === "owner",
            style: { width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "var(--input-bg,#f8fafc)", fontSize: 13, outline: "none", boxSizing: "border-box" },
            children: INVITABLE_ROLES.map((r) => /* @__PURE__ */ jsx("option", { value: r, children: ROLES[r]?.label ?? r }, r))
          }
        ),
        member.role === "owner" && /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: vq.slate[400], marginTop: 4 }, children: "Owner role cannot be changed." })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { style: { fontSize: 12, fontWeight: 700, color: vq.slate[600], display: "block", marginBottom: 5 }, children: "Display Name" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            value: data.display_name,
            onChange: (e) => setData("display_name", e.target.value),
            placeholder: "POS display name",
            style: { width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "var(--input-bg,#f8fafc)", fontSize: 13, outline: "none", boxSizing: "border-box" }
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { style: { fontSize: 12, fontWeight: 700, color: vq.slate[600], display: "block", marginBottom: 5 }, children: "Status" }),
        /* @__PURE__ */ jsxs(
          "select",
          {
            value: data.status,
            onChange: (e) => setData("status", e.target.value),
            disabled: member.role === "owner",
            style: { width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "var(--input-bg,#f8fafc)", fontSize: 13, outline: "none", boxSizing: "border-box" },
            children: [
              /* @__PURE__ */ jsx("option", { value: "active", children: "Active" }),
              /* @__PURE__ */ jsx("option", { value: "suspended", children: "Suspended" })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 10, marginTop: 4 }, children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: onClose,
            style: { flex: 1, padding: "10px", borderRadius: 10, border: "1px solid #e2e8f0", background: "transparent", fontSize: 13, fontWeight: 600, color: vq.slate[500], cursor: "pointer" },
            children: "Cancel"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "submit",
            disabled: processing,
            style: { flex: 2, padding: "10px", borderRadius: 10, border: "none", background: vq.indigo[500], color: "#fff", fontSize: 13, fontWeight: 700, cursor: processing ? "wait" : "pointer", opacity: processing ? 0.7 : 1 },
            children: processing ? "Saving…" : "Save Changes"
          }
        )
      ] })
    ] })
  ] }) });
}
function MemberRow({ member, storeId, canManage, myRole }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const isOwner = member.role === "owner";
  const isMe = member.user_id === usePage().props.auth?.user?.id;
  function remove() {
    if (!confirm(`Remove ${member.name} from the store? They will lose all access immediately.`)) return;
    router.delete(route("store.admin.users.remove", { store_slug: usePage().props.store_slug, member: member.id }), { preserveScroll: true });
    setMenuOpen(false);
  }
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    editing && /* @__PURE__ */ jsx(EditMemberModal, { member, storeId, onClose: () => setEditing(false) }),
    /* @__PURE__ */ jsxs(
      "tr",
      {
        style: { borderBottom: "1px solid var(--card-border,#f1f5f9)", transition: "background 0.12s" },
        onMouseEnter: (e) => e.currentTarget.style.background = "rgba(99,102,241,0.02)",
        onMouseLeave: (e) => e.currentTarget.style.background = "transparent",
        children: [
          /* @__PURE__ */ jsx("td", { style: { padding: "14px 20px" }, children: /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 12 }, children: [
            /* @__PURE__ */ jsx(Avatar, { name: member.name, role: member.role }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("div", { style: { fontWeight: 700, fontSize: 13, color: "var(--text-main,#0f172a)", display: "flex", alignItems: "center", gap: 6 }, children: [
                member.display_name || member.name,
                isMe && /* @__PURE__ */ jsx("span", { style: { fontSize: 10, fontWeight: 700, background: vq.violet[100], color: vq.indigo[500], padding: "1px 6px", borderRadius: 5, letterSpacing: "0.04em" }, children: "YOU" })
              ] }),
              /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: vq.slate[500], marginTop: 2 }, children: member.email }),
              member.display_name && member.name !== member.display_name && /* @__PURE__ */ jsxs("div", { style: { fontSize: 10, color: vq.slate[400] }, children: [
                "Name: ",
                member.name
              ] })
            ] })
          ] }) }),
          /* @__PURE__ */ jsx("td", { style: { padding: "14px 16px" }, children: /* @__PURE__ */ jsx(RolePill, { role: member.role }) }),
          /* @__PURE__ */ jsx("td", { style: { padding: "14px 16px" }, children: /* @__PURE__ */ jsx(StatusDot, { status: member.status }) }),
          /* @__PURE__ */ jsx("td", { style: { padding: "14px 16px" }, children: /* @__PURE__ */ jsxs("span", { style: { display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: member.pos_pin_set ? vq.emerald[500] : vq.slate[400], fontWeight: 600 }, children: [
            /* @__PURE__ */ jsx(Key, { size: 11 }),
            member.pos_pin_set ? "PIN Set" : "No PIN"
          ] }) }),
          /* @__PURE__ */ jsx("td", { style: { padding: "14px 16px", fontSize: 12, color: vq.slate[500] }, children: member.status === "invited" ? /* @__PURE__ */ jsxs("span", { style: { color: vq.indigo[500], fontSize: 11 }, children: [
            "Invited ",
            member.invited_at ? new Date(member.invited_at).toLocaleDateString() : ""
          ] }) : member.joined_at ? new Date(member.joined_at).toLocaleDateString() : "—" }),
          /* @__PURE__ */ jsx("td", { style: { padding: "14px 16px", textAlign: "right" }, children: canManage && !isOwner && /* @__PURE__ */ jsxs("div", { style: { position: "relative", display: "inline-block" }, children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setMenuOpen((v) => !v),
                style: { padding: "5px 8px", borderRadius: 8, border: "1px solid #e2e8f0", background: "transparent", cursor: "pointer", color: vq.slate[500], display: "flex", alignItems: "center" },
                children: /* @__PURE__ */ jsx(MoreVertical, { size: 15 })
              }
            ),
            menuOpen && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("div", { style: { position: "fixed", inset: 0, zIndex: 30 }, onClick: () => setMenuOpen(false) }),
              /* @__PURE__ */ jsxs("div", { style: { position: "absolute", right: 0, top: "100%", marginTop: 4, zIndex: 40, background: "var(--card-bg,#fff)", border: "1px solid #e2e8f0", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", minWidth: 160, overflow: "hidden" }, children: [
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => {
                      setEditing(true);
                      setMenuOpen(false);
                    },
                    style: { width: "100%", padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", fontSize: 13, color: vq.slate[600], cursor: "pointer", textAlign: "left" },
                    onMouseEnter: (e) => e.currentTarget.style.background = vq.slate[50],
                    onMouseLeave: (e) => e.currentTarget.style.background = "none",
                    children: [
                      /* @__PURE__ */ jsx(Edit2, { size: 13 }),
                      " Edit Role"
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: remove,
                    style: { width: "100%", padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", fontSize: 13, color: vq.red[500], cursor: "pointer", textAlign: "left" },
                    onMouseEnter: (e) => e.currentTarget.style.background = vq.red[50],
                    onMouseLeave: (e) => e.currentTarget.style.background = "none",
                    children: [
                      /* @__PURE__ */ jsx(Trash2, { size: 13 }),
                      " Remove"
                    ]
                  }
                )
              ] })
            ] })
          ] }) })
        ]
      }
    )
  ] });
}
function StaffIndex({ members, join_code, store_id }) {
  const { my_role, auth, flash } = usePage().props;
  const [showInvite, setShowInvite] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [search, setSearch] = useState("");
  const canManage = ["owner", "admin"].includes(my_role);
  function copyCode() {
    navigator.clipboard.writeText(join_code ?? "");
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2e3);
  }
  const filtered = (members ?? []).filter(
    (m) => !search || m.name?.toLowerCase().includes(search.toLowerCase()) || m.email?.toLowerCase().includes(search.toLowerCase()) || m.role?.toLowerCase().includes(search.toLowerCase())
  );
  const active = filtered.filter((m) => m.status === "active");
  const invited = filtered.filter((m) => m.status === "invited");
  const suspended = filtered.filter((m) => m.status === "suspended");
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { mode: "admin", activeMenu: "Staff Management", children: [
    /* @__PURE__ */ jsx(Head, { title: "Staff Management" }),
    showInvite && /* @__PURE__ */ jsx(InviteModal, { storeId: store_id, onClose: () => setShowInvite(false) }),
    /* @__PURE__ */ jsxs("div", { style: { maxWidth: 1100, margin: "0 auto", padding: "28px 24px 64px" }, children: [
      flash?.success && /* @__PURE__ */ jsxs("div", { style: { marginBottom: 20, padding: "12px 18px", borderRadius: 12, background: vq.green[50], border: "1px solid #bbf7d0", color: vq.green[700], fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }, children: [
        /* @__PURE__ */ jsx(CheckCircle2, { size: 15 }),
        " ",
        flash.success
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 12 }, children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h1", { style: { fontSize: 22, fontWeight: 800, color: "var(--text-main,#0f172a)", margin: 0, display: "flex", alignItems: "center", gap: 10 }, children: [
            /* @__PURE__ */ jsx(Users, { size: 20, color: vq.indigo[500] }),
            " Team Management"
          ] }),
          /* @__PURE__ */ jsxs("p", { style: { fontSize: 13, color: vq.slate[500], margin: "4px 0 0" }, children: [
            members?.length ?? 0,
            " member",
            members?.length !== 1 ? "s" : "",
            " · ",
            active.length,
            " active, ",
            invited.length,
            " pending, ",
            suspended.length,
            " suspended"
          ] })
        ] }),
        canManage && /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setShowInvite(true),
            style: { display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 12, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(99,102,241,0.3)", transition: "transform 0.12s, box-shadow 0.12s" },
            onMouseEnter: (e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 8px 20px rgba(99,102,241,0.4)";
            },
            onMouseLeave: (e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "0 4px 14px rgba(99,102,241,0.3)";
            },
            children: [
              /* @__PURE__ */ jsx(UserPlus, { size: 15 }),
              " Invite Staff"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 14, marginBottom: 20, flexWrap: "wrap" }, children: [
        /* @__PURE__ */ jsxs("div", { style: { flex: 1, minWidth: 200, display: "flex", alignItems: "center", gap: 10, background: "var(--card-bg,#fff)", border: "1px solid var(--card-border,#e2e8f0)", borderRadius: 12, padding: "0 14px" }, children: [
          /* @__PURE__ */ jsx(Users, { size: 14, color: vq.slate[400] }),
          /* @__PURE__ */ jsx(
            "input",
            {
              value: search,
              onChange: (e) => setSearch(e.target.value),
              placeholder: "Search by name, email, or role…",
              style: { flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 13, padding: "10px 0", color: "var(--text-main,#0f172a)" }
            }
          )
        ] }),
        canManage && join_code && /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 10, background: "var(--card-bg,#fff)", border: "1px solid #e2e8f0", borderRadius: 12, padding: "8px 16px" }, children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { style: { fontSize: 10, fontWeight: 700, color: vq.slate[400], letterSpacing: "0.05em", textTransform: "uppercase" }, children: "Join Code" }),
            /* @__PURE__ */ jsx("div", { style: { fontSize: 16, fontWeight: 800, color: vq.indigo[500], letterSpacing: "0.12em", fontFamily: "monospace" }, children: join_code })
          ] }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: copyCode,
              style: { padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0", background: codeCopied ? vq.green[50] : "transparent", color: codeCopied ? vq.emerald[500] : vq.slate[500], cursor: "pointer", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 },
              children: [
                codeCopied ? /* @__PURE__ */ jsx(CheckCircle2, { size: 12 }) : /* @__PURE__ */ jsx(Copy, { size: 12 }),
                codeCopied ? "Copied!" : "Copy"
              ]
            }
          ),
          /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: vq.slate[400], maxWidth: 120 }, children: "Staff can join instantly at the Join page" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { style: { background: "var(--card-bg,#fff)", border: "1px solid var(--card-border,#e2e8f0)", borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }, children: /* @__PURE__ */ jsxs("table", { style: { width: "100%", borderCollapse: "collapse" }, children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", { style: { borderBottom: "1px solid var(--card-border,#f1f5f9)" }, children: ["Member", "Role", "Status", "POS PIN", "Joined", "Actions"].map((h) => /* @__PURE__ */ jsx("th", { style: { padding: "12px 16px", textAlign: h === "Actions" ? "right" : "left", fontSize: 11, fontWeight: 700, color: vq.slate[400], letterSpacing: "0.05em", textTransform: "uppercase" }, children: h === "Actions" && !canManage ? "" : h }, h)) }) }),
        /* @__PURE__ */ jsxs("tbody", { children: [
          filtered.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsxs("td", { colSpan: 6, style: { padding: "48px", textAlign: "center" }, children: [
            /* @__PURE__ */ jsx(Users, { size: 32, color: vq.slate[200], style: { margin: "0 auto 12px" } }),
            /* @__PURE__ */ jsx("div", { style: { color: vq.slate[400], fontSize: 14 }, children: search ? "No members match your search." : "No team members yet. Invite your first staff member!" })
          ] }) }),
          filtered.map((member) => /* @__PURE__ */ jsx(
            MemberRow,
            {
              member,
              storeId: store_id,
              canManage,
              myRole: my_role
            },
            member.id
          ))
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { style: { marginTop: 24, padding: "16px 20px", background: "var(--card-bg,#fff)", border: "1px solid var(--card-border,#e2e8f0)", borderRadius: 16 }, children: [
        /* @__PURE__ */ jsx("div", { style: { fontSize: 11, fontWeight: 700, color: vq.slate[400], letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 12 }, children: "Role Permissions" }),
        /* @__PURE__ */ jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }, children: Object.entries(ROLES).filter(([r]) => r !== "owner").map(([role, cfg]) => /* @__PURE__ */ jsx("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: /* @__PURE__ */ jsx(RolePill, { role }) }, role)) }),
        /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: vq.slate[400], marginTop: 10 }, children: "💡 Each role gets a tailored dashboard — Cashiers see only POS, Accountants see only finance, Viewers are read-only." })
      ] })
    ] }),
    /* @__PURE__ */ jsx("style", { children: `
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            ` })
  ] });
}
export {
  StaffIndex as default
};

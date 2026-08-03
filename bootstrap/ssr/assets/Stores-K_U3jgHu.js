import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { Head, router } from "@inertiajs/react";
import { Trash2, Search, RotateCcw, MoreHorizontal, Building2 } from "lucide-react";
import { P as PlatformShell } from "./PlatformShell-CbpSfCJ6.js";
import { u as useTheme, v as vq } from "./marketing-pages-CTBAvetE.js";
import { D as Dropdown } from "./Dropdown-BR6h6OS4.js";
import "./PlatformLayout-CFRlnfbA.js";
import "./ui-CLtSftB2.js";
import "marked";
import "axios";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
function Stores({ tenants, filters }) {
  const { isDarkMode: isDark } = useTheme();
  const T = isDark ? {
    text: vq.slate[100],
    textSub: vq.slate[400],
    textMuted: vq.slate[500],
    border: "rgba(255,255,255,0.1)",
    bgInput: "rgba(255,255,255,0.03)",
    bgTable: "rgba(255,255,255,0.02)",
    bgHead: "rgba(255,255,255,0.02)",
    rowBorder: "rgba(255,255,255,0.03)"
  } : {
    text: vq.slate[900],
    textSub: vq.slate[600],
    textMuted: vq.slate[500],
    border: "rgba(0,0,0,0.1)",
    bgInput: "#ffffff",
    bgTable: "#ffffff",
    bgHead: vq.slate[50],
    rowBorder: "rgba(0,0,0,0.05)"
  };
  const [search, setSearch] = useState(filters.search || "");
  const [trashed, setTrashed] = useState(filters.trashed || false);
  const [selected, setSelected] = useState([]);
  const handleSelectAll = (e) => {
    if (e.target.checked) setSelected(tenants.data.map((t) => t.id));
    else setSelected([]);
  };
  const handleSelect = (id) => {
    if (selected.includes(id)) setSelected(selected.filter((i) => i !== id));
    else setSelected([...selected, id]);
  };
  const handleBulkDelete = () => {
    if (confirm(`Move ${selected.length} stores to trash?`)) {
      router.post(route("platform.stores.bulk-destroy"), { ids: selected }, {
        onSuccess: () => setSelected([])
      });
    }
  };
  const handleSearch = (e) => {
    if (e) e.preventDefault();
    router.get(route("platform.stores"), { search, trashed }, { preserveState: true });
  };
  const toggleTrashed = () => {
    const newVal = !trashed;
    setTrashed(newVal);
    setSelected([]);
    router.get(route("platform.stores"), { search, trashed: newVal }, { preserveState: true });
  };
  const onRestore = (id) => {
    if (confirm("Restore this store?")) {
      router.post(route("platform.store.restore", id));
    }
  };
  const onPurge = (id) => {
    const passcode = prompt("Enter your action passcode to confirm permanently deleting this store:");
    if (passcode) {
      router.delete(route("platform.store.purge", id), {
        data: { passcode }
      });
    }
  };
  return /* @__PURE__ */ jsxs(PlatformShell, { mode: "admin", activeMenu: "Stores", children: [
    /* @__PURE__ */ jsx(Head, { title: "Platform HQ | Stores" }),
    /* @__PURE__ */ jsxs("div", { style: { padding: 24 }, children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }, children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { style: { fontSize: 24, fontWeight: 800, margin: 0, color: T.text }, children: "Store Management" }),
          /* @__PURE__ */ jsx("p", { style: { color: T.textSub, fontSize: 14, marginTop: 4 }, children: "View and manage all tenant stores on the platform." })
        ] }),
        /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: 12 }, children: /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: toggleTrashed,
            style: {
              padding: "10px 16px",
              borderRadius: 12,
              background: trashed ? "rgba(239,68,68,0.1)" : T.bgInput,
              border: `1px solid ${trashed ? vq.red[500] : T.border}`,
              color: trashed ? vq.red[500] : T.textSub,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8
            },
            children: [
              /* @__PURE__ */ jsx(Trash2, { size: 16 }),
              " ",
              trashed ? "Viewing Trash" : "View Trash"
            ]
          }
        ) })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 12, marginBottom: 24 }, children: [
        /* @__PURE__ */ jsxs("form", { onSubmit: handleSearch, style: { display: "flex", gap: 12, flex: 1 }, children: [
          /* @__PURE__ */ jsxs("div", { style: { flex: 1, display: "flex", alignItems: "center", gap: 10, background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 12, padding: "0 16px" }, children: [
            /* @__PURE__ */ jsx(Search, { size: 18, color: T.textMuted }),
            /* @__PURE__ */ jsx(
              "input",
              {
                value: search,
                onChange: (e) => setSearch(e.target.value),
                placeholder: "Search by store name, slug or owner email...",
                style: { flex: 1, background: "transparent", border: "none", outline: "none", color: T.text, padding: "14px 0", fontSize: 14 }
              }
            )
          ] }),
          /* @__PURE__ */ jsx("button", { type: "submit", style: { padding: "0 24px", background: vq.indigo[500], color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, cursor: "pointer" }, children: "Search" })
        ] }),
        selected.length > 0 && !trashed && /* @__PURE__ */ jsxs("button", { onClick: handleBulkDelete, style: { padding: "0 24px", background: vq.red[500], color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, cursor: "pointer" }, children: [
          "Delete ",
          selected.length,
          " Selected"
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { style: { background: T.bgTable, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden" }, children: /* @__PURE__ */ jsxs("table", { style: { width: "100%", borderCollapse: "collapse" }, children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { style: { background: T.bgHead, borderBottom: `1px solid ${T.border}` }, children: [
          /* @__PURE__ */ jsx("th", { style: { width: 40, textAlign: "center", padding: "16px 12px" }, children: /* @__PURE__ */ jsx(
            "input",
            {
              type: "checkbox",
              checked: tenants.data.length > 0 && selected.length === tenants.data.length,
              onChange: handleSelectAll,
              style: { cursor: "pointer" }
            }
          ) }),
          /* @__PURE__ */ jsx("th", { style: { textAlign: "left", padding: "16px 20px", fontSize: 11, fontWeight: 700, color: T.textSub, textTransform: "uppercase" }, children: "Store" }),
          /* @__PURE__ */ jsx("th", { style: { textAlign: "left", padding: "16px 20px", fontSize: 11, fontWeight: 700, color: T.textSub, textTransform: "uppercase" }, children: "Owner" }),
          /* @__PURE__ */ jsx("th", { style: { textAlign: "left", padding: "16px 20px", fontSize: 11, fontWeight: 700, color: T.textSub, textTransform: "uppercase" }, children: "Plan" }),
          /* @__PURE__ */ jsx("th", { style: { textAlign: "left", padding: "16px 20px", fontSize: 11, fontWeight: 700, color: T.textSub, textTransform: "uppercase" }, children: "Status" }),
          trashed && /* @__PURE__ */ jsx("th", { style: { textAlign: "left", padding: "16px 20px", fontSize: 11, fontWeight: 700, color: T.textSub, textTransform: "uppercase" }, children: "Deleted At" }),
          /* @__PURE__ */ jsx("th", { style: { textAlign: "right", padding: "16px 20px", fontSize: 11, fontWeight: 700, color: T.textSub, textTransform: "uppercase" }, children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsxs("tbody", { children: [
          tenants.data.map((t) => /* @__PURE__ */ jsxs("tr", { style: { borderBottom: `1px solid ${T.rowBorder}`, transition: "background 0.2s", background: selected.includes(t.id) ? "rgba(99,102,241,0.05)" : "transparent" }, children: [
            /* @__PURE__ */ jsx("td", { style: { width: 40, textAlign: "center", padding: "16px 12px" }, children: /* @__PURE__ */ jsx(
              "input",
              {
                type: "checkbox",
                checked: selected.includes(t.id),
                onChange: () => handleSelect(t.id),
                style: { cursor: "pointer" }
              }
            ) }),
            /* @__PURE__ */ jsxs("td", { style: { padding: "16px 20px" }, children: [
              /* @__PURE__ */ jsx("div", { style: { fontWeight: 600, color: T.text }, children: t.name }),
              /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: T.textMuted }, children: t.slug })
            ] }),
            /* @__PURE__ */ jsxs("td", { style: { padding: "16px 20px" }, children: [
              /* @__PURE__ */ jsx("div", { style: { fontWeight: 600, color: T.text, fontSize: 13 }, children: t.owner_name }),
              /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: T.textMuted }, children: t.owner_email })
            ] }),
            /* @__PURE__ */ jsx("td", { style: { padding: "16px 20px" }, children: /* @__PURE__ */ jsx("span", { style: { fontSize: 10, fontWeight: 800, color: vq.indigo[500], background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", padding: "2px 8px", borderRadius: 4, textTransform: "uppercase" }, children: t.plan }) }),
            /* @__PURE__ */ jsx("td", { style: { padding: "16px 20px" }, children: /* @__PURE__ */ jsx("span", { style: { fontSize: 10, fontWeight: 800, color: t.status === "active" ? vq.emerald[500] : vq.amber[500], background: (t.status === "active" ? vq.emerald[500] : vq.amber[500]) + "10", border: "1px solid " + (t.status === "active" ? vq.emerald[500] : vq.amber[500]) + "20", padding: "2px 8px", borderRadius: 4, textTransform: "uppercase" }, children: t.status }) }),
            trashed && /* @__PURE__ */ jsx("td", { style: { padding: "16px 20px", color: vq.red[500], fontSize: 12 }, children: t.deleted_at }),
            /* @__PURE__ */ jsx("td", { style: { padding: "16px 20px", textAlign: "right" }, children: trashed ? /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 8, justifyContent: "flex-end" }, children: [
              /* @__PURE__ */ jsxs("button", { onClick: () => onRestore(t.id), style: { padding: "6px 12px", borderRadius: 8, background: "rgba(16,185,129,0.1)", color: vq.emerald[500], border: "1px solid rgba(16,185,129,0.2)", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }, children: [
                /* @__PURE__ */ jsx(RotateCcw, { size: 14 }),
                " Restore"
              ] }),
              /* @__PURE__ */ jsxs("button", { onClick: () => onPurge(t.id), style: { padding: "6px 12px", borderRadius: 8, background: "rgba(239,68,68,0.1)", color: vq.red[500], border: "1px solid rgba(239,68,68,0.2)", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }, children: [
                /* @__PURE__ */ jsx(Trash2, { size: 14 }),
                " Purge"
              ] })
            ] }) : /* @__PURE__ */ jsxs(Dropdown, { children: [
              /* @__PURE__ */ jsx(Dropdown.Trigger, { children: /* @__PURE__ */ jsx("button", { style: { color: T.textSub, background: "none", border: "none", cursor: "pointer" }, children: /* @__PURE__ */ jsx(MoreHorizontal, { size: 18 }) }) }),
              /* @__PURE__ */ jsxs(Dropdown.Content, { align: "right", width: "48", children: [
                t.status === "suspended" ? /* @__PURE__ */ jsx(Dropdown.Link, { href: route("platform.store.activate", t.id), method: "post", as: "button", style: { fontSize: 13, fontWeight: 500 }, children: "Activate Store" }) : /* @__PURE__ */ jsx(Dropdown.Link, { href: route("platform.store.suspend", t.id), method: "post", as: "button", style: { fontSize: 13, fontWeight: 500, color: vq.amber[500] }, children: "Suspend Store" }),
                t.status === "trial" && /* @__PURE__ */ jsx(Dropdown.Link, { href: route("platform.store.extend-trial", t.id), method: "post", as: "button", style: { fontSize: 13, fontWeight: 500 }, children: "Extend Trial (7 Days)" }),
                /* @__PURE__ */ jsx("div", { style: { borderTop: "1px solid " + T.rowBorder, margin: "4px 0" } }),
                /* @__PURE__ */ jsx(Dropdown.Link, { href: route("platform.store.destroy", t.id), method: "delete", as: "button", style: { fontSize: 13, fontWeight: 500, color: vq.red[500] }, children: "Trash Store" })
              ] })
            ] }) })
          ] }, t.id)),
          tenants.data.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsxs("td", { colSpan: trashed ? 6 : 5, style: { padding: 64, textAlign: "center", color: vq.slate[600] }, children: [
            /* @__PURE__ */ jsx(Building2, { size: 32, style: { margin: "0 auto 12px", opacity: 0.5 } }),
            /* @__PURE__ */ jsx("div", { children: "No stores found." })
          ] }) })
        ] })
      ] }) })
    ] })
  ] });
}
export {
  Stores as default
};

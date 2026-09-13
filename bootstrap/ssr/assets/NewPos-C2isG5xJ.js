import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Head } from "@inertiajs/react";
import axios from "axios";
import { D as DEFAULTS, R as RETURN_POLICIES, a as DEFAULT_PERMS, b as DEFAULT_OPS, P as PROFILES, L as LayoutPreviewShell, c as approverOptions, d as describeApprovalLines, l as loadPrefs, s as savePrefs, e as autoComposition, f as loadRescue, g as saveRescue, w as withApproval, p as parseApprovalRequired, h as clearRescue, S as SetupWizardModal } from "./approval-COrxd3AL.js";
import { k as keymap, g as presetComposition, h as presets, i as composeTerminal, m as marginAt } from "./engine-Cd795qy4.js";
import { S as Sheet, K as Kbd, n as n0, c as n2, R as RowButton, F as Flag, M as Money, a as Switch, d as Seg, u as useViewport, I as Icon, e as Splitter, T as Toasts, H as HUE_VAR, P as Pane, g as Stepper } from "./ui-_8sZpHCB.js";
import { P as PrintService } from "./PrintService-L_d7O0gK.js";
import { u as useTermText } from "./terms-DwYjlWsV.js";
import "lucide-react";
import "react-dom";
import "react-dom/client";
import "./format-131Nyq79.js";
import "./PrintPreview-CmXEPl-w.js";
import "qrcode.react";
import "./runtime-DwSFgQZq.js";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "dexie";
import "@headlessui/react";
const PAY_METHODS = ["Cash", "Card", "Bank", "UPI", "Credit"];
function LineSheet({ open, onClose, line, onChange, onRemove, perms, showMargin, narrow }) {
  const [total, setTotal] = useState("");
  const lineId = line ? line.u : null;
  useEffect(() => {
    if (open && line) setTotal(String(Math.round(line.qty * line.price - lineDiscount(line))));
  }, [open, lineId]);
  if (!line) return /* @__PURE__ */ jsx(Sheet, { open: false, onClose, title: "Line" });
  const gross = line.qty * line.price;
  const disc = lineDiscount(line);
  const net = gross - disc;
  const margin = line.cost && line.price > 0 ? (line.price - line.cost) / line.price * 100 : null;
  const backSolve = (v) => {
    setTotal(v);
    const want = Number(String(v).replace(/[^\d.]/g, ""));
    if (!want || !line.qty) return;
    const pct = Math.min(99.99, Math.max(0, line.discount?.value || 0));
    const beforeDisc = line.discount?.mode === "pct" ? want / (1 - pct / 100) : want + (line.discount?.value || 0);
    const next = beforeDisc / line.qty;
    if (!Number.isFinite(next)) return;
    onChange({ price: Math.round(next * 100) / 100, overridden: true });
  };
  return /* @__PURE__ */ jsxs(
    Sheet,
    {
      open,
      onClose,
      title: line.name,
      size: narrow ? "bottom" : "side",
      subtitle: line.sku,
      footer: /* @__PURE__ */ jsxs("div", { className: "nqp-actions", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            className: "nqp-cta",
            "data-danger": "true",
            disabled: !perms?.["pos.void_item"],
            title: perms?.["pos.void_item"] ? "Remove this line" : "Your role may not void a line",
            onClick: () => {
              onRemove();
              onClose();
            },
            children: "Remove line"
          }
        ),
        /* @__PURE__ */ jsx("button", { type: "button", className: "nqp-cta", onClick: onClose, children: "Done" })
      ] }),
      children: [
        /* @__PURE__ */ jsxs("div", { className: "nqp-field", children: [
          /* @__PURE__ */ jsxs("label", { htmlFor: "nqp-le-qty", children: [
            "Quantity ",
            /* @__PURE__ */ jsx(Kbd, { children: "F2" })
          ] }),
          /* @__PURE__ */ jsx(
            "input",
            {
              id: "nqp-le-qty",
              className: "num",
              inputMode: "decimal",
              value: line.qty,
              onChange: (e) => onChange({ qty: Math.max(0, Number(e.target.value.replace(/[^\d.]/g, "")) || 0) })
            }
          ),
          /* @__PURE__ */ jsxs("small", { children: [
            line.unit,
            line.band ? ` · wholesale band from ${line.band} ${line.unit}` : "",
            line.stock !== void 0 ? ` · ${line.stock} in stock` : ""
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "nqp-field", children: [
          /* @__PURE__ */ jsxs("label", { htmlFor: "nqp-le-rate", children: [
            "Rate ",
            /* @__PURE__ */ jsx(Kbd, { children: "F5" })
          ] }),
          /* @__PURE__ */ jsx(
            "input",
            {
              id: "nqp-le-rate",
              className: "num",
              inputMode: "decimal",
              value: line.price,
              disabled: !perms?.["pos.price_override"],
              onChange: (e) => onChange({ price: Number(e.target.value.replace(/[^\d.]/g, "")) || 0, overridden: true })
            }
          ),
          !perms?.["pos.price_override"] ? /* @__PURE__ */ jsx("span", { className: "nqp-err", children: "Your role may not override a price." }) : null,
          line.overridden ? /* @__PURE__ */ jsxs("small", { children: [
            "Overridden from ",
            n0(line.basePrice),
            ". ",
            /* @__PURE__ */ jsx("button", { type: "button", style: { minHeight: 0, textDecoration: "underline" }, onClick: () => onChange({ price: line.basePrice, overridden: false }), children: "revert" })
          ] }) : null,
          showMargin && margin != null ? /* @__PURE__ */ jsxs("small", { children: [
            "Margin ",
            margin.toFixed(1),
            "% · cost ",
            n0(line.cost)
          ] }) : null
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "nqp-field", children: [
          /* @__PURE__ */ jsxs("label", { children: [
            "Discount ",
            /* @__PURE__ */ jsx(Kbd, { children: "F3" })
          ] }),
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 8 }, children: [
            /* @__PURE__ */ jsxs("span", { className: "nqp-seg", style: { flex: "0 0 108px" }, children: [
              /* @__PURE__ */ jsx("button", { type: "button", "aria-pressed": line.discount?.mode === "pct", onClick: () => onChange({ discount: { ...line.discount, mode: "pct" } }), children: "%" }),
              /* @__PURE__ */ jsx("button", { type: "button", "aria-pressed": line.discount?.mode === "amt", onClick: () => onChange({ discount: { ...line.discount, mode: "amt" } }), children: "Rs" })
            ] }),
            /* @__PURE__ */ jsx(
              "input",
              {
                className: "num",
                inputMode: "decimal",
                value: line.discount?.value || 0,
                disabled: !perms?.["pos.discount"],
                onChange: (e) => {
                  const v = Number(e.target.value.replace(/[^\d.]/g, "")) || 0;
                  onChange({ discount: { ...line.discount, value: line.discount?.mode === "pct" ? Math.min(100, v) : v } });
                }
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("small", { children: [
            "Takes ",
            n2(disc),
            " off this line."
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "nqp-field", children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "nqp-le-tot", children: "Line total — type it and the rate follows" }),
          /* @__PURE__ */ jsx("input", { id: "nqp-le-tot", className: "num", inputMode: "decimal", value: total, onChange: (e) => backSolve(e.target.value) }),
          /* @__PURE__ */ jsxs("small", { children: [
            "Currently ",
            n2(net),
            "."
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "nqp-field", children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "nqp-le-free", children: "Free / bonus quantity" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              id: "nqp-le-free",
              className: "num",
              inputMode: "decimal",
              value: line.freeQty || 0,
              onChange: (e) => onChange({ freeQty: Math.max(0, Number(e.target.value.replace(/[^\d.]/g, "")) || 0) })
            }
          ),
          /* @__PURE__ */ jsx("small", { children: "Goes out with the sale, charged at zero." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "nqp-field", children: [
          /* @__PURE__ */ jsxs("label", { htmlFor: "nqp-le-unit", children: [
            "Unit ",
            /* @__PURE__ */ jsx(Kbd, { children: "F6" })
          ] }),
          /* @__PURE__ */ jsx("select", { id: "nqp-le-unit", value: line.unit || "pc", onChange: (e) => onChange({ unit: e.target.value }), children: ["pc", "strip", "pack", "box", "can", "bottle", "kg", "dozen", "meter"].map((u) => /* @__PURE__ */ jsx("option", { value: u, children: u }, u)) })
        ] }),
        line.batch ? /* @__PURE__ */ jsxs("div", { className: "nqp-field", children: [
          /* @__PURE__ */ jsx("label", { children: "Batch" }),
          /* @__PURE__ */ jsx("input", { value: line.batch, readOnly: true }),
          /* @__PURE__ */ jsx("small", { children: "FIFO batch tracking" })
        ] }) : null,
        /* @__PURE__ */ jsxs("div", { className: "nqp-field", style: { paddingBottom: 20 }, children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "nqp-le-note", children: "Note on this line" }),
          /* @__PURE__ */ jsx("textarea", { id: "nqp-le-note", value: line.note || "", placeholder: "Notes, serial numbers, customizations…", onChange: (e) => onChange({ note: e.target.value }) })
        ] })
      ]
    }
  );
}
function lineDiscount(line) {
  if (!line) return 0;
  const gross = (line.qty || 0) * (line.price || 0);
  const discVal = Number(line.discount?.value || 0);
  const off = line.discount?.mode === "pct" ? gross * Math.min(100, Math.max(0, discVal)) / 100 : Math.max(0, discVal);
  return Math.min(gross, off);
}
function PartySheet({ open, onClose, onPick, current, storeSlug, defaultCustomer, narrow }) {
  const tt = useTermText();
  const [q, setQ] = useState("");
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(null);
  const searchTimeout = useRef(null);
  const walkInCustomer = defaultCustomer || { id: 0, name: tt("Walk-in customer"), phone: "", balance: 0, discount: 0, walkin: true };
  const fetchCustomers = useCallback((query = "") => {
    setLoading(true);
    const url = storeSlug ? route("store.customers.search", { store_slug: storeSlug }) : "/customers-search";
    axios.get(url, { params: { search: query } }).then((res) => {
      const results = Array.isArray(res.data) ? res.data : res.data?.data || [];
      const formatted = results.map((p) => ({
        id: p.id,
        name: p.name,
        phone: p.phone || p.mobile || "",
        balance: Number(p.balance || p.current_balance || 0),
        discount: Number(p.default_discount || 0),
        credit: Number(p.credit_limit || 0),
        walkin: false
      }));
      if (!query.trim()) {
        setList([walkInCustomer, ...formatted.filter((c) => c.id !== walkInCustomer.id)]);
      } else {
        setList(formatted);
      }
    }).catch(() => {
      setList([walkInCustomer]);
    }).finally(() => setLoading(false));
  }, [storeSlug, walkInCustomer]);
  useEffect(() => {
    if (open) {
      fetchCustomers(q);
    }
  }, [open]);
  const onSearchChange = (val) => {
    setQ(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchCustomers(val);
    }, 250);
  };
  const handleCreateCustomer = () => {
    if (!creating?.name?.trim()) return;
    setLoading(true);
    const url = storeSlug ? route("store.parties.store", { store_slug: storeSlug }) : "/parties";
    axios.post(url, {
      name: creating.name,
      phone: creating.phone,
      party_type: "customer",
      credit_limit: creating.credit || 0,
      default_discount: creating.discount || 0,
      opening_balance: 0
    }).then((res) => {
      const created = res.data?.party || res.data || creating;
      const formatted = {
        id: created.id || Date.now(),
        name: created.name,
        phone: created.phone || "",
        balance: 0,
        discount: Number(created.default_discount || creating.discount || 0),
        credit: Number(created.credit_limit || creating.credit || 0),
        walkin: false
      };
      onPick(formatted);
      setCreating(null);
      onClose();
    }).catch((err) => {
      const errMsg = err.response?.data?.message || "Could not save customer";
      alert(errMsg);
    }).finally(() => setLoading(false));
  };
  if (creating) {
    return /* @__PURE__ */ jsxs(
      Sheet,
      {
        open,
        onClose: () => setCreating(null),
        title: creating.id ? tt("Edit customer") : tt("New customer"),
        size: narrow ? "bottom" : "side",
        footer: /* @__PURE__ */ jsxs("div", { className: "nqp-actions", children: [
          /* @__PURE__ */ jsx("button", { type: "button", className: "nqp-cta", "data-ghost": "true", onClick: () => setCreating(null), children: "Back" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              className: "nqp-cta",
              disabled: !creating.name.trim() || loading,
              onClick: handleCreateCustomer,
              children: loading ? "Saving…" : "Save and use"
            }
          )
        ] }),
        children: [
          /* @__PURE__ */ jsxs("div", { className: "nqp-field", children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "nqp-p-n", children: "Name *" }),
            /* @__PURE__ */ jsx("input", { id: "nqp-p-n", value: creating.name, onChange: (e) => setCreating({ ...creating, name: e.target.value }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "nqp-field", children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "nqp-p-ph", children: "Phone" }),
            /* @__PURE__ */ jsx("input", { id: "nqp-p-ph", inputMode: "tel", value: creating.phone, onChange: (e) => setCreating({ ...creating, phone: e.target.value }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "nqp-field", children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "nqp-p-d", children: "Default discount %" }),
            /* @__PURE__ */ jsx("input", { id: "nqp-p-d", className: "num", inputMode: "decimal", value: creating.discount, onChange: (e) => setCreating({ ...creating, discount: Number(e.target.value.replace(/[^\d.]/g, "")) || 0 }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "nqp-field", style: { paddingBottom: 20 }, children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "nqp-p-c", children: "Credit limit" }),
            /* @__PURE__ */ jsx("input", { id: "nqp-p-c", className: "num", inputMode: "decimal", value: creating.credit, onChange: (e) => setCreating({ ...creating, credit: Number(e.target.value.replace(/[^\d.]/g, "")) || 0 }) })
          ] })
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxs(
    Sheet,
    {
      open,
      onClose,
      title: tt("Customer"),
      size: narrow ? "bottom" : "side",
      footer: /* @__PURE__ */ jsx("div", { className: "nqp-actions", children: /* @__PURE__ */ jsxs("button", { type: "button", className: "nqp-cta", "data-ghost": "true", onClick: () => setCreating({ name: "", phone: "", discount: 0, credit: 0, balance: 0 }), children: [
        tt("New customer"),
        " ",
        /* @__PURE__ */ jsx(Kbd, { children: "Ctrl+D" })
      ] }) }),
      children: [
        /* @__PURE__ */ jsx("div", { className: "nqp-field", children: /* @__PURE__ */ jsx("input", { "data-sheet-focus": true, placeholder: "Search name or phone number…", value: q, onChange: (e) => onSearchChange(e.target.value) }) }),
        list.map((p) => /* @__PURE__ */ jsxs(RowButton, { className: "nqp-row", onClick: () => {
          onPick(p);
          onClose();
        }, children: [
          /* @__PURE__ */ jsx("span", { className: "nqp-avatar", children: p.name ? p.name[0].toUpperCase() : "C" }),
          /* @__PURE__ */ jsxs("span", { className: "nqp-rowmain", children: [
            /* @__PURE__ */ jsx("span", { className: "nqp-rowtitle", children: p.name }),
            /* @__PURE__ */ jsx("span", { className: "nqp-line-sub", children: p.walkin ? tt("Walk-in cash customer") : `${p.phone || "No phone"} · Balance: ${n0(p.balance)}${p.discount ? ` · ${p.discount}% discount` : ""}` })
          ] }),
          current && current.id === p.id ? /* @__PURE__ */ jsx(Flag, { children: "Selected" }) : null
        ] }, p.id)),
        !list.length && !loading ? /* @__PURE__ */ jsx("div", { className: "nqp-empty", children: tt("No matching customers found.") }) : null,
        loading ? /* @__PURE__ */ jsx("div", { className: "nqp-empty", children: tt("Loading customers…") }) : null
      ]
    }
  );
}
function ParkedSheet({ open, onClose, onRecall, onDelete, storeSlug, narrow }) {
  const tt = useTermText();
  const [parked, setParked] = useState([]);
  const [loading, setLoading] = useState(false);
  const loadParked = useCallback(() => {
    setLoading(true);
    const url = storeSlug ? route("store.sales.parked", { store_slug: storeSlug }) : "/sales/parked";
    axios.get(url).then((res) => {
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setParked(data);
    }).catch(() => setParked([])).finally(() => setLoading(false));
  }, [storeSlug]);
  useEffect(() => {
    if (open) loadParked();
  }, [open, loadParked]);
  return /* @__PURE__ */ jsxs(Sheet, { open, onClose, title: "Parked sales", subtitle: `${parked.length} held`, size: narrow ? "bottom" : "side", children: [
    parked.map((h) => {
      const cart = typeof h.cart_data === "string" ? JSON.parse(h.cart_data || "[]") : h.cart_data || [];
      const linesCount = Array.isArray(cart) ? cart.length : h.items?.length || 0;
      const total = Number(h.total_amount || h.total || 0);
      return /* @__PURE__ */ jsxs("div", { className: "nqp-row", "data-static": "true", children: [
        /* @__PURE__ */ jsxs("span", { className: "nqp-rowmain", children: [
          /* @__PURE__ */ jsx("span", { className: "nqp-rowtitle", children: h.customer?.name || h.customer_name || tt("Walk-in Customer") }),
          /* @__PURE__ */ jsxs("span", { className: "nqp-line-sub", children: [
            "Ref: ",
            h.reference_number || h.id,
            " · ",
            linesCount,
            " items · ",
            h.created_at ? new Date(h.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""
          ] })
        ] }),
        /* @__PURE__ */ jsx(Money, { value: total, font: 15, avail: 110 }),
        /* @__PURE__ */ jsx("button", { type: "button", className: "nqp-adjbtn", onClick: () => {
          onRecall(h);
          onClose();
        }, children: "Recall" }),
        onDelete ? /* @__PURE__ */ jsx("button", { type: "button", className: "nqp-line-del", "aria-label": "Delete", onClick: () => onDelete(h.id), children: "✕" }) : null
      ] }, h.id);
    }),
    !parked.length && !loading ? /* @__PURE__ */ jsx("div", { className: "nqp-empty", children: "No sales currently on hold." }) : null,
    loading ? /* @__PURE__ */ jsx("div", { className: "nqp-empty", children: "Loading held sales…" }) : null
  ] });
}
function RecentSheet({ open, onClose, onReprint, onReturn, perms, narrow, storeSlug, settings }) {
  const tt = useTermText();
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (open) {
      setLoading(true);
      const url = storeSlug ? route("store.pos.recent-sales", { store_slug: storeSlug }) : "/pos/recent-sales";
      axios.get(url).then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setRecent(data);
      }).catch(() => setRecent([])).finally(() => setLoading(false));
    }
  }, [open, storeSlug]);
  return /* @__PURE__ */ jsxs(Sheet, { open, onClose, title: "Recent invoices", subtitle: "Latest completed sales", size: narrow ? "bottom" : "side", children: [
    recent.map((r) => /* @__PURE__ */ jsxs("div", { className: "nqp-row", "data-static": "true", children: [
      /* @__PURE__ */ jsxs("span", { className: "nqp-rowmain", children: [
        /* @__PURE__ */ jsx("span", { className: "nqp-rowtitle", children: r.customer?.name || r.customer_name || tt("Walk-in Customer") }),
        /* @__PURE__ */ jsxs("span", { className: "nqp-line-sub", children: [
          r.invoice_number || r.reference_number || `INV-${r.id}`,
          " · ",
          r.created_at ? new Date(r.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
          " · ",
          r.payment_method || "Cash",
          r.status === "returned" ? " · Returned" : ""
        ] })
      ] }),
      /* @__PURE__ */ jsx(Money, { value: Number(r.final_total || r.total || r.grand_total || 0), font: 14, avail: 100 }),
      /* @__PURE__ */ jsx("button", { type: "button", className: "nqp-adjbtn", onClick: () => onReprint(r), children: "Print" }),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          className: "nqp-adjbtn",
          disabled: !perms?.["pos.refund"] || r.status === "returned",
          title: perms?.["pos.refund"] ? "Start a return against this invoice" : "Your role may not run a return",
          onClick: () => {
            onReturn(r);
            onClose();
          },
          children: "Return"
        }
      )
    ] }, r.id)),
    !recent.length && !loading ? /* @__PURE__ */ jsx("div", { className: "nqp-empty", children: "No recent sales found today." }) : null,
    loading ? /* @__PURE__ */ jsx("div", { className: "nqp-empty", children: "Loading recent invoices…" }) : null
  ] });
}
function ReturnSheet({ open, onClose, onLoad, policy, windowDays, party, perms, narrow, storeSlug }) {
  const [ref, setRef] = useState("");
  const [found, setFound] = useState(null);
  const [searching, setSearching] = useState(false);
  const [recentList, setRecentList] = useState([]);
  const canOpen = policy === "open";
  useEffect(() => {
    if (open) {
      const url = storeSlug ? route("store.pos.recent-sales", { store_slug: storeSlug }) : "/pos/recent-sales";
      axios.get(url).then((res) => {
        setRecentList(Array.isArray(res.data) ? res.data : res.data?.data || []);
      }).catch(() => {
      });
    }
  }, [open, storeSlug]);
  const searchInvoice = (invNum) => {
    setRef(invNum);
    if (!invNum.trim()) {
      setFound(null);
      return;
    }
    setSearching(true);
    const url = storeSlug ? route("store.sales.lookup", { store_slug: storeSlug }) : "/sales/lookup";
    axios.get(url, { params: { query: invNum.trim() } }).then((res) => {
      const sale = res.data?.sale || (Array.isArray(res.data) ? res.data[0] : res.data);
      setFound(sale || null);
    }).catch(() => setFound(null)).finally(() => setSearching(false));
  };
  return /* @__PURE__ */ jsxs(
    Sheet,
    {
      open,
      onClose,
      title: "Return / Refund",
      size: narrow ? "bottom" : "side",
      subtitle: policy === "reference" ? "Invoice reference required" : "Select invoice to return",
      footer: /* @__PURE__ */ jsx("div", { className: "nqp-actions", children: /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          className: "nqp-cta",
          disabled: !perms?.["pos.refund"] || !found && !canOpen,
          onClick: () => {
            onLoad(found || null);
            onClose();
          },
          children: found ? `Load ${found.invoice_number || found.reference_number || found.id}` : canOpen ? "Start open return" : "Load invoice"
        }
      ) }),
      children: [
        !perms?.["pos.refund"] ? /* @__PURE__ */ jsxs("div", { className: "nqp-empty", children: [
          "Your role may not run a return. ",
          /* @__PURE__ */ jsx("code", { children: "pos.refund" }),
          " is disabled."
        ] }) : null,
        /* @__PURE__ */ jsxs("div", { className: "nqp-field", children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "nqp-r-ref", children: "Invoice number" }),
          /* @__PURE__ */ jsx("input", { id: "nqp-r-ref", placeholder: "e.g. INV-10021", value: ref, onChange: (e) => searchInvoice(e.target.value) }),
          ref && !found && !searching ? /* @__PURE__ */ jsx("span", { className: "nqp-err", children: "No matching invoice found." }) : null,
          found ? /* @__PURE__ */ jsxs("small", { style: { color: "var(--vq-success)" }, children: [
            "Found: ",
            found.customer?.name || "Walk-in",
            " · Total: PKR ",
            n0(found.final_total || found.total),
            " · Paid: ",
            found.payment_method
          ] }) : null
        ] }),
        /* @__PURE__ */ jsx("div", { style: { padding: "8px 16px 4px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--vq-text-3)" }, children: "Recent Sales" }),
        recentList.slice(0, 8).map((r) => /* @__PURE__ */ jsxs("button", { type: "button", className: "nqp-row", onClick: () => searchInvoice(r.invoice_number || r.reference_number || String(r.id)), children: [
          /* @__PURE__ */ jsxs("span", { className: "nqp-rowmain", children: [
            /* @__PURE__ */ jsx("span", { className: "nqp-rowtitle", children: r.invoice_number || r.reference_number || `INV-${r.id}` }),
            /* @__PURE__ */ jsxs("span", { className: "nqp-line-sub", children: [
              r.customer?.name || "Walk-in",
              " · ",
              r.created_at ? new Date(r.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""
            ] })
          ] }),
          /* @__PURE__ */ jsx(Money, { value: Number(r.final_total || r.total || 0), font: 14, avail: 100 })
        ] }, r.id))
      ]
    }
  );
}
function QuickProductSheet({ open, onClose, onCreate, categories = [], narrow }) {
  const tt = useTermText();
  const [f, setF] = useState({ name: "", sku: "", price: "", stock: "", category_id: categories[1]?.id || categories[0]?.id || "" });
  useEffect(() => {
    if (open) setF({ name: "", sku: "", price: "", stock: "", category_id: categories[1]?.id || categories[0]?.id || "" });
  }, [open, categories]);
  const ok = f.name.trim() && Number(f.price) > 0;
  return /* @__PURE__ */ jsxs(
    Sheet,
    {
      open,
      onClose,
      title: tt("New product"),
      size: narrow ? "bottom" : "side",
      footer: /* @__PURE__ */ jsxs("div", { className: "nqp-actions", children: [
        /* @__PURE__ */ jsx("button", { type: "button", className: "nqp-cta", "data-ghost": "true", onClick: onClose, children: "Cancel" }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            className: "nqp-cta",
            disabled: !ok,
            onClick: () => {
              onCreate(f);
              onClose();
            },
            children: "Create and add"
          }
        )
      ] }),
      children: [
        /* @__PURE__ */ jsxs("div", { className: "nqp-field", children: [
          /* @__PURE__ */ jsxs("label", { htmlFor: "nqp-q-n", children: [
            tt("Product name"),
            " *"
          ] }),
          /* @__PURE__ */ jsx("input", { id: "nqp-q-n", value: f.name, onChange: (e) => setF({ ...f, name: e.target.value }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "nqp-field", children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "nqp-q-s", children: "SKU or Barcode" }),
          /* @__PURE__ */ jsx("input", { id: "nqp-q-s", value: f.sku, onChange: (e) => setF({ ...f, sku: e.target.value }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "nqp-field", children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "nqp-q-p", children: "Selling price *" }),
          /* @__PURE__ */ jsx("input", { id: "nqp-q-p", className: "num", inputMode: "decimal", value: f.price, onChange: (e) => setF({ ...f, price: e.target.value.replace(/[^\d.]/g, "") }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "nqp-field", children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "nqp-q-st", children: "Opening stock" }),
          /* @__PURE__ */ jsx("input", { id: "nqp-q-st", className: "num", inputMode: "decimal", value: f.stock, onChange: (e) => setF({ ...f, stock: e.target.value.replace(/[^\d.]/g, "") }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "nqp-field", style: { paddingBottom: 20 }, children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "nqp-q-c", children: "Category" }),
          /* @__PURE__ */ jsx("select", { id: "nqp-q-c", value: f.category_id, onChange: (e) => setF({ ...f, category_id: e.target.value }), children: categories.filter((c) => c.id !== "all").map((c) => /* @__PURE__ */ jsx("option", { value: c.id, children: c.name }, c.id)) })
        ] })
      ]
    }
  );
}
function QuickBankSheet({ open, onClose, onCreate, narrow }) {
  const [f, setF] = useState({ name: "", code: "" });
  useEffect(() => {
    if (open) setF({ name: "", code: "" });
  }, [open]);
  return /* @__PURE__ */ jsxs(
    Sheet,
    {
      open,
      onClose,
      title: "New bank account",
      size: narrow ? "bottom" : "side",
      footer: /* @__PURE__ */ jsx("div", { className: "nqp-actions", children: /* @__PURE__ */ jsx("button", { type: "button", className: "nqp-cta", disabled: !f.name.trim(), onClick: () => {
        onCreate(f);
        onClose();
      }, children: "Create and use" }) }),
      children: [
        /* @__PURE__ */ jsxs("div", { className: "nqp-field", children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "nqp-b-n", children: "Account name *" }),
          /* @__PURE__ */ jsx("input", { id: "nqp-b-n", value: f.name, onChange: (e) => setF({ ...f, name: e.target.value }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "nqp-field", style: { paddingBottom: 20 }, children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "nqp-b-c", children: "Account number / IBAN" }),
          /* @__PURE__ */ jsx("input", { id: "nqp-b-c", value: f.code, onChange: (e) => setF({ ...f, code: e.target.value }) })
        ] })
      ]
    }
  );
}
function VariantSheet({ open, onClose, product, onPick, narrow }) {
  return /* @__PURE__ */ jsx(Sheet, { open, onClose, title: product ? product.name : "Select Variant", subtitle: "Choose option", size: narrow ? "bottom" : "side", children: (product?.variants || []).map((v) => /* @__PURE__ */ jsxs("button", { type: "button", className: "nqp-row", onClick: () => {
    onPick(v);
    onClose();
  }, children: [
    /* @__PURE__ */ jsxs("span", { className: "nqp-rowmain", children: [
      /* @__PURE__ */ jsx("span", { className: "nqp-rowtitle", children: v.name }),
      /* @__PURE__ */ jsxs("span", { className: "nqp-line-sub", children: [
        v.sku || product.sku,
        " · ",
        v.stock !== void 0 ? `${v.stock} in stock` : ""
      ] })
    ] }),
    /* @__PURE__ */ jsx(Money, { value: v.price, font: 15, avail: 100 })
  ] }, v.id)) });
}
function OfflineSheet({ open, onClose, queue, onRetry, onRecall, onDelete, online, narrow }) {
  return /* @__PURE__ */ jsxs(
    Sheet,
    {
      open,
      onClose,
      title: "Offline queue",
      subtitle: online ? "Connected — syncing" : "Offline Mode",
      size: narrow ? "bottom" : "side",
      footer: /* @__PURE__ */ jsx("div", { className: "nqp-actions", children: /* @__PURE__ */ jsx("button", { type: "button", className: "nqp-cta", disabled: !online || !queue.length, onClick: () => onRetry(null), children: "Sync all now" }) }),
      children: [
        queue.map((q) => /* @__PURE__ */ jsxs("div", { className: "nqp-row", "data-static": "true", style: { alignItems: "flex-start", flexWrap: "wrap" }, children: [
          /* @__PURE__ */ jsxs("span", { className: "nqp-rowmain", children: [
            /* @__PURE__ */ jsxs("span", { className: "nqp-rowtitle", children: [
              q.id,
              " · ",
              q.lines || q.items?.length || 0,
              " lines"
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "nqp-line-sub", children: [
              q.at,
              " · ",
              q.why || (q.state === "pending" ? "Waiting to post" : "Error")
            ] })
          ] }),
          /* @__PURE__ */ jsx(Money, { value: q.total, font: 14, avail: 100 }),
          /* @__PURE__ */ jsx(Flag, { tone: q.state === "error" ? "bad" : q.state === "syncing" ? "info" : "warn", children: q.state }),
          /* @__PURE__ */ jsxs("span", { style: { display: "flex", gap: 6, width: "100%", marginTop: 6 }, children: [
            /* @__PURE__ */ jsx("button", { type: "button", className: "nqp-adjbtn", disabled: !online, onClick: () => onRetry(q), children: "Retry" }),
            /* @__PURE__ */ jsx("button", { type: "button", className: "nqp-adjbtn", onClick: () => onRecall(q), children: "Recall to tab" }),
            /* @__PURE__ */ jsx("button", { type: "button", className: "nqp-adjbtn", onClick: () => onDelete(q), children: "Discard" })
          ] })
        ] }, q.id)),
        !queue.length ? /* @__PURE__ */ jsx("div", { className: "nqp-empty", children: "No pending offline sales. All orders are synced." }) : null
      ]
    }
  );
}
function KeysSheet({ open, onClose, narrow }) {
  return /* @__PURE__ */ jsx(Sheet, { open, onClose, title: "Keyboard shortcuts", subtitle: "Full POS keymap", size: narrow ? "bottom" : "side", children: /* @__PURE__ */ jsx("div", { className: "nqp-keymap", children: keymap().map(([k, action, where]) => /* @__PURE__ */ jsxs(React.Fragment, { children: [
    /* @__PURE__ */ jsx(Kbd, { children: k }),
    /* @__PURE__ */ jsx("span", { children: action }),
    /* @__PURE__ */ jsx("span", { className: "mono", children: where })
  ] }, k)) }) });
}
function BreakupSheet({ open, onClose, m, tab, narrow }) {
  const tt = useTermText();
  const rows = [
    ["Gross total", m.gross],
    ["Item discounts", -m.lineDisc],
    ["Subtotal", m.sub],
    [`Document discount${tab.discount?.mode === "pct" && tab.discount?.value ? ` (${tab.discount.value}%)` : ""}`, -m.docDisc],
    ["Additional charges", m.charges],
    [`Tax ${m.taxLabel || ""}${tab.taxMode === "inclusive" ? " (included)" : ""}`, m.tax],
    m.round ? ["Round off", m.round] : null
  ].filter(Boolean);
  return /* @__PURE__ */ jsxs(Sheet, { open, onClose, title: "Bill breakdown", subtitle: tab.docNo || "Active Sale", size: narrow ? "bottom" : "side", children: [
    rows.map(([k, v]) => /* @__PURE__ */ jsxs("div", { className: "nqp-tot", children: [
      /* @__PURE__ */ jsx("span", { className: "k", children: k }),
      /* @__PURE__ */ jsx(Money, { value: v, font: 15, avail: 140, className: "v" })
    ] }, k)),
    /* @__PURE__ */ jsxs("div", { className: "nqp-tot nqp-grand", children: [
      /* @__PURE__ */ jsx("span", { className: "k", children: "Total" }),
      /* @__PURE__ */ jsx(Money, { value: m.total, font: 28, avail: 200, ccy: "PKR", className: "v" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "nqp-tot", children: [
      /* @__PURE__ */ jsx("span", { className: "k", children: "Items" }),
      /* @__PURE__ */ jsx("span", { className: "v num", children: m.count })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "nqp-tot", children: [
      /* @__PURE__ */ jsx("span", { className: "k", children: tt("Customer") }),
      /* @__PURE__ */ jsx("span", { className: "v", children: tab.party?.name || "Walk-in" })
    ] })
  ] });
}
function DiscountSheet({ open, onClose, tab, setTab, presetsList = [5, 10, 15, 20], onEditPreset, perms, narrow }) {
  return /* @__PURE__ */ jsxs(
    Sheet,
    {
      open,
      onClose,
      title: "Document discount",
      size: narrow ? "bottom" : "side",
      footer: /* @__PURE__ */ jsx("div", { className: "nqp-actions", children: /* @__PURE__ */ jsx("button", { type: "button", className: "nqp-cta", onClick: onClose, children: "Done" }) }),
      children: [
        !perms?.["pos.discount"] ? /* @__PURE__ */ jsx("div", { className: "nqp-empty", children: "Your role may not give a discount." }) : null,
        /* @__PURE__ */ jsxs("div", { className: "nqp-field", children: [
          /* @__PURE__ */ jsx("label", { children: "Discount" }),
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 8 }, children: [
            /* @__PURE__ */ jsxs("span", { className: "nqp-seg", style: { flex: "0 0 108px" }, children: [
              /* @__PURE__ */ jsx("button", { type: "button", "aria-pressed": tab.discount?.mode === "pct", onClick: () => setTab({ discount: { ...tab.discount, mode: "pct" } }), children: "%" }),
              /* @__PURE__ */ jsx("button", { type: "button", "aria-pressed": tab.discount?.mode === "amt", onClick: () => setTab({ discount: { ...tab.discount, mode: "amt" } }), children: "Rs" })
            ] }),
            /* @__PURE__ */ jsx(
              "input",
              {
                className: "num",
                inputMode: "decimal",
                value: tab.discount?.value || 0,
                disabled: !perms?.["pos.discount"],
                onChange: (e) => {
                  const v = Number(e.target.value.replace(/[^\d.]/g, "")) || 0;
                  setTab({ discount: { ...tab.discount, value: tab.discount?.mode === "pct" ? Math.min(100, v) : v } });
                }
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "nqp-field", style: { paddingBottom: 20 }, children: [
          /* @__PURE__ */ jsx("label", { children: "Discount presets" }),
          /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" }, children: presetsList.map((v) => /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              className: "nqp-catchip",
              disabled: !perms?.["pos.discount"],
              "aria-pressed": tab.discount?.mode === "pct" && tab.discount?.value === v,
              onClick: () => setTab({ discount: { mode: "pct", value: v } }),
              children: [
                v,
                "%"
              ]
            },
            v
          )) })
        ] })
      ]
    }
  );
}
function ChargesSheet({ open, onClose, tab, setTab, narrow }) {
  const set = (i, patch) => setTab({ charges: tab.charges.map((c, j) => j === i ? { ...c, ...patch } : c) });
  return /* @__PURE__ */ jsxs(
    Sheet,
    {
      open,
      onClose,
      title: "Additional charges",
      size: narrow ? "bottom" : "side",
      footer: /* @__PURE__ */ jsxs("div", { className: "nqp-actions", children: [
        /* @__PURE__ */ jsx("button", { type: "button", className: "nqp-cta", "data-ghost": "true", onClick: () => setTab({ charges: [...tab.charges, { label: "Delivery", amount: 0 }] }), children: "Add charge" }),
        /* @__PURE__ */ jsx("button", { type: "button", className: "nqp-cta", onClick: onClose, children: "Done" })
      ] }),
      children: [
        tab.charges.map((c, i) => /* @__PURE__ */ jsxs("div", { className: "nqp-field", style: { flexDirection: "row", alignItems: "center", gap: 8 }, children: [
          /* @__PURE__ */ jsx("input", { value: c.label, onChange: (e) => set(i, { label: e.target.value }) }),
          /* @__PURE__ */ jsx("input", { className: "num", inputMode: "decimal", style: { flex: "0 0 130px" }, value: c.amount, onChange: (e) => set(i, { amount: Number(e.target.value.replace(/[^\d.]/g, "")) || 0 }) }),
          /* @__PURE__ */ jsx("button", { type: "button", className: "nqp-line-del", "aria-label": "Remove charge", onClick: () => setTab({ charges: tab.charges.filter((_, j) => j !== i) }), children: "✕" })
        ] }, i)),
        !tab.charges.length ? /* @__PURE__ */ jsx("div", { className: "nqp-empty", children: "No additional charges on this sale." }) : null
      ]
    }
  );
}
function NotesSheet({ open, onClose, tab, setTab, narrow }) {
  const tt = useTermText();
  return /* @__PURE__ */ jsx(
    Sheet,
    {
      open,
      onClose,
      title: "Sale remarks",
      size: narrow ? "bottom" : "side",
      footer: /* @__PURE__ */ jsx("div", { className: "nqp-actions", children: /* @__PURE__ */ jsx("button", { type: "button", className: "nqp-cta", onClick: onClose, children: "Done" }) }),
      children: /* @__PURE__ */ jsxs("div", { className: "nqp-field", style: { paddingBottom: 20 }, children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "nqp-n", children: "Invoice remarks" }),
        /* @__PURE__ */ jsx("textarea", { id: "nqp-n", "data-sheet-focus": true, value: tab.notes || "", placeholder: tt("Add invoice notes or customer remarks…"), onChange: (e) => setTab({ notes: e.target.value }) })
      ] })
    }
  );
}
function SplitSheet({ open, onClose, tab, setTab, total, banks = [], onNewBank, narrow }) {
  const paid = (tab.splits || []).reduce((a, s) => a + (Number(s.amount) || 0), 0);
  const left = total - paid;
  const set = (i, patch) => setTab({ splits: tab.splits.map((s, j) => j === i ? { ...s, ...patch } : s) });
  return /* @__PURE__ */ jsxs(
    Sheet,
    {
      open,
      onClose,
      title: "Split payment",
      subtitle: `Paid: ${n0(paid)} of ${n0(total)}`,
      size: narrow ? "bottom" : "side",
      footer: /* @__PURE__ */ jsxs("div", { className: "nqp-actions", children: [
        /* @__PURE__ */ jsx("button", { type: "button", className: "nqp-cta", "data-ghost": "true", onClick: () => setTab({ splits: [...tab.splits || [], { method: "Cash", amount: Math.max(0, Math.round(left)), bank: banks[0]?.id }] }), children: "Add payment line" }),
        /* @__PURE__ */ jsx("button", { type: "button", className: "nqp-cta", onClick: onClose, children: "Done" })
      ] }),
      children: [
        /* @__PURE__ */ jsx("div", { className: "nqp-splitrows", style: { paddingTop: 12 }, children: (tab.splits || []).map((s, i) => /* @__PURE__ */ jsxs("div", { className: "nqp-splitrow", children: [
          /* @__PURE__ */ jsx("select", { value: s.method, onChange: (e) => set(i, { method: e.target.value }), children: PAY_METHODS.map((m) => /* @__PURE__ */ jsx("option", { value: m, children: m }, m)) }),
          s.method !== "Cash" && s.method !== "Credit" ? /* @__PURE__ */ jsx("select", { value: s.bank, onChange: (e) => set(i, { bank: Number(e.target.value) }), children: banks.map((b) => /* @__PURE__ */ jsx("option", { value: b.id, children: b.name }, b.id)) }) : null,
          /* @__PURE__ */ jsx("input", { className: "num", inputMode: "decimal", value: s.amount, onChange: (e) => set(i, { amount: Number(e.target.value.replace(/[^\d.]/g, "")) || 0 }) }),
          /* @__PURE__ */ jsx("button", { type: "button", className: "nqp-line-del", "aria-label": "Remove", onClick: () => setTab({ splits: tab.splits.filter((_, j) => j !== i) }), children: "✕" })
        ] }, i)) }),
        !tab.splits?.length ? /* @__PURE__ */ jsx("div", { className: "nqp-empty", children: 'Click "Add payment line" to split across cash, bank, or card.' }) : null,
        /* @__PURE__ */ jsxs("div", { className: "nqp-tot", children: [
          /* @__PURE__ */ jsx("span", { className: "k", children: "Remaining balance" }),
          /* @__PURE__ */ jsx(Money, { value: left, font: 17, avail: 140, className: "v", style: { color: left <= 0 ? "var(--vq-success)" : "var(--vq-danger)" } })
        ] }),
        onNewBank ? /* @__PURE__ */ jsx("div", { className: "nqp-actions", children: /* @__PURE__ */ jsx("button", { type: "button", className: "nqp-cta", "data-ghost": "true", onClick: onNewBank, children: "Add bank account" }) }) : null
      ]
    }
  );
}
function OverpaySheet({ open, onClose, amount, party, onChoose, narrow }) {
  const tt = useTermText();
  return /* @__PURE__ */ jsxs(Sheet, { open, onClose, title: "Overpayment", size: narrow ? "bottom" : "side", children: [
    /* @__PURE__ */ jsxs("div", { className: "nqp-tot nqp-grand", children: [
      /* @__PURE__ */ jsx("span", { className: "k", children: "Change / Excess" }),
      /* @__PURE__ */ jsx(Money, { value: amount, font: 30, avail: 200, ccy: "PKR", className: "v" })
    ] }),
    /* @__PURE__ */ jsx("button", { type: "button", className: "nqp-row", onClick: () => {
      onChoose("change");
      onClose();
    }, children: /* @__PURE__ */ jsxs("span", { className: "nqp-rowmain", children: [
      /* @__PURE__ */ jsx("span", { className: "nqp-rowtitle", children: "Return as Cash Change" }),
      /* @__PURE__ */ jsx("span", { className: "nqp-line-sub", children: "Opens drawer and registers cash change on invoice." })
    ] }) }),
    /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        className: "nqp-row",
        disabled: !party || party.walkin,
        onClick: () => {
          onChoose("ledger");
          onClose();
        },
        children: /* @__PURE__ */ jsxs("span", { className: "nqp-rowmain", children: [
          /* @__PURE__ */ jsxs("span", { className: "nqp-rowtitle", children: [
            tt("Credit to"),
            " ",
            party && !party.walkin ? party.name : tt("Customer"),
            "'s Ledger"
          ] }),
          /* @__PURE__ */ jsx("span", { className: "nqp-line-sub", children: party && !party.walkin ? tt("Records as advance customer deposit on ledger balance.") : tt("Walk-in customer has no ledger account.") })
        ] })
      }
    )
  ] });
}
function ReceiptSheet({ open, onClose, sale, settings, store }) {
  const tt = useTermText();
  if (!sale) return null;
  const total = Number(sale.total || sale.final_total || sale.amount_paid || 0);
  const paid = Number(sale.amount_paid || sale.cash || total);
  const change = Number(sale.change || Math.max(0, paid - total));
  const items = sale.items || sale.cart || [];
  const handlePrint = (type = "thermal") => {
    PrintService.quickPrint(sale, type, settings);
  };
  return /* @__PURE__ */ jsxs(
    Sheet,
    {
      open,
      onClose,
      title: "Sale Completed",
      subtitle: sale.invoice_number || sale.reference_number || `INV-${sale.id || "POSTED"}`,
      footer: /* @__PURE__ */ jsxs("div", { className: "nqp-actions", children: [
        /* @__PURE__ */ jsx("button", { type: "button", className: "nqp-cta", "data-ghost": "true", onClick: () => handlePrint("regular"), children: "Standard (A4)" }),
        /* @__PURE__ */ jsx("button", { type: "button", className: "nqp-cta", onClick: () => handlePrint("thermal"), children: "Print Receipt" }),
        /* @__PURE__ */ jsx("button", { type: "button", className: "nqp-cta", "data-ghost": "true", onClick: onClose, children: "Done" })
      ] }),
      children: [
        /* @__PURE__ */ jsxs("div", { style: { textAlign: "center", padding: "16px 0 20px", borderBottom: "1px solid var(--vq-line)" }, children: [
          /* @__PURE__ */ jsx("div", { style: { fontSize: 13, fontWeight: 700, color: "var(--vq-accent-text)", textTransform: "uppercase", letterSpacing: "0.05em" }, children: store?.name || "VenQore POS" }),
          /* @__PURE__ */ jsxs("div", { style: { fontSize: 24, fontWeight: 800, fontFamily: "var(--vq-font-numeric)", color: "var(--vq-text)", marginTop: 4 }, children: [
            "PKR ",
            n0(total)
          ] }),
          /* @__PURE__ */ jsxs("div", { style: { fontSize: 12, color: "var(--vq-text-3)", marginTop: 2 }, children: [
            sale.customer?.name || sale.customer_name || tt("Walk-in Customer"),
            " · ",
            (/* @__PURE__ */ new Date()).toLocaleTimeString()
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { padding: "14px 0", borderBottom: "1px solid var(--vq-line)" }, children: [
          /* @__PURE__ */ jsxs("div", { style: { fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--vq-text-3)", marginBottom: 8 }, children: [
            "Items (",
            items.reduce((acc, i) => acc + (Number(i.qty || i.quantity) || 1), 0),
            ")"
          ] }),
          items.map((it, idx) => {
            const lineQty = Number(it.qty || it.quantity || 1);
            const linePrice = Number(it.price || it.unit_price || 0);
            return /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0" }, children: [
              /* @__PURE__ */ jsxs("span", { children: [
                lineQty,
                " × ",
                it.name || it.product?.name || `Item #${it.product_id}`
              ] }),
              /* @__PURE__ */ jsxs("span", { style: { fontWeight: 600, fontFamily: "var(--vq-font-numeric)" }, children: [
                "PKR ",
                n0(lineQty * linePrice)
              ] })
            ] }, idx);
          })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { padding: "12px 0" }, children: [
          /* @__PURE__ */ jsxs("div", { className: "nqp-tot", children: [
            /* @__PURE__ */ jsx("span", { className: "k", children: "Paid" }),
            /* @__PURE__ */ jsxs("span", { className: "v num", children: [
              "PKR ",
              n0(paid)
            ] })
          ] }),
          change > 0 ? /* @__PURE__ */ jsxs("div", { className: "nqp-tot", children: [
            /* @__PURE__ */ jsx("span", { className: "k", children: "Change" }),
            /* @__PURE__ */ jsxs("span", { className: "v num", style: { color: "var(--vq-success)" }, children: [
              "PKR ",
              n0(change)
            ] })
          ] }) : null,
          /* @__PURE__ */ jsxs("div", { className: "nqp-tot", children: [
            /* @__PURE__ */ jsx("span", { className: "k", children: "Payment Method" }),
            /* @__PURE__ */ jsx("span", { className: "v", children: sale.payment_method || "Cash" })
          ] })
        ] })
      ]
    }
  );
}
function Palette({ open, onClose, commands }) {
  const [q, setQ] = useState("");
  useEffect(() => {
    if (open) setQ("");
  }, [open]);
  if (!open) return null;
  const list = commands.filter((c) => c.label.toLowerCase().includes(q.toLowerCase()));
  return /* @__PURE__ */ jsxs("div", { className: "nqp-palette", role: "dialog", "aria-modal": "true", "aria-label": "Commands", children: [
    /* @__PURE__ */ jsx("input", { autoFocus: true, placeholder: "Type a command…", value: q, onChange: (e) => setQ(e.target.value), onKeyDown: (e) => {
      if (e.key === "Enter" && list[0]) {
        list[0].run();
        onClose();
      }
    } }),
    /* @__PURE__ */ jsxs("div", { className: "nqp-pb", children: [
      list.map((c) => /* @__PURE__ */ jsxs("button", { type: "button", className: "nqp-row", onClick: () => {
        c.run();
        onClose();
      }, children: [
        /* @__PURE__ */ jsxs("span", { className: "nqp-rowmain", children: [
          /* @__PURE__ */ jsx("span", { className: "nqp-rowtitle", children: c.label }),
          c.note ? /* @__PURE__ */ jsx("span", { className: "nqp-line-sub", children: c.note }) : null
        ] }),
        c.key ? /* @__PURE__ */ jsx(Kbd, { children: c.key }) : null
      ] }, c.label)),
      !list.length ? /* @__PURE__ */ jsx("div", { className: "nqp-empty", children: "No matching commands." }) : null
    ] })
  ] });
}
function NavDrawer({ open, onClose, items, current, width }) {
  return /* @__PURE__ */ jsxs(
    "aside",
    {
      className: "nqp-sheet",
      "data-side": "left",
      "data-open": open ? "true" : "false",
      style: { width: width ? `${width}px` : void 0 },
      role: "dialog",
      "aria-modal": "true",
      "aria-label": "Navigation",
      "aria-hidden": !open,
      children: [
        /* @__PURE__ */ jsxs("header", { className: "nqp-sh", children: [
          /* @__PURE__ */ jsx("span", { className: "nqp-brand", style: { color: "var(--vq-text)" }, children: "VenQore" }),
          /* @__PURE__ */ jsx("span", { style: { flex: 1 } }),
          /* @__PURE__ */ jsx("button", { type: "button", className: "nqp-iconbtn", "aria-label": "Close", onClick: onClose, children: "✕" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "nqp-pb", children: items.map((n) => /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            className: "nqp-navitem",
            "aria-current": n.id === current ? "true" : void 0,
            onClick: () => {
              if (n.url) window.location.href = n.url;
              onClose();
            },
            children: [
              /* @__PURE__ */ jsx("span", { "aria-hidden": true, style: { width: 20, textAlign: "center" }, children: n.glyph }),
              n.label
            ]
          },
          n.id
        )) })
      ]
    }
  );
}
function SettingsDrawer({
  open,
  onClose,
  prefs = DEFAULTS,
  setPrefs,
  width,
  warehouses = [],
  banks = [],
  taxRates = [],
  onOpenLayoutPicker,
  onOpenSetupWizard
}) {
  const setOps = (opsPatch) => setPrefs?.((p) => ({ ...p, ops: { ...p.ops, ...opsPatch } }));
  const setPerm = (key, val) => setPrefs?.((p) => ({ ...p, perms: { ...p.perms, [key]: val } }));
  const setRail = (rail) => setPrefs?.((p) => ({ ...p, rail }));
  const setRankMode = (rankMode) => setPrefs?.((p) => ({ ...p, ops: { ...p.ops, rankMode } }));
  const onReset = () => setPrefs?.({
    ...DEFAULTS,
    comp: presetComposition("column"),
    ops: { ...DEFAULT_OPS },
    perms: { ...DEFAULT_PERMS }
  });
  const effectiveWarehouses = warehouses.length ? warehouses : [{ id: 1, name: "Main store" }];
  const effectiveBanks = banks.length ? banks : [{ id: 1, name: "Main bank" }];
  const effectiveTaxRates = taxRates.length ? taxRates : [
    { id: 0, label: "No tax (0%)", rate: 0 },
    { id: 1, label: "GST (18%)", rate: 18 },
    { id: 2, label: "GST (5%)", rate: 5 }
  ];
  const currentPreset = prefs?.preset || "column";
  const currentProfile = prefs?.profile || "retail";
  return /* @__PURE__ */ jsx(
    Sheet,
    {
      open,
      onClose,
      title: "Register Settings",
      size: "wide",
      style: { width: width ? `${width}px` : void 0 },
      footer: /* @__PURE__ */ jsxs("div", { className: "nqp-actions", children: [
        /* @__PURE__ */ jsx("button", { type: "button", className: "nqp-cta", "data-ghost": "true", onClick: onReset, children: "Reset to Defaults" }),
        /* @__PURE__ */ jsx("button", { type: "button", className: "nqp-cta", onClick: onClose, children: "Done" })
      ] }),
      children: /* @__PURE__ */ jsxs("div", { className: "nqp-clean-settings-wrap", children: [
        /* @__PURE__ */ jsxs("div", { className: "nqp-look-card", children: [
          /* @__PURE__ */ jsx("div", { className: "look-card-top", children: /* @__PURE__ */ jsxs("div", { className: "look-card-info", children: [
            /* @__PURE__ */ jsx("span", { className: "look-eyebrow", children: "POS LOOK & LAYOUT" }),
            /* @__PURE__ */ jsxs("h3", { className: "look-title", children: [
              currentPreset.toUpperCase(),
              " Layout · ",
              prefs?.auto ? "Auto Mode" : "Manual"
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "look-desc", children: [
              "Profile: ",
              /* @__PURE__ */ jsx("b", { children: currentProfile }),
              " · Rail: ",
              /* @__PURE__ */ jsx("b", { children: prefs?.rail ? "Visible" : "Hidden" }),
              " · Senior Mode: ",
              /* @__PURE__ */ jsx("b", { children: prefs?.ops?.senior ? "On" : "Off" })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxs("div", { className: "look-card-actions", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                className: "nqp-look-btn primary",
                onClick: () => {
                  onClose?.();
                  onOpenLayoutPicker?.();
                },
                children: "🎨 Want to change your look? Click here"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                className: "nqp-look-btn secondary",
                onClick: () => {
                  onClose?.();
                  onOpenSetupWizard?.();
                },
                children: "✨ Run Setup Wizard"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "nqp-setgroup", children: [
          /* @__PURE__ */ jsx("h3", { children: "Display & Interface" }),
          /* @__PURE__ */ jsx(
            Switch,
            {
              label: "Large text mode (Senior mode)",
              note: "Enlarges typography and figures for faster counter reading.",
              value: Boolean(prefs?.ops?.senior),
              onChange: (v) => setOps({ senior: v })
            }
          ),
          /* @__PURE__ */ jsx(
            Switch,
            {
              label: "Navigation rail",
              note: "Show the icon navigation sidebar beside the register.",
              value: Boolean(prefs?.rail),
              onChange: setRail
            }
          ),
          /* @__PURE__ */ jsx(
            Seg,
            {
              label: "Interface scale",
              value: prefs?.ops?.uiScale || 1,
              options: [0.9, 1, 1.15, 1.25],
              labels: ["Compact 90%", "Normal 100%", "Large 115%", "Extra 125%"],
              onPick: (v) => setOps({ uiScale: v })
            }
          ),
          /* @__PURE__ */ jsx(
            Switch,
            {
              label: "Show control ranks",
              note: "Outlines controls by operational rank: teal = act, blue = adjust, grey = configure.",
              value: Boolean(prefs?.ops?.rankMode),
              onChange: setRankMode
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "nqp-setgroup", children: [
          /* @__PURE__ */ jsx("h3", { children: "Checkout & Hardware" }),
          /* @__PURE__ */ jsx(
            Switch,
            {
              label: "Auto-print receipt on complete",
              note: "Automatically prints thermal receipt when sale is finalized.",
              value: Boolean(prefs?.ops?.autoPrint),
              onChange: (v) => setOps({ autoPrint: v })
            }
          ),
          /* @__PURE__ */ jsx(
            Switch,
            {
              label: "Open cash drawer on cash sale",
              note: "Sends electronic kick pulse to cash drawer on cash tender.",
              value: Boolean(prefs?.ops?.openDrawerOnCash),
              onChange: (v) => setOps({ openDrawerOnCash: v })
            }
          ),
          /* @__PURE__ */ jsx(
            Switch,
            {
              label: "Auto-fill exact cash",
              note: "Pre-fills tendered amount with invoice total for faster cashout.",
              value: Boolean(prefs?.ops?.autoFillCash),
              onChange: (v) => setOps({ autoFillCash: v })
            }
          ),
          /* @__PURE__ */ jsx(
            Switch,
            {
              label: "Round off invoice total",
              note: "Rounds invoice total to the nearest whole rupee.",
              value: Boolean(prefs?.ops?.roundOff),
              onChange: (v) => setOps({ roundOff: v })
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "nqp-setgroup", children: [
          /* @__PURE__ */ jsx("h3", { children: "Sales & Return Policy" }),
          /* @__PURE__ */ jsx(
            Seg,
            {
              label: "Return mode policy",
              value: prefs?.ops?.returnPolicy || "reference",
              options: RETURN_POLICIES.map((p) => p.id),
              labels: RETURN_POLICIES.map((p) => p.label),
              onPick: (v) => setOps({ returnPolicy: v }),
              note: RETURN_POLICIES.find((p) => p.id === prefs?.ops?.returnPolicy)?.note
            }
          ),
          /* @__PURE__ */ jsx(
            Seg,
            {
              label: "Return window",
              value: prefs?.ops?.returnWindowDays || 14,
              options: [7, 14, 30, 0],
              labels: ["7 days", "14 days", "30 days", "No limit"],
              onPick: (v) => setOps({ returnWindowDays: v })
            }
          ),
          /* @__PURE__ */ jsx(
            Switch,
            {
              label: "Show profit margin",
              note: "Displays profit margin percentage on selected item line.",
              value: Boolean(prefs?.ops?.showMargin),
              onChange: (v) => setOps({ showMargin: v })
            }
          ),
          /* @__PURE__ */ jsx(
            Switch,
            {
              label: "Allow overselling (Negative stock)",
              note: "Permits completing a sale even when product inventory is 0 or less.",
              value: Boolean(prefs?.ops?.allowOversell),
              onChange: (v) => setOps({ allowOversell: v })
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "nqp-setgroup", children: [
          /* @__PURE__ */ jsx("h3", { children: "Locations & Accounts" }),
          /* @__PURE__ */ jsx(
            Seg,
            {
              label: "Default store location / warehouse",
              value: prefs?.ops?.warehouse || effectiveWarehouses[0]?.id || 1,
              options: effectiveWarehouses.map((w) => w.id),
              labels: effectiveWarehouses.map((w) => w.name),
              onPick: (v) => setOps({ warehouse: v })
            }
          ),
          /* @__PURE__ */ jsx(
            Seg,
            {
              label: "Deposit non-cash payments to",
              value: prefs?.ops?.bank || effectiveBanks[0]?.id || 1,
              options: effectiveBanks.map((b) => b.id),
              labels: effectiveBanks.map((b) => (b.name || "").split(" — ")[0]),
              onPick: (v) => setOps({ bank: v })
            }
          ),
          /* @__PURE__ */ jsx(
            Seg,
            {
              label: "Default tax rate",
              value: prefs?.ops?.defaultTax || 0,
              options: effectiveTaxRates.map((t) => t.id),
              labels: effectiveTaxRates.map((t) => t.label),
              onPick: (v) => setOps({ defaultTax: v })
            }
          ),
          /* @__PURE__ */ jsx(
            Seg,
            {
              label: "Prices are displayed",
              value: prefs?.ops?.taxMode || "exclusive",
              options: ["exclusive", "inclusive"],
              labels: ["Tax on top (Exclusive)", "Tax included (Inclusive)"],
              onPick: (v) => setOps({ taxMode: v })
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "nqp-setgroup", children: [
          /* @__PURE__ */ jsx("h3", { children: "Cashier Permissions" }),
          /* @__PURE__ */ jsx(
            Switch,
            {
              label: "Void a line item",
              value: Boolean(prefs?.perms?.["pos.void_item"]),
              onChange: (v) => setPerm("pos.void_item", v)
            }
          ),
          /* @__PURE__ */ jsx(
            Switch,
            {
              label: "Run a return / refund",
              value: Boolean(prefs?.perms?.["pos.refund"]),
              onChange: (v) => setPerm("pos.refund", v)
            }
          ),
          /* @__PURE__ */ jsx(
            Switch,
            {
              label: "Override unit price",
              value: Boolean(prefs?.perms?.["pos.price_override"]),
              onChange: (v) => setPerm("pos.price_override", v)
            }
          ),
          /* @__PURE__ */ jsx(
            Switch,
            {
              label: "Apply custom discount",
              value: Boolean(prefs?.perms?.["pos.discount"]),
              onChange: (v) => setPerm("pos.discount", v)
            }
          ),
          /* @__PURE__ */ jsx(
            Switch,
            {
              label: "Open cash drawer manually",
              value: Boolean(prefs?.perms?.["pos.open_drawer"]),
              onChange: (v) => setPerm("pos.open_drawer", v)
            }
          )
        ] })
      ] })
    }
  );
}
function LayoutPickerModal({
  open,
  onClose,
  prefs = DEFAULTS,
  setPrefs
}) {
  if (!open) return null;
  const availablePresets = presets();
  const [selectedPreset, setSelectedPreset] = useState(prefs?.preset || "column");
  const [autoMode, setAutoMode] = useState(Boolean(prefs?.auto));
  const [selectedProfile, setSelectedProfile] = useState(prefs?.profile || "retail");
  const [navRail, setNavRail] = useState(prefs?.rail ?? true);
  const [seniorMode, setSeniorMode] = useState(Boolean(prefs?.ops?.senior));
  const handlePresetSelect = (presetId) => {
    setSelectedPreset(presetId);
    setAutoMode(false);
  };
  const handleProfileSelect = (profileId) => {
    setSelectedProfile(profileId);
    setAutoMode(true);
    const match = PROFILES.find((p) => p.id === profileId);
    if (match) {
      setSelectedPreset(match.family.desk || "column");
    }
  };
  const handleApply = () => {
    const comp = presetComposition(selectedPreset);
    setPrefs?.((prev) => ({
      ...prev,
      auto: autoMode,
      profile: selectedProfile,
      preset: selectedPreset,
      comp,
      rail: navRail,
      ops: {
        ...prev.ops || {},
        senior: seniorMode
      }
    }));
    onClose?.();
  };
  const activePresetObj = availablePresets.find((p) => p.id === selectedPreset) || availablePresets[1];
  return /* @__PURE__ */ jsx("div", { className: "nqp-wizard-overlay", role: "dialog", "aria-modal": "true", "aria-label": "Customize POS Look and Layout", children: /* @__PURE__ */ jsxs("div", { className: "nqp-wizard-modal nqp-layout-picker-modal", children: [
    /* @__PURE__ */ jsxs("div", { className: "nqp-wizard-header", children: [
      /* @__PURE__ */ jsxs("div", { className: "nqp-wizard-brand-badge", children: [
        /* @__PURE__ */ jsx("span", { className: "sparkle-icon", children: "🎨" }),
        /* @__PURE__ */ jsx("span", { children: "POS Layout & Appearance Customizer" })
      ] }),
      /* @__PURE__ */ jsx("h2", { children: "Choose how you want your POS screen arranged" }),
      /* @__PURE__ */ jsx("p", { className: "nqp-wizard-subtitle", children: "Select a starting point layout. Every layout adapts responsively according to the Layout Law." })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "nqp-wizard-body", children: /* @__PURE__ */ jsxs("div", { className: "nqp-layout-picker-grid", children: [
      /* @__PURE__ */ jsxs("div", { className: "nqp-layout-controls-col", children: [
        /* @__PURE__ */ jsxs("div", { className: "nqp-mode-box", children: [
          /* @__PURE__ */ jsxs("div", { className: "mode-toggle-row", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("b", { children: autoMode ? "🤖 Auto Mode (Recommended)" : "🛠️ Manual Layout" }),
              /* @__PURE__ */ jsx("p", { className: "mode-desc", children: autoMode ? "Automatically picks the best geometry for your device screen size." : "Keeps your selected starting point fixed across screen sizes." })
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                className: `nqp-pill-toggle ${autoMode ? "active" : ""}`,
                onClick: () => setAutoMode(!autoMode),
                children: autoMode ? "Auto: ON" : "Auto: OFF"
              }
            )
          ] }),
          autoMode ? /* @__PURE__ */ jsxs("div", { className: "nqp-auto-profile-picker", children: [
            /* @__PURE__ */ jsx("span", { className: "picker-lbl", children: "Select your business counter profile:" }),
            /* @__PURE__ */ jsx("div", { className: "profile-chips", children: PROFILES.map((p) => /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                className: `profile-chip ${selectedProfile === p.id ? "active" : ""}`,
                onClick: () => handleProfileSelect(p.id),
                children: /* @__PURE__ */ jsx("b", { children: p.name })
              },
              p.id
            )) })
          ] }) : null
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "nqp-preset-selector-section", children: [
          /* @__PURE__ */ jsx("span", { className: "section-eyebrow", children: "STARTING POINTS" }),
          /* @__PURE__ */ jsx("div", { className: "nqp-preset-buttons-list", children: availablePresets.map((p) => {
            const isSelected = selectedPreset === p.id;
            return /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                className: `nqp-preset-option-btn ${isSelected ? "active" : ""}`,
                onClick: () => handlePresetSelect(p.id),
                children: [
                  /* @__PURE__ */ jsxs("div", { className: "preset-opt-hdr", children: [
                    /* @__PURE__ */ jsx("b", { children: p.name }),
                    isSelected ? /* @__PURE__ */ jsx("span", { className: "check-tag", children: "✓ Active" }) : null
                  ] }),
                  /* @__PURE__ */ jsx("span", { className: "preset-opt-tagline", children: p.tagline })
                ]
              },
              p.id
            );
          }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "nqp-layout-preview-col", children: [
        /* @__PURE__ */ jsxs("div", { className: "preview-title-bar", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "eyebrow", children: "LIVE PREVIEW" }),
            /* @__PURE__ */ jsxs("h3", { children: [
              activePresetObj?.name || "Layout",
              " Layout"
            ] })
          ] }),
          /* @__PURE__ */ jsx("span", { className: "preview-for-tag", children: activePresetObj?.for })
        ] }),
        /* @__PURE__ */ jsx(
          LayoutPreviewShell,
          {
            preset: selectedPreset,
            rail: navRail,
            senior: seniorMode,
            className: "picker-embedded-preview"
          }
        ),
        activePresetObj?.why ? /* @__PURE__ */ jsxs("div", { className: "nqp-layout-why-box", children: [
          /* @__PURE__ */ jsx("b", { children: "Why this layout:" }),
          " ",
          activePresetObj.why
        ] }) : null,
        /* @__PURE__ */ jsxs("div", { className: "nqp-preview-quick-switches", children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              className: "quick-switch-item",
              onClick: () => setNavRail(!navRail),
              "aria-pressed": navRail,
              children: [
                /* @__PURE__ */ jsx("span", { className: `nqp-checkbox ${navRail ? "checked" : ""}`, children: /* @__PURE__ */ jsx("span", { className: "nqp-checkbox-tick" }) }),
                /* @__PURE__ */ jsx("span", { children: "Navigation Rail" })
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              className: "quick-switch-item",
              onClick: () => setSeniorMode(!seniorMode),
              "aria-pressed": seniorMode,
              children: [
                /* @__PURE__ */ jsx("span", { className: `nqp-checkbox ${seniorMode ? "checked" : ""}`, children: /* @__PURE__ */ jsx("span", { className: "nqp-checkbox-tick" }) }),
                /* @__PURE__ */ jsx("span", { children: "Large Text Mode" })
              ]
            }
          )
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "nqp-wizard-footer", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          className: "nqp-wizard-btn secondary",
          onClick: onClose,
          children: "Cancel"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          className: "nqp-wizard-btn primary success",
          onClick: handleApply,
          children: "✨ Apply Layout to Register"
        }
      )
    ] })
  ] }) });
}
function ApprovalSheet({ request, storeSlug, onSubmit, onClose, busy = false, narrow }) {
  const open = !!request;
  const [approvers, setApprovers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [pinState, setPinState] = useState({ req: request, value: "" });
  const pin = pinState.req === request ? pinState.value : "";
  const setPin = (value) => setPinState({ req: request, value });
  useEffect(() => {
    let cancelled = false;
    axios.get(`/s/${storeSlug}/sales/approvers`).then((res) => {
      if (!cancelled) setApprovers(res.data?.approvers || []);
    }).catch(() => {
      if (!cancelled) {
        setApprovers([]);
        setLoadError("Could not load approvers.");
      }
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [storeSlug]);
  const options = useMemo(() => approverOptions(approvers, request), [approvers, request]);
  const selected = options.find((o) => o.user_id === selectedId) || null;
  const lines = describeApprovalLines(request, (v) => `PKR ${n0(v)}`);
  const canSubmit = !!selected && !selected.disabled && (!selected.needsPin || pin.length > 0) && !busy;
  const submit = () => {
    if (canSubmit) onSubmit({ approvedBy: selected.user_id, pin: selected.needsPin ? pin : "" });
  };
  return /* @__PURE__ */ jsxs(
    Sheet,
    {
      open,
      onClose: busy ? () => {
      } : onClose,
      title: "Manager approval",
      subtitle: request?.reasons?.includes("below_cost") ? "Sale below cost" : "Discount over your limit",
      size: narrow ? "bottom" : "side",
      footer: /* @__PURE__ */ jsxs("div", { className: "nqp-actions", children: [
        /* @__PURE__ */ jsx("button", { type: "button", className: "nqp-cta", "data-ghost": "true", disabled: busy, onClick: onClose, children: "Cancel" }),
        /* @__PURE__ */ jsx("button", { type: "button", className: "nqp-cta", disabled: !canSubmit, onClick: submit, children: busy ? "Approving…" : "Approve & complete" })
      ] }),
      children: [
        lines.map((text, i) => /* @__PURE__ */ jsx("div", { className: "nqp-row", "data-static": "true", children: /* @__PURE__ */ jsx("span", { className: "nqp-rowmain", children: /* @__PURE__ */ jsx("span", { className: "nqp-line-sub", children: text }) }) }, i)),
        loading && /* @__PURE__ */ jsx("div", { className: "nqp-row", "data-static": "true", children: /* @__PURE__ */ jsx("span", { className: "nqp-line-sub", children: "Loading approvers…" }) }),
        !loading && options.length === 0 && /* @__PURE__ */ jsx("div", { className: "nqp-row", "data-static": "true", children: /* @__PURE__ */ jsx("span", { className: "nqp-line-sub", children: loadError || "No owner, admin or manager in this store." }) }),
        !loading && options.map((o) => /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            className: "nqp-row",
            "aria-pressed": selectedId === o.user_id,
            disabled: !!o.disabled || busy,
            onClick: () => {
              setSelectedId(o.user_id);
              setPin("");
            },
            style: selectedId === o.user_id ? { background: "var(--vq-surface-2)", boxShadow: "inset 3px 0 0 var(--vq-accent-fill)" } : void 0,
            children: /* @__PURE__ */ jsxs("span", { className: "nqp-rowmain", children: [
              /* @__PURE__ */ jsxs("span", { className: "nqp-rowtitle", children: [
                o.name,
                o.is_self ? " (you)" : ""
              ] }),
              /* @__PURE__ */ jsx("span", { className: "nqp-line-sub", style: { textTransform: "capitalize" }, children: o.disabled ? `${o.role} · ${o.disabled}` : o.role })
            ] })
          },
          o.user_id
        )),
        selected?.needsPin && /* @__PURE__ */ jsxs("div", { className: "nqp-field", children: [
          /* @__PURE__ */ jsxs("label", { htmlFor: "nqp-approval-pin", children: [
            selected.name,
            "'s PIN"
          ] }),
          /* @__PURE__ */ jsx(
            "input",
            {
              id: "nqp-approval-pin",
              type: "password",
              inputMode: "numeric",
              autoComplete: "off",
              maxLength: 20,
              value: pin,
              "data-sheet-focus": true,
              onChange: (e) => setPin(e.target.value.replace(/\s/g, "")),
              onKeyDown: (e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submit();
                }
              }
            }
          )
        ] }),
        request?.approvalError && /* @__PURE__ */ jsx("div", { className: "nqp-row", "data-static": "true", role: "alert", children: /* @__PURE__ */ jsx("span", { className: "nqp-line-sub", style: { color: "var(--vq-danger)", fontWeight: 700 }, children: request.approvalError }) })
      ]
    }
  );
}
const HUES = ["teal", "sky", "lime", "coral", "butter", "plum"];
const NAV = [
  { id: "sell", label: "Sell", glyph: "🛍", url: "/pos" },
  { id: "inv", label: "Inventory", glyph: "📦", url: "/inventory" },
  { id: "sales", label: "Sales", glyph: "🧾", url: "/sales" },
  { id: "parties", label: "Parties", glyph: "👥", url: "/parties" },
  { id: "reports", label: "Reports", glyph: "📊", url: "/reports" },
  { id: "accounting", label: "Ledger", glyph: "🏛", url: "/accounts" }
];
const TABLES = [
  { id: "T1", zone: "Hall", seats: 2, status: "free" },
  { id: "T2", zone: "Hall", seats: 2, status: "seated", guests: 2, since: "18 min", bill: 1840 },
  { id: "T3", zone: "Hall", seats: 4, status: "free" },
  { id: "T4", zone: "Hall", seats: 4, status: "seated", guests: 4, since: "42 min", bill: 6120 },
  { id: "T5", zone: "Hall", seats: 4, status: "billed", guests: 3, since: "1 h 04", bill: 4390 },
  { id: "T6", zone: "Hall", seats: 6, status: "free" },
  { id: "T7", zone: "Terrace", seats: 6, status: "seated", guests: 6, since: "9 min", bill: 980 },
  { id: "T8", zone: "Terrace", seats: 2, status: "free" }
];
let uidSeq = 1;
const uid = () => `u${uidSeq += 1}`;
const idemKey = () => `POS-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
function newLine(product, qty = 1, variant = null) {
  const base = Number(variant ? variant.price : product.price);
  const cost = Number(variant ? variant.cost_price ?? product.cost_price ?? 0 : product.cost_price ?? 0);
  const stock = Number(variant ? variant.stock ?? variant.stock_quantity ?? product.stock_quantity ?? product.stock ?? 999 : product.stock_quantity ?? product.stock ?? 999);
  return {
    u: uid(),
    id: product.id,
    product_id: product.id,
    variant_id: variant ? variant.id : null,
    name: variant ? `${product.name} (${variant.name})` : product.name,
    sku: variant?.sku || product.sku || "",
    qty,
    price: base,
    basePrice: base,
    cost,
    stock,
    tax: Number(product.tax_rate ?? product.tax ?? 0),
    unit: product.base_unit || product.unit || "pc",
    batch: product.batch || null,
    freeQty: 0,
    discount: { mode: "pct", value: 0 },
    note: "",
    overridden: false,
    image_url: product.image_url || null,
    hue: HUES[(product.id || 0) % HUES.length]
  };
}
function newTab(seq = 1, ops = {}, defaultParty = null, defaultWarehouse = 1, defaultTaxRate = 0, defaultTaxMode = "exclusive") {
  return {
    id: uid(),
    seq,
    party: defaultParty || { id: 0, name: "Walk-in customer", phone: "", balance: 0, discount: 0, walkin: true },
    lines: [],
    discount: { mode: "pct", value: 0 },
    taxRate: defaultTaxRate,
    taxMode: defaultTaxMode,
    charges: [],
    notes: "",
    warehouse: defaultWarehouse,
    fulfilment: "local",
    method: "Cash",
    tendered: 0,
    tenderTouched: false,
    splits: [],
    bank: null,
    overpay: "change",
    isReturn: false,
    returnRef: null,
    idem: idemKey(),
    docNo: `POS-${seq}`
  };
}
function NewPos({
  recalledSale = null,
  bankAccounts = [],
  warehouses = [],
  ecommerceChannels = [],
  settings = {},
  defaultCustomer = null,
  store = null,
  auth = {}
}) {
  const tt = useTermText();
  const storeSlug = store?.slug || (typeof window !== "undefined" ? window.location.pathname.split("/")[2] : "") || "";
  const userId = auth?.user?.id ? `u_${auth.user.id}` : "default";
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("vq-theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    }
    return "light";
  });
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", theme === "dark");
      localStorage.setItem("vq-theme", theme);
    }
  }, [theme]);
  const toggleTheme = useCallback(() => {
    setTheme((prev) => prev === "dark" ? "light" : "dark");
  }, []);
  const parsedTaxRates = useMemo(() => {
    let list = [];
    try {
      if (settings?.tax_rates) {
        const parsed = typeof settings.tax_rates === "string" ? JSON.parse(settings.tax_rates) : settings.tax_rates;
        if (Array.isArray(parsed)) list = parsed.map((t, idx) => ({ id: idx + 1, label: `${t.name || "Tax"} (${t.rate}%)`, rate: Number(t.rate) }));
      }
    } catch (_) {
    }
    if (!list.length) {
      list = [
        { id: 0, label: "No tax", rate: 0 },
        { id: 1, label: "GST 18%", rate: 18 },
        { id: 2, label: "GST 5%", rate: 5 },
        { id: 3, label: `${tt("Services")} 15%`, rate: 15 }
      ];
    }
    if (!list.some((t) => t.rate === 0)) list.unshift({ id: 0, label: "No tax", rate: 0 });
    return list;
  }, [settings?.tax_rates]);
  const defaultTaxRate = Number(settings?.default_tax_rate ?? 0);
  const defaultTaxMode = settings?.tax_type === "inclusive" ? "inclusive" : "exclusive";
  const walkInCustomer = useMemo(() => {
    if (defaultCustomer) {
      return {
        id: defaultCustomer.id,
        name: defaultCustomer.name,
        phone: defaultCustomer.phone || "",
        balance: Number(defaultCustomer.current_balance || defaultCustomer.balance || 0),
        discount: Number(defaultCustomer.default_discount || 0),
        credit: Number(defaultCustomer.credit_limit || 0),
        walkin: true
      };
    }
    return { id: 0, name: "Walk-in customer", phone: "", balance: 0, discount: 0, walkin: true };
  }, [defaultCustomer]);
  const defaultWarehouseId = warehouses[0]?.id || 1;
  const [categories, setCategories] = useState([{ id: "all", name: "All items" }]);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [catFilter, setCatFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [catalogSearch, setCatalogSearch] = useState("");
  const searchTimeout = useRef(null);
  useEffect(() => {
    const url = storeSlug ? route("store.pos.categories", { store_slug: storeSlug }) : "/pos/categories";
    axios.get(url).then((res) => {
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      const formatted = data.map((c) => ({ id: c.id, name: c.name, count: c.product_count }));
      setCategories([{ id: "all", name: "All items" }, ...formatted]);
    }).catch(() => {
    });
  }, [storeSlug]);
  const fetchFeatured = useCallback(() => {
    setLoadingProducts(true);
    const url = storeSlug ? route("store.pos.featured", { store_slug: storeSlug }) : "/pos/products/featured";
    axios.get(url).then((res) => {
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setProducts(data);
    }).catch(() => setProducts([])).finally(() => setLoadingProducts(false));
  }, [storeSlug]);
  useEffect(() => {
    fetchFeatured();
  }, [fetchFeatured]);
  const performSearch = useCallback((query = "", catId = "all") => {
    if (!query.trim() && catId === "all") {
      fetchFeatured();
      return;
    }
    setLoadingProducts(true);
    const url = storeSlug ? route("store.pos.search", { store_slug: storeSlug }) : "/pos/products";
    axios.get(url, { params: { q: query, category_id: catId !== "all" ? catId : void 0 } }).then((res) => {
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setProducts(data);
    }).catch(() => setProducts([])).finally(() => setLoadingProducts(false));
  }, [fetchFeatured, storeSlug]);
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      performSearch(search, catFilter);
    }, 250);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [search, catFilter, performSearch]);
  const [banks, setBanks] = useState(() => bankAccounts.length ? bankAccounts : [
    { id: 1, name: "Bank Transfer / POS Card", code: "BANK" }
  ]);
  const [prefs, setPrefs] = useState(() => loadPrefs(userId));
  useEffect(() => savePrefs(userId, prefs), [prefs, userId]);
  const vp = useViewport();
  const [fractions, setFractions] = useState({});
  const composition = useMemo(() => {
    if (prefs?.auto) {
      const { comp } = autoComposition(prefs?.profile || "retail", vp.w, vp.h);
      return comp;
    }
    return prefs?.comp || presetComposition(prefs?.preset || "column");
  }, [prefs?.auto, prefs?.profile, prefs?.comp, prefs?.preset, vp.w, vp.h]);
  const T = useMemo(() => {
    const spec = { ...composition || presetComposition("column") };
    return composeTerminal(spec, vp.w, vp.h, {
      scale: prefs?.ops?.uiScale || 1,
      margin: marginAt(vp.w),
      senior: Boolean(prefs?.ops?.senior),
      rail: Boolean(prefs?.rail)
    });
  }, [composition, fractions, prefs?.ops?.senior, prefs?.ops?.uiScale, prefs?.rail, vp.h, vp.w]);
  const getFrac = useCallback((leftKey, rightKey) => fractions[`${leftKey}_${rightKey}`] ?? 0.5, [fractions]);
  const setFrac = useCallback((leftKey, rightKey, f) => {
    setFractions((prev) => ({ ...prev, [`${leftKey}_${rightKey}`]: f }));
  }, []);
  const [tabs, setTabs] = useState(() => {
    if (recalledSale) {
      const lines = (recalledSale.items || []).map((item) => ({
        u: uid(),
        id: item.product_id,
        product_id: item.product_id,
        variant_id: item.variant_id || item.product_variant_id || null,
        name: item.product?.name || item.name || "Item",
        sku: item.productVariant?.sku || item.product?.sku || item.sku || "",
        price: Number(item.price || item.unit_price || 0),
        basePrice: Number(item.product?.price || item.price || 0),
        cost: Number(item.product?.cost_price || item.cost_price || 0),
        stock: Number(item.product?.stocks?.reduce((a, s) => a + (Number(s.quantity) || 0), 0) || 99),
        tax: Number(item.product?.tax_rate ?? 0),
        unit: item.product?.base_unit || "pc",
        image_url: item.product?.image_path || item.product?.image_url || null,
        qty: Number(item.quantity || 1),
        freeQty: Number(item.free_quantity || 0),
        discount: { mode: item.discount_type === "percentage" ? "pct" : "amt", value: Number(item.discount || 0) },
        note: item.note || "",
        hue: HUES[(item.product_id || 0) % HUES.length]
      }));
      const recTab = {
        ...newTab(1, prefs.ops, recalledSale.customer || walkInCustomer, defaultWarehouseId, defaultTaxRate, defaultTaxMode),
        lines,
        notes: recalledSale.notes || "",
        discount: { mode: recalledSale.discount_type === "percentage" ? "pct" : "amt", value: Number(recalledSale.discount || 0) },
        taxRate: Number(recalledSale.tax_rate ?? defaultTaxRate),
        docNo: recalledSale.invoice_number || `INV-${recalledSale.id}`
      };
      return [recTab];
    }
    return [newTab(1, prefs.ops, walkInCustomer, defaultWarehouseId, defaultTaxRate, defaultTaxMode)];
  });
  const [active, setActive] = useState(0);
  const [sel, setSel] = useState(-1);
  const tab = tabs[active] || tabs[0];
  const patchTab = useCallback((patch) => {
    setTabs((ts) => ts.map((t, i) => i === active ? { ...t, ...patch } : t));
  }, [active]);
  const [sheet, setSheet] = useState(null);
  const [approval, setApproval] = useState(null);
  const [approvalBusy, setApprovalBusy] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [setupWizardOpen, setSetupWizardOpen] = useState(() => !prefs?.wizardCompleted);
  const [layoutPickerOpen, setLayoutPickerOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [variantPicker, setVariantPicker] = useState(null);
  const [completedSale, setCompletedSale] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [table, setTable] = useState(null);
  const [online, setOnline] = useState(true);
  const [queue, setQueue] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("pos_offline_queue") || "[]");
    } catch (_) {
      return [];
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("pos_offline_queue", JSON.stringify(queue));
    } catch (_) {
    }
  }, [queue]);
  const [toasts, setToasts] = useState([]);
  const toast = useCallback((text, opts = {}) => {
    const t = { id: `t${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, text, tone: opts.tone || "info", action: opts.action, onAction: opts.onAction };
    setToasts((ts) => [...ts.slice(-3), t]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== t.id)), opts.ms || 3400);
  }, []);
  const onToastAction = useCallback((t) => {
    t.onAction?.();
    setToasts((ts) => ts.filter((x) => x.id !== t.id));
  }, []);
  const handleApplyWizard = useCallback((newPrefs) => {
    setPrefs(newPrefs);
    toast("✨ Register layout configured! You can customize this anytime in Settings.", { tone: "good", ms: 5e3 });
  }, [toast]);
  const searchRef = useRef(null);
  useEffect(() => {
    if (!recalledSale) {
      const saved = loadRescue(userId);
      if (saved?.tabs?.length && saved.tabs.some((t) => t.lines?.length)) {
        setTabs(saved.tabs);
        toast("Restored active cart from your last session.", { tone: "good", ms: 4e3 });
      }
    }
  }, []);
  useEffect(() => {
    const id = setTimeout(() => saveRescue(userId, tabs), 500);
    return () => clearTimeout(id);
  }, [tabs, userId]);
  const syncOfflineQueue = useCallback(async () => {
    if (!online || !queue.length) return;
    const pending = queue.filter((q) => q.state !== "error");
    for (const item of pending) {
      try {
        const url = storeSlug ? route("store.sales.store", { store_slug: storeSlug }) : "/sales";
        const res = await axios.post(url, item.payload);
        if (res.data?.success) {
          setQueue((prev) => prev.filter((q) => q.id !== item.id));
          toast(`Offline sale ${item.id} posted successfully.`, { tone: "good" });
        }
      } catch (err) {
        setQueue((prev) => prev.map((q) => q.id === item.id ? { ...q, state: "error", why: err.response?.data?.message || "Server rejected" } : q));
      }
    }
  }, [online, queue, storeSlug, toast]);
  useEffect(() => {
    if (online && queue.some((q) => q.state === "pending" || q.state === "syncing")) {
      const timer = setTimeout(syncOfflineQueue, 1500);
      return () => clearTimeout(timer);
    }
    return void 0;
  }, [online, queue, syncOfflineQueue]);
  const m = useMemo(() => {
    const lines = tab.lines;
    const gross = lines.reduce((a, l) => a + l.qty * l.price + (l.freeQty || 0) * l.price, 0);
    const lineDisc = lines.reduce((a, l) => a + lineDiscount(l), 0);
    const sub = Math.max(0, gross - lineDisc);
    const docDisc = tab.discount.mode === "pct" ? sub * Math.min(100, Math.max(0, tab.discount.value || 0)) / 100 : Math.min(sub, Math.max(0, tab.discount.value || 0));
    const taxable = Math.max(0, sub - docDisc);
    const charges = (tab.charges || []).reduce((a, c) => a + (Number(c.amount) || 0), 0);
    let tax = 0;
    if (tab.taxRate > 0) {
      if (tab.taxMode === "inclusive") {
        tax = Math.round((taxable - taxable / (1 + tab.taxRate / 100)) * 100) / 100;
      } else {
        tax = Math.round(taxable * tab.taxRate / 100 * 100) / 100;
      }
    }
    const unrounded = tab.taxMode === "inclusive" ? taxable + charges : taxable + tax + charges;
    const total = prefs?.ops?.roundOff ? Math.round(unrounded) : Math.round(unrounded * 100) / 100;
    const round = total - unrounded;
    return {
      gross,
      lineDisc,
      sub,
      docDisc,
      charges,
      tax,
      total,
      round,
      count: lines.reduce((a, l) => a + l.qty, 0),
      taxLabel: tab.taxRate > 0 ? `${tab.taxRate}%` : "0%",
      taxMode: tab.taxMode
    };
  }, [tab.charges, tab.discount, tab.lines, tab.taxMode, tab.taxRate, prefs?.ops?.roundOff]);
  const change = tab.tendered > 0 ? tab.tendered - m.total : 0;
  const addProduct = useCallback((product, variant = null) => {
    if (!variant && product.has_variants && product.variants?.length) {
      setVariantPicker(product);
      return;
    }
    const isService = product.type === "service" || product.is_service || product.item_type === "service";
    const stock = isService ? 999999 : Number(variant ? variant.stock ?? variant.stock_quantity ?? product.stock_quantity ?? product.stock : product.stock_quantity ?? product.stock ?? 999);
    if (!isService && stock <= 0 && settings?.prevent_negative_stock === "1") {
      toast(`"${product.name}" is out of stock.`, { tone: "bad" });
      return;
    }
    setTabs((ts) => ts.map((t, i) => {
      if (i !== active) return t;
      const targetSku = variant ? variant.sku : product.sku;
      const existingIdx = t.lines.findIndex((l) => (variant ? l.variant_id === variant.id : l.product_id === product.id && !l.variant_id) || targetSku && l.sku === targetSku);
      if (existingIdx >= 0) {
        const lines = [...t.lines];
        lines[existingIdx] = { ...lines[existingIdx], qty: lines[existingIdx].qty + 1 };
        return { ...t, lines };
      }
      return { ...t, lines: [newLine(product, 1, variant), ...t.lines] };
    }));
    setSel(0);
    toast(`Added ${variant ? `${product.name} (${variant.name})` : product.name}`, { tone: "good", ms: 1600 });
  }, [active, settings?.prevent_negative_stock, toast]);
  const removeLine = useCallback((line) => {
    patchTab({ lines: tab.lines.filter((l) => l.u !== line.u) });
    setSel(-1);
  }, [patchTab, tab.lines]);
  const patchLine = useCallback((line, patch) => {
    patchTab({ lines: tab.lines.map((l) => l.u === line.u ? { ...l, ...patch } : l) });
  }, [patchTab, tab.lines]);
  const onSearchKey = async (e) => {
    if (e.key === "Enter") {
      const query = search.trim();
      if (!query) return;
      try {
        const url = storeSlug ? route("store.pos.barcode", { store_slug: storeSlug, code: query }) : `/pos/barcode/${query}`;
        const res = await axios.get(url);
        if (res.data?.found && res.data?.product) {
          const prod = res.data.product;
          const variant = res.data.variant_id ? prod.variants?.find((v) => v.id === res.data.variant_id) : null;
          addProduct(prod, variant);
          setSearch("");
          return;
        }
      } catch (_) {
      }
      if (products.length === 1) {
        addProduct(products[0]);
        setSearch("");
      } else if (products.length > 1) {
        setCatalogSearch(query);
        setSheet("catalog");
      } else {
        toast(`No product found for "${query}".`, { tone: "bad" });
      }
    }
    if (e.key === "Escape") setSearch("");
  };
  const openDrawer = useCallback(() => {
    if (!prefs?.perms?.["pos.open_drawer"]) {
      toast("Your role may not open the cash drawer.", { tone: "bad" });
      return;
    }
    if (PrintService.isAMDStationAvailable?.()) {
      PrintService.printWithAMDStation({}, settings, { openDrawer: true });
    }
    toast("Cash drawer opened.", { tone: "good" });
  }, [prefs?.perms, settings, toast]);
  const holdSale = useCallback(async () => {
    if (!tab.lines.length) {
      toast("Nothing to hold. Cart is empty.", { tone: "bad" });
      return;
    }
    try {
      const url = storeSlug ? route("store.sales.park", { store_slug: storeSlug }) : "/sales/park";
      await axios.post(url, {
        cart_data: JSON.stringify(tab.lines),
        customer_id: tab.party?.id && !tab.party.walkin ? tab.party.id : null,
        notes: tab.notes || "",
        total_amount: m.total
      });
      toast("Sale held in Parked. You can recall it anytime.", { tone: "good" });
    } catch (_) {
      toast("Saved to local hold queue.", { tone: "good" });
    }
    patchTab({
      lines: [],
      notes: "",
      charges: [],
      discount: { mode: "pct", value: 0 },
      tendered: 0,
      tenderTouched: false,
      splits: [],
      isReturn: false,
      returnRef: null
    });
    setSel(-1);
  }, [m.total, patchTab, storeSlug, tab.lines, tab.notes, tab.party?.id, tab.party?.walkin, toast]);
  const complete = useCallback(async (opts = {}) => {
    if (!tab.lines.length) {
      toast("Cart is empty. Add products to complete sale.", { tone: "bad" });
      return false;
    }
    const ch = (tab.tendered || m.total) - m.total;
    if (tab.splits.length) {
      const paid = tab.splits.reduce((a, x) => a + (Number(x.amount) || 0), 0);
      if (paid + 0.5 < m.total) {
        toast(`Split covers PKR ${n0(paid)} of ${n0(m.total)}. Add the rest.`, { tone: "bad" });
        setSheet("split");
        return false;
      }
    } else if (!tab.isReturn && tab.method === "Cash" && ch < -0.5) {
      toast(`Short by PKR ${n0(Math.abs(ch))}.`, { tone: "bad" });
      return false;
    }
    if (!opts.skipOverpay && !tab.isReturn && !tab.splits.length && tab.method === "Cash" && ch > 0.5) {
      setSheet("overpay");
      return false;
    }
    const asChange = (opts.overpay || tab.overpay) !== "ledger";
    const payload = {
      customer_id: tab.party?.id && !tab.party.walkin ? tab.party.id : null,
      sale_date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
      items: tab.lines.map((l) => ({
        product_id: l.product_id || l.id,
        variant_id: l.variant_id || null,
        quantity: Number(l.qty),
        free_quantity: Number(l.freeQty || 0),
        price: Number(l.price),
        discount: Number(lineDiscount(l)),
        discount_type: l.discount?.mode === "pct" ? "percentage" : "fixed",
        tax_rate: Number(l.tax ?? tab.taxRate ?? 0),
        serials: l.serials || []
      })),
      payment_method: tab.splits.length > 1 ? "split" : (tab.method || "Cash").toLowerCase(),
      payment_account_id: tab.bank || null,
      payments: tab.splits.length > 1 ? tab.splits.map((s) => ({
        method: s.method.toLowerCase(),
        amount: Number(s.amount),
        bank_account_id: s.bank || null
      })) : [{
        method: (tab.method || "Cash").toLowerCase(),
        amount: Math.min(Number(tab.tendered || m.total), Number(m.total)),
        bank_account_id: tab.bank || null
      }],
      amount_paid: Number(tab.tendered || m.total),
      discount: Number(m.docDisc || 0),
      discount_type: tab.discount?.mode === "pct" ? "percentage" : "fixed",
      tax: Number(m.tax || 0),
      tax_rate: Number(tab.taxRate || 0),
      tax_inclusive: tab.taxMode === "inclusive",
      delivery_charge: Number(tab.charges?.find((c) => /delivery|shipping/i.test(c.label))?.amount || 0),
      extra_charge_value: Number(tab.charges?.filter((c) => !/delivery|shipping/i.test(c.label)).reduce((a, c) => a + Number(c.amount || 0), 0)),
      extra_charge_label: tab.charges?.filter((c) => !/delivery|shipping/i.test(c.label)).map((c) => c.label).join(", ") || null,
      add_to_ledger: opts.overpay === "ledger" || tab.overpay === "ledger",
      notes: tab.notes || null,
      warehouse_id: tab.warehouse || defaultWarehouseId,
      idempotency_key: tab.idem || idemKey(),
      source: "pos"
    };
    if (!online) {
      const offlineSale = {
        id: `Q-${Date.now().toString().slice(-4)}`,
        at: (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        total: m.total,
        lines: tab.lines.length,
        state: "pending",
        why: "Offline — saved to local queue",
        payload
      };
      setQueue((qs) => [...qs, offlineSale]);
      toast(`Saved offline (${offlineSale.id}). Will sync when connected.`, { tone: "good", ms: 5e3 });
    } else {
      try {
        const url = storeSlug ? route("store.sales.store", { store_slug: storeSlug }) : "/sales";
        const res = await axios.post(url, withApproval(payload, opts.approval));
        setApproval(null);
        const recordedSale = res.data?.sale || {
          id: res.data?.sale_id || Date.now(),
          invoice_number: res.data?.reference || `INV-${Date.now()}`,
          total: m.total,
          amount_paid: tab.tendered || m.total,
          change: ch > 0 ? ch : 0,
          payment_method: tab.method || "Cash",
          customer: tab.party,
          items: tab.lines
        };
        toast(`Sale ${recordedSale.invoice_number || ""} completed & posted to ledger.`, { tone: "good", ms: 4e3 });
        if (prefs?.ops?.openDrawerOnCash && tab.method === "Cash" && asChange) {
          openDrawer();
        }
        if (prefs?.ops?.autoPrint || settings?.auto_print_receipt === "1") {
          const printType = settings?.default_print_type || "thermal";
          setTimeout(() => PrintService.quickPrint(recordedSale, printType, settings), 300);
        }
        setCompletedSale(recordedSale);
        fetchFeatured();
      } catch (err) {
        const approvalInfo = parseApprovalRequired(err);
        if (approvalInfo) {
          setApproval({ info: approvalInfo, opts: { ...opts, skipOverpay: true } });
          return false;
        }
        setApproval(null);
        const errorMsg = err.response?.data?.message || err.response?.data?.errors?.customer_id?.[0] || "Checkout failed. Please review values.";
        toast(errorMsg, { tone: "bad", ms: 5e3 });
        return false;
      }
    }
    const tabId = tab.id;
    setTabs((ts) => ts.map((t) => t.id === tabId ? { ...newTab(t.seq, prefs.ops, walkInCustomer, defaultWarehouseId, defaultTaxRate, defaultTaxMode), party: t.party, warehouse: t.warehouse } : t));
    setSel(-1);
    clearRescue(userId);
    return true;
  }, [defaultTaxMode, defaultTaxRate, defaultWarehouseId, fetchFeatured, m.docDisc, m.tax, m.total, online, openDrawer, patchTab, prefs.ops, settings, storeSlug, tab, toast, userId, walkInCustomer]);
  const addTab = useCallback(() => {
    setTabs((ts) => [...ts, newTab(ts.length + 1, prefs.ops, walkInCustomer, defaultWarehouseId, defaultTaxRate, defaultTaxMode)]);
    setActive(tabs.length);
    setSel(-1);
  }, [defaultTaxMode, defaultTaxRate, defaultWarehouseId, prefs.ops, tabs.length, walkInCustomer]);
  const closeTab = useCallback((i) => {
    if (tabs.length === 1) {
      patchTab({
        lines: [],
        notes: "",
        charges: [],
        discount: { mode: "pct", value: 0 },
        tendered: 0,
        tenderTouched: false,
        splits: []
      });
      setSel(-1);
      return;
    }
    setTabs((ts) => ts.filter((_, j) => j !== i));
    setActive((a) => Math.max(0, a >= i ? a - 1 : a));
    setSel(-1);
  }, [patchTab, tabs.length]);
  const cancelSale = useCallback(() => {
    patchTab({
      lines: [],
      notes: "",
      charges: [],
      discount: { mode: "pct", value: 0 },
      tendered: 0,
      tenderTouched: false,
      splits: [],
      isReturn: false,
      returnRef: null
    });
    setSel(-1);
    toast("Active sale cleared.");
  }, [patchTab, toast]);
  const recallParked = useCallback(async (parked) => {
    try {
      const url = storeSlug ? route("store.sales.recall", { store_slug: storeSlug, id: parked.id }) : `/sales/parked/${parked.id}`;
      const res = await axios.get(url);
      const saleData = res.data?.sale || res.data;
      const items = typeof saleData.cart_data === "string" ? JSON.parse(saleData.cart_data || "[]") : saleData.items || [];
      patchTab({
        lines: items.map((it) => ({
          u: uid(),
          id: it.product_id || it.id,
          product_id: it.product_id || it.id,
          variant_id: it.variant_id || null,
          name: it.name || it.product?.name || "Item",
          sku: it.sku || "",
          qty: Number(it.quantity || it.qty || 1),
          price: Number(it.price || it.unit_price || 0),
          basePrice: Number(it.price || 0),
          cost: Number(it.cost || 0),
          stock: 99,
          tax: Number(it.tax || 0),
          unit: it.unit || "pc",
          freeQty: Number(it.freeQty || 0),
          discount: it.discount || { mode: "pct", value: 0 },
          note: it.note || "",
          hue: HUES[(it.product_id || 0) % HUES.length]
        })),
        party: saleData.customer ? {
          id: saleData.customer.id,
          name: saleData.customer.name,
          phone: saleData.customer.phone || "",
          balance: Number(saleData.customer.balance || 0),
          discount: Number(saleData.customer.default_discount || 0),
          credit: Number(saleData.customer.credit_limit || 0),
          walkin: false
        } : walkInCustomer,
        notes: saleData.notes || ""
      });
      toast(`Recalled held sale #${parked.reference_number || parked.id}`, { tone: "good" });
    } catch (_) {
      toast("Could not recall held sale.", { tone: "bad" });
    }
  }, [patchTab, storeSlug, toast, walkInCustomer]);
  const anyOverlay = Boolean(sheet || settingsOpen || setupWizardOpen || layoutPickerOpen || paletteOpen || navOpen || confirm || variantPicker || completedSale);
  useEffect(() => {
    const typing = () => {
      const el = document.activeElement;
      if (!el) return false;
      if (el.dataset && el.dataset.scan === "true") return false;
      return el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable;
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (completedSale) setCompletedSale(null);
        else if (setupWizardOpen) setSetupWizardOpen(false);
        else if (layoutPickerOpen) setLayoutPickerOpen(false);
        else if (variantPicker) setVariantPicker(null);
        else if (confirm) setConfirm(null);
        else if (paletteOpen) setPaletteOpen(false);
        else if (settingsOpen) setSettingsOpen(false);
        else if (sheet) setSheet(null);
        else if (navOpen) setNavOpen(false);
        else if (sel >= 0) setSel(-1);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
        return;
      }
      if (anyOverlay) return;
      const line = sel >= 0 ? tab.lines[sel] : null;
      const withLine = (fn) => {
        if (line) fn(line);
        else toast("Select a line first — Ctrl+1…9, or tap it.");
      };
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "Tab") {
          e.preventDefault();
          setActive((a) => (a + 1) % tabs.length);
          return;
        }
        if (/^[1-9]$/.test(e.key)) {
          e.preventDefault();
          setSel(Math.min(tab.lines.length - 1, Number(e.key) - 1));
          return;
        }
        const k = e.key.toLowerCase();
        if (k === "s" || k === "p") {
          e.preventDefault();
          complete();
        } else if (k === "n") {
          e.preventDefault();
          if (complete()) addTab();
        } else if (k === "d") {
          e.preventDefault();
          setSheet("party");
        } else if (k === "t") {
          e.preventDefault();
          addTab();
        } else if (k === "w") {
          e.preventDefault();
          closeTab(active);
        } else if (k === "f") {
          e.preventDefault();
          setSheet("breakup");
        }
        return;
      }
      switch (e.key) {
        case "F1":
          e.preventDefault();
          searchRef.current?.focus();
          break;
        case "F2":
        case "F3":
        case "F5":
        case "F6":
          e.preventDefault();
          withLine(() => setSheet("line"));
          break;
        case "F4":
          e.preventDefault();
          withLine((l) => removeLine(l));
          break;
        case "F7":
          e.preventDefault();
          setSheet("tax");
          break;
        case "F8":
          e.preventDefault();
          setSheet("charges");
          break;
        case "F9":
          e.preventDefault();
          setSheet("discount");
          break;
        case "F11":
          e.preventDefault();
          setSheet("party");
          break;
        case "F12":
          e.preventDefault();
          setSheet("notes");
          break;
        case "?":
          if (!typing()) {
            e.preventDefault();
            setSheet("keys");
          }
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, anyOverlay, closeTab, complete, confirm, navOpen, paletteOpen, sel, setSel, settingsOpen, sheet, tab.lines, tabs.length, toast, variantPicker, completedSale, addTab]);
  const tabLabel = (t) => {
    if (t.isReturn) return `Return #${t.seq}`;
    if (t.party && !t.party.walkin) return `${t.party.name.split(" ")[0]} (#${t.seq})`;
    return `Sale #${t.seq}`;
  };
  const renderTile = (p) => /* @__PURE__ */ jsxs(
    "button",
    {
      type: "button",
      className: "nqp-tile",
      "data-rank": "1",
      onClick: () => addProduct(p),
      children: [
        /* @__PURE__ */ jsxs("div", { className: "nqp-tile-head", children: [
          /* @__PURE__ */ jsx("span", { className: "nqp-sw", style: { background: HUE_VAR[HUES[(p.id || 0) % HUES.length]] }, children: p.image_url ? /* @__PURE__ */ jsx("img", { src: p.image_url, alt: p.name, style: { width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" } }) : /* @__PURE__ */ jsx("span", { style: { fontSize: 16 }, children: "📦" }) }),
          /* @__PURE__ */ jsxs("span", { className: "nqp-tile-pr num", children: [
            "PKR ",
            n0(p.price)
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "nqp-tile-body", children: [
          /* @__PURE__ */ jsx("span", { className: "nqp-tile-name", children: p.name }),
          /* @__PURE__ */ jsxs("span", { className: "nqp-tile-sub", children: [
            p.sku,
            " · ",
            p.stock_quantity ?? p.stock ?? 0,
            " in stock"
          ] })
        ] }),
        tab.lines.some((l) => l.product_id === p.id) ? /* @__PURE__ */ jsx("span", { className: "nqp-tile-badge", children: tab.lines.filter((l) => l.product_id === p.id).reduce((a, l) => a + l.qty, 0) }) : null
      ]
    },
    p.id
  );
  const renderCatalogFilters = () => /* @__PURE__ */ jsx("div", { className: "nqp-catchips", children: categories.map((c) => /* @__PURE__ */ jsxs(
    "button",
    {
      type: "button",
      className: "nqp-catchip",
      "aria-pressed": catFilter === c.id,
      onClick: () => setCatFilter(c.id),
      children: [
        c.name,
        " ",
        c.count !== void 0 ? `(${c.count})` : ""
      ]
    },
    c.id
  )) });
  const renderCatalogBody = (tiles) => /* @__PURE__ */ jsxs("div", { style: { padding: 10, display: "flex", flexDirection: "column", gap: 10, height: "100%", overflowY: "auto" }, children: [
    renderCatalogFilters(),
    loadingProducts ? /* @__PURE__ */ jsx("div", { className: "nqp-empty", children: "Loading catalogue…" }) : null,
    !loadingProducts && !products.length ? /* @__PURE__ */ jsx("div", { className: "nqp-empty", children: "No products match your filter." }) : null,
    /* @__PURE__ */ jsx("div", { className: "nqp-grid", style: { gridTemplateColumns: `repeat(${tiles || 3}, minmax(0, 1fr))` }, children: products.map(renderTile) })
  ] });
  const renderCartBody = (fit) => /* @__PURE__ */ jsxs("div", { className: "nqp-lines", "data-fit": fit, children: [
    tab.lines.map((l, i) => {
      const isSel = i === sel;
      const net = l.qty * l.price - lineDiscount(l);
      return /* @__PURE__ */ jsxs(
        "div",
        {
          className: "nqp-line",
          "data-sel": isSel ? "true" : void 0,
          onClick: () => setSel(i),
          children: [
            /* @__PURE__ */ jsx("span", { className: "nqp-sw", style: { background: HUE_VAR[l.hue || "teal"] }, children: l.image_url ? /* @__PURE__ */ jsx("img", { src: l.image_url, alt: l.name, style: { width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" } }) : /* @__PURE__ */ jsx("span", { style: { fontSize: 13 }, children: "📦" }) }),
            /* @__PURE__ */ jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
              /* @__PURE__ */ jsxs("div", { className: "nqp-line-head", children: [
                /* @__PURE__ */ jsx("span", { className: "nqp-line-name", children: l.name }),
                /* @__PURE__ */ jsxs("span", { className: "nqp-line-tot num", children: [
                  "PKR ",
                  n0(net)
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "nqp-line-sub", children: [
                l.qty,
                " ",
                l.unit,
                " × ",
                n0(l.price),
                lineDiscount(l) > 0 ? ` · -${n0(lineDiscount(l))} off` : "",
                l.freeQty > 0 ? ` · +${l.freeQty} bonus` : ""
              ] })
            ] }),
            /* @__PURE__ */ jsx(
              Stepper,
              {
                value: l.qty,
                onChange: (q) => {
                  if (q <= 0) removeLine(l);
                  else patchLine(l, { qty: q });
                }
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                className: "nqp-line-del",
                "aria-label": "Remove item",
                onClick: (e) => {
                  e.stopPropagation();
                  removeLine(l);
                },
                children: "✕"
              }
            )
          ]
        },
        l.u
      );
    }),
    !tab.lines.length ? /* @__PURE__ */ jsxs("div", { className: "nqp-empty", children: [
      /* @__PURE__ */ jsx("span", { style: { fontSize: 32, opacity: 0.4, display: "block", marginBottom: 8 }, children: "🛒" }),
      "Cart is empty. Scan a barcode or tap items to add."
    ] }) : null
  ] });
  const taxLabel = parsedTaxRates.find((t) => t.rate === tab.taxRate)?.label || `${tab.taxRate}%`;
  const renderTenderBody = (fit, w, full) => {
    const avail = Math.max(90, w - 40 - 110);
    return /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("button", { type: "button", className: "nqp-party", "data-rank": "1", onClick: () => setSheet("party"), children: [
        /* @__PURE__ */ jsx("span", { className: "nqp-avatar", children: tab.party?.name ? tab.party.name[0].toUpperCase() : "W" }),
        /* @__PURE__ */ jsxs("span", { style: { flex: 1, minWidth: 0, textAlign: "left" }, children: [
          /* @__PURE__ */ jsx("span", { className: "nqp-line-name", style: { display: "block" }, children: tab.party?.name || "Walk-in Customer" }),
          /* @__PURE__ */ jsx("span", { className: "nqp-line-sub", children: tab.party?.walkin ? "Walk-in cash customer" : `${tab.party?.phone || "No phone"} · Balance: PKR ${n0(tab.party?.balance || 0)}${tab.party?.discount ? ` · ${tab.party.discount}% discount` : ""}` })
        ] }),
        w > 300 ? /* @__PURE__ */ jsx(Kbd, { children: "F11" }) : null
      ] }),
      [
        ["Subtotal", m.sub],
        ["Discount", -m.docDisc],
        [`Tax ${taxLabel}${tab.taxMode === "inclusive" ? " (included)" : ""}`, m.tax],
        m.charges ? ["Charges", m.charges] : null,
        m.round ? ["Round off", m.round] : null
      ].filter(Boolean).map(([k, v]) => /* @__PURE__ */ jsxs("div", { className: "nqp-tot", children: [
        /* @__PURE__ */ jsx("span", { className: "k", children: k }),
        /* @__PURE__ */ jsx(Money, { value: v, font: 15, avail, className: "v" })
      ] }, k)),
      /* @__PURE__ */ jsxs("div", { className: "nqp-field", children: [
        /* @__PURE__ */ jsx("label", { htmlFor: `nqp-tendered-${full ? "sheet" : "col"}`, children: "Amount tendered (PKR)" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            id: `nqp-tendered-${full ? "sheet" : "col"}`,
            className: "num",
            inputMode: "decimal",
            "data-rank": "1",
            value: tab.tendered ? n0(tab.tendered) : "",
            placeholder: n0(m.total),
            onChange: (e) => patchTab({ tendered: Number(e.target.value.replace(/[^\d.]/g, "")) || 0, tenderTouched: true })
          }
        )
      ] }),
      full ? /* @__PURE__ */ jsx("div", { className: "nqp-keypad", children: ["1", "2", "3", "⌫", "4", "5", "6", "C", "7", "8", "9", "00", "+500", "+1000", "0", "Exact"].map((k) => /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: () => {
            const cur = String(Math.round(tab.tendered) || "");
            let next = cur;
            if (k === "⌫") next = cur.slice(0, -1);
            else if (k === "C") next = "";
            else if (k === "Exact") next = String(Math.max(0, Math.round(m.total)));
            else if (k === "+500") next = String((Number(cur) || 0) + 500);
            else if (k === "+1000") next = String((Number(cur) || 0) + 1e3);
            else next = cur + k;
            patchTab({ tendered: Number(next) || 0, tenderTouched: true });
          },
          children: k
        },
        k
      )) }) : null,
      /* @__PURE__ */ jsxs("div", { className: "nqp-fields", children: [
        /* @__PURE__ */ jsxs("button", { type: "button", className: "nqp-fchip", "data-rank": "2", onClick: () => setSheet("method"), children: [
          /* @__PURE__ */ jsx("span", { className: "nqp-fk", children: "Method" }),
          /* @__PURE__ */ jsx("span", { className: "nqp-fv", children: tab.splits.length ? "Split" : tab.method })
        ] }),
        /* @__PURE__ */ jsxs("button", { type: "button", className: "nqp-fchip", "data-rank": "2", "data-set": tab.discount.value ? "true" : void 0, onClick: () => setSheet("discount"), children: [
          /* @__PURE__ */ jsx("span", { className: "nqp-fk", children: "Discount F9" }),
          /* @__PURE__ */ jsx("span", { className: "nqp-fv", children: tab.discount.value ? tab.discount.mode === "pct" ? `${tab.discount.value}%` : n0(tab.discount.value) : "—" })
        ] }),
        /* @__PURE__ */ jsxs("button", { type: "button", className: "nqp-fchip", "data-rank": "2", onClick: () => setSheet("tax"), children: [
          /* @__PURE__ */ jsx("span", { className: "nqp-fk", children: "Tax F7" }),
          /* @__PURE__ */ jsxs("span", { className: "nqp-fv", children: [
            taxLabel,
            tab.taxMode === "inclusive" ? " inc" : ""
          ] })
        ] }),
        /* @__PURE__ */ jsxs("button", { type: "button", className: "nqp-fchip", "data-rank": "2", onClick: () => setSheet("location"), children: [
          /* @__PURE__ */ jsx("span", { className: "nqp-fk", children: "Location" }),
          /* @__PURE__ */ jsx("span", { className: "nqp-fv", children: (warehouses.find((x) => x.id === tab.warehouse)?.name || "Main store").split(" — ")[0] })
        ] }),
        /* @__PURE__ */ jsxs("button", { type: "button", className: "nqp-fchip", "data-rank": "2", "data-set": tab.charges.length ? "true" : void 0, onClick: () => setSheet("charges"), children: [
          /* @__PURE__ */ jsx("span", { className: "nqp-fk", children: "Charges F8" }),
          /* @__PURE__ */ jsx("span", { className: "nqp-fv", children: m.charges ? n0(m.charges) : "—" })
        ] }),
        /* @__PURE__ */ jsxs("button", { type: "button", className: "nqp-fchip", "data-rank": "2", "data-set": tab.notes ? "true" : void 0, onClick: () => setSheet("notes"), children: [
          /* @__PURE__ */ jsx("span", { className: "nqp-fk", children: "Remarks F12" }),
          /* @__PURE__ */ jsx("span", { className: "nqp-fv", children: tab.notes ? "set" : "—" })
        ] }),
        tab.method !== "Cash" || tab.splits.length ? /* @__PURE__ */ jsxs("button", { type: "button", className: "nqp-fchip", "data-rank": "2", onClick: () => setSheet("bank"), children: [
          /* @__PURE__ */ jsx("span", { className: "nqp-fk", children: "Deposit to" }),
          /* @__PURE__ */ jsx("span", { className: "nqp-fv", children: (banks.find((b) => b.id === tab.bank)?.name || banks[0]?.name || "Bank").split(" — ")[0] })
        ] }) : null
      ] })
    ] });
  };
  const renderTenderFooter = (w, fit, full) => {
    const stacked = w < 360;
    const rowW = w - 48;
    const amountAvail = (stacked ? rowW : rowW * 0.5) - 100;
    const showAmount = amountAvail >= 80;
    const totalFont = full || fit === "full" ? 32 : fit === "compact" ? 26 : 22;
    return /* @__PURE__ */ jsxs("div", { className: "nqp-pf", children: [
      /* @__PURE__ */ jsxs("div", { className: "nqp-tot nqp-grand", children: [
        /* @__PURE__ */ jsx("span", { className: "k", children: tab.isReturn ? "Refund" : "Total" }),
        /* @__PURE__ */ jsx("button", { type: "button", "data-rank": "2", title: "Tap for breakdown (Ctrl+F)", onClick: () => setSheet("breakup"), style: { minWidth: 0 }, children: /* @__PURE__ */ jsx(Money, { value: m.total, font: totalFont, avail: Math.max(90, w - 40 - 74), ccy: "PKR", className: "v" }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "nqp-tot", style: { paddingTop: 4, paddingBottom: 4 }, children: [
        /* @__PURE__ */ jsx("span", { className: "k", children: "Change" }),
        /* @__PURE__ */ jsx(
          Money,
          {
            value: change,
            font: 15,
            avail: Math.max(80, w - 150),
            className: "v",
            style: { color: change >= 0 ? "var(--vq-success)" : "var(--vq-danger)" }
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "nqp-actions", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            className: "nqp-cta",
            "data-rank": "1",
            style: { flex: stacked ? "1 0 100%" : 2 },
            onClick: () => complete(),
            children: [
              /* @__PURE__ */ jsx("span", { children: tab.isReturn ? "Refund" : "Complete (Ctrl+S)" }),
              showAmount ? /* @__PURE__ */ jsx(Money, { value: m.total, font: 15, avail: amountAvail }) : null
            ]
          }
        ),
        /* @__PURE__ */ jsx("button", { type: "button", className: "nqp-cta", "data-ghost": "true", "data-rank": "1", onClick: holdSale, children: "Hold" }),
        /* @__PURE__ */ jsx("button", { type: "button", className: "nqp-cta", "data-ghost": "true", "data-rank": "2", disabled: !prefs?.perms?.["pos.open_drawer"], onClick: openDrawer, children: "Drawer" })
      ] })
    ] });
  };
  const renderFloorBody = (per) => /* @__PURE__ */ jsx("div", { style: { display: "grid", gap: 10, padding: 12, gridTemplateColumns: `repeat(${Math.max(1, per)}, minmax(0,1fr))` }, children: TABLES.map((t) => {
    const busy = t.status !== "free";
    return /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        className: "nqp-tile",
        "data-rank": "1",
        style: {
          height: per > 1 ? 96 : 58,
          borderColor: busy ? "var(--vq-accent)" : void 0,
          background: busy ? "var(--vq-accent-quiet)" : void 0
        },
        onClick: () => {
          setTable(t);
          setSheet(null);
          toast(`Selected Table ${t.id} (${t.zone})`);
        },
        children: [
          /* @__PURE__ */ jsx("span", { style: { fontFamily: "var(--vq-font-numeric)", fontSize: 18, fontWeight: 700 }, children: t.id }),
          /* @__PURE__ */ jsx("span", { className: "nqp-line-sub", children: t.status === "free" ? `${t.seats} seats` : `${t.guests || 2} guests · ${t.since}` }),
          busy && t.bill ? /* @__PURE__ */ jsxs("span", { className: "nqp-tile-pr", children: [
            "PKR ",
            n0(t.bill)
          ] }) : null
        ]
      },
      t.id
    );
  }) });
  const cat = T?.catalog;
  const cols = [];
  if (cat && cat.mode === "left") cols.push(["catalog", cat.px]);
  if (T?.floor && T.floor.mode === "left") cols.push(["floor", T.floor.px]);
  if (T?.cart) cols.push(["cart", T.cart.px]);
  if (T?.tender && T.tender.mode === "column") cols.push(["tender", T.tender.px]);
  if (cat && cat.mode === "right") cols.push(["catalog", cat.px]);
  const qtyTotal = (tab.lines || []).reduce((a, l) => a + (l.qty || 0), 0);
  const railW = Math.round(T?.railW || 0);
  const dock = T?.dock || [];
  const dockCarriesActions = dock.length > 0 && T?.tender?.mode !== "column" && vp.w >= 620;
  const dockExtras = dock.filter((d) => d.id !== "tender").length + (dockCarriesActions ? 2 : 0);
  const tenderInline = dock.some((d) => d.id === "tender" && d.inline);
  const dockTight = vp.w < 560 && dock.length > 1;
  const showDockTotal = tenderInline && !dockTight;
  const dockSlots = (showDockTotal ? 1 : 0) + (dock.length ? 1 : 0) + dockExtras;
  const dockPool = Math.max(120, (T?.avail || vp.w) - 20 - 10 * Math.max(0, dockSlots - 1));
  const dockWeights = (showDockTotal ? 1.6 : 0) + 2.2 + dockExtras;
  const dockTotalAvail = Math.max(60, dockPool * 1.6 / dockWeights - 14);
  const dockPayAvail = Math.max(60, dockPool * 2.2 / dockWeights - 96);
  const renderPane = (key, px) => {
    if (key === "catalog") {
      return /* @__PURE__ */ jsx(Pane, { title: "Catalogue", width: px, extra: /* @__PURE__ */ jsxs("span", { className: "mono", children: [
        products.length,
        " items"
      ] }), children: renderCatalogBody(cat.tiles) }, "catalog");
    }
    if (key === "floor") {
      return /* @__PURE__ */ jsx(Pane, { title: tt("Tables"), width: px, extra: /* @__PURE__ */ jsxs("span", { className: "mono", children: [
        TABLES.filter((t) => t.status !== "free").length,
        " active"
      ] }), children: renderFloorBody(T.floor.fit === "map" ? 2 : 1) }, "floor");
    }
    if (key === "tender") {
      return /* @__PURE__ */ jsx(
        Pane,
        {
          title: tab.isReturn ? "Refund" : "Payment",
          width: px,
          footer: renderTenderFooter(px, T.tender.fit, false),
          children: renderTenderBody(T.tender.fit, px, false)
        },
        "tender"
      );
    }
    return /* @__PURE__ */ jsx(
      Pane,
      {
        title: tab.isReturn ? "Return Items" : "Sale Cart",
        width: px,
        minWidth: T.cart.underflow ? T.cart.minWidth : void 0,
        extra: /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs("span", { className: "mono", children: [
            tab.lines.length,
            " lines · ",
            qtyTotal,
            " qty"
          ] }),
          tab.lines.length ? /* @__PURE__ */ jsx("button", { type: "button", className: "nqp-adjbtn", "data-rank": "2", onClick: cancelSale, style: { marginLeft: 8 }, children: "Clear" }) : null
        ] }),
        footer: T?.tender?.mode !== "column" && !dockCarriesActions ? /* @__PURE__ */ jsx("div", { className: "nqp-pf", children: /* @__PURE__ */ jsxs("div", { className: "nqp-actions", children: [
          /* @__PURE__ */ jsx("button", { type: "button", className: "nqp-cta", "data-ghost": "true", "data-rank": "1", onClick: holdSale, children: "Hold" }),
          /* @__PURE__ */ jsx("button", { type: "button", className: "nqp-cta", "data-ghost": "true", "data-rank": "2", disabled: !prefs?.perms?.["pos.open_drawer"], onClick: openDrawer, children: "Drawer" })
        ] }) }) : null,
        children: renderCartBody(T?.cart?.fit || "full")
      },
      "cart"
    );
  };
  const commands = [
    { label: "New sale tab", key: "Ctrl+T", run: addTab },
    { label: "Complete sale", key: "Ctrl+S", run: complete },
    { label: "Hold this sale", run: holdSale },
    { label: "Parked sales", run: () => setSheet("parked") },
    { label: "Recent invoices", run: () => setSheet("recent") },
    { label: "Start a return", run: () => setSheet("return") },
    { label: "Open cash drawer", run: openDrawer },
    { label: "Bill breakdown", key: "Ctrl+F", run: () => setSheet("breakup") },
    { label: "Document discount", key: "F9", run: () => setSheet("discount") },
    { label: "Additional charges", key: "F8", run: () => setSheet("charges") },
    { label: "Sale remarks", key: "F12", run: () => setSheet("notes") },
    { label: "New customer", key: "Ctrl+D", run: () => setSheet("party") },
    { label: "Offline queue", run: () => setSheet("offline") },
    { label: "Keyboard map", key: "?", run: () => setSheet("keys") },
    { label: "Register settings", run: () => setSettingsOpen(true) },
    { label: "Change POS look & layout", run: () => setLayoutPickerOpen(true) },
    { label: "Run setup wizard", run: () => setSetupWizardOpen(true) },
    { label: "Back to Dashboard", run: () => {
      window.location.href = storeSlug ? `/s/${storeSlug}/dashboard` : "/dashboard";
    } }
  ];
  const narrow = vp.w < 768;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Head, { title: "VenQore POS — Register" }),
    /* @__PURE__ */ jsxs(
      "div",
      {
        className: "nqp",
        "data-theme": theme,
        "data-rankmode": prefs?.ops?.rankMode ? "true" : void 0,
        "data-senior": prefs?.ops?.senior ? "true" : "false",
        style: { "--nqp-scale": prefs?.ops?.uiScale || 1, "--nqp-margin": `${Math.round(marginAt(vp.w))}px` },
        children: [
          railW > 0 ? /* @__PURE__ */ jsxs("nav", { className: "nqp-rail", style: { width: railW }, "data-rank": "2", "aria-label": "Sections", children: [
            NAV.map((n) => /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                className: "nqp-railicon",
                "aria-label": n.label,
                title: n.label,
                "aria-current": n.id === "sell" ? "true" : void 0,
                onClick: () => {
                  if (n.id !== "sell" && n.url) {
                    window.location.href = storeSlug ? `/s/${storeSlug}${n.url}` : n.url;
                  }
                },
                children: n.glyph
              },
              n.id
            )),
            /* @__PURE__ */ jsx("span", { className: "nqp-rail-sp" }),
            /* @__PURE__ */ jsx("button", { type: "button", className: "nqp-railicon", "aria-label": "Register settings", "data-rank": "3", onClick: () => setSettingsOpen(true), children: /* @__PURE__ */ jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
              /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: "3" }),
              /* @__PURE__ */ jsx("path", { d: "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" })
            ] }) })
          ] }) : null,
          /* @__PURE__ */ jsxs("div", { className: "nqp-main", children: [
            /* @__PURE__ */ jsxs("header", { className: "nqp-bar", children: [
              /* @__PURE__ */ jsx(Icon, { label: "Menu", rank: "2", title: "Navigation menu", onClick: () => setNavOpen(true), children: /* @__PURE__ */ jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
                /* @__PURE__ */ jsx("line", { x1: "3", y1: "12", x2: "21", y2: "12" }),
                /* @__PURE__ */ jsx("line", { x1: "3", y1: "6", x2: "21", y2: "6" }),
                /* @__PURE__ */ jsx("line", { x1: "3", y1: "18", x2: "21", y2: "18" })
              ] }) }),
              /* @__PURE__ */ jsx(
                Icon,
                {
                  label: "Dashboard",
                  rank: "2",
                  onClick: () => {
                    window.location.href = storeSlug ? `/s/${storeSlug}/dashboard` : "/dashboard";
                  },
                  children: /* @__PURE__ */ jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
                    /* @__PURE__ */ jsx("line", { x1: "19", y1: "12", x2: "5", y2: "12" }),
                    /* @__PURE__ */ jsx("polyline", { points: "12 19 5 12 12 5" })
                  ] })
                }
              ),
              vp.w >= 560 ? /* @__PURE__ */ jsxs("span", { className: "nqp-brand", children: [
                /* @__PURE__ */ jsxs("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [
                  /* @__PURE__ */ jsx("rect", { width: "24", height: "24", rx: "6", fill: "url(#vq-logo-grad)" }),
                  /* @__PURE__ */ jsx("path", { d: "M7 8L12 17L17 8", stroke: "#FFFFFF", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" }),
                  /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("linearGradient", { id: "vq-logo-grad", x1: "0", y1: "0", x2: "24", y2: "24", gradientUnits: "userSpaceOnUse", children: [
                    /* @__PURE__ */ jsx("stop", { stopColor: "#23C4A6" }),
                    /* @__PURE__ */ jsx("stop", { offset: "1", stopColor: "#076B5E" })
                  ] }) })
                ] }),
                store?.name || "VenQore"
              ] }) : null,
              /* @__PURE__ */ jsx("div", { className: "nqp-tabs", "data-rank": "2", role: "group", "aria-label": "Open sales", children: tabs.map((t, i) => /* @__PURE__ */ jsxs("span", { className: "nqp-tab", "data-current": i === active ? "true" : void 0, children: [
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    className: "nqp-tab-lab nqp-tight",
                    "aria-current": i === active ? "true" : void 0,
                    onClick: () => {
                      setActive(i);
                      setSel(-1);
                    },
                    children: tabLabel(t)
                  }
                ),
                /* @__PURE__ */ jsx("button", { type: "button", className: "nqp-tab-x nqp-tight", "aria-label": `Close ${tabLabel(t)}`, onClick: () => closeTab(i), children: "✕" })
              ] }, t.id)) }),
              /* @__PURE__ */ jsx(Icon, { label: "New sale", rank: "2", title: "New sale (Ctrl+T)", onClick: addTab, children: /* @__PURE__ */ jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", children: [
                /* @__PURE__ */ jsx("line", { x1: "12", y1: "5", x2: "12", y2: "19" }),
                /* @__PURE__ */ jsx("line", { x1: "5", y1: "12", x2: "19", y2: "12" })
              ] }) }),
              /* @__PURE__ */ jsx("span", { className: "nqp-sp" }),
              vp.w >= 980 ? /* @__PURE__ */ jsx("button", { type: "button", className: "nqp-status", "data-action": "true", "data-rank": "2", disabled: !prefs?.perms?.["pos.refund"], onClick: () => setSheet("return"), children: tab.isReturn ? `Return · ${tab.returnRef?.invoice_number || "open"}` : "Return (F10)" }) : null,
              vp.w >= 720 ? /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  className: "nqp-status",
                  "data-rank": "3",
                  "data-action": "true",
                  title: "Click to toggle simulated online/offline state",
                  onClick: () => setOnline((o) => !o),
                  children: [
                    /* @__PURE__ */ jsx("span", { className: "nqp-dot", "data-state": online ? void 0 : "bad" }),
                    online ? "Online" : "Offline"
                  ]
                }
              ) : null,
              queue.length ? /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  className: "nqp-status",
                  "data-action": "true",
                  "data-rank": "3",
                  title: `${queue.length} sales queued`,
                  onClick: () => setSheet("offline"),
                  children: [
                    /* @__PURE__ */ jsx("span", { className: "nqp-dot", "data-state": queue.some((q) => q.state === "error") ? "bad" : "off" }),
                    vp.w >= 560 ? `${queue.length} queued` : queue.length
                  ]
                }
              ) : null,
              /* @__PURE__ */ jsx(Icon, { label: theme === "dark" ? "Light mode" : "Dark mode", rank: "3", onClick: toggleTheme, children: theme === "dark" ? /* @__PURE__ */ jsxs("svg", { width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
                /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: "5" }),
                /* @__PURE__ */ jsx("line", { x1: "12", y1: "1", x2: "12", y2: "3" }),
                /* @__PURE__ */ jsx("line", { x1: "12", y1: "21", x2: "12", y2: "23" }),
                /* @__PURE__ */ jsx("line", { x1: "4.22", y1: "4.22", x2: "5.64", y2: "5.64" }),
                /* @__PURE__ */ jsx("line", { x1: "18.36", y1: "18.36", x2: "19.78", y2: "19.78" }),
                /* @__PURE__ */ jsx("line", { x1: "1", y1: "12", x2: "3", y2: "12" }),
                /* @__PURE__ */ jsx("line", { x1: "21", y1: "12", x2: "23", y2: "12" }),
                /* @__PURE__ */ jsx("line", { x1: "4.22", y1: "19.78", x2: "5.64", y2: "18.36" }),
                /* @__PURE__ */ jsx("line", { x1: "18.36", y1: "5.64", x2: "19.78", y2: "4.22" })
              ] }) : /* @__PURE__ */ jsx("svg", { width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ jsx("path", { d: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" }) }) }),
              /* @__PURE__ */ jsx(Icon, { label: "Keyboard map", rank: "2", onClick: () => setSheet("keys"), children: /* @__PURE__ */ jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
                /* @__PURE__ */ jsx("rect", { x: "2", y: "4", width: "20", height: "16", rx: "2" }),
                /* @__PURE__ */ jsx("line", { x1: "6", y1: "8", x2: "6.01", y2: "8" }),
                /* @__PURE__ */ jsx("line", { x1: "10", y1: "8", x2: "10.01", y2: "8" }),
                /* @__PURE__ */ jsx("line", { x1: "14", y1: "8", x2: "14.01", y2: "8" }),
                /* @__PURE__ */ jsx("line", { x1: "18", y1: "8", x2: "18.01", y2: "8" }),
                /* @__PURE__ */ jsx("line", { x1: "6", y1: "12", x2: "6.01", y2: "12" }),
                /* @__PURE__ */ jsx("line", { x1: "10", y1: "12", x2: "10.01", y2: "12" }),
                /* @__PURE__ */ jsx("line", { x1: "14", y1: "12", x2: "14.01", y2: "12" }),
                /* @__PURE__ */ jsx("line", { x1: "18", y1: "12", x2: "18.01", y2: "12" }),
                /* @__PURE__ */ jsx("line", { x1: "7", y1: "16", x2: "17", y2: "16" })
              ] }) }),
              /* @__PURE__ */ jsx(Icon, { label: "Register settings", rank: "3", onClick: () => setSettingsOpen(true), children: /* @__PURE__ */ jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
                /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: "3" }),
                /* @__PURE__ */ jsx("path", { d: "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" })
              ] }) })
            ] }),
            /* @__PURE__ */ jsxs("main", { className: "nqp-term", children: [
              /* @__PURE__ */ jsxs("div", { className: "nqp-search", "data-rank": "1", style: { position: "relative" }, children: [
                /* @__PURE__ */ jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", style: { opacity: 0.5, flex: "0 0 auto" }, children: [
                  /* @__PURE__ */ jsx("circle", { cx: "11", cy: "11", r: "8" }),
                  /* @__PURE__ */ jsx("line", { x1: "21", y1: "21", x2: "16.65", y2: "16.65" })
                ] }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    ref: searchRef,
                    "data-scan": "true",
                    value: search,
                    placeholder: "Scan barcode (F1) or type name / SKU…",
                    "aria-label": "Scan or search",
                    onChange: (e) => setSearch(e.target.value),
                    onKeyDown: onSearchKey
                  }
                ),
                search ? /* @__PURE__ */ jsx("button", { type: "button", className: "nqp-iconbtn", "aria-label": "Clear", onClick: () => setSearch(""), children: "✕" }) : null,
                vp.w >= 560 ? /* @__PURE__ */ jsx(Kbd, { children: "F1" }) : null
              ] }),
              cat && cat.mode === "top" ? /* @__PURE__ */ jsx("div", { className: "nqp-band", style: { gridTemplateColumns: `repeat(${cat.tiles}, minmax(0,1fr))`, height: cat.h }, children: products.slice(0, cat.tiles * cat.rows).map(renderTile) }) : null,
              /* @__PURE__ */ jsx("div", { className: "nqp-panes", children: cols.map(([key, px], i) => /* @__PURE__ */ jsxs(React.Fragment, { children: [
                renderPane(key, px),
                i < cols.length - 1 && key !== "floor" && cols[i + 1][0] !== "floor" ? /* @__PURE__ */ jsx(
                  Splitter,
                  {
                    leftKey: key,
                    rightKey: cols[i + 1][0],
                    pool: T.avail,
                    get: getFrac,
                    set: setFrac,
                    label: `Resize ${key} and ${cols[i + 1][0]}`
                  }
                ) : i < cols.length - 1 ? /* @__PURE__ */ jsx("div", { className: "nqp-split", "aria-hidden": "true", style: { cursor: "default" } }) : null
              ] }, key)) }),
              cat && cat.mode === "bottom" ? /* @__PURE__ */ jsx("div", { className: "nqp-band", style: { gridTemplateColumns: `repeat(${cat.tiles}, minmax(0,1fr))`, height: cat.h }, children: products.slice(0, cat.tiles * cat.rows).map(renderTile) }) : null,
              T.dock.length ? /* @__PURE__ */ jsx("div", { className: "nqp-dock", style: { height: T.dockH }, children: T.dock.map((item) => item.id === "tender" ? /* @__PURE__ */ jsxs(React.Fragment, { children: [
                showDockTotal ? /* @__PURE__ */ jsxs("div", { className: "nqp-docktotal", style: { flex: 1.6 }, children: [
                  /* @__PURE__ */ jsx("div", { className: "k", children: "Total" }),
                  /* @__PURE__ */ jsx(Money, { value: m.total, font: 22, avail: dockTotalAvail, className: "v" })
                ] }) : null,
                /* @__PURE__ */ jsxs("button", { type: "button", className: "nqp-cta nqp-dockpay", "data-rank": "1", onClick: () => setSheet("tender"), children: [
                  /* @__PURE__ */ jsx("span", { className: "lab", children: item.label }),
                  !showDockTotal ? /* @__PURE__ */ jsx(Money, { value: m.total, font: 19, avail: dockPayAvail, ccy: "PKR", className: "amt" }) : null
                ] })
              ] }, "tender") : /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  className: "nqp-dockbtn",
                  "data-rank": "2",
                  onClick: () => {
                    if (item.id === "catalog") setSheet("catalog");
                    else if (item.id === "floor") setSheet("floor");
                  },
                  children: /* @__PURE__ */ jsx("span", { className: "lab", children: item.label })
                },
                item.id
              )) }) : null
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            LineSheet,
            {
              open: sheet === "line",
              onClose: () => setSheet(null),
              line: sel >= 0 ? tab.lines[sel] : null,
              onChange: (patch) => {
                if (sel >= 0) patchLine(tab.lines[sel], patch);
              },
              onRemove: () => {
                if (sel >= 0) removeLine(tab.lines[sel]);
              },
              perms: prefs?.perms,
              showMargin: prefs?.ops?.showMargin,
              narrow
            }
          ),
          /* @__PURE__ */ jsx(
            PartySheet,
            {
              open: sheet === "party",
              onClose: () => setSheet(null),
              onPick: (p) => {
                patchTab({
                  party: p,
                  discount: p.discount > 0 ? { mode: "pct", value: p.discount } : tab.discount
                });
                toast(`Customer set to ${p.name}`);
              },
              current: tab.party,
              storeSlug,
              defaultCustomer: walkInCustomer,
              narrow
            }
          ),
          /* @__PURE__ */ jsx(
            ParkedSheet,
            {
              open: sheet === "parked",
              onClose: () => setSheet(null),
              onRecall: recallParked,
              onDelete: async (parkedId) => {
                try {
                  const url = storeSlug ? route("store.sales.parked.delete", { store_slug: storeSlug, id: parkedId }) : `/sales/parked/${parkedId}`;
                  await axios.delete(url);
                  toast("Held sale discarded.");
                } catch (_) {
                }
              },
              storeSlug,
              narrow
            }
          ),
          /* @__PURE__ */ jsx(
            RecentSheet,
            {
              open: sheet === "recent",
              onClose: () => setSheet(null),
              onReprint: (sale) => PrintService.quickPrint(sale, settings?.default_print_type, settings),
              onReturn: (sale) => {
                patchTab({
                  isReturn: true,
                  returnRef: sale,
                  party: sale.customer ? {
                    id: sale.customer.id,
                    name: sale.customer.name,
                    phone: sale.customer.phone || "",
                    balance: 0,
                    discount: 0,
                    credit: 0,
                    walkin: false
                  } : walkInCustomer
                });
                toast(`Started return against ${sale.invoice_number || sale.reference_number || sale.id}`);
              },
              perms: prefs?.perms,
              narrow,
              storeSlug,
              settings
            }
          ),
          /* @__PURE__ */ jsx(
            ReturnSheet,
            {
              open: sheet === "return",
              onClose: () => setSheet(null),
              onLoad: (sale) => {
                if (sale) {
                  patchTab({
                    isReturn: true,
                    returnRef: sale,
                    party: sale.customer ? {
                      id: sale.customer.id,
                      name: sale.customer.name,
                      phone: sale.customer.phone || "",
                      balance: 0,
                      discount: 0,
                      credit: 0,
                      walkin: false
                    } : walkInCustomer
                  });
                  toast(`Loaded return invoice ${sale.invoice_number || sale.reference_number || sale.id}`);
                } else {
                  patchTab({ isReturn: true, returnRef: null });
                  toast("Started open return session.");
                }
              },
              policy: prefs?.ops?.returnPolicy || "reference",
              windowDays: prefs?.ops?.returnWindowDays || 14,
              party: tab.party,
              perms: prefs?.perms,
              narrow,
              storeSlug
            }
          ),
          /* @__PURE__ */ jsx(
            DiscountSheet,
            {
              open: sheet === "discount",
              onClose: () => setSheet(null),
              tab,
              setTab: patchTab,
              presetsList: prefs?.ops?.discountPresets || [5, 10, 15, 20],
              perms: prefs?.perms,
              narrow
            }
          ),
          /* @__PURE__ */ jsx(
            ChargesSheet,
            {
              open: sheet === "charges",
              onClose: () => setSheet(null),
              tab,
              setTab: patchTab,
              narrow
            }
          ),
          /* @__PURE__ */ jsx(
            NotesSheet,
            {
              open: sheet === "notes",
              onClose: () => setSheet(null),
              tab,
              setTab: patchTab,
              narrow
            }
          ),
          /* @__PURE__ */ jsx(
            SplitSheet,
            {
              open: sheet === "split",
              onClose: () => setSheet(null),
              tab,
              setTab: patchTab,
              total: m.total,
              banks,
              onNewBank: () => setSheet("newBank"),
              narrow
            }
          ),
          approval && /* @__PURE__ */ jsx(
            ApprovalSheet,
            {
              request: approval.info,
              storeSlug,
              busy: approvalBusy,
              narrow,
              onClose: () => setApproval(null),
              onSubmit: async (appr) => {
                setApprovalBusy(true);
                try {
                  await complete({ ...approval.opts, approval: appr });
                } finally {
                  setApprovalBusy(false);
                }
              }
            }
          ),
          /* @__PURE__ */ jsx(
            OverpaySheet,
            {
              open: sheet === "overpay",
              onClose: () => setSheet(null),
              amount: change,
              party: tab.party,
              onChoose: (overpayMode) => {
                complete({ skipOverpay: true, overpay: overpayMode });
              },
              narrow
            }
          ),
          /* @__PURE__ */ jsx(
            QuickProductSheet,
            {
              open: sheet === "quickProduct",
              onClose: () => setSheet(null),
              categories,
              onCreate: async (p) => {
                try {
                  const url = storeSlug ? route("store.inventory.store", { store_slug: storeSlug }) : "/inventory";
                  const res = await axios.post(url, {
                    name: p.name,
                    sku: p.sku || `SKU-${Date.now()}`,
                    price: p.price,
                    stock: p.stock || 0,
                    category_id: p.category_id
                  });
                  const created = res.data?.product || res.data || p;
                  addProduct(created);
                  fetchFeatured();
                  toast(`Created and added "${created.name}"`);
                } catch (_) {
                  addProduct(p);
                }
              },
              narrow
            }
          ),
          /* @__PURE__ */ jsx(
            QuickBankSheet,
            {
              open: sheet === "newBank",
              onClose: () => setSheet(null),
              onCreate: async (b) => {
                try {
                  const url = storeSlug ? route("store.bank-accounts.store", { store_slug: storeSlug }) : "/bank-accounts";
                  const res = await axios.post(url, { name: b.name, account_number: b.code });
                  const created = res.data?.bankAccount || { id: Date.now(), name: b.name, code: b.code };
                  setBanks((prev) => [...prev, created]);
                  patchTab({ bank: created.id });
                  toast(`Added bank account "${b.name}"`);
                } catch (_) {
                  const created = { id: Date.now(), name: b.name, code: b.code };
                  setBanks((prev) => [...prev, created]);
                  patchTab({ bank: created.id });
                }
              },
              narrow
            }
          ),
          /* @__PURE__ */ jsx(
            VariantSheet,
            {
              open: Boolean(variantPicker),
              onClose: () => setVariantPicker(null),
              product: variantPicker,
              onPick: (variant) => {
                addProduct(variantPicker, variant);
                setVariantPicker(null);
              },
              narrow
            }
          ),
          /* @__PURE__ */ jsx(
            ReceiptSheet,
            {
              open: Boolean(completedSale),
              onClose: () => setCompletedSale(null),
              sale: completedSale,
              settings,
              store
            }
          ),
          /* @__PURE__ */ jsx(KeysSheet, { open: sheet === "keys", onClose: () => setSheet(null), narrow }),
          /* @__PURE__ */ jsx(
            OfflineSheet,
            {
              open: sheet === "offline",
              onClose: () => setSheet(null),
              queue,
              online,
              onRetry: syncOfflineQueue,
              onRecall: (q) => {
                if (q.payload?.items) {
                  patchTab({
                    lines: q.payload.items.map((it) => ({
                      u: uid(),
                      id: it.product_id,
                      product_id: it.product_id,
                      name: `Item #${it.product_id}`,
                      price: Number(it.price || 0),
                      qty: Number(it.quantity || 1),
                      stock: 99,
                      discount: { mode: "pct", value: 0 },
                      hue: "teal"
                    }))
                  });
                  setSheet(null);
                  toast("Recalled offline sale into tab.");
                }
              },
              onDelete: (q) => setQueue((prev) => prev.filter((x) => x.id !== q.id)),
              narrow
            }
          ),
          /* @__PURE__ */ jsx(BreakupSheet, { open: sheet === "breakup", onClose: () => setSheet(null), m, tab, narrow }),
          /* @__PURE__ */ jsx(Sheet, { open: sheet === "tax", onClose: () => setSheet(null), title: "Tax rate", size: narrow ? "bottom" : "side", children: /* @__PURE__ */ jsxs("div", { className: "nqp-field", style: { padding: "8px 0" }, children: [
            /* @__PURE__ */ jsxs("div", { className: "nqp-seg", style: { marginBottom: 12 }, children: [
              /* @__PURE__ */ jsx("button", { type: "button", "aria-pressed": tab.taxMode === "exclusive", onClick: () => patchTab({ taxMode: "exclusive" }), children: "Exclusive (added)" }),
              /* @__PURE__ */ jsx("button", { type: "button", "aria-pressed": tab.taxMode === "inclusive", onClick: () => patchTab({ taxMode: "inclusive" }), children: "Inclusive (in price)" })
            ] }),
            parsedTaxRates.map((t) => /* @__PURE__ */ jsxs(
              RowButton,
              {
                className: "nqp-row",
                onClick: () => {
                  patchTab({ taxRate: t.rate });
                  setSheet(null);
                },
                children: [
                  /* @__PURE__ */ jsx("span", { className: "nqp-rowmain", children: /* @__PURE__ */ jsx("span", { className: "nqp-rowtitle", children: t.label }) }),
                  tab.taxRate === t.rate ? /* @__PURE__ */ jsx(Flag, { children: "Active" }) : null
                ]
              },
              t.id
            ))
          ] }) }),
          /* @__PURE__ */ jsx(Sheet, { open: sheet === "location", onClose: () => setSheet(null), title: "Warehouse / Location", size: narrow ? "bottom" : "side", children: /* @__PURE__ */ jsx("div", { className: "nqp-field", style: { padding: "8px 0" }, children: warehouses.map((w) => /* @__PURE__ */ jsxs(
            RowButton,
            {
              className: "nqp-row",
              onClick: () => {
                patchTab({ warehouse: w.id });
                setSheet(null);
              },
              children: [
                /* @__PURE__ */ jsxs("span", { className: "nqp-rowmain", children: [
                  /* @__PURE__ */ jsx("span", { className: "nqp-rowtitle", children: w.name }),
                  w.is_default ? /* @__PURE__ */ jsx("span", { className: "nqp-line-sub", children: "Default location" }) : null
                ] }),
                tab.warehouse === w.id ? /* @__PURE__ */ jsx(Flag, { children: "Selected" }) : null
              ]
            },
            w.id
          )) }) }),
          /* @__PURE__ */ jsx(Sheet, { open: sheet === "method", onClose: () => setSheet(null), title: "Payment method", size: narrow ? "bottom" : "side", children: /* @__PURE__ */ jsxs("div", { className: "nqp-field", style: { padding: "8px 0" }, children: [
            PAY_METHODS.map((method) => /* @__PURE__ */ jsxs(
              RowButton,
              {
                className: "nqp-row",
                onClick: () => {
                  patchTab({ method, splits: [] });
                  setSheet(null);
                },
                children: [
                  /* @__PURE__ */ jsx("span", { className: "nqp-rowmain", children: /* @__PURE__ */ jsx("span", { className: "nqp-rowtitle", children: method }) }),
                  tab.method === method && !tab.splits.length ? /* @__PURE__ */ jsx(Flag, { children: "Selected" }) : null
                ]
              },
              method
            )),
            /* @__PURE__ */ jsxs(
              RowButton,
              {
                className: "nqp-row",
                onClick: () => {
                  setSheet("split");
                },
                children: [
                  /* @__PURE__ */ jsx("span", { className: "nqp-rowmain", children: /* @__PURE__ */ jsx("span", { className: "nqp-rowtitle", children: "Split Payment…" }) }),
                  tab.splits.length ? /* @__PURE__ */ jsx(Flag, { children: "Active" }) : null
                ]
              }
            )
          ] }) }),
          /* @__PURE__ */ jsx(
            Sheet,
            {
              open: sheet === "tender",
              onClose: () => setSheet(null),
              title: tab.isReturn ? "Refund" : "Payment",
              size: narrow ? "bottom" : "side",
              footer: renderTenderFooter(narrow ? vp.w : Math.min(580, vp.w * 0.96), "full", true),
              children: renderTenderBody("full", narrow ? vp.w : Math.min(580, vp.w * 0.96), true)
            }
          ),
          /* @__PURE__ */ jsx(Palette, { open: paletteOpen, onClose: () => setPaletteOpen(false), commands }),
          /* @__PURE__ */ jsx(
            NavDrawer,
            {
              open: navOpen,
              onClose: () => setNavOpen(false),
              items: NAV,
              current: "sell",
              width: narrow ? vp.w * 0.85 : 280
            }
          ),
          /* @__PURE__ */ jsx(
            SettingsDrawer,
            {
              open: settingsOpen,
              onClose: () => setSettingsOpen(false),
              prefs,
              setPrefs,
              T,
              vp,
              width: narrow ? vp.w : Math.min(480, vp.w * 0.96),
              warehouses,
              banks,
              taxRates: parsedTaxRates,
              onOpenLayoutPicker: () => setLayoutPickerOpen(true),
              onOpenSetupWizard: () => setSetupWizardOpen(true)
            }
          ),
          /* @__PURE__ */ jsx(
            SetupWizardModal,
            {
              open: setupWizardOpen,
              onClose: () => setSetupWizardOpen(false),
              onApply: handleApplyWizard,
              currentPrefs: prefs,
              store
            }
          ),
          /* @__PURE__ */ jsx(
            LayoutPickerModal,
            {
              open: layoutPickerOpen,
              onClose: () => setLayoutPickerOpen(false),
              prefs,
              setPrefs
            }
          ),
          /* @__PURE__ */ jsx(
            Toasts,
            {
              ns: "nqp",
              items: toasts,
              onAction: onToastAction,
              onDismiss: (t) => setToasts((ts) => ts.filter((x) => x.id !== t.id))
            }
          )
        ]
      }
    )
  ] });
}
export {
  HUES,
  NAV,
  TABLES,
  NewPos as default
};

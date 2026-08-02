import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useCallback } from "react";
import { usePage, Head, Link, router } from "@inertiajs/react";
import { O as OneGlanceLayout, v as vq, r as role } from "./marketing-pages-DYgr6x02.js";
import MoneyPipeline from "./MoneyPipeline-DIXi91MV.js";
import { ChevronLeft, CheckCircle2, Info, AlertCircle, Clock, AlertTriangle, Loader2, Landmark } from "lucide-react";
import "marked";
import "axios";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
const money = (n, currency = "GBP") => {
  const symbols = { GBP: "£", USD: "$", EUR: "€", PKR: "₨", AED: "AED " };
  return `${symbols[currency] ?? currency + " "}${Number(n ?? 0).toLocaleString(void 0, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString(void 0, {
  day: "numeric",
  month: "short",
  year: "numeric"
}) : "—";
function ConfirmRow({ payout, bankAccounts, storeSlug }) {
  const [actual, setActual] = useState(String(payout.expected_net ?? ""));
  const [bankId, setBankId] = useState(bankAccounts?.[0]?.id ?? "");
  const [externalId, setExternalId] = useState("");
  const [saving, setSaving] = useState(false);
  const expected = Number(payout.expected_net ?? 0);
  const entered = Number(actual);
  const variance = Number.isFinite(entered) ? entered - expected : 0;
  const hasVariance = Math.abs(variance) >= 0.01;
  const submit = useCallback(() => {
    setSaving(true);
    router.post(
      route("store.vensynq.payouts.confirm", { store_slug: storeSlug, payout: payout.id }),
      {
        actual_net: actual,
        bank_account_id: bankId || null,
        external_payout_id: externalId || null
      },
      { preserveScroll: true, onFinish: () => setSaving(false) }
    );
  }, [actual, bankId, externalId, payout.id, storeSlug]);
  const inputStyle = {
    width: "100%",
    padding: "9px 11px",
    borderRadius: 8,
    background: "#0a1220",
    border: `1px solid ${vq.slate[800]}`,
    color: vq.slate[100],
    fontSize: 13,
    outline: "none"
  };
  const labelStyle = {
    display: "block",
    fontSize: 10,
    fontWeight: 700,
    color: vq.slate[500],
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: 5
  };
  return /* @__PURE__ */ jsxs("div", { style: {
    background: vq.void[800] ?? "#0b1220",
    border: `1px solid ${payout.is_overdue ? role.danger[800] : role.warning[800]}`,
    borderRadius: 12,
    padding: 18,
    display: "flex",
    flexDirection: "column",
    gap: 14
  }, children: [
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between", alignItems: "flex-start" }, children: [
      /* @__PURE__ */ jsxs("div", { style: { minWidth: 0 }, children: [
        /* @__PURE__ */ jsx("div", { style: { fontSize: 14, fontWeight: 700, color: vq.slate[100] }, children: payout.channel?.name ?? "Marketplace" }),
        /* @__PURE__ */ jsxs("div", { style: { fontSize: 11, color: vq.slate[500], marginTop: 3 }, children: [
          fmtDate(payout.period_start),
          " — ",
          fmtDate(payout.period_end),
          payout.expected_at_human ? ` · expected ${payout.expected_at_human}` : ""
        ] })
      ] }),
      payout.is_overdue && /* @__PURE__ */ jsxs("span", { style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "4px 10px",
        borderRadius: 999,
        background: role.danger[950],
        border: `1px solid ${role.danger[800]}`,
        color: role.danger[400],
        fontSize: 10,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        flexShrink: 0
      }, children: [
        /* @__PURE__ */ jsx(AlertTriangle, { size: 10 }),
        " Overdue"
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
      gap: 10,
      padding: "12px 14px",
      borderRadius: 9,
      background: "#0a1220",
      border: `1px solid ${vq.slate[800]}`
    }, children: [
      ["Gross sales", payout.expected_gross, vq.slate[200]],
      ["Est. fees", -payout.expected_fees, role.danger[400]],
      ...Number(payout.expected_reserve) > 0 ? [["Reserve held", -payout.expected_reserve, role.warning[400]]] : [],
      ["Expected net", payout.expected_net, role.success[400]]
    ].map(([label, amount, color]) => /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("div", { style: { fontSize: 10, color: vq.slate[600], textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }, children: label }),
      /* @__PURE__ */ jsx("div", { style: { fontSize: 14, fontWeight: 700, color, marginTop: 3 }, children: money(amount, payout.currency) })
    ] }, label)) }),
    /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }, children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { style: labelStyle, htmlFor: `actual-${payout.id}`, children: "Amount actually received" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            id: `actual-${payout.id}`,
            type: "number",
            step: "0.01",
            min: "0",
            value: actual,
            onChange: (e) => setActual(e.target.value),
            style: {
              ...inputStyle,
              borderColor: hasVariance ? role.warning[700] : vq.slate[800]
            }
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { style: labelStyle, htmlFor: `bank-${payout.id}`, children: "Deposited into" }),
        /* @__PURE__ */ jsxs(
          "select",
          {
            id: `bank-${payout.id}`,
            value: bankId,
            onChange: (e) => setBankId(e.target.value),
            style: inputStyle,
            children: [
              (bankAccounts ?? []).length === 0 && /* @__PURE__ */ jsx("option", { value: "", children: "No bank accounts" }),
              (bankAccounts ?? []).map((b) => /* @__PURE__ */ jsxs("option", { value: b.id, children: [
                b.name,
                b.bank_name ? ` — ${b.bank_name}` : ""
              ] }, b.id))
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { style: labelStyle, htmlFor: `ext-${payout.id}`, children: "Platform reference (optional)" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            id: `ext-${payout.id}`,
            value: externalId,
            onChange: (e) => setExternalId(e.target.value),
            placeholder: "e.g. Payout #8841",
            style: inputStyle
          }
        )
      ] })
    ] }),
    hasVariance && /* @__PURE__ */ jsxs("div", { style: {
      display: "flex",
      gap: 8,
      alignItems: "flex-start",
      padding: "11px 13px",
      borderRadius: 9,
      background: role.warning[950],
      border: `1px solid ${role.warning[800]}`
    }, children: [
      /* @__PURE__ */ jsx(Info, { size: 13, color: role.warning[400], style: { flexShrink: 0, marginTop: 1 } }),
      /* @__PURE__ */ jsx("span", { style: { fontSize: 12, color: role.warning[300], lineHeight: 1.5 }, children: variance < 0 ? `${money(Math.abs(variance), payout.currency)} less than estimated. This usually means storage, advertising or dispute fees. It will be recorded as fee variance — your books stay balanced.` : `${money(variance, payout.currency)} more than estimated. The difference will be recorded as a fee variance credit.` })
    ] }),
    /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: submit,
        disabled: saving || actual === "",
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 7,
          padding: "11px 18px",
          borderRadius: 9,
          border: "none",
          background: saving || actual === "" ? vq.slate[800] : "linear-gradient(135deg, #059669, #047857)",
          color: saving || actual === "" ? vq.slate[600] : "#fff",
          fontSize: 13,
          fontWeight: 700,
          cursor: saving ? "wait" : actual === "" ? "not-allowed" : "pointer"
        },
        children: [
          saving ? /* @__PURE__ */ jsx(Loader2, { size: 14, className: "spin" }) : /* @__PURE__ */ jsx(Landmark, { size: 14 }),
          saving ? "Confirming…" : "Confirm & deposit to bank"
        ]
      }
    )
  ] });
}
function Payouts({
  due = [],
  pending = [],
  recent = [],
  pipeline = null,
  bankAccounts = []
}) {
  const { props } = usePage();
  const flash = props.flash ?? {};
  const store = props.store;
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { children: [
    /* @__PURE__ */ jsx(Head, { title: "Marketplace Payouts — VenSynQ" }),
    /* @__PURE__ */ jsxs("div", { className: "vensynq-root", style: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a0f1a 0%, #0d1421 100%)",
      color: vq.slate[200],
      fontFamily: "'Inter', sans-serif",
      padding: "0 0 80px"
    }, children: [
      /* @__PURE__ */ jsxs("div", { style: {
        background: "linear-gradient(90deg, #0a0f1a, #111827)",
        borderBottom: "1px solid #1e3a5f",
        padding: "20px 32px",
        display: "flex",
        alignItems: "center",
        gap: 14
      }, children: [
        /* @__PURE__ */ jsx(
          Link,
          {
            href: route("store.vensynq.index", { store_slug: store?.slug }),
            style: {
              width: 36,
              height: 36,
              borderRadius: 10,
              background: vq.slate[800],
              border: "1px solid #334155",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: vq.slate[400],
              flexShrink: 0
            },
            children: /* @__PURE__ */ jsx(ChevronLeft, { size: 20 })
          }
        ),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { style: {
            fontSize: 20,
            fontWeight: 700,
            margin: 0,
            background: "linear-gradient(90deg, #60a5fa, #a78bfa)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }, children: "Marketplace Payouts" }),
          /* @__PURE__ */ jsx("p", { style: { margin: 0, fontSize: 12, color: vq.slate[500] }, children: "Confirm what actually landed in your bank" })
        ] })
      ] }),
      ["success", "error", "warning"].map((k) => flash[k] && /* @__PURE__ */ jsxs("div", { style: {
        margin: "16px 32px 0",
        padding: "12px 16px",
        borderRadius: 8,
        fontSize: 13,
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: k === "success" ? role.success[950] : k === "warning" ? role.warning[950] : role.danger[950],
        border: `1px solid ${k === "success" ? role.success[800] : k === "warning" ? role.warning[800] : role.danger[800]}`,
        color: k === "success" ? role.success[400] : k === "warning" ? role.warning[300] : role.danger[400]
      }, children: [
        k === "success" ? /* @__PURE__ */ jsx(CheckCircle2, { size: 15 }) : k === "warning" ? /* @__PURE__ */ jsx(Info, { size: 15 }) : /* @__PURE__ */ jsx(AlertCircle, { size: 15 }),
        flash[k]
      ] }, k)),
      /* @__PURE__ */ jsxs("div", { style: { padding: "28px 32px", display: "flex", flexDirection: "column", gap: 28 }, children: [
        /* @__PURE__ */ jsx(
          MoneyPipeline,
          {
            pipeline,
            clearingEnabled: true,
            storeSlug: store?.slug
          }
        ),
        /* @__PURE__ */ jsxs("section", { children: [
          /* @__PURE__ */ jsxs("h2", { style: {
            fontSize: 13,
            fontWeight: 700,
            color: vq.slate[400],
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 14
          }, children: [
            "Ready to confirm (",
            due.length,
            ")"
          ] }),
          due.length === 0 ? /* @__PURE__ */ jsxs("div", { style: {
            textAlign: "center",
            padding: "44px 20px",
            background: vq.void[800] ?? "#0b1220",
            border: "1px solid #1e3a5f",
            borderRadius: 12
          }, children: [
            /* @__PURE__ */ jsx(CheckCircle2, { size: 32, color: role.success[600], style: { marginBottom: 12 } }),
            /* @__PURE__ */ jsx("h3", { style: { margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: vq.slate[300] }, children: "Nothing waiting on you" }),
            /* @__PURE__ */ jsx("p", { style: { margin: 0, fontSize: 12, color: vq.slate[500] }, children: "Payouts appear here once their settlement window has passed." })
          ] }) : /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: 14 }, children: due.map((p) => /* @__PURE__ */ jsx(
            ConfirmRow,
            {
              payout: p,
              bankAccounts,
              storeSlug: store?.slug
            },
            p.id
          )) })
        ] }),
        pending.length > 0 && /* @__PURE__ */ jsxs("section", { children: [
          /* @__PURE__ */ jsxs("h2", { style: {
            fontSize: 13,
            fontWeight: 700,
            color: vq.slate[400],
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 14
          }, children: [
            "Still accruing (",
            pending.length,
            ")"
          ] }),
          /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: 9 }, children: pending.map((p) => /* @__PURE__ */ jsxs("div", { style: {
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            alignItems: "center",
            justifyContent: "space-between",
            padding: "13px 16px",
            borderRadius: 10,
            background: vq.void[800] ?? "#0b1220",
            border: "1px solid #1e3a5f"
          }, children: [
            /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 10, minWidth: 0 }, children: [
              /* @__PURE__ */ jsx(Clock, { size: 15, color: vq.slate[500], style: { flexShrink: 0 } }),
              /* @__PURE__ */ jsxs("div", { style: { minWidth: 0 }, children: [
                /* @__PURE__ */ jsx("div", { style: { fontSize: 13, fontWeight: 700, color: vq.slate[200] }, children: p.channel?.name ?? "Marketplace" }),
                /* @__PURE__ */ jsxs("div", { style: { fontSize: 11, color: vq.slate[500], marginTop: 2 }, children: [
                  "Expected ",
                  p.expected_at_human ?? fmtDate(p.expected_at)
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { style: { fontSize: 15, fontWeight: 700, color: vq.slate[100], flexShrink: 0 }, children: money(p.expected_net, p.currency) })
          ] }, p.id)) })
        ] }),
        recent.length > 0 && /* @__PURE__ */ jsxs("section", { children: [
          /* @__PURE__ */ jsx("h2", { style: {
            fontSize: 13,
            fontWeight: 700,
            color: vq.slate[400],
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 14
          }, children: "Recently confirmed" }),
          /* @__PURE__ */ jsx("div", { style: {
            background: vq.void[800] ?? "#0b1220",
            border: "1px solid #1e3a5f",
            borderRadius: 12,
            overflowX: "auto"
          }, children: /* @__PURE__ */ jsxs("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 520 }, children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", { style: { background: "#0f1f35", borderBottom: "1px solid #1e3a5f" }, children: ["Channel", "Confirmed", "Expected", "Received", "Variance"].map((h) => /* @__PURE__ */ jsx("th", { style: {
              padding: "10px 14px",
              textAlign: "left",
              color: vq.slate[500],
              fontWeight: 700,
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              whiteSpace: "nowrap"
            }, children: h }, h)) }) }),
            /* @__PURE__ */ jsx("tbody", { children: recent.map((p) => {
              const v = Number(p.variance ?? 0);
              return /* @__PURE__ */ jsxs("tr", { style: { borderBottom: "1px solid #162032" }, children: [
                /* @__PURE__ */ jsx("td", { style: { padding: "10px 14px", color: vq.slate[200], fontWeight: 600 }, children: p.channel?.name ?? "—" }),
                /* @__PURE__ */ jsx("td", { style: { padding: "10px 14px", color: vq.slate[400], whiteSpace: "nowrap" }, children: fmtDate(p.confirmed_at) }),
                /* @__PURE__ */ jsx("td", { style: { padding: "10px 14px", color: vq.slate[400], whiteSpace: "nowrap" }, children: money(p.expected_net, p.currency) }),
                /* @__PURE__ */ jsx("td", { style: { padding: "10px 14px", color: vq.slate[100], fontWeight: 700, whiteSpace: "nowrap" }, children: money(p.actual_net, p.currency) }),
                /* @__PURE__ */ jsx("td", { style: {
                  padding: "10px 14px",
                  whiteSpace: "nowrap",
                  fontWeight: 700,
                  color: Math.abs(v) < 0.01 ? vq.slate[600] : v < 0 ? role.danger[400] : role.success[400]
                }, children: Math.abs(v) < 0.01 ? "Exact" : money(v, p.currency) })
              ] }, p.id);
            }) })
          ] }) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("style", { children: `
                .spin { animation: vensynq-spin 1s linear infinite; }
                @keyframes vensynq-spin { to { transform: rotate(360deg); } }
            ` })
  ] });
}
export {
  Payouts as default
};

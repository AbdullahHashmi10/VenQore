import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useCallback } from "react";
import { router } from "@inertiajs/react";
import { v as vq, r as role } from "./marketing-pages-DYgr6x02.js";
import { Info, CheckCircle2, Landmark, ArrowRight, AlertTriangle, ShoppingCart, ChevronRight, Clock } from "lucide-react";
import "marked";
import "axios";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
const money = (n, currency = "GBP") => {
  const symbols = { GBP: "£", USD: "$", EUR: "€", PKR: "₨", AED: "AED " };
  const symbol = symbols[currency] ?? `${currency} `;
  const value = Number(n ?? 0);
  return `${symbol}${value.toLocaleString(void 0, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};
function Stage({ icon: Icon, label, amount, currency, sub, tone, emphasis }) {
  const tones = {
    neutral: { color: vq.slate[300], bg: "transparent", border: "#1e3a5f" },
    warn: { color: role.warning[400], bg: role.warning[950], border: role.warning[800] },
    good: { color: role.success[400], bg: role.success[950], border: role.success[800] }
  };
  const t = tones[tone] ?? tones.neutral;
  return /* @__PURE__ */ jsxs("div", { style: {
    flex: "1 1 200px",
    minWidth: 0,
    background: t.bg,
    border: `1px solid ${t.border}`,
    borderRadius: 12,
    padding: "16px 18px"
  }, children: [
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }, children: [
      /* @__PURE__ */ jsx(Icon, { size: 14, color: t.color }),
      /* @__PURE__ */ jsx("span", { style: {
        fontSize: 10,
        fontWeight: 700,
        color: vq.slate[500],
        textTransform: "uppercase",
        letterSpacing: "0.06em"
      }, children: label })
    ] }),
    /* @__PURE__ */ jsx("div", { style: {
      fontSize: emphasis ? 26 : 22,
      fontWeight: 700,
      color: emphasis ? t.color : vq.slate[100],
      lineHeight: 1.15,
      wordBreak: "break-word"
    }, children: money(amount, currency) }),
    sub && /* @__PURE__ */ jsx("div", { style: { marginTop: 6, fontSize: 11, color: vq.slate[500], lineHeight: 1.45 }, children: sub })
  ] });
}
function MoneyPipeline({ pipeline, clearingEnabled, storeSlug, currency = "GBP" }) {
  const [expanded, setExpanded] = useState(false);
  const [toggling, setToggling] = useState(false);
  const handleToggleClearing = useCallback(() => {
    setToggling(true);
    router.post(
      route("store.vensynq.clearing.toggle", { store_slug: storeSlug }),
      { enabled: !clearingEnabled },
      { preserveScroll: true, onFinish: () => setToggling(false) }
    );
  }, [clearingEnabled, storeSlug]);
  if (!clearingEnabled) {
    return /* @__PURE__ */ jsxs("div", { style: {
      background: "linear-gradient(135deg, #0d1e36 0%, #091220 100%)",
      border: "1px dashed #2f5c96",
      borderRadius: 12,
      padding: "18px 20px",
      display: "flex",
      flexWrap: "wrap",
      gap: 14,
      alignItems: "center",
      justifyContent: "space-between"
    }, children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 11, alignItems: "flex-start", flex: "1 1 340px", minWidth: 0 }, children: [
        /* @__PURE__ */ jsx(Info, { size: 17, color: "#60a5fa", style: { flexShrink: 0, marginTop: 2 } }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { style: { fontSize: 13, fontWeight: 700, color: vq.slate[100], marginBottom: 4 }, children: "Marketplace Clearing is off" }),
          /* @__PURE__ */ jsxs("p", { style: { margin: 0, fontSize: 12, color: vq.slate[400], lineHeight: 1.55, maxWidth: 560 }, children: [
            "Online sales currently post straight to cash the moment the order arrives — but Amazon holds funds around 14 days and Stripe around 2. Turning this on holds that money in a clearing pool so your cash balance reflects what you can actually spend. ",
            /* @__PURE__ */ jsx("strong", { style: { color: vq.slate[300] }, children: "Existing sales are not changed." })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: handleToggleClearing,
          disabled: toggling,
          style: {
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "10px 18px",
            borderRadius: 9,
            border: "none",
            background: toggling ? vq.slate[800] : "linear-gradient(135deg, #3b82f6, #1d4ed8)",
            color: toggling ? vq.slate[500] : "#fff",
            fontSize: 13,
            fontWeight: 700,
            cursor: toggling ? "wait" : "pointer",
            flexShrink: 0
          },
          children: [
            /* @__PURE__ */ jsx(CheckCircle2, { size: 14 }),
            toggling ? "Turning on…" : "Turn on Clearing"
          ]
        }
      )
    ] });
  }
  if (!pipeline) return null;
  const awaiting = pipeline.awaiting_confirmation ?? { count: 0, amount: 0 };
  const channels = pipeline.by_channel ?? [];
  return /* @__PURE__ */ jsxs("section", { style: { display: "flex", flexDirection: "column", gap: 14 }, children: [
    awaiting.count > 0 && /* @__PURE__ */ jsxs("div", { style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 12,
      alignItems: "center",
      justifyContent: "space-between",
      background: role.warning[950],
      border: `1px solid ${role.warning[800]}`,
      borderRadius: 12,
      padding: "14px 18px"
    }, children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 10, alignItems: "center", minWidth: 0 }, children: [
        /* @__PURE__ */ jsx(Landmark, { size: 17, color: role.warning[400], style: { flexShrink: 0 } }),
        /* @__PURE__ */ jsxs("div", { style: { minWidth: 0 }, children: [
          /* @__PURE__ */ jsxs("div", { style: { fontSize: 13, fontWeight: 700, color: role.warning[300] }, children: [
            awaiting.count,
            " payout",
            awaiting.count === 1 ? "" : "s",
            " ready to confirm",
            " · ",
            money(awaiting.amount, currency)
          ] }),
          /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: vq.slate[400], marginTop: 2 }, children: "Check your bank, then confirm the amount that actually landed." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(
        "a",
        {
          href: route("store.vensynq.payouts", { store_slug: storeSlug }),
          style: {
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "9px 16px",
            borderRadius: 8,
            background: role.warning[600],
            color: "#1a1200",
            fontSize: 12,
            fontWeight: 700,
            textDecoration: "none",
            flexShrink: 0,
            whiteSpace: "nowrap"
          },
          children: [
            "Confirm payouts ",
            /* @__PURE__ */ jsx(ArrowRight, { size: 13 })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { style: {
      background: "linear-gradient(135deg, #0d1e36 0%, #091220 100%)",
      border: "1px solid #1e3a5f",
      borderRadius: 12,
      padding: 18
    }, children: [
      /* @__PURE__ */ jsxs("div", { style: {
        display: "flex",
        flexWrap: "wrap",
        gap: 12,
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 14
      }, children: [
        /* @__PURE__ */ jsx("h2", { style: {
          margin: 0,
          fontSize: 13,
          fontWeight: 700,
          color: vq.slate[300],
          textTransform: "uppercase",
          letterSpacing: "0.07em"
        }, children: "Where your money is" }),
        pipeline.overdue_count > 0 && /* @__PURE__ */ jsxs("span", { style: {
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          padding: "4px 10px",
          borderRadius: 999,
          background: role.danger[950],
          border: `1px solid ${role.danger[800]}`,
          color: role.danger[400],
          fontSize: 11,
          fontWeight: 700
        }, children: [
          /* @__PURE__ */ jsx(AlertTriangle, { size: 11 }),
          pipeline.overdue_count,
          " overdue"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexWrap: "wrap", alignItems: "stretch", gap: 10 }, children: [
        /* @__PURE__ */ jsx(
          Stage,
          {
            icon: ShoppingCart,
            label: "Online sales in pipeline",
            amount: pipeline.gross_in_pipeline,
            currency,
            sub: "Gross value of orders not yet paid out",
            tone: "neutral"
          }
        ),
        /* @__PURE__ */ jsx(ChevronRight, { size: 18, color: vq.slate[700], style: { alignSelf: "center", flexShrink: 0 } }),
        /* @__PURE__ */ jsx(
          Stage,
          {
            icon: Clock,
            label: "Held by platforms",
            amount: pipeline.pending_payout,
            currency,
            sub: `After ${money(pipeline.estimated_fees, currency)} estimated fees${pipeline.held_in_reserve > 0 ? ` and ${money(pipeline.held_in_reserve, currency)} reserve` : ""}`,
            tone: "warn",
            emphasis: true
          }
        ),
        /* @__PURE__ */ jsx(ChevronRight, { size: 18, color: vq.slate[700], style: { alignSelf: "center", flexShrink: 0 } }),
        /* @__PURE__ */ jsx(
          Stage,
          {
            icon: Landmark,
            label: "Cleared to bank",
            amount: pipeline.cleared_to_bank,
            currency,
            sub: "Confirmed payouts you can actually spend",
            tone: "good"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("p", { style: {
        margin: "13px 0 0",
        fontSize: 11,
        color: vq.slate[600],
        lineHeight: 1.5,
        display: "flex",
        gap: 6,
        alignItems: "flex-start"
      }, children: [
        /* @__PURE__ */ jsx(Info, { size: 12, style: { flexShrink: 0, marginTop: 1 } }),
        "Fees shown are estimates. The exact amount is trued up automatically when you confirm each payout, and any difference is recorded as fee variance."
      ] }),
      channels.length > 0 && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setExpanded((v) => !v),
            "aria-expanded": expanded,
            style: {
              marginTop: 12,
              padding: 0,
              background: "transparent",
              border: "none",
              color: "#60a5fa",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4
            },
            children: [
              expanded ? "Hide" : "Show",
              " breakdown by channel",
              /* @__PURE__ */ jsx(
                ChevronRight,
                {
                  size: 13,
                  style: { transform: expanded ? "rotate(90deg)" : "none", transition: "transform 0.2s" }
                }
              )
            ]
          }
        ),
        expanded && /* @__PURE__ */ jsx("div", { style: { marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }, children: channels.map((ch) => /* @__PURE__ */ jsxs(
          "div",
          {
            style: {
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              alignItems: "center",
              justifyContent: "space-between",
              padding: "11px 13px",
              borderRadius: 9,
              background: "#0a1220",
              border: `1px solid ${ch.is_overdue ? role.danger[800] : vq.slate[800]}`
            },
            children: [
              /* @__PURE__ */ jsxs("div", { style: { minWidth: 0 }, children: [
                /* @__PURE__ */ jsx("div", { style: { fontSize: 12, fontWeight: 700, color: vq.slate[200] }, children: ch.channel_name }),
                /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: ch.is_overdue ? role.danger[400] : vq.slate[500], marginTop: 2 }, children: ch.is_overdue ? "Payout is overdue — check your platform account" : ch.arrives_human ? `Arriving ${ch.arrives_human}` : "Awaiting settlement date" })
              ] }),
              /* @__PURE__ */ jsx("div", { style: { fontSize: 15, fontWeight: 700, color: vq.slate[100], flexShrink: 0 }, children: money(ch.amount, ch.currency ?? currency) })
            ]
          },
          ch.channel_id
        )) })
      ] })
    ] })
  ] });
}
export {
  MoneyPipeline as default
};

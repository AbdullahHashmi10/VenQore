import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { router } from "@inertiajs/react";
import { v as vq, r as role } from "./marketing-pages-CTBAvetE.js";
import { Clock, RefreshCw, AlertCircle, AlertTriangle, CheckCircle2, Wifi, Webhook, KeyRound, X, ChevronDown, RotateCw } from "lucide-react";
import "marked";
import "axios";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
const STATUS = {
  green: { label: "Healthy", color: role.success[400], bg: role.success[950], border: role.success[800], Icon: CheckCircle2 },
  yellow: { label: "Needs Attention", color: role.warning[400], bg: role.warning[950], border: role.warning[800], Icon: AlertTriangle },
  red: { label: "Action Required", color: role.danger[400], bg: role.danger[950], border: role.danger[800], Icon: AlertCircle }
};
const statusOf = (key) => STATUS[key] ?? STATUS.yellow;
function relativeTime(iso, now) {
  if (!iso) return "never";
  const seconds = Math.round((now - new Date(iso).getTime()) / 1e3);
  if (Number.isNaN(seconds)) return "unknown";
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds} seconds ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
function SignalPill({ icon: Icon, title, signal }) {
  const s = statusOf(signal?.status);
  return /* @__PURE__ */ jsxs(
    "div",
    {
      title: signal?.detail ?? "",
      style: {
        display: "flex",
        alignItems: "center",
        gap: 7,
        padding: "7px 10px",
        borderRadius: 8,
        background: s.bg,
        border: `1px solid ${s.border}`,
        minWidth: 0,
        flex: "1 1 140px"
      },
      children: [
        /* @__PURE__ */ jsx(Icon, { size: 13, color: s.color, style: { flexShrink: 0 } }),
        /* @__PURE__ */ jsxs("div", { style: { minWidth: 0 }, children: [
          /* @__PURE__ */ jsx("div", { style: { fontSize: 9, color: vq.slate[500], textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }, children: title }),
          /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: s.color, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }, children: signal?.label ?? "Unknown" })
        ] })
      ]
    }
  );
}
function OverallBadge({ status, connectedCount, errorCount }) {
  const s = statusOf(status);
  const { Icon } = s;
  const summary = connectedCount === 0 ? "No channels connected" : errorCount > 0 ? `${errorCount} channel${errorCount === 1 ? "" : "s"} need attention` : `${connectedCount} channel${connectedCount === 1 ? "" : "s"} healthy`;
  return /* @__PURE__ */ jsxs("div", { style: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "9px 14px",
    borderRadius: 10,
    background: s.bg,
    border: `1px solid ${s.border}`
  }, children: [
    /* @__PURE__ */ jsx(Icon, { size: 17, color: s.color }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("div", { style: { fontSize: 13, fontWeight: 700, color: s.color }, children: s.label }),
      /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: vq.slate[400] }, children: summary })
    ] })
  ] });
}
function ErrorInspector({ channels, storeSlug, onRetry, retrying }) {
  const [open, setOpen] = useState(false);
  const failing = useMemo(
    () => channels.filter((c) => c.status === "red" || c.error_message),
    [channels]
  );
  if (failing.length === 0) return null;
  return /* @__PURE__ */ jsxs("div", { style: {
    background: role.danger[950],
    border: `1px solid ${role.danger[800]}`,
    borderRadius: 12,
    overflow: "hidden"
  }, children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => setOpen((v) => !v),
        "aria-expanded": open,
        style: {
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "14px 18px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          color: "inherit"
        },
        children: [
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 10, minWidth: 0 }, children: [
            /* @__PURE__ */ jsx(AlertCircle, { size: 17, color: role.danger[400], style: { flexShrink: 0 } }),
            /* @__PURE__ */ jsxs("div", { style: { minWidth: 0 }, children: [
              /* @__PURE__ */ jsxs("div", { style: { fontSize: 13, fontWeight: 700, color: role.danger[300] }, children: [
                failing.length,
                " sync error",
                failing.length === 1 ? "" : "s",
                " need attention"
              ] }),
              /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: vq.slate[400] }, children: open ? "Hide details" : "Tap to inspect and retry" })
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            ChevronDown,
            {
              size: 16,
              color: vq.slate[400],
              style: { flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }
            }
          )
        ]
      }
    ),
    open && /* @__PURE__ */ jsx("div", { style: { borderTop: `1px solid ${role.danger[900]}`, padding: "4px 0" }, children: failing.map((channel) => /* @__PURE__ */ jsxs(
      "div",
      {
        style: {
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: "14px 18px",
          borderBottom: `1px solid ${vq.slate[900]}`
        },
        children: [
          /* @__PURE__ */ jsxs("div", { style: { flex: "1 1 260px", minWidth: 0 }, children: [
            /* @__PURE__ */ jsxs("div", { style: { fontSize: 12, fontWeight: 700, color: vq.slate[200], marginBottom: 5 }, children: [
              channel.channel_name,
              /* @__PURE__ */ jsx("span", { style: { marginLeft: 8, fontSize: 10, color: vq.slate[500], fontWeight: 500 }, children: channel.platform_label })
            ] }),
            /* @__PURE__ */ jsx("pre", { style: {
              margin: 0,
              padding: "9px 11px",
              borderRadius: 7,
              background: vq.void[950] ?? "#05080f",
              border: `1px solid ${vq.slate[800]}`,
              color: role.danger[300],
              fontSize: 11,
              lineHeight: 1.5,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              maxHeight: 140,
              overflowY: "auto"
            }, children: channel.error_message || channel.api?.detail || "No error detail recorded." })
          ] }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => onRetry(channel.channel_id),
              disabled: retrying === channel.channel_id,
              style: {
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 8,
                border: "none",
                background: retrying === channel.channel_id ? vq.slate[800] : role.danger[600],
                color: retrying === channel.channel_id ? vq.slate[500] : "#fff",
                fontSize: 12,
                fontWeight: 600,
                cursor: retrying === channel.channel_id ? "not-allowed" : "pointer",
                flexShrink: 0,
                whiteSpace: "nowrap"
              },
              children: [
                /* @__PURE__ */ jsx(RotateCw, { size: 13, className: retrying === channel.channel_id ? "spin" : "" }),
                retrying === channel.channel_id ? "Retrying…" : "Retry Failed Sync"
              ]
            }
          )
        ]
      },
      channel.channel_id
    )) })
  ] });
}
function SyncHealthPanel({ health, storeSlug, syncing, onSyncNow }) {
  const [local, setLocal] = useState(health);
  const [retrying, setRetrying] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  const [dismissed, setDismissed] = useState(false);
  const pollRef = useRef(null);
  useEffect(() => {
    setLocal(health);
  }, [health]);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15e3);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (!syncing) {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return void 0;
    }
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(route("store.vensynq.health", { store_slug: storeSlug }), {
          headers: { Accept: "application/json" },
          credentials: "same-origin"
        });
        if (res.ok) {
          const data = await res.json();
          setLocal(data.health);
        }
      } catch {
      }
    }, 3e3);
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [syncing, storeSlug]);
  const channels = local?.channels ?? [];
  const lastSynced = useMemo(() => {
    const stamps = channels.map((c) => c.last_synced_at).filter(Boolean);
    if (stamps.length === 0) return null;
    return stamps.reduce((a, b) => new Date(a) > new Date(b) ? a : b);
  }, [channels]);
  const handleSyncNow = useCallback(() => {
    setLocal((prev) => ({
      ...prev,
      channels: (prev?.channels ?? []).map((c) => ({ ...c, sync_status: "syncing" }))
    }));
    onSyncNow();
  }, [onSyncNow]);
  const handleRetry = useCallback((channelId) => {
    setRetrying(channelId);
    router.post(
      route("store.vensynq.channels.retry", { store_slug: storeSlug, channel: channelId }),
      {},
      {
        preserveScroll: true,
        onFinish: () => setRetrying(null)
      }
    );
  }, [storeSlug]);
  if (!local) return null;
  return /* @__PURE__ */ jsxs("section", { style: { display: "flex", flexDirection: "column", gap: 16 }, children: [
    /* @__PURE__ */ jsxs("div", { style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 14,
      alignItems: "center",
      justifyContent: "space-between",
      background: "linear-gradient(135deg, #0d1e36 0%, #091220 100%)",
      border: "1px solid #1e3a5f",
      borderRadius: 12,
      padding: "16px 18px"
    }, children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14, minWidth: 0 }, children: [
        /* @__PURE__ */ jsx(
          OverallBadge,
          {
            status: local.overall,
            connectedCount: local.connected_count ?? 0,
            errorCount: local.error_count ?? 0
          }
        ),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 6, color: vq.slate[400], fontSize: 12 }, children: [
          /* @__PURE__ */ jsx(Clock, { size: 13 }),
          /* @__PURE__ */ jsxs("span", { children: [
            "Last synced",
            " ",
            /* @__PURE__ */ jsx("strong", { style: { color: vq.slate[200], fontWeight: 600 }, children: relativeTime(lastSynced, now) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: handleSyncNow,
          disabled: syncing,
          style: {
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "11px 22px",
            borderRadius: 10,
            border: "none",
            background: syncing ? vq.slate[800] : "linear-gradient(135deg, #3b82f6, #1d4ed8)",
            color: syncing ? vq.slate[500] : "#fff",
            fontSize: 14,
            fontWeight: 700,
            cursor: syncing ? "wait" : "pointer",
            boxShadow: syncing ? "none" : "0 4px 14px rgba(59,130,246,0.3)",
            transition: "all 0.2s",
            flexShrink: 0
          },
          children: [
            /* @__PURE__ */ jsx(RefreshCw, { size: 16, className: syncing ? "spin" : "" }),
            syncing ? "Syncing…" : "Sync Now"
          ]
        }
      )
    ] }),
    syncing && /* @__PURE__ */ jsx(
      "div",
      {
        role: "progressbar",
        "aria-label": "Sync in progress",
        style: { height: 3, borderRadius: 2, background: vq.slate[800], overflow: "hidden" },
        children: /* @__PURE__ */ jsx("div", { style: {
          height: "100%",
          width: "35%",
          borderRadius: 2,
          background: "linear-gradient(90deg, #3b82f6, #a78bfa)",
          animation: "vensynq-indeterminate 1.1s ease-in-out infinite"
        } })
      }
    ),
    /* @__PURE__ */ jsx(
      ErrorInspector,
      {
        channels,
        storeSlug,
        onRetry: handleRetry,
        retrying
      }
    ),
    channels.length > 0 && /* @__PURE__ */ jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }, children: channels.map((channel) => {
      const s = statusOf(channel.status);
      const isSyncing = channel.sync_status === "syncing";
      return /* @__PURE__ */ jsxs(
        "div",
        {
          style: {
            background: vq.void[800] ?? "#0b1220",
            border: `1px solid ${channel.status === "green" ? "#1e3a5f" : s.border}`,
            borderRadius: 12,
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 12
          },
          children: [
            /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }, children: [
              /* @__PURE__ */ jsxs("div", { style: { minWidth: 0 }, children: [
                /* @__PURE__ */ jsx("div", { style: {
                  fontSize: 13,
                  fontWeight: 700,
                  color: vq.slate[100],
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }, children: channel.channel_name }),
                /* @__PURE__ */ jsxs("div", { style: { fontSize: 11, color: vq.slate[500], marginTop: 2 }, children: [
                  channel.platform_label,
                  " · synced ",
                  relativeTime(channel.last_synced_at, now)
                ] })
              ] }),
              /* @__PURE__ */ jsx("span", { style: {
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "4px 9px",
                borderRadius: 999,
                background: s.bg,
                border: `1px solid ${s.border}`,
                color: s.color,
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                whiteSpace: "nowrap",
                flexShrink: 0
              }, children: isSyncing ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(RefreshCw, { size: 10, className: "spin" }),
                " Syncing"
              ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(s.Icon, { size: 10 }),
                " ",
                s.label
              ] }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexWrap: "wrap", gap: 8 }, children: [
              /* @__PURE__ */ jsx(SignalPill, { icon: Wifi, title: "API", signal: channel.api }),
              /* @__PURE__ */ jsx(SignalPill, { icon: Webhook, title: "Webhook", signal: channel.webhook }),
              /* @__PURE__ */ jsx(SignalPill, { icon: KeyRound, title: "Token", signal: channel.token })
            ] })
          ]
        },
        channel.channel_id
      );
    }) }),
    channels.length === 0 && !dismissed && /* @__PURE__ */ jsxs("div", { style: {
      position: "relative",
      background: vq.void[800] ?? "#0b1220",
      border: "1px dashed #1e3a5f",
      borderRadius: 12,
      padding: "26px 20px",
      textAlign: "center"
    }, children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setDismissed(true),
          "aria-label": "Dismiss",
          style: {
            position: "absolute",
            top: 10,
            right: 10,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: vq.slate[600],
            padding: 4
          },
          children: /* @__PURE__ */ jsx(X, { size: 14 })
        }
      ),
      /* @__PURE__ */ jsx(AlertTriangle, { size: 26, color: role.warning[500], style: { marginBottom: 10 } }),
      /* @__PURE__ */ jsx("h3", { style: { margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: vq.slate[300] }, children: "No marketplaces connected yet" }),
      /* @__PURE__ */ jsx("p", { style: { margin: 0, fontSize: 12, color: vq.slate[500] }, children: "Connect WooCommerce or Amazon in Settings to start importing orders automatically." })
    ] }),
    /* @__PURE__ */ jsx("style", { children: `
                @keyframes vensynq-indeterminate {
                    0%   { transform: translateX(-100%); }
                    100% { transform: translateX(400%); }
                }
                .spin { animation: vensynq-spin 1s linear infinite; }
                @keyframes vensynq-spin { to { transform: rotate(360deg); } }
                @media (max-width: 640px) {
                    .vensynq-root table { font-size: 11px; }
                }
            ` })
  ] });
}
export {
  SyncHealthPanel as default
};

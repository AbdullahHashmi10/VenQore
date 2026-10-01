import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Head, Link } from "@inertiajs/react";
import axios from "axios";
import { Bike, Wallet, RefreshCcw, WifiOff, LayoutGrid, AlertTriangle, Clock, Phone, MapPin, Check, Copy, Undo2, ChevronRight, X } from "lucide-react";
import { i as isLate, c as DELIVERY_STATES, d as DELIVERY_META, e as elapsedLabel } from "./Delivery-Bl04uOEz.js";
const POLL_MS = 15e3;
const TICK_MS = 1e3;
function RiderCashUpModal({ storeSlug, riders, onClose }) {
  const [selectedRiderId, setSelectedRiderId] = useState(riders[0]?.id || "");
  const [date, setDate] = useState(() => (/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState(null);
  const r = useCallback((name, params = {}) => route(name, { store_slug: storeSlug, ...params }), [storeSlug]);
  const loadCashUp = useCallback(async () => {
    if (!selectedRiderId) return;
    setLoading(true);
    try {
      const res = await axios.get(r("store.restaurant.dispatch.rider-cashup"), {
        params: { rider_id: selectedRiderId, date }
      });
      setData(res.data);
    } catch (err) {
      console.error("Failed to load rider cash-up:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedRiderId, date, r]);
  useEffect(() => {
    loadCashUp();
  }, [loadCashUp]);
  const handleMarkHandedIn = async () => {
    if (!data?.deliveries?.length) return;
    const unpaidIds = data.deliveries.filter((d) => !d.cash_handed_in).map((d) => d.occupancy_id);
    if (!unpaidIds.length) return;
    setSaving(true);
    try {
      await axios.post(r("store.restaurant.dispatch.cash-up"), {
        occupancy_ids: unpaidIds
      });
      await loadCashUp();
    } catch (err) {
      console.error("Failed to mark cash handed in:", err);
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ jsx("div", { style: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: "16px"
  }, onClick: onClose, children: /* @__PURE__ */ jsxs("div", { style: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "24px",
    width: "100%",
    maxWidth: "720px",
    maxHeight: "85vh",
    overflowY: "auto",
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
    border: "1px solid #e4e4e7"
  }, onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }, children: [
      /* @__PURE__ */ jsxs("h2", { style: { fontSize: "18px", fontWeight: 800, color: "#18181b", margin: 0, display: "flex", alignItems: "center", gap: "8px" }, children: [
        /* @__PURE__ */ jsx(Wallet, { size: 20, className: "text-brand-600" }),
        "Rider Shift Cash-Up & Reconciliation"
      ] }),
      /* @__PURE__ */ jsx("button", { type: "button", onClick: onClose, style: { background: "transparent", border: "none", cursor: "pointer", padding: 4 }, children: /* @__PURE__ */ jsx(X, { size: 20, className: "text-zinc-500" }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: "12px", marginBottom: "20px" }, children: [
      /* @__PURE__ */ jsxs("div", { style: { flex: 1 }, children: [
        /* @__PURE__ */ jsx("label", { style: { display: "block", fontSize: "12px", fontWeight: 700, color: "#71717a", marginBottom: "4px" }, children: "Rider" }),
        /* @__PURE__ */ jsx(
          "select",
          {
            value: selectedRiderId,
            onChange: (e) => setSelectedRiderId(e.target.value),
            style: { width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #d4d4d8", fontSize: "14px" },
            children: riders.map((rd) => /* @__PURE__ */ jsx("option", { value: rd.id, children: rd.name }, rd.id))
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { width: "180px" }, children: [
        /* @__PURE__ */ jsx("label", { style: { display: "block", fontSize: "12px", fontWeight: 700, color: "#71717a", marginBottom: "4px" }, children: "Date" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "date",
            value: date,
            onChange: (e) => setDate(e.target.value),
            style: { width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #d4d4d8", fontSize: "14px" }
          }
        )
      ] })
    ] }),
    loading ? /* @__PURE__ */ jsx("div", { style: { textAlign: "center", padding: "40px", color: "#71717a" }, children: "Loading deliveries..." }) : data ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }, children: [
        /* @__PURE__ */ jsxs("div", { style: { padding: "16px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }, children: [
          /* @__PURE__ */ jsx("span", { style: { fontSize: "12px", fontWeight: 600, color: "#64748b" }, children: "Expected Cash" }),
          /* @__PURE__ */ jsxs("div", { style: { fontSize: "22px", fontWeight: 800, color: "#0f172a" }, children: [
            "Rs ",
            data.total_expected?.toLocaleString()
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { padding: "16px", background: "#f0fdf4", borderRadius: "12px", border: "1px solid #dcfce7" }, children: [
          /* @__PURE__ */ jsx("span", { style: { fontSize: "12px", fontWeight: 600, color: "#166534" }, children: "Cash Handed In" }),
          /* @__PURE__ */ jsxs("div", { style: { fontSize: "22px", fontWeight: 800, color: "#15803d" }, children: [
            "Rs ",
            data.total_collected?.toLocaleString()
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: {
          padding: "16px",
          background: data.variance < 0 ? "#fef2f2" : "#f8fafc",
          borderRadius: "12px",
          border: `1px solid ${data.variance < 0 ? "#fecaca" : "#e2e8f0"}`
        }, children: [
          /* @__PURE__ */ jsx("span", { style: { fontSize: "12px", fontWeight: 600, color: data.variance < 0 ? "#991b1b" : "#64748b" }, children: "Variance" }),
          /* @__PURE__ */ jsx("div", { style: {
            fontSize: "22px",
            fontWeight: 800,
            color: data.variance < 0 ? "#dc2626" : "#0f172a"
          }, children: data.variance < 0 ? `-Rs ${Math.abs(data.variance).toLocaleString()}` : `Rs ${data.variance?.toLocaleString()}` })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: "13px", marginBottom: "20px" }, children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { style: { borderBottom: "2px solid #e4e4e7", textAlign: "left", color: "#71717a" }, children: [
          /* @__PURE__ */ jsx("th", { style: { padding: "8px" }, children: "Ticket" }),
          /* @__PURE__ */ jsx("th", { style: { padding: "8px" }, children: "Customer / Address" }),
          /* @__PURE__ */ jsx("th", { style: { padding: "8px" }, children: "Order Total" }),
          /* @__PURE__ */ jsx("th", { style: { padding: "8px" }, children: "Fee" }),
          /* @__PURE__ */ jsx("th", { style: { padding: "8px" }, children: "Pay Method" }),
          /* @__PURE__ */ jsx("th", { style: { padding: "8px" }, children: "Status" })
        ] }) }),
        /* @__PURE__ */ jsxs("tbody", { children: [
          data.deliveries?.map((d) => /* @__PURE__ */ jsxs("tr", { style: { borderBottom: "1px solid #f4f4f5" }, children: [
            /* @__PURE__ */ jsx("td", { style: { padding: "8px", fontWeight: 700 }, children: d.code }),
            /* @__PURE__ */ jsxs("td", { style: { padding: "8px" }, children: [
              /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("b", { children: d.customer_name || "Guest" }) }),
              /* @__PURE__ */ jsx("div", { style: { fontSize: "11px", color: "#71717a" }, children: d.address })
            ] }),
            /* @__PURE__ */ jsxs("td", { style: { padding: "8px" }, children: [
              "Rs ",
              d.order_total
            ] }),
            /* @__PURE__ */ jsxs("td", { style: { padding: "8px" }, children: [
              "Rs ",
              d.delivery_fee
            ] }),
            /* @__PURE__ */ jsx("td", { style: { padding: "8px", textTransform: "capitalize" }, children: d.payment_method }),
            /* @__PURE__ */ jsx("td", { style: { padding: "8px" }, children: d.cash_handed_in ? /* @__PURE__ */ jsx("span", { style: { color: "#15803d", fontWeight: 700 }, children: "✓ Settled" }) : /* @__PURE__ */ jsx("span", { style: { color: "#ea580c", fontWeight: 700 }, children: "Pending" }) })
          ] }, d.occupancy_id)),
          (!data.deliveries || data.deliveries.length === 0) && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 6, style: { padding: "24px", textAlign: "center", color: "#a1a1aa" }, children: "No deliveries assigned to this rider on this date." }) })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { style: { display: "flex", justifyContent: "flex-end", gap: "8px" }, children: /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: handleMarkHandedIn,
          disabled: saving || !data.deliveries?.some((d) => !d.cash_handed_in),
          style: {
            padding: "10px 18px",
            borderRadius: "8px",
            background: "#18181b",
            color: "#ffffff",
            border: "none",
            fontSize: "14px",
            fontWeight: 700,
            cursor: "pointer"
          },
          children: saving ? "Recording..." : "Mark All Cash Handed In"
        }
      ) })
    ] }) : null
  ] }) });
}
function DeliveryCard({ order, riders, onUpdateStatus, onAssignRider }) {
  const del = order.delivery || {};
  const late = isLate(del);
  const [copied, setCopied] = useState(false);
  const copyTracking = (e) => {
    e.stopPropagation();
    if (!del.tracking_token) return;
    const url = `${window.location.origin}/track/${del.tracking_token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2e3);
    });
  };
  const nextState = {
    placed: "preparing",
    preparing: "out",
    out: "delivered",
    delivered: null
  }[del.status];
  const prevState = {
    placed: null,
    preparing: "placed",
    out: "preparing",
    delivered: "out"
  }[del.status];
  return /* @__PURE__ */ jsxs("div", { style: {
    background: "#ffffff",
    borderRadius: "12px",
    border: `1px solid ${late ? "#fecaca" : "#e4e4e7"}`,
    boxShadow: late ? "0 4px 12px rgba(239,68,68,0.12)" : "0 2px 6px rgba(0,0,0,0.04)",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  }, children: [
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px" }, children: [
        /* @__PURE__ */ jsx("span", { style: {
          fontSize: "13px",
          fontWeight: 800,
          color: "#18181b",
          background: "#f4f4f5",
          padding: "2px 8px",
          borderRadius: "6px"
        }, children: order.code }),
        late && /* @__PURE__ */ jsxs("span", { style: {
          fontSize: "11px",
          fontWeight: 800,
          color: "#dc2626",
          background: "#fee2e2",
          padding: "2px 6px",
          borderRadius: "4px",
          display: "flex",
          alignItems: "center",
          gap: "3px"
        }, children: [
          /* @__PURE__ */ jsx(AlertTriangle, { size: 11 }),
          " LATE"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("span", { style: { fontSize: "12px", color: "#71717a", display: "flex", alignItems: "center", gap: "4px" }, children: [
        /* @__PURE__ */ jsx(Clock, { size: 12 }),
        /* @__PURE__ */ jsx("b", { children: elapsedLabel(del.status_at || order.opened_at) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("div", { style: { fontSize: "15px", fontWeight: 700, color: "#18181b" }, children: order.customer_name || "Guest Order" }),
      order.phone && /* @__PURE__ */ jsxs(
        "a",
        {
          href: `tel:${order.phone}`,
          style: { fontSize: "13px", color: "#2563eb", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px", marginTop: "2px" },
          children: [
            /* @__PURE__ */ jsx(Phone, { size: 12 }),
            " ",
            order.phone
          ]
        }
      ),
      order.address && /* @__PURE__ */ jsxs("div", { style: { fontSize: "13px", color: "#52525b", marginTop: "4px", display: "flex", gap: "4px", alignItems: "flex-start" }, children: [
        /* @__PURE__ */ jsx(MapPin, { size: 13, style: { flexShrink: 0, marginTop: "2px", color: "#a1a1aa" } }),
        /* @__PURE__ */ jsx("span", { children: order.address })
      ] }),
      del.note && /* @__PURE__ */ jsxs("div", { style: { fontSize: "12px", color: "#d97706", background: "#fef3c7", padding: "4px 8px", borderRadius: "4px", marginTop: "6px" }, children: [
        '"',
        del.note,
        '"'
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "#71717a", borderTop: "1px solid #f4f4f5", paddingTop: "8px" }, children: [
      /* @__PURE__ */ jsxs("span", { children: [
        "Total: ",
        /* @__PURE__ */ jsxs("b", { children: [
          "Rs ",
          order.order_total
        ] }),
        " ",
        del.fee > 0 ? `(+Rs ${del.fee} fee)` : ""
      ] }),
      /* @__PURE__ */ jsx("span", { style: { textTransform: "capitalize", fontWeight: 600 }, children: del.payment_method || "Cash" })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px" }, children: [
      /* @__PURE__ */ jsx(Bike, { size: 14, className: "text-zinc-500" }),
      /* @__PURE__ */ jsxs(
        "select",
        {
          value: del.rider_id || "",
          onChange: (e) => onAssignRider(order.occupancy_id, e.target.value),
          style: {
            flex: 1,
            padding: "6px 8px",
            borderRadius: "6px",
            border: "1px solid #d4d4d8",
            fontSize: "12px",
            background: "#ffffff"
          },
          children: [
            /* @__PURE__ */ jsx("option", { value: "", children: del.rider ? `Assigned: ${del.rider}` : "Assign Rider..." }),
            riders.map((r) => /* @__PURE__ */ jsx("option", { value: r.id, children: r.name }, r.id))
          ]
        }
      ),
      del.tracking_token && /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: copyTracking,
          title: "Copy tracking link",
          style: {
            padding: "6px 10px",
            borderRadius: "6px",
            border: "1px solid #d4d4d8",
            background: "#ffffff",
            cursor: "pointer",
            fontSize: "12px"
          },
          children: copied ? /* @__PURE__ */ jsx(Check, { size: 13, style: { color: "#10b981" } }) : /* @__PURE__ */ jsx(Copy, { size: 13 })
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: "6px", marginTop: "4px" }, children: [
      prevState && /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: () => onUpdateStatus(order.occupancy_id, prevState),
          title: "Move back a step",
          style: {
            padding: "8px 12px",
            borderRadius: "6px",
            border: "1px solid #e4e4e7",
            background: "#f4f4f5",
            cursor: "pointer"
          },
          children: /* @__PURE__ */ jsx(Undo2, { size: 14 })
        }
      ),
      nextState && /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: () => onUpdateStatus(order.occupancy_id, nextState),
          style: {
            flex: 1,
            padding: "8px 12px",
            borderRadius: "6px",
            border: "none",
            background: nextState === "delivered" ? "#10b981" : "#18181b",
            color: "#ffffff",
            fontWeight: 700,
            fontSize: "13px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px"
          },
          children: [
            /* @__PURE__ */ jsx("span", { children: DELIVERY_META[nextState]?.label || "Next" }),
            /* @__PURE__ */ jsx(ChevronRight, { size: 14 })
          ]
        }
      )
    ] })
  ] });
}
function Dispatch({ storeSlug, orders: initialOrders = [], riders: initialRiders = [] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [riders, setRiders] = useState(initialRiders);
  const [live, setLive] = useState(true);
  const [showCashUp, setShowCashUp] = useState(false);
  const [, setTick] = useState(0);
  const inFlight = useRef(false);
  const r = useCallback((name, params = {}) => route(name, { store_slug: storeSlug, ...params }), [storeSlug]);
  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    try {
      const { data } = await axios.get(r("store.restaurant.dispatch.state"));
      if (Array.isArray(data?.orders)) setOrders(data.orders);
      if (Array.isArray(data?.riders)) setRiders(data.riders);
      setLive(true);
    } catch (_) {
      setLive(false);
    }
  }, [r]);
  useEffect(() => {
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), TICK_MS);
    return () => clearInterval(id);
  }, []);
  const handleUpdateStatus = async (occupancyId, status) => {
    inFlight.current = true;
    try {
      await axios.post(r("store.tables.delivery"), {
        occupancy_id: occupancyId,
        status
      });
      await refresh();
    } catch (err) {
      console.error("Failed to update delivery status:", err);
    } finally {
      inFlight.current = false;
    }
  };
  const handleAssignRider = async (occupancyId, riderId) => {
    inFlight.current = true;
    try {
      await axios.post(r("store.tables.delivery"), {
        occupancy_id: occupancyId,
        rider_id: riderId || null
      });
      await refresh();
    } catch (err) {
      console.error("Failed to assign rider:", err);
    } finally {
      inFlight.current = false;
    }
  };
  const grouped = useMemo(() => {
    const out = { placed: [], preparing: [], out: [], delivered: [] };
    for (const ord of orders) {
      const st = ord.delivery?.status || "placed";
      if (out[st]) out[st].push(ord);
      else out.placed.push(ord);
    }
    return out;
  }, [orders]);
  const activeCount = grouped.placed.length + grouped.preparing.length + grouped.out.length;
  const lateCount = orders.filter((o) => isLate(o.delivery)).length;
  return /* @__PURE__ */ jsxs("div", { style: { minHeight: "100vh", background: "#f4f4f5", display: "flex", flexDirection: "column" }, children: [
    /* @__PURE__ */ jsx(Head, { title: "Delivery Dispatch" }),
    /* @__PURE__ */ jsxs("header", { style: {
      background: "#18181b",
      color: "#ffffff",
      padding: "12px 24px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }, children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "16px" }, children: [
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px", fontSize: "18px", fontWeight: 800 }, children: [
          /* @__PURE__ */ jsx(Bike, { size: 22, className: "text-orange-500" }),
          /* @__PURE__ */ jsx("span", { children: "Delivery Dispatch" })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: "8px" }, children: [
          /* @__PURE__ */ jsxs("span", { style: { fontSize: "12px", background: "#27272a", padding: "4px 10px", borderRadius: "6px", fontWeight: 700 }, children: [
            activeCount,
            " active"
          ] }),
          lateCount > 0 && /* @__PURE__ */ jsxs("span", { style: { fontSize: "12px", background: "#ef4444", padding: "4px 10px", borderRadius: "6px", fontWeight: 700 }, children: [
            lateCount,
            " late"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "12px" }, children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => setShowCashUp(true),
            style: {
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "#27272a",
              border: "1px solid #3f3f46",
              color: "#ffffff",
              padding: "6px 14px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer"
            },
            children: [
              /* @__PURE__ */ jsx(Wallet, { size: 14 }),
              /* @__PURE__ */ jsx("span", { children: "Rider Cash-Up" })
            ]
          }
        ),
        /* @__PURE__ */ jsxs("span", { style: {
          fontSize: "12px",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          color: live ? "#10b981" : "#ef4444"
        }, children: [
          live ? /* @__PURE__ */ jsx(RefreshCcw, { size: 12 }) : /* @__PURE__ */ jsx(WifiOff, { size: 12 }),
          live ? "Live" : "Offline"
        ] }),
        /* @__PURE__ */ jsxs(
          Link,
          {
            href: route("store.tables.index", { store_slug: storeSlug }),
            style: {
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "#a1a1aa",
              textDecoration: "none",
              fontSize: "13px",
              padding: "6px 12px",
              borderRadius: "6px"
            },
            children: [
              /* @__PURE__ */ jsx(LayoutGrid, { size: 14 }),
              " Floor"
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsx("main", { style: {
      flex: 1,
      padding: "24px",
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: "16px",
      overflowX: "auto"
    }, children: DELIVERY_STATES.map((st) => {
      const meta = DELIVERY_META[st];
      const items = grouped[st] || [];
      const Icon = meta.icon;
      return /* @__PURE__ */ jsxs("div", { style: {
        background: "#e4e4e7",
        borderRadius: "14px",
        display: "flex",
        flexDirection: "column",
        maxHeight: "calc(100vh - 120px)"
      }, children: [
        /* @__PURE__ */ jsxs("div", { style: {
          padding: "14px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #d4d4d8"
        }, children: [
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px", fontWeight: 800, fontSize: "14px", color: "#18181b" }, children: [
            /* @__PURE__ */ jsx(Icon, { size: 16 }),
            /* @__PURE__ */ jsx("span", { children: meta.label })
          ] }),
          /* @__PURE__ */ jsx("span", { style: {
            fontSize: "12px",
            fontWeight: 800,
            background: "#ffffff",
            padding: "2px 8px",
            borderRadius: "10px",
            color: "#71717a"
          }, children: items.length })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: {
          flex: 1,
          padding: "12px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "12px"
        }, children: [
          items.map((ord) => /* @__PURE__ */ jsx(
            DeliveryCard,
            {
              order: ord,
              riders,
              onUpdateStatus: handleUpdateStatus,
              onAssignRider: handleAssignRider
            },
            ord.occupancy_id
          )),
          items.length === 0 && /* @__PURE__ */ jsxs("div", { style: {
            textAlign: "center",
            padding: "32px 16px",
            color: "#a1a1aa",
            fontSize: "13px"
          }, children: [
            "No tickets in ",
            meta.label.toLowerCase()
          ] })
        ] })
      ] }, st);
    }) }),
    showCashUp && /* @__PURE__ */ jsx(
      RiderCashUpModal,
      {
        storeSlug,
        riders,
        onClose: () => setShowCashUp(false)
      }
    )
  ] });
}
export {
  Dispatch as default
};

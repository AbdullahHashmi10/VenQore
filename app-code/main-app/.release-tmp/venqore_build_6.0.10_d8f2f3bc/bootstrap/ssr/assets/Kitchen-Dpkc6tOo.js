import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Head, Link } from "@inertiajs/react";
import axios from "axios";
import { ChefHat, BarChart3, XCircle, RefreshCcw, WifiOff, LayoutGrid, Bike, ShoppingBag, Utensils, Clock, Undo2, Printer, Check, X } from "lucide-react";
import { K as KitchenPrintService } from "./KitchenPrintService-lbU3G5FH.js";
import "./AMDStation-CG85dq0d.js";
const POLL_MS = 1e4;
const TICK_MS = 1e3;
const LS_STATION = "kds_station";
const FLOW = ["pending", "preparing", "ready", "served"];
const NEXT_LABEL = { pending: "Start", preparing: "Ready", ready: "Served", served: "Done" };
const TYPE_ICON = { dine_in: Utensils, takeaway: ShoppingBag, delivery: Bike };
const ageBand = (mins) => mins >= 20 ? "late" : mins >= 10 ? "slow" : mins >= 5 ? "on" : "new";
function minutesSince(iso) {
  if (!iso) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 6e4));
}
function clock(iso) {
  if (!iso) return "—";
  const total = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1e3));
  const m = Math.floor(total / 60);
  const sec = total % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    return `${h}h ${String(m % 60).padStart(2, "0")}m`;
  }
  return `${m}:${String(sec).padStart(2, "0")}`;
}
function Ticket({ order, onBump, onRecall, onReprint, busy }) {
  const mins = minutesSince(order.fired_at || order.created_at);
  const band = order.status === "served" ? "done" : ageBand(mins);
  const Icon = TYPE_ICON[order.order_type] || Utensils;
  const idx = FLOW.indexOf(order.status);
  const canBump = idx >= 0 && idx < FLOW.length - 1;
  const canRecall = idx > 0;
  const orderType = order.order_type || "dine_in";
  const orderTypeLabel = orderType.replace("_", " ");
  return /* @__PURE__ */ jsxs("article", { className: "kds-ticket", "data-band": band, "data-status": order.status, children: [
    /* @__PURE__ */ jsxs("header", { className: "kds-ticket-h", children: [
      /* @__PURE__ */ jsxs("span", { className: "kds-ticket-where", children: [
        /* @__PURE__ */ jsx(Icon, { size: 14, "aria-hidden": "true" }),
        /* @__PURE__ */ jsx("b", { children: order.position_code || order.table_number || order.order_number }),
        /* @__PURE__ */ jsx(
          "span",
          {
            style: {
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              marginLeft: "6px",
              padding: "1px 6px",
              borderRadius: "4px",
              background: orderType === "takeaway" ? "#c2410c" : orderType === "delivery" ? "#1d4ed8" : "#047857",
              color: "#ffffff"
            },
            children: orderTypeLabel
          }
        )
      ] }),
      order.course > 1 && /* @__PURE__ */ jsxs("span", { className: "kds-course", children: [
        "Course ",
        order.course
      ] }),
      /* @__PURE__ */ jsxs("span", { className: "kds-clock vq-num", title: `Fired ${order.fired_at || order.created_at}`, children: [
        /* @__PURE__ */ jsx(Clock, { size: 13, "aria-hidden": "true" }),
        clock(order.fired_at || order.created_at)
      ] })
    ] }),
    /* @__PURE__ */ jsxs("ul", { className: "kds-items", children: [
      (order.items || []).map((it, i) => /* @__PURE__ */ jsxs("li", { className: "kds-item", children: [
        /* @__PURE__ */ jsx("span", { className: "kds-qty vq-num", children: it.qty || 1 }),
        /* @__PURE__ */ jsxs("span", { className: "kds-item-body", children: [
          /* @__PURE__ */ jsx("span", { className: "kds-item-name", children: it.name }),
          Array.isArray(it.mods) && it.mods.length > 0 && /* @__PURE__ */ jsx("span", { className: "kds-item-mods", children: it.mods.map((m) => m.name).join(" · ") }),
          Array.isArray(it.modifiers) && it.modifiers.length > 0 && /* @__PURE__ */ jsx("span", { className: "kds-item-mods", children: it.modifiers.join(" · ") }),
          it.notes && /* @__PURE__ */ jsxs("span", { className: "kds-item-note", children: [
            '"',
            it.notes,
            '"'
          ] })
        ] })
      ] }, i)),
      (order.items || []).length === 0 && /* @__PURE__ */ jsx("li", { className: "kds-item kds-item-empty", children: "Ticket has no items" })
    ] }),
    /* @__PURE__ */ jsxs("footer", { className: "kds-ticket-f", children: [
      canRecall && /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          className: "kds-btn",
          onClick: () => onRecall(order.id),
          disabled: busy,
          title: "Put this ticket back a step",
          children: /* @__PURE__ */ jsx(Undo2, { size: 15, "aria-hidden": "true" })
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          className: "kds-btn",
          onClick: () => onReprint?.(order),
          disabled: busy,
          title: "Reprint KOT docket",
          children: /* @__PURE__ */ jsx(Printer, { size: 15, "aria-hidden": "true" })
        }
      ),
      /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          className: "kds-btn kds-btn-go",
          onClick: () => onBump(order.id),
          disabled: busy || !canBump,
          children: [
            /* @__PURE__ */ jsx(Check, { size: 16, "aria-hidden": "true" }),
            NEXT_LABEL[order.status] || "Done"
          ]
        }
      )
    ] })
  ] });
}
function EightySixModal({ orders, eightySixIds, onToggle, onClose }) {
  const items = useMemo(() => {
    const seen = /* @__PURE__ */ new Map();
    for (const order of orders) {
      for (const it of order.items || []) {
        if (it.product_id && !seen.has(it.product_id)) {
          seen.set(it.product_id, it.name);
        }
      }
    }
    return [...seen.entries()].map(([id, name]) => ({ id, name }));
  }, [orders]);
  return /* @__PURE__ */ jsx(
    "div",
    {
      style: {
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999
      },
      onClick: onClose,
      children: /* @__PURE__ */ jsxs(
        "div",
        {
          style: {
            background: "#1c1c1e",
            borderRadius: "12px",
            padding: "24px",
            minWidth: "340px",
            maxWidth: "480px",
            width: "90%",
            maxHeight: "80vh",
            overflowY: "auto",
            boxShadow: "0 20px 60px rgba(0,0,0,0.6)"
          },
          onClick: (e) => e.stopPropagation(),
          children: [
            /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }, children: [
              /* @__PURE__ */ jsxs("h2", { style: { color: "#fff", fontSize: "18px", fontWeight: 700, margin: 0 }, children: [
                /* @__PURE__ */ jsx(XCircle, { size: 18, style: { marginRight: 8, verticalAlign: "middle", color: "#ef4444" }, "aria-hidden": "true" }),
                "86 List — Unavailable Items"
              ] }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: onClose,
                  style: { background: "transparent", border: "none", color: "#aaa", cursor: "pointer", padding: 4 },
                  children: /* @__PURE__ */ jsx(X, { size: 20 })
                }
              )
            ] }),
            items.length === 0 && /* @__PURE__ */ jsx("p", { style: { color: "#888", fontSize: "14px", margin: 0 }, children: "No items seen in current tickets. Items appear here once they appear on a KOT." }),
            /* @__PURE__ */ jsx("ul", { style: { listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }, children: items.map(({ id, name }) => {
              const is86 = eightySixIds.includes(id);
              return /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => onToggle(id),
                  style: {
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: `2px solid ${is86 ? "#ef4444" : "#3f3f46"}`,
                    background: is86 ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.04)",
                    color: is86 ? "#fca5a5" : "#d4d4d8",
                    fontSize: "15px",
                    cursor: "pointer",
                    textAlign: "left",
                    fontWeight: is86 ? 600 : 400,
                    textDecoration: is86 ? "line-through" : "none"
                  },
                  children: [
                    name,
                    is86 && /* @__PURE__ */ jsx("span", { style: { fontSize: "11px", fontWeight: 700, color: "#ef4444", letterSpacing: "0.05em" }, children: "86'd" })
                  ]
                }
              ) }, id);
            }) })
          ]
        }
      )
    }
  );
}
function KitchenPerformanceModal({ storeSlug, onClose }) {
  const [days, setDays] = useState(7);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    axios.get(route("store.restaurant.reports.kitchen-performance", { store_slug: storeSlug, days })).then((res) => {
      if (mounted) setData(res.data);
    }).catch((err) => console.error(err)).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [storeSlug, days]);
  return /* @__PURE__ */ jsx(
    "div",
    {
      style: {
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "16px"
      },
      onClick: onClose,
      children: /* @__PURE__ */ jsxs(
        "div",
        {
          style: {
            background: "#1c1c1e",
            borderRadius: "16px",
            padding: "24px",
            minWidth: "360px",
            maxWidth: "640px",
            width: "90%",
            maxHeight: "85vh",
            overflowY: "auto",
            boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
            border: "1px solid #27272a",
            color: "#ffffff"
          },
          onClick: (e) => e.stopPropagation(),
          children: [
            /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }, children: [
              /* @__PURE__ */ jsxs("h2", { style: { fontSize: "18px", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "8px" }, children: [
                /* @__PURE__ */ jsx(BarChart3, { size: 20, style: { color: "#3b82f6" } }),
                "Kitchen Performance Analytics"
              ] }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: onClose,
                  style: { background: "transparent", border: "none", color: "#aaa", cursor: "pointer", padding: 4 },
                  children: /* @__PURE__ */ jsx(X, { size: 20 })
                }
              )
            ] }),
            /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: "8px", marginBottom: "20px" }, children: [1, 7, 30].map((d) => /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setDays(d),
                style: {
                  padding: "6px 14px",
                  borderRadius: "8px",
                  border: "none",
                  background: days === d ? "#3b82f6" : "#27272a",
                  color: days === d ? "#ffffff" : "#a1a1aa",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer"
                },
                children: d === 1 ? "Today" : `Last ${d} Days`
              },
              d
            )) }),
            loading ? /* @__PURE__ */ jsx("div", { style: { textAlign: "center", padding: "40px", color: "#71717a" }, children: "Analyzing ticket times..." }) : data ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }, children: [
                /* @__PURE__ */ jsxs("div", { style: { padding: "16px", background: "#27272a", borderRadius: "12px" }, children: [
                  /* @__PURE__ */ jsx("span", { style: { fontSize: "12px", color: "#a1a1aa" }, children: "Total Served" }),
                  /* @__PURE__ */ jsx("div", { style: { fontSize: "24px", fontWeight: 800, marginTop: "4px" }, children: data.total_tickets })
                ] }),
                /* @__PURE__ */ jsxs("div", { style: { padding: "16px", background: "#27272a", borderRadius: "12px" }, children: [
                  /* @__PURE__ */ jsx("span", { style: { fontSize: "12px", color: "#a1a1aa" }, children: "Avg Cook Time" }),
                  /* @__PURE__ */ jsxs("div", { style: { fontSize: "24px", fontWeight: 800, color: "#60a5fa", marginTop: "4px" }, children: [
                    data.avg_cook_time,
                    "m"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { style: { padding: "16px", background: "#27272a", borderRadius: "12px" }, children: [
                  /* @__PURE__ */ jsx("span", { style: { fontSize: "12px", color: "#a1a1aa" }, children: "On-Time (≤15m)" }),
                  /* @__PURE__ */ jsxs("div", { style: { fontSize: "24px", fontWeight: 800, color: "#34d399", marginTop: "4px" }, children: [
                    data.on_time_pct,
                    "%"
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { style: { marginBottom: "20px" }, children: [
                /* @__PURE__ */ jsx("h3", { style: { fontSize: "14px", fontWeight: 700, color: "#d4d4d8", marginBottom: "10px" }, children: "Performance by Station" }),
                /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "8px" }, children: [
                  data.by_station?.map((st) => /* @__PURE__ */ jsxs("div", { style: {
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 14px",
                    background: "#27272a",
                    borderRadius: "8px",
                    fontSize: "13px"
                  }, children: [
                    /* @__PURE__ */ jsx("b", { style: { textTransform: "capitalize" }, children: st.station }),
                    /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: "16px", color: "#a1a1aa" }, children: [
                      /* @__PURE__ */ jsxs("span", { children: [
                        st.count,
                        " tickets"
                      ] }),
                      /* @__PURE__ */ jsxs("span", { style: { color: "#60a5fa", fontWeight: 700 }, children: [
                        "Avg ",
                        st.avg_mins,
                        "m"
                      ] })
                    ] })
                  ] }, st.station)),
                  (!data.by_station || data.by_station.length === 0) && /* @__PURE__ */ jsx("div", { style: { color: "#71717a", fontSize: "13px" }, children: "No completed tickets in this period." })
                ] })
              ] })
            ] }) : null
          ]
        }
      )
    }
  );
}
function RestaurantKitchen({ storeSlug, orders: initial = [] }) {
  const [orders, setOrders] = useState(initial);
  const [status, setStatus] = useState("open");
  const [station, setStation] = useState(() => localStorage.getItem(LS_STATION) || "all");
  const [busyId, setBusyId] = useState(null);
  const [live, setLive] = useState(true);
  const [, setTick] = useState(0);
  const [eightySixIds, setEightySixIds] = useState([]);
  const [show86Modal, setShow86Modal] = useState(false);
  const [showPerfModal, setShowPerfModal] = useState(false);
  const inFlight = useRef(false);
  const r = useCallback((name, params = {}) => route(name, { store_slug: storeSlug, ...params }), [storeSlug]);
  const handleStationChange = useCallback((s) => {
    setStation(s);
    localStorage.setItem(LS_STATION, s);
  }, []);
  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    try {
      const { data } = await axios.get(r("store.restaurant.kitchen.state"));
      if (Array.isArray(data?.orders)) setOrders(data.orders);
      if (Array.isArray(data?.eighty_six_ids)) setEightySixIds(data.eighty_six_ids);
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
  const act = async (name, id) => {
    setBusyId(id);
    inFlight.current = true;
    try {
      const { data } = await axios.post(r(name, { id }));
      if (data?.order) {
        setOrders((prev) => prev.map((o) => o.id === data.order.id ? data.order : o));
      }
      setLive(true);
    } catch (_) {
      setLive(false);
    } finally {
      inFlight.current = false;
      setBusyId(null);
    }
  };
  const handleReprint = async (order) => {
    try {
      const { data } = await axios.post(r("store.tables.kitchen.reprint"), {
        ticket_id: order.id
      });
      if (data?.kot) {
        KitchenPrintService.printKOT(data.kot, { isReprint: true });
      }
    } catch (err) {
      console.error("Failed to reprint ticket:", err);
    }
  };
  const handleToggle86 = async (productId) => {
    try {
      const { data } = await axios.post(r("store.tables.kitchen.86"), { product_id: productId });
      if (Array.isArray(data?.eighty_six_ids)) setEightySixIds(data.eighty_six_ids);
    } catch (err) {
      console.error("Failed to update 86 list:", err);
    }
  };
  const stations = useMemo(() => {
    const set = new Set(orders.map((o) => o.station).filter(Boolean));
    return [...set].sort();
  }, [orders]);
  const shown = useMemo(() => {
    let list = orders;
    if (status === "open") list = list.filter((o) => o.status === "pending" || o.status === "preparing");
    else if (status !== "all") list = list.filter((o) => o.status === status);
    if (station !== "all") list = list.filter((o) => (o.station || "kitchen") === station);
    return [...list].sort((a, b) => new Date(a.fired_at || a.created_at) - new Date(b.fired_at || b.created_at));
  }, [orders, status, station]);
  const lateCount = shown.filter((o) => (o.status === "pending" || o.status === "preparing") && minutesSince(o.fired_at || o.created_at) >= 10).length;
  return /* @__PURE__ */ jsxs("div", { className: "kds", children: [
    /* @__PURE__ */ jsx(Head, { title: "Kitchen" }),
    /* @__PURE__ */ jsxs("header", { className: "kds-bar", children: [
      /* @__PURE__ */ jsxs("span", { className: "kds-brand", children: [
        /* @__PURE__ */ jsx(ChefHat, { size: 20, "aria-hidden": "true" }),
        /* @__PURE__ */ jsx("b", { children: "Kitchen" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "kds-seg", role: "tablist", "aria-label": "Which tickets", children: [["open", "Cooking"], ["ready", "Ready"], ["served", "Served"], ["all", "All"]].map(([id, label]) => /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          role: "tab",
          "aria-selected": status === id,
          "data-on": status === id ? "1" : "0",
          onClick: () => setStatus(id),
          children: label
        },
        id
      )) }),
      stations.length > 1 && /* @__PURE__ */ jsxs("div", { className: "kds-seg", role: "tablist", "aria-label": "Station", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            role: "tab",
            "aria-selected": station === "all",
            "data-on": station === "all" ? "1" : "0",
            onClick: () => handleStationChange("all"),
            children: "All stations"
          }
        ),
        stations.map((s) => /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            role: "tab",
            "aria-selected": station === s,
            "data-on": station === s ? "1" : "0",
            onClick: () => handleStationChange(s),
            children: s
          },
          s
        ))
      ] }),
      /* @__PURE__ */ jsxs("span", { className: "kds-bar-end", children: [
        eightySixIds.length > 0 && /* @__PURE__ */ jsxs(
          "span",
          {
            style: {
              fontSize: "12px",
              fontWeight: 700,
              color: "#ef4444",
              background: "rgba(239,68,68,0.15)",
              borderRadius: "4px",
              padding: "2px 8px",
              marginRight: "4px"
            },
            title: "Items currently 86'd",
            children: [
              "86: ",
              eightySixIds.length
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            className: "kds-btn",
            onClick: () => setShowPerfModal(true),
            title: "View Kitchen Performance Analytics",
            style: { fontSize: "12px", fontWeight: 700, letterSpacing: "0.05em" },
            children: [
              /* @__PURE__ */ jsx(BarChart3, { size: 14, "aria-hidden": "true" }),
              "Stats"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            className: "kds-btn",
            onClick: () => setShow86Modal(true),
            title: "Manage 86 list (unavailable items)",
            style: { fontSize: "12px", fontWeight: 700, letterSpacing: "0.05em" },
            children: [
              /* @__PURE__ */ jsx(XCircle, { size: 14, "aria-hidden": "true" }),
              "86"
            ]
          }
        ),
        lateCount > 0 && /* @__PURE__ */ jsxs("span", { className: "kds-late", title: "Tickets over ten minutes old", children: [
          lateCount,
          " late"
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "kds-live", "data-live": live ? "1" : "0", title: live ? "Updating every 10 seconds" : "Not reaching the server", children: [
          live ? /* @__PURE__ */ jsx(RefreshCcw, { size: 13, "aria-hidden": "true" }) : /* @__PURE__ */ jsx(WifiOff, { size: 13, "aria-hidden": "true" }),
          live ? "Live" : "Offline"
        ] }),
        /* @__PURE__ */ jsxs(Link, { href: route("store.tables.index", { store_slug: storeSlug }), className: "kds-link", children: [
          /* @__PURE__ */ jsx(LayoutGrid, { size: 14, "aria-hidden": "true" }),
          "Floor"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("main", { className: "kds-board", children: [
      shown.map((o) => /* @__PURE__ */ jsx(
        Ticket,
        {
          order: o,
          busy: busyId === o.id,
          onBump: (id) => act("store.restaurant.order.bump", id),
          onRecall: (id) => act("store.restaurant.order.recall", id),
          onReprint: handleReprint
        },
        o.id
      )),
      shown.length === 0 && /* @__PURE__ */ jsxs("div", { className: "kds-empty", children: [
        /* @__PURE__ */ jsx(ChefHat, { size: 40, strokeWidth: 1.5, "aria-hidden": "true" }),
        /* @__PURE__ */ jsx("p", { children: status === "open" ? "Nothing on. The pass is clear." : "No tickets here." })
      ] })
    ] }),
    show86Modal && /* @__PURE__ */ jsx(
      EightySixModal,
      {
        orders,
        eightySixIds,
        onToggle: handleToggle86,
        onClose: () => setShow86Modal(false)
      }
    ),
    showPerfModal && /* @__PURE__ */ jsx(
      KitchenPerformanceModal,
      {
        storeSlug,
        onClose: () => setShowPerfModal(false)
      }
    )
  ] });
}
export {
  RestaurantKitchen as default
};

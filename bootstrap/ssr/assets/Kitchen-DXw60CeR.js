import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Head, Link } from "@inertiajs/react";
import axios from "axios";
import { ChefHat, RefreshCcw, WifiOff, LayoutGrid, Bike, ShoppingBag, Utensils, Clock, Undo2, Check } from "lucide-react";
const POLL_MS = 1e4;
const TICK_MS = 1e3;
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
function Ticket({ order, onBump, onRecall, busy }) {
  const mins = minutesSince(order.fired_at || order.created_at);
  const band = order.status === "served" ? "done" : ageBand(mins);
  const Icon = TYPE_ICON[order.order_type] || Utensils;
  const idx = FLOW.indexOf(order.status);
  const canBump = idx >= 0 && idx < FLOW.length - 1;
  const canRecall = idx > 0;
  return /* @__PURE__ */ jsxs("article", { className: "kds-ticket", "data-band": band, "data-status": order.status, children: [
    /* @__PURE__ */ jsxs("header", { className: "kds-ticket-h", children: [
      /* @__PURE__ */ jsxs("span", { className: "kds-ticket-where", children: [
        /* @__PURE__ */ jsx(Icon, { size: 14, "aria-hidden": "true" }),
        /* @__PURE__ */ jsx("b", { children: order.position_code || order.table_number || order.order_number })
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
            "“",
            it.notes,
            "”"
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
function RestaurantKitchen({ storeSlug, orders: initial = [] }) {
  const [orders, setOrders] = useState(initial);
  const [status, setStatus] = useState("open");
  const [station, setStation] = useState("all");
  const [busyId, setBusyId] = useState(null);
  const [live, setLive] = useState(true);
  const [, setTick] = useState(0);
  const inFlight = useRef(false);
  const r = useCallback((name, params = {}) => route(name, { store_slug: storeSlug, ...params }), [storeSlug]);
  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    try {
      const { data } = await axios.get(r("store.restaurant.kitchen.state"));
      if (Array.isArray(data?.orders)) setOrders(data.orders);
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
            onClick: () => setStation("all"),
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
            onClick: () => setStation(s),
            children: s
          },
          s
        ))
      ] }),
      /* @__PURE__ */ jsxs("span", { className: "kds-bar-end", children: [
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
          onRecall: (id) => act("store.restaurant.order.recall", id)
        },
        o.id
      )),
      shown.length === 0 && /* @__PURE__ */ jsxs("div", { className: "kds-empty", children: [
        /* @__PURE__ */ jsx(ChefHat, { size: 40, strokeWidth: 1.5, "aria-hidden": "true" }),
        /* @__PURE__ */ jsx("p", { children: status === "open" ? "Nothing on. The pass is clear." : "No tickets here." })
      ] })
    ] })
  ] });
}
export {
  RestaurantKitchen as default
};

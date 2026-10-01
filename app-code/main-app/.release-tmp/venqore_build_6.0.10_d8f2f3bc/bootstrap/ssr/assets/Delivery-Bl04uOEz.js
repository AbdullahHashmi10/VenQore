import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { PackageCheck, Bike, ChefHat, StickyNote, User, Phone, MapPin, Wallet, CreditCard, Check, Copy, Search, Loader2, Timer } from "lucide-react";
const DELIVERY_STATES = ["placed", "preparing", "out", "delivered"];
const DELIVERY_META = {
  placed: { label: "Placed", short: "Placed", icon: StickyNote, tone: "idle" },
  preparing: { label: "Preparing", short: "Cooking", icon: ChefHat, tone: "work" },
  out: { label: "On the way", short: "On the way", icon: Bike, tone: "live" },
  delivered: { label: "Delivered", short: "Delivered", icon: PackageCheck, tone: "done" }
};
function sinceMinutes(iso) {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((Date.now() - t) / 6e4));
}
function elapsedLabel(iso) {
  const m = sinceMinutes(iso);
  if (m === null) return "";
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}
function isLate(delivery) {
  if (!delivery || delivery.status !== "out") return false;
  const eta = Number(delivery.eta_minutes);
  if (!eta) return false;
  const m = sinceMinutes(delivery.status_at);
  return m !== null && m > eta;
}
function DeliveryChip({ delivery, compact = false }) {
  if (!delivery) return null;
  const meta = DELIVERY_META[delivery.status] || DELIVERY_META.placed;
  const Icon = meta.icon;
  const late = isLate(delivery);
  return /* @__PURE__ */ jsxs(
    "span",
    {
      className: "vqd-chip",
      "data-tone": meta.tone,
      "data-late": late ? "1" : "0",
      title: late ? `${meta.label} — ${elapsedLabel(delivery.status_at)}, past the ${delivery.eta_minutes} minute estimate` : `${meta.label} — ${elapsedLabel(delivery.status_at)}`,
      children: [
        /* @__PURE__ */ jsx(Icon, { size: 12, "aria-hidden": "true" }),
        !compact && /* @__PURE__ */ jsx("span", { children: meta.short }),
        /* @__PURE__ */ jsx("b", { className: "vq-num", children: elapsedLabel(delivery.status_at) })
      ]
    }
  );
}
function AddressPicker({ storeSlug, value, onPick }) {
  const [q, setQ] = useState(value || "");
  const [matches, setMatches] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timer = useRef(null);
  const box = useRef(null);
  useEffect(() => {
    clearTimeout(timer.current);
    if (q.trim().length < 2) {
      setMatches([]);
      setLoading(false);
      return void 0;
    }
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const { data } = await axios.get(
          route("store.tables.address-book", { store_slug: storeSlug }),
          { params: { q: q.trim() } }
        );
        setMatches(data?.matches || []);
        setOpen(true);
      } catch (_) {
        setMatches([]);
      } finally {
        setLoading(false);
      }
    }, 260);
    return () => clearTimeout(timer.current);
  }, [q, storeSlug]);
  useEffect(() => {
    const away = (e) => {
      if (box.current && !box.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, []);
  return /* @__PURE__ */ jsxs("div", { className: "vqd-picker", ref: box, children: [
    /* @__PURE__ */ jsxs("label", { className: "vqt-field vqt-field-stacked", children: [
      /* @__PURE__ */ jsxs("span", { className: "vqt-field-l", children: [
        /* @__PURE__ */ jsx(Search, { size: 12, "aria-hidden": "true" }),
        " Find a customer"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "vqd-picker-input", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            className: "vqt-input",
            value: q,
            onChange: (e) => setQ(e.target.value),
            onFocus: () => matches.length && setOpen(true),
            placeholder: "Name or phone — picks up their saved address",
            autoComplete: "off"
          }
        ),
        loading && /* @__PURE__ */ jsx(Loader2, { size: 14, className: "vqd-picker-spin", "aria-hidden": "true" })
      ] })
    ] }),
    open && matches.length > 0 && /* @__PURE__ */ jsx("ul", { className: "vqd-picker-list", role: "listbox", children: matches.map((m, i) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        className: "vqd-picker-row",
        onClick: () => {
          onPick?.(m);
          setOpen(false);
          setQ(m.name || m.phone || "");
        },
        children: [
          /* @__PURE__ */ jsxs("span", { className: "vqd-picker-who", children: [
            /* @__PURE__ */ jsx("b", { children: m.name || "No name" }),
            m.phone && /* @__PURE__ */ jsx("span", { className: "vq-num", children: m.phone }),
            m.source === "recent" && /* @__PURE__ */ jsx("em", { children: "previous order" })
          ] }),
          m.address && /* @__PURE__ */ jsx("span", { className: "vqd-picker-addr", children: m.address })
        ]
      }
    ) }, `${m.party_id || "r"}-${i}`)) })
  ] });
}
function RiderPicker({ storeSlug, riderName, riderId, onSelect }) {
  const [riders, setRiders] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const box = useRef(null);
  const loadRiders = async () => {
    if (!storeSlug) return;
    setLoading(true);
    try {
      const { data } = await axios.get(route("store.riders.list", { store_slug: storeSlug }));
      setRiders(data?.riders || []);
    } catch (_) {
      setRiders([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const away = (e) => {
      if (box.current && !box.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, []);
  return /* @__PURE__ */ jsxs("div", { className: "vqd-picker", ref: box, style: { position: "relative" }, children: [
    /* @__PURE__ */ jsxs("label", { className: "vqt-field vqt-field-stacked", children: [
      /* @__PURE__ */ jsxs("span", { className: "vqt-field-l", children: [
        /* @__PURE__ */ jsx(Bike, { size: 12, "aria-hidden": "true" }),
        " Rider"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "vqd-picker-input", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            className: "vqt-input",
            value: riderName || "",
            onChange: (e) => onSelect({ id: null, name: e.target.value }),
            onFocus: () => {
              loadRiders();
              setOpen(true);
            },
            placeholder: "Select rider or type name",
            autoComplete: "off"
          }
        ),
        loading && /* @__PURE__ */ jsx(Loader2, { size: 14, className: "vqd-picker-spin", "aria-hidden": "true" })
      ] })
    ] }),
    open && riders.length > 0 && /* @__PURE__ */ jsx("ul", { className: "vqd-picker-list", role: "listbox", style: { zIndex: 100 }, children: riders.map((r) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        className: "vqd-picker-row",
        onClick: () => {
          onSelect({ id: r.id, name: r.name });
          setOpen(false);
        },
        style: { display: "flex", justifyContent: "space-between", alignItems: "center" },
        children: [
          /* @__PURE__ */ jsx("span", { className: "vqd-picker-who", children: /* @__PURE__ */ jsx("b", { children: r.name }) }),
          /* @__PURE__ */ jsx("span", { style: {
            fontSize: "11px",
            fontWeight: 700,
            padding: "2px 6px",
            borderRadius: "4px",
            background: r.live_count > 0 ? "rgba(234,88,12,0.15)" : "rgba(16,185,129,0.15)",
            color: r.live_count > 0 ? "#ea580c" : "#10b981"
          }, children: r.live_count > 0 ? `${r.live_count} out` : "Available" })
        ]
      }
    ) }, r.id)) })
  ] });
}
function DeliveryFields({ v, set, showRider = true, storeSlug = null }) {
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("label", { className: "vqt-field vqt-field-stacked", children: [
      /* @__PURE__ */ jsxs("span", { className: "vqt-field-l", children: [
        /* @__PURE__ */ jsx(MapPin, { size: 12, "aria-hidden": "true" }),
        " Address"
      ] }),
      /* @__PURE__ */ jsx(
        "textarea",
        {
          className: "vqt-input vqt-textarea",
          value: v.address,
          onChange: (e) => set("address", e.target.value),
          placeholder: "Street, building, floor — whatever gets a stranger to the door",
          rows: 3
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("label", { className: "vqt-field vqt-field-stacked", children: [
      /* @__PURE__ */ jsxs("span", { className: "vqt-field-l", children: [
        /* @__PURE__ */ jsx(StickyNote, { size: 12, "aria-hidden": "true" }),
        " Delivery instructions"
      ] }),
      /* @__PURE__ */ jsx(
        "textarea",
        {
          className: "vqt-input vqt-textarea",
          value: v.deliveryNote,
          onChange: (e) => set("deliveryNote", e.target.value),
          placeholder: "Gate code, “call on arrival”, “leave with the guard”",
          rows: 2
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "vqd-row3", children: [
      /* @__PURE__ */ jsxs("label", { className: "vqt-field vqt-field-stacked", children: [
        /* @__PURE__ */ jsxs("span", { className: "vqt-field-l", children: [
          /* @__PURE__ */ jsx(Wallet, { size: 12, "aria-hidden": "true" }),
          " Delivery fee"
        ] }),
        /* @__PURE__ */ jsx(
          "input",
          {
            className: "vqt-input vq-num",
            value: v.deliveryFee,
            onChange: (e) => set("deliveryFee", e.target.value.replace(/[^\d.]/g, "")),
            placeholder: "0",
            inputMode: "decimal"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "vqt-field vqt-field-stacked", children: [
        /* @__PURE__ */ jsxs("span", { className: "vqt-field-l", children: [
          /* @__PURE__ */ jsx(Timer, { size: 12, "aria-hidden": "true" }),
          " Promised in"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "vqd-eta", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              className: "vqt-input vq-num",
              value: v.etaMinutes,
              onChange: (e) => set("etaMinutes", e.target.value.replace(/[^\d]/g, "")),
              placeholder: "30",
              inputMode: "numeric"
            }
          ),
          /* @__PURE__ */ jsx("span", { className: "vqd-eta-unit", children: "min" })
        ] })
      ] }),
      showRider && /* @__PURE__ */ jsx(
        RiderPicker,
        {
          storeSlug,
          riderName: v.rider,
          riderId: v.riderId,
          onSelect: ({ id, name }) => {
            set("rider", name);
            set("riderId", id);
          }
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "vqd-quick", children: [
      /* @__PURE__ */ jsx("span", { className: "vqd-quick-l", children: "Quick ETA" }),
      [15, 30, 45, 60].map((n) => /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          className: "vqd-quick-b",
          "data-on": String(n) === String(v.etaMinutes) ? "1" : "0",
          onClick: () => set("etaMinutes", String(n)),
          children: [
            n,
            " min"
          ]
        },
        n
      ))
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "vqd-quick", style: { marginTop: "8px" }, children: [
      /* @__PURE__ */ jsxs("span", { className: "vqd-quick-l", children: [
        /* @__PURE__ */ jsx(CreditCard, { size: 11, style: { marginRight: 4, verticalAlign: "middle" } }),
        " Payment"
      ] }),
      ["cash", "card", "online", "prepaid"].map((pm) => /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          className: "vqd-quick-b",
          "data-on": (v.paymentMethod || "cash") === pm ? "1" : "0",
          onClick: () => set("paymentMethod", pm),
          style: { textTransform: "capitalize" },
          children: pm
        },
        pm
      ))
    ] })
  ] });
}
function DeliveryPanel({ ticket, onUpdate, onError, money, storeSlug }) {
  const delivery = ticket?.delivery;
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 3e4);
    return () => clearInterval(id);
  }, []);
  const [form, setForm] = useState(() => ({
    address: ticket?.address || "",
    deliveryNote: delivery?.note || "",
    deliveryFee: delivery?.fee ? String(delivery.fee) : "",
    etaMinutes: delivery?.eta_minutes ? String(delivery.eta_minutes) : "",
    rider: delivery?.rider || "",
    riderId: delivery?.rider_id || null,
    paymentMethod: delivery?.payment_method || "cash",
    collectedAmount: delivery?.collected_amount ? String(delivery.collected_amount) : ""
  }));
  const seededFor = useRef(ticket?.occupancy_id);
  useEffect(() => {
    if (seededFor.current === ticket?.occupancy_id) return;
    seededFor.current = ticket?.occupancy_id;
    setEditing(false);
    setForm({
      address: ticket?.address || "",
      deliveryNote: ticket?.delivery?.note || "",
      deliveryFee: ticket?.delivery?.fee ? String(ticket.delivery.fee) : "",
      etaMinutes: ticket?.delivery?.eta_minutes ? String(ticket.delivery.eta_minutes) : "",
      rider: ticket?.delivery?.rider || "",
      riderId: ticket?.delivery?.rider_id || null,
      paymentMethod: ticket?.delivery?.payment_method || "cash",
      collectedAmount: ticket?.delivery?.collected_amount ? String(ticket.delivery.collected_amount) : ""
    });
  }, [ticket?.occupancy_id]);
  const set = useCallback((k, val) => setForm((f) => ({ ...f, [k]: val })), []);
  const push = useCallback(async (patch) => {
    if (!ticket?.occupancy_id || !onUpdate) return;
    setSaving(true);
    try {
      await onUpdate(ticket.occupancy_id, patch);
    } catch (e) {
      onError?.(e?.response?.data?.message || "That delivery could not be updated.");
    } finally {
      setSaving(false);
    }
  }, [ticket?.occupancy_id, onUpdate, onError]);
  const copyTrackingLink = () => {
    if (!delivery?.tracking_token) return;
    const url = `${window.location.origin}/track/${delivery.tracking_token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2e3);
    });
  };
  if (!ticket || !delivery) return null;
  const late = isLate(delivery);
  const activeIdx = DELIVERY_STATES.indexOf(delivery.status);
  return /* @__PURE__ */ jsxs("section", { className: "vqd-panel", "data-late": late ? "1" : "0", children: [
    /* @__PURE__ */ jsxs("header", { className: "vqd-panel-h", children: [
      /* @__PURE__ */ jsx(Bike, { size: 14, "aria-hidden": "true" }),
      /* @__PURE__ */ jsx("b", { children: "Delivery" }),
      /* @__PURE__ */ jsx("span", { className: "vq-num vqd-panel-code", children: ticket.code }),
      /* @__PURE__ */ jsx(DeliveryChip, { delivery })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "vqd-ladder", role: "group", "aria-label": "Delivery status", children: DELIVERY_STATES.map((st, i) => {
      const meta = DELIVERY_META[st];
      const Icon = meta.icon;
      return /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          className: "vqd-step",
          "data-on": st === delivery.status ? "1" : "0",
          "data-past": i < activeIdx ? "1" : "0",
          disabled: saving,
          onClick: () => push({ status: st }),
          "aria-pressed": st === delivery.status,
          children: [
            /* @__PURE__ */ jsx(Icon, { size: 14, "aria-hidden": "true" }),
            /* @__PURE__ */ jsx("span", { children: meta.label })
          ]
        },
        st
      );
    }) }),
    late && /* @__PURE__ */ jsxs("p", { className: "vqd-late", children: [
      "Past the ",
      delivery.eta_minutes,
      " minute promise by",
      " ",
      /* @__PURE__ */ jsxs("b", { className: "vq-num", children: [
        sinceMinutes(delivery.status_at) - delivery.eta_minutes,
        "m"
      ] }),
      "."
    ] }),
    !editing ? /* @__PURE__ */ jsxs("div", { className: "vqd-read", children: [
      /* @__PURE__ */ jsxs("dl", { children: [
        ticket.customer_name && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("dt", { children: [
            /* @__PURE__ */ jsx(User, { size: 11 }),
            " Name"
          ] }),
          /* @__PURE__ */ jsx("dd", { children: ticket.customer_name })
        ] }),
        ticket.phone && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("dt", { children: [
            /* @__PURE__ */ jsx(Phone, { size: 11 }),
            " Phone"
          ] }),
          /* @__PURE__ */ jsx("dd", { className: "vq-num", children: ticket.phone })
        ] }),
        ticket.address && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("dt", { children: [
            /* @__PURE__ */ jsx(MapPin, { size: 11 }),
            " Address"
          ] }),
          /* @__PURE__ */ jsx("dd", { children: ticket.address })
        ] }),
        delivery.note && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("dt", { children: [
            /* @__PURE__ */ jsx(StickyNote, { size: 11 }),
            " Instructions"
          ] }),
          /* @__PURE__ */ jsx("dd", { children: delivery.note })
        ] }),
        delivery.rider && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("dt", { children: [
            /* @__PURE__ */ jsx(Bike, { size: 11 }),
            " Rider"
          ] }),
          /* @__PURE__ */ jsx("dd", { children: delivery.rider })
        ] }),
        Number(delivery.fee) > 0 && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("dt", { children: [
            /* @__PURE__ */ jsx(Wallet, { size: 11 }),
            " Fee"
          ] }),
          /* @__PURE__ */ jsx("dd", { className: "vq-num", children: money ? money(delivery.fee) : delivery.fee })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("dt", { children: [
            /* @__PURE__ */ jsx(CreditCard, { size: 11 }),
            " Pay Method"
          ] }),
          /* @__PURE__ */ jsx("dd", { style: { textTransform: "capitalize" }, children: delivery.payment_method || "Cash" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: "8px", marginTop: "12px" }, children: [
        /* @__PURE__ */ jsx("button", { type: "button", className: "vqt-btn", onClick: () => setEditing(true), children: "Edit details" }),
        delivery.tracking_token && /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            className: "vqt-btn",
            onClick: copyTrackingLink,
            title: "Copy public customer tracking link",
            children: [
              copied ? /* @__PURE__ */ jsx(Check, { size: 13, style: { color: "#10b981" } }) : /* @__PURE__ */ jsx(Copy, { size: 13 }),
              copied ? "Link Copied!" : "Tracking Link"
            ]
          }
        )
      ] })
    ] }) : /* @__PURE__ */ jsxs("div", { className: "vqd-edit", children: [
      /* @__PURE__ */ jsx(DeliveryFields, { v: form, set, storeSlug }),
      /* @__PURE__ */ jsxs("div", { className: "vqd-edit-f", children: [
        /* @__PURE__ */ jsx("button", { type: "button", className: "vqt-btn", onClick: () => setEditing(false), children: "Cancel" }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            className: "vqt-btn vqt-btn-go",
            disabled: saving,
            onClick: async () => {
              await push({
                address: form.address,
                note: form.deliveryNote,
                fee: form.deliveryFee === "" ? 0 : Number(form.deliveryFee),
                eta_minutes: form.etaMinutes === "" ? null : Number(form.etaMinutes),
                rider: form.rider,
                rider_id: form.riderId,
                payment_method: form.paymentMethod
              });
              setEditing(false);
            },
            children: [
              /* @__PURE__ */ jsx(Check, { size: 15 }),
              " Save"
            ]
          }
        )
      ] })
    ] })
  ] });
}
export {
  AddressPicker as A,
  DeliveryChip as D,
  DeliveryFields as a,
  DeliveryPanel as b,
  DELIVERY_STATES as c,
  DELIVERY_META as d,
  elapsedLabel as e,
  isLate as i
};

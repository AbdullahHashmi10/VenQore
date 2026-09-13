import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useRef, useMemo } from "react";
import { Head, Link } from "@inertiajs/react";
import axios from "axios";
import { ChevronLeft, Lock, Pencil, Trash2, Plus, ShoppingBag, Bike, LayoutGrid, Loader2, Check, X, GripVertical, Users } from "lucide-react";
import { O as OneGlanceLayout, T as Toast } from "./OneGlanceLayout-D0x15wPs.js";
import { C as ConfirmModal } from "./ConfirmModal-DaQlI6mj.js";
import { u as useTermText } from "./terms-DwYjlWsV.js";
import "react-dom";
import "./plans-CxabWI_P.js";
import "./runtime-DwSFgQZq.js";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "dexie";
import "@headlessui/react";
import "./Input-BO7OpFmF.js";
import "./AiIsland-Ccw9HuV0.js";
import "motion/react";
import "./ThinkingOrb-DGYTy5s1.js";
import "laravel-echo";
import "pusher-js";
import "driver.js";
import "./utils-H80jjgLf.js";
import "clsx";
import "tailwind-merge";
function FloorBuilder({ zones: initialZones = [], positions: initialPositions = [], settings = {}, storeSlug }) {
  const tt = useTermText();
  const [zones, setZones] = useState(initialZones);
  const [positions, setPositions] = useState(initialPositions);
  const [lanes, setLanes] = useState({
    takeaway: String(settings?.lane_takeaway ?? "0") === "1",
    delivery: String(settings?.lane_delivery ?? "0") === "1"
  });
  const [busy, setBusy] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [confirm, setConfirm] = useState(null);
  const [openZone, setOpenZone] = useState(() => initialZones[0]?.name || null);
  const [renaming, setRenaming] = useState(null);
  const [addingZone, setAddingZone] = useState(false);
  const dragId = useRef(null);
  const r = (name, params = {}) => route(name, { store_slug: storeSlug, ...params });
  const say = (msg, type = "success") => {
    setToasts((t) => [...t, { id: Date.now() + Math.random(), message: msg, type }]);
  };
  const post = async (name, body) => {
    setBusy(true);
    try {
      const { data } = await axios.post(r(name), body);
      if (Array.isArray(data?.zones)) setZones(data.zones);
      if (Array.isArray(data?.positions)) setPositions(data.positions);
      return data;
    } catch (e) {
      say(e?.response?.data?.message || "That did not work.", "error");
      return null;
    } finally {
      setBusy(false);
    }
  };
  const byZone = useMemo(() => {
    const m = /* @__PURE__ */ new Map();
    zones.forEach((z) => m.set(z.name, []));
    positions.forEach((p) => {
      if (!m.has(p.zone)) m.set(p.zone, []);
      m.get(p.zone).push(p);
    });
    return m;
  }, [zones, positions]);
  const totals = useMemo(() => ({
    tables: positions.length,
    seats: positions.reduce((a, p) => a + (Number(p.capacity) || 0), 0),
    busy: positions.filter((p) => p.has_open_bill).length
  }), [positions]);
  const addZone = async (name) => {
    const clean = (name || "").trim();
    if (!clean) return;
    const d = await post("store.tables.plan.zone.add", { name: clean });
    if (d) {
      setOpenZone(clean);
      setAddingZone(false);
      say(`${clean} added`);
    }
  };
  const renameZone = async (from, to) => {
    const clean = (to || "").trim();
    setRenaming(null);
    if (!clean || clean === from) return;
    const d = await post("store.tables.plan.zone.rename", { from, to: clean });
    if (d) {
      setOpenZone(clean);
      say(`Renamed to ${clean}`);
    }
  };
  const removeZone = (name) => {
    const tables = byZone.get(name) || [];
    const others = zones.filter((z) => z.name !== name);
    const openBills = tables.filter((t) => t.has_open_bill).length;
    if (openBills) {
      say(`${name} has ${openBills} table${openBills === 1 ? "" : "s"} with an open bill. Settle or close ${openBills === 1 ? "it" : "them"} first.`, "error");
      return;
    }
    setConfirm({
      title: `Remove ${name}?`,
      message: tables.length === 0 ? "This area is empty, so nothing else changes." : others.length ? `${tables.length} table${tables.length === 1 ? "" : "s"} are in it. They will move to ${others[0].name} rather than be deleted.` : `${tables.length} table${tables.length === 1 ? "" : "s"} are in it and there is nowhere to move them, so they will be deleted.`,
      onConfirm: async () => {
        setConfirm(null);
        const d = await post("store.tables.plan.zone.remove", {
          name,
          move_to: tables.length && others.length ? others[0].name : null
        });
        if (d) {
          setOpenZone(others[0]?.name || null);
          say(`${name} removed`);
        }
      }
    });
  };
  const removeTable = (p) => {
    if (p.has_open_bill) {
      say(`${p.label || p.code} has an open bill. Settle or close it first.`, "error");
      return;
    }
    setConfirm({
      title: `Remove ${p.label || p.code}?`,
      message: "The table goes from the floor plan. Past sales are untouched.",
      onConfirm: async () => {
        setConfirm(null);
        const d = await post("store.tables.plan.table.remove", { id: p.id });
        if (d) say(`${p.code} removed`);
      }
    });
  };
  const onDrop = async (targetId) => {
    const from = dragId.current;
    dragId.current = null;
    if (!from || from === targetId) return;
    const zoneName = positions.find((p) => p.id === from)?.zone;
    const list = (byZone.get(zoneName) || []).map((p) => p.id);
    const a = list.indexOf(from);
    const b = list.indexOf(targetId);
    if (a === -1 || b === -1) return;
    list.splice(b, 0, list.splice(a, 1)[0]);
    setPositions((prev) => {
      const order = new Map(list.map((id, i) => [id, i]));
      return [...prev].sort((x, y) => order.has(x.id) && order.has(y.id) ? order.get(x.id) - order.get(y.id) : 0);
    });
    await post("store.tables.plan.reorder", { ids: list });
  };
  const toggleLane = async (which, value) => {
    const next = { ...lanes, [which]: value };
    setLanes(next);
    setBusy(true);
    try {
      await axios.post(r("store.tables.plan.lanes"), next);
      say(value ? `${which === "takeaway" ? "Takeaway" : "Delivery"} turned on` : `${which === "takeaway" ? "Takeaway" : "Delivery"} turned off`);
    } catch (e) {
      setLanes(lanes);
      say(e?.response?.data?.message || "That could not be saved.", "error");
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { children: [
    /* @__PURE__ */ jsx(Head, { title: "Floor plan" }),
    /* @__PURE__ */ jsxs("div", { className: "vqfb", children: [
      /* @__PURE__ */ jsxs("header", { className: "vqfb-head", children: [
        /* @__PURE__ */ jsxs(Link, { href: route("store.tables.index", { store_slug: storeSlug }), className: "vqfb-back", children: [
          /* @__PURE__ */ jsx(ChevronLeft, { size: 16, "aria-hidden": "true" }),
          "Floor"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsx("h1", { className: "vqfb-title", children: "Floor plan" }),
          /* @__PURE__ */ jsx("p", { className: "vqfb-sub", children: "Your areas and the tables in them. This is the only place tables come from — the floor screen shows what you build here." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "vqfb-totals", children: [
          /* @__PURE__ */ jsxs("span", { children: [
            /* @__PURE__ */ jsx("b", { className: "vq-num", children: totals.tables }),
            " tables"
          ] }),
          /* @__PURE__ */ jsxs("span", { children: [
            /* @__PURE__ */ jsx("b", { className: "vq-num", children: totals.seats }),
            " seats"
          ] }),
          totals.busy > 0 && /* @__PURE__ */ jsxs("span", { className: "vqfb-total-busy", children: [
            /* @__PURE__ */ jsx(Lock, { size: 11, "aria-hidden": "true" }),
            /* @__PURE__ */ jsx("b", { className: "vq-num", children: totals.busy }),
            " in use"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "vqfb-body", children: [
        /* @__PURE__ */ jsxs("aside", { className: "vqfb-zones", children: [
          /* @__PURE__ */ jsx("h2", { className: "vqfb-h2", children: "Areas" }),
          zones.map((z) => /* @__PURE__ */ jsx("div", { className: "vqfb-zone", "data-on": openZone === z.name ? "1" : "0", children: renaming === z.name ? /* @__PURE__ */ jsx(
            InlineText,
            {
              value: z.name,
              onCancel: () => setRenaming(null),
              onSave: (v) => renameZone(z.name, v),
              "aria-label": "Area name"
            }
          ) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs("button", { type: "button", className: "vqfb-zone-pick", onClick: () => setOpenZone(z.name), children: [
              /* @__PURE__ */ jsx("span", { className: "vq-clip", children: z.name }),
              /* @__PURE__ */ jsx("span", { className: "vqfb-zone-n vq-num", children: z.count })
            ] }),
            /* @__PURE__ */ jsx("button", { type: "button", className: "vqfb-icon", onClick: () => setRenaming(z.name), title: `Rename ${z.name}`, children: /* @__PURE__ */ jsx(Pencil, { size: 13 }) }),
            /* @__PURE__ */ jsx("button", { type: "button", className: "vqfb-icon vqfb-icon-danger", onClick: () => removeZone(z.name), title: `Remove ${z.name}`, children: /* @__PURE__ */ jsx(Trash2, { size: 13 }) })
          ] }) }, z.name)),
          addingZone ? /* @__PURE__ */ jsx(
            InlineText,
            {
              value: "",
              placeholder: "Terrace",
              onCancel: () => setAddingZone(false),
              onSave: addZone,
              "aria-label": "New area name"
            }
          ) : /* @__PURE__ */ jsxs("button", { type: "button", className: "vqfb-add-zone", onClick: () => setAddingZone(true), children: [
            /* @__PURE__ */ jsx(Plus, { size: 15, "aria-hidden": "true" }),
            "Add an area"
          ] }),
          zones.length === 0 && /* @__PURE__ */ jsx("p", { className: "vqfb-hint", children: "Ground floor, Terrace, Garden — whatever you call them. Add one to start." }),
          /* @__PURE__ */ jsx("h2", { className: "vqfb-h2 vqfb-h2-gap", children: "Beyond the tables" }),
          /* @__PURE__ */ jsx("p", { className: "vqfb-hint", children: tt("Orders that never sit down. They get their own tab on the floor and their own ticket numbers — not made-up tables.") }),
          /* @__PURE__ */ jsx(
            LaneToggle,
            {
              icon: ShoppingBag,
              label: "Takeaway",
              hint: "Counter and collection orders.",
              on: lanes.takeaway,
              onChange: (v) => toggleLane("takeaway", v)
            }
          ),
          /* @__PURE__ */ jsx(
            LaneToggle,
            {
              icon: Bike,
              label: "Delivery",
              hint: "Adds address and phone to the ticket.",
              on: lanes.delivery,
              onChange: (v) => toggleLane("delivery", v)
            }
          )
        ] }),
        /* @__PURE__ */ jsx("main", { className: "vqfb-tables", children: !openZone ? /* @__PURE__ */ jsxs("div", { className: "vqfb-empty", children: [
          /* @__PURE__ */ jsx(LayoutGrid, { size: 38, strokeWidth: 1.5, "aria-hidden": "true" }),
          /* @__PURE__ */ jsx("p", { className: "font-bold text-ink", children: "Add an area first" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted", children: "Tables live inside an area." })
        ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(
            BulkAdd,
            {
              zone: openZone,
              busy,
              existing: (byZone.get(openZone) || []).length,
              onCreate: async (spec) => {
                const d = await post("store.tables.plan.tables.bulk", { zone: openZone, ...spec });
                if (d) {
                  const skipped = (d.skipped || []).length;
                  say(skipped ? `${d.created} added · ${skipped} skipped, those codes were taken` : `${d.created} table${d.created === 1 ? "" : "s"} added`);
                }
              }
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "vqfb-rows", children: [
            /* @__PURE__ */ jsxs("div", { className: "vqfb-rowhead", children: [
              /* @__PURE__ */ jsx("span", {}),
              /* @__PURE__ */ jsx("span", { children: "Code" }),
              /* @__PURE__ */ jsx("span", { children: "Name" }),
              /* @__PURE__ */ jsx("span", { children: "Seats" }),
              /* @__PURE__ */ jsx("span", {})
            ] }),
            (byZone.get(openZone) || []).map((p) => /* @__PURE__ */ jsx(
              TableRow,
              {
                p,
                busy,
                onDragStart: () => {
                  dragId.current = p.id;
                },
                onDropRow: () => onDrop(p.id),
                onSave: async (patch) => {
                  const d = await post("store.tables.plan.table.update", { id: p.id, ...patch });
                  if (d) say("Saved");
                },
                onRemove: () => removeTable(p)
              },
              p.id
            )),
            (byZone.get(openZone) || []).length === 0 && /* @__PURE__ */ jsxs("p", { className: "vqfb-hint vqfb-hint-pad", children: [
              "No tables in ",
              openZone,
              " yet. Add them in one go above."
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            AddOne,
            {
              busy,
              onAdd: async (spec) => {
                const d = await post("store.tables.plan.table.add", { zone: openZone, ...spec });
                if (d) say(`${spec.code} added`);
              }
            }
          )
        ] }) })
      ] })
    ] }),
    busy && /* @__PURE__ */ jsxs("span", { className: "vqfb-busy", role: "status", "aria-live": "polite", children: [
      /* @__PURE__ */ jsx(Loader2, { size: 14, className: "animate-spin", "aria-hidden": "true" }),
      " Saving"
    ] }),
    /* @__PURE__ */ jsx(Toast, { toasts, removeToast: (id) => setToasts((x) => x.filter((y) => y.id !== id)) }),
    /* @__PURE__ */ jsx(
      ConfirmModal,
      {
        show: !!confirm,
        title: confirm?.title || "",
        message: confirm?.message || "",
        confirmLabel: "Remove",
        isDangerous: true,
        onConfirm: confirm?.onConfirm || (() => {
        }),
        onClose: () => setConfirm(null)
      }
    )
  ] });
}
function InlineText({ value, placeholder, onSave, onCancel, ...rest }) {
  const [v, setV] = useState(value);
  return /* @__PURE__ */ jsxs("div", { className: "vqfb-inline", children: [
    /* @__PURE__ */ jsx(
      "input",
      {
        className: "vqfb-input",
        value: v,
        placeholder,
        onChange: (e) => setV(e.target.value),
        onKeyDown: (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onSave(v);
          }
          if (e.key === "Escape") {
            e.preventDefault();
            onCancel();
          }
        },
        autoFocus: true,
        ...rest
      }
    ),
    /* @__PURE__ */ jsx("button", { type: "button", className: "vqfb-icon vqfb-icon-go", onClick: () => onSave(v), title: "Save", children: /* @__PURE__ */ jsx(Check, { size: 14 }) }),
    /* @__PURE__ */ jsx("button", { type: "button", className: "vqfb-icon", onClick: onCancel, title: "Cancel", children: /* @__PURE__ */ jsx(X, { size: 14 }) })
  ] });
}
function LaneToggle({ icon: Icon, label, hint, on, onChange }) {
  return /* @__PURE__ */ jsxs("label", { className: "vqfb-lane", "data-on": on ? "1" : "0", children: [
    /* @__PURE__ */ jsx("span", { className: "vqfb-lane-icon", children: /* @__PURE__ */ jsx(Icon, { size: 15, "aria-hidden": "true" }) }),
    /* @__PURE__ */ jsxs("span", { className: "min-w-0", children: [
      /* @__PURE__ */ jsx("span", { className: "vqfb-lane-l", children: label }),
      /* @__PURE__ */ jsx("span", { className: "vqfb-lane-h", children: hint })
    ] }),
    /* @__PURE__ */ jsx(
      "input",
      {
        type: "checkbox",
        className: "sr-only",
        checked: on,
        onChange: (e) => onChange(e.target.checked)
      }
    ),
    /* @__PURE__ */ jsx("span", { className: "vqfb-switch", "aria-hidden": "true", children: /* @__PURE__ */ jsx("span", {}) })
  ] });
}
function BulkAdd({ zone, existing, busy, onCreate }) {
  const [count, setCount] = useState(existing ? 4 : 12);
  const [prefix, setPrefix] = useState("T");
  const [start, setStart] = useState(existing + 1);
  const [capacity, setCapacity] = useState(4);
  const preview = useMemo(() => {
    const n = Math.max(1, Math.min(200, Number(count) || 1));
    const s = Math.max(0, Number(start) || 0);
    const first = `${prefix}${s}`;
    const last = `${prefix}${s + n - 1}`;
    return n === 1 ? first : `${first} … ${last}`;
  }, [count, prefix, start]);
  return /* @__PURE__ */ jsxs("section", { className: "vqfb-bulk", children: [
    /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
      /* @__PURE__ */ jsxs("h3", { className: "vqfb-bulk-h", children: [
        "Add tables to ",
        zone
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "vqfb-bulk-p", children: [
        "Creates ",
        /* @__PURE__ */ jsx("b", { className: "vq-num", children: preview }),
        ". Codes already in use are skipped."
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "vqfb-bulk-f", children: [
      /* @__PURE__ */ jsx(Num, { label: "How many", value: count, min: 1, max: 200, onChange: setCount }),
      /* @__PURE__ */ jsxs("label", { className: "vqfb-num", children: [
        /* @__PURE__ */ jsx("span", { children: "Prefix" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            className: "vqfb-input",
            value: prefix,
            maxLength: 8,
            onChange: (e) => setPrefix(e.target.value)
          }
        )
      ] }),
      /* @__PURE__ */ jsx(Num, { label: "Start at", value: start, min: 0, max: 99999, onChange: setStart }),
      /* @__PURE__ */ jsx(Num, { label: "Seats each", value: capacity, min: 1, max: 99, onChange: setCapacity }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          className: "vqfb-btn vqfb-btn-go",
          disabled: busy,
          onClick: () => onCreate({
            count: Math.max(1, Math.min(200, Number(count) || 1)),
            prefix,
            start: Math.max(0, Number(start) || 0),
            capacity: Math.max(1, Math.min(99, Number(capacity) || 1))
          }),
          children: [
            /* @__PURE__ */ jsx(Plus, { size: 15 }),
            "Add"
          ]
        }
      )
    ] })
  ] });
}
function Num({ label, value, min, max, onChange }) {
  return /* @__PURE__ */ jsxs("label", { className: "vqfb-num", children: [
    /* @__PURE__ */ jsx("span", { children: label }),
    /* @__PURE__ */ jsx(
      "input",
      {
        type: "number",
        className: "vqfb-input vq-num",
        value,
        min,
        max,
        onChange: (e) => onChange(e.target.value)
      }
    )
  ] });
}
function TableRow({ p, busy, onSave, onRemove, onDragStart, onDropRow }) {
  const [code, setCode] = useState(p.code);
  const [label, setLabel] = useState(p.label === p.code ? "" : p.label);
  const [capacity, setCapacity] = useState(p.capacity);
  const dirty = code !== p.code || (label || "") !== (p.label === p.code ? "" : p.label || "") || Number(capacity) !== Number(p.capacity);
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: "vqfb-row",
      "data-busy": p.has_open_bill ? "1" : "0",
      draggable: !p.has_open_bill,
      onDragStart,
      onDragOver: (e) => e.preventDefault(),
      onDrop: onDropRow,
      children: [
        /* @__PURE__ */ jsx("span", { className: "vqfb-grip", "aria-hidden": "true", children: /* @__PURE__ */ jsx(GripVertical, { size: 14 }) }),
        /* @__PURE__ */ jsx(
          "input",
          {
            className: "vqfb-input vq-num",
            value: code,
            maxLength: 24,
            "aria-label": `Code for ${p.code}`,
            onChange: (e) => setCode(e.target.value)
          }
        ),
        /* @__PURE__ */ jsx(
          "input",
          {
            className: "vqfb-input",
            value: label,
            placeholder: "optional, e.g. Window 2",
            maxLength: 80,
            "aria-label": `Name for ${p.code}`,
            onChange: (e) => setLabel(e.target.value)
          }
        ),
        /* @__PURE__ */ jsxs("span", { className: "vqfb-seats", children: [
          /* @__PURE__ */ jsx(Users, { size: 12, "aria-hidden": "true" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "number",
              className: "vqfb-input vq-num",
              value: capacity,
              min: 1,
              max: 99,
              "aria-label": `Seats at ${p.code}`,
              onChange: (e) => setCapacity(e.target.value)
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "vqfb-row-end", children: [
          dirty && /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              className: "vqfb-icon vqfb-icon-go",
              disabled: busy,
              title: "Save this table",
              onClick: () => onSave({
                code: code.trim(),
                label: label.trim() || null,
                capacity: Math.max(1, Math.min(99, Number(capacity) || 1))
              }),
              children: /* @__PURE__ */ jsx(Check, { size: 14 })
            }
          ),
          p.has_open_bill ? (
            /* Not a disabled bin with no explanation. The reason a
               table cannot be removed is the only useful thing to say
               here, and it is a state that clears itself. */
            /* @__PURE__ */ jsxs("span", { className: "vqfb-locked", title: "This table has an open bill", children: [
              /* @__PURE__ */ jsx(Lock, { size: 11, "aria-hidden": "true" }),
              "In use"
            ] })
          ) : /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              className: "vqfb-icon vqfb-icon-danger",
              disabled: busy,
              onClick: onRemove,
              title: `Remove ${p.code}`,
              children: /* @__PURE__ */ jsx(Trash2, { size: 14 })
            }
          )
        ] })
      ]
    }
  );
}
function AddOne({ busy, onAdd }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [capacity, setCapacity] = useState(4);
  if (!open) {
    return /* @__PURE__ */ jsxs("button", { type: "button", className: "vqfb-add-one", onClick: () => setOpen(true), children: [
      /* @__PURE__ */ jsx(Plus, { size: 15, "aria-hidden": "true" }),
      "Add one more"
    ] });
  }
  const submit = () => {
    if (!code.trim()) return;
    onAdd({ code: code.trim(), label: label.trim() || null, capacity: Number(capacity) || 1 });
    setCode("");
    setLabel("");
  };
  return /* @__PURE__ */ jsxs("div", { className: "vqfb-row vqfb-row-new", onKeyDown: (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  }, children: [
    /* @__PURE__ */ jsx("span", { className: "vqfb-grip", "aria-hidden": "true", children: /* @__PURE__ */ jsx(Plus, { size: 14 }) }),
    /* @__PURE__ */ jsx(
      "input",
      {
        className: "vqfb-input vq-num",
        value: code,
        placeholder: "T13",
        maxLength: 24,
        "aria-label": "New table code",
        autoFocus: true,
        onChange: (e) => setCode(e.target.value)
      }
    ),
    /* @__PURE__ */ jsx(
      "input",
      {
        className: "vqfb-input",
        value: label,
        placeholder: "optional name",
        maxLength: 80,
        "aria-label": "New table name",
        onChange: (e) => setLabel(e.target.value)
      }
    ),
    /* @__PURE__ */ jsxs("span", { className: "vqfb-seats", children: [
      /* @__PURE__ */ jsx(Users, { size: 12, "aria-hidden": "true" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "number",
          className: "vqfb-input vq-num",
          value: capacity,
          min: 1,
          max: 99,
          "aria-label": "Seats",
          onChange: (e) => setCapacity(e.target.value)
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("span", { className: "vqfb-row-end", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          className: "vqfb-icon vqfb-icon-go",
          disabled: busy || !code.trim(),
          onClick: submit,
          title: "Add",
          children: /* @__PURE__ */ jsx(Check, { size: 14 })
        }
      ),
      /* @__PURE__ */ jsx("button", { type: "button", className: "vqfb-icon", onClick: () => setOpen(false), title: "Cancel", children: /* @__PURE__ */ jsx(X, { size: 14 }) })
    ] })
  ] });
}
export {
  FloorBuilder as default
};

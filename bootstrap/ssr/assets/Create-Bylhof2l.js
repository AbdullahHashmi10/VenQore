import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useCallback, useRef, useMemo } from "react";
import { usePage, router } from "@inertiajs/react";
import { CheckCircle2, Plus, ArrowLeftRight, Zap, ScanBarcode } from "lucide-react";
import { u as useAlert } from "../ssr.js";
import { a as useDocumentChrome, d as documentType, c as computeTotals, b as availableOf, D as DocumentShell, e as DocumentSettings, f as DocumentScan, g as DocumentCounts, Z as Zone, i as DocumentLines, F as Field, V as VqSelect, l as linePayload } from "./useDocumentChrome-DON8WQ-L.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "./AsyncProductCombobox-BMa0miLw.js";
import "use-debounce";
import "./SmartCombobox-DfdFIseQ.js";
import "./format-131Nyq79.js";
import "./terms-DwYjlWsV.js";
import "./OneGlanceLayout-D0x15wPs.js";
import "./plans-CxabWI_P.js";
import "./runtime-DwSFgQZq.js";
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
const DOC = documentType("stock-transfer");
const today = () => (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const blankLine = () => ({ id: uid(), product: null, quantity: 1 });
function StockTransferCreate({ warehouses = [], products = [] }) {
  const { settings, store } = usePage().props;
  const { showAlert } = useAlert();
  const [d, setD] = useState(() => ({
    id: "transfer",
    from_warehouse_id: warehouses.find((w) => w.is_default)?.id || warehouses[0]?.id || "",
    to_warehouse_id: "",
    transfer_date: today(),
    status: "completed",
    notes: "",
    reference: ""
  }));
  const patch = useCallback((p) => setD((prev) => ({ ...prev, ...p })), []);
  const [items, setItems] = useState(() => [blankLine()]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [scanning, setScanning] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const saveRef = useRef(null);
  const chrome = useDocumentChrome({
    doc: DOC,
    activeId: d.id,
    seniorMode: settings?.senior_mode === "1",
    onSave: () => saveRef.current?.(),
    canFold: !!(d.from_warehouse_id && d.to_warehouse_id)
  });
  const totals = useMemo(
    () => computeTotals({ doc: DOC, items, document: d, settings, fields: chrome.fields }),
    [items, d, settings, chrome.fields]
  );
  const update = useCallback((id, key, value) => {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, [key]: value } : i));
  }, []);
  const remove = useCallback((id) => {
    setItems((prev) => prev.length > 1 ? prev.filter((i) => i.id !== id) : [blankLine()]);
  }, []);
  const addLine = useCallback(() => setItems((prev) => [...prev, blankLine()]), []);
  const onPickProduct = useCallback((product, id) => {
    if (!product) return;
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, product, available_stock: availableOf(product) } : i));
  }, []);
  const validLines = items.filter((i) => i.product);
  const save = () => {
    const next = {};
    if (!d.from_warehouse_id) next.from = "Say where the goods are now.";
    if (!d.to_warehouse_id) next.to = "Say where they are going.";
    if (d.from_warehouse_id && d.from_warehouse_id === d.to_warehouse_id) {
      next.to = "A transfer has to go somewhere else.";
    }
    if (!validLines.length) {
      showAlert({ title: "Nothing to move", message: "Add at least one item.", type: "warning" });
      return;
    }
    if (d.status === "completed") {
      const short = validLines.find((i) => num(i.quantity) > availableOf(i.product, i.available_stock));
      if (short) {
        showAlert({
          title: "Not enough on the shelf",
          message: `There are ${availableOf(short.product, short.available_stock)} of ${short.product.name} in the warehouse it is leaving.`,
          type: "error"
        });
        return;
      }
    }
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    router.post(
      route("store.stock-transfers.store", { store_slug: store?.slug }),
      {
        from_warehouse_id: d.from_warehouse_id,
        to_warehouse_id: d.to_warehouse_id,
        transfer_date: d.transfer_date,
        status: d.status,
        notes: d.notes || null,
        items: linePayload({ doc: DOC, items, totals })
      },
      {
        onError: (e) => {
          setErrors(e);
          setSaving(false);
        },
        onFinish: () => setSaving(false)
      }
    );
  };
  saveRef.current = save;
  const whOptions = warehouses.map((w) => ({ value: w.id, label: w.name }));
  const from = warehouses.find((w) => String(w.id) === String(d.from_warehouse_id));
  const to = warehouses.find((w) => String(w.id) === String(d.to_warehouse_id));
  const ctx = {
    locked: false,
    showStock: chrome.showStock,
    stockMode: DOC.stock.badge,
    stockWord: "in that warehouse",
    freeOn: false,
    canDiscount: false,
    itemPlaceholder: "Search for what is moving",
    defaultProducts: products,
    update,
    remove,
    addLine,
    onPickProduct,
    money: () => "",
    currency: "",
    draggedIndex,
    onDragStart: (e, idx) => {
      setDraggedIndex(idx);
      e.dataTransfer.effectAllowed = "move";
    },
    onDragOver: (e, idx) => {
      e.preventDefault();
      if (draggedIndex === null || draggedIndex === idx) return;
      setItems((prev) => {
        const n = [...prev];
        const [m] = n.splice(draggedIndex, 1);
        n.splice(idx, 0, m);
        return n;
      });
      setDraggedIndex(idx);
    },
    onDragEnd: () => setDraggedIndex(null)
  };
  return /* @__PURE__ */ jsxs(
    DocumentShell,
    {
      doc: DOC,
      chrome,
      subtitle: from && to ? `${from.name} → ${to.name}` : "Choose where it moves from and to",
      tools: /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            className: "vqdoc-icon",
            "aria-pressed": chrome.showQuickEntry,
            title: "Quick add row — Alt+Q, then just type",
            onClick: () => chrome.setShowQuickEntry(!chrome.showQuickEntry),
            children: /* @__PURE__ */ jsx(Zap, { size: 17 })
          }
        ),
        /* @__PURE__ */ jsx("button", { type: "button", className: "vqdoc-icon", title: "Scan barcodes", onClick: () => setScanning(true), children: /* @__PURE__ */ jsx(ScanBarcode, { size: 17 }) })
      ] }),
      header: /* @__PURE__ */ jsx(
        Zone,
        {
          title: DOC.zone,
          actions: /* @__PURE__ */ jsxs(Fragment, { children: [
            chrome.hasHiddenFields && /* @__PURE__ */ jsx("button", { type: "button", className: "togg", onClick: () => chrome.setShowAllFields((p) => !p), children: chrome.showAllFields ? "Fewer fields" : "All fields" }),
            /* @__PURE__ */ jsx("button", { type: "button", className: "togg", onClick: () => chrome.setFold("collapsed"), children: "Fold away" })
          ] }),
          children: /* @__PURE__ */ jsxs("div", { className: "vqdoc-hdr", children: [
            /* @__PURE__ */ jsx(Field, { label: "From warehouse", span: 5, required: true, error: errors.from || errors.from_warehouse_id, children: /* @__PURE__ */ jsx(
              VqSelect,
              {
                ariaLabel: "Where the goods are now",
                value: d.from_warehouse_id,
                placeholder: "Where they are now",
                onChange: (v) => patch({ from_warehouse_id: v }),
                options: whOptions
              }
            ) }),
            /* @__PURE__ */ jsx("div", { className: "vqdoc-f", "data-span": "2", "data-nolabel": "true", children: /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                className: "vqdoc-icon",
                title: "Swap the two warehouses round",
                onClick: () => patch({ from_warehouse_id: d.to_warehouse_id, to_warehouse_id: d.from_warehouse_id }),
                children: /* @__PURE__ */ jsx(ArrowLeftRight, { size: 17 })
              }
            ) }),
            /* @__PURE__ */ jsx(Field, { label: "To warehouse", span: 5, required: true, error: errors.to || errors.to_warehouse_id, children: /* @__PURE__ */ jsx(
              VqSelect,
              {
                ariaLabel: "Where they are going",
                value: d.to_warehouse_id,
                placeholder: "Where they are going",
                onChange: (v) => patch({ to_warehouse_id: v }),
                options: whOptions.filter((o) => String(o.value) !== String(d.from_warehouse_id))
              }
            ) }),
            chrome.field("date") && /* @__PURE__ */ jsx(Field, { label: "Transfer date", span: 4, error: errors.transfer_date, children: /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                className: "vqdoc-in",
                value: d.transfer_date,
                onChange: (e) => patch({ transfer_date: e.target.value })
              }
            ) }),
            chrome.field("status") && /* @__PURE__ */ jsx(Field, { label: "Stock", span: 4, children: /* @__PURE__ */ jsx(
              VqSelect,
              {
                ariaLabel: "Whether the stock has moved yet",
                value: d.status,
                onChange: (v) => patch({ status: v }),
                options: [
                  { value: "completed", label: "Moved now", hint: "Stock leaves one shelf and lands on the other today" },
                  { value: "in_progress", label: "On its way", hint: "Written down, but nothing moves until it is completed" },
                  { value: "pending", label: "Planned", hint: "A note of intent — no stock moves" }
                ]
              }
            ) }),
            chrome.field("notes") && /* @__PURE__ */ jsx(Field, { label: "Note", span: 12, children: /* @__PURE__ */ jsx(
              "textarea",
              {
                className: "vqdoc-in",
                rows: 2,
                value: d.notes,
                placeholder: "Who is carrying it, which van, anything worth remembering",
                onChange: (e) => patch({ notes: e.target.value })
              }
            ) })
          ] })
        }
      ),
      strip: /* @__PURE__ */ jsxs("button", { type: "button", className: "vqdoc-strip", onClick: () => chrome.setFold("open"), title: "Open the details", children: [
        /* @__PURE__ */ jsx("span", { className: "chev", children: "▾" }),
        /* @__PURE__ */ jsxs("span", { className: "who", children: [
          from?.name || "From?",
          " → ",
          to?.name || "To?"
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "meta", children: [
          d.transfer_date,
          " · ",
          d.status === "completed" ? "Moved now" : d.status === "in_progress" ? "On its way" : "Planned"
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "amt", children: [
          /* @__PURE__ */ jsx("span", { className: "tag", children: "Units" }),
          totals.units
        ] })
      ] }),
      lines: /* @__PURE__ */ jsxs(Zone, { title: "Items", count: validLines.length || "none yet", onFocusCapture: chrome.onLinesFocus, children: [
        /* @__PURE__ */ jsx(
          DocumentLines,
          {
            doc: DOC,
            chrome,
            items,
            ctx,
            onQuickAdd: (line) => setItems((prev) => {
              const next = { ...blankLine(), product: line.product, quantity: num(line.quantity) };
              const only = prev.length === 1 && !prev[0].product;
              return only ? [next] : [...prev, next];
            })
          }
        ),
        /* @__PURE__ */ jsxs("button", { type: "button", className: "vqdoc-addline", onClick: addLine, children: [
          /* @__PURE__ */ jsx(Plus, { size: 16 }),
          " Add an item"
        ] })
      ] }),
      totals: /* @__PURE__ */ jsx(
        DocumentCounts,
        {
          doc: DOC,
          chrome,
          totals,
          ctx: {
            unitLabel: "Units moving",
            actions: /* @__PURE__ */ jsxs("div", { className: "vqdoc-actions", children: [
              /* @__PURE__ */ jsxs("button", { type: "button", className: "vqdoc-btn pri", disabled: saving, onClick: save, children: [
                /* @__PURE__ */ jsx(CheckCircle2, { size: 17 }),
                " ",
                saving ? "Saving" : "Record transfer"
              ] }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  className: "vqdoc-btn",
                  onClick: () => router.visit(route("store.stock-transfers.index", { store_slug: store?.slug })),
                  children: "Cancel"
                }
              )
            ] })
          }
        }
      ),
      dock: {
        total: String(totals.units),
        totalLabel: "Units moving",
        actions: /* @__PURE__ */ jsxs("button", { type: "button", className: "vqdoc-btn", disabled: saving, onClick: save, children: [
          /* @__PURE__ */ jsx(CheckCircle2, { size: 17 }),
          " ",
          saving ? "Saving" : "Record transfer"
        ] })
      },
      children: [
        chrome.settingsOpen && /* @__PURE__ */ jsx(
          DocumentSettings,
          {
            doc: DOC,
            open: true,
            onClose: () => chrome.setSettingsOpen(false),
            comp: chrome.comp,
            setComp: chrome.setComp,
            applyLayout: chrome.applyLayout,
            textSize: chrome.textSize,
            setTextSize: chrome.setTextSize,
            fields: chrome.fields,
            setField: chrome.setField,
            showRail: chrome.showRail,
            setShowRail: chrome.setShowRail,
            showQuickEntry: chrome.showQuickEntry,
            setShowQuickEntry: chrome.setShowQuickEntry,
            showStock: chrome.showStock,
            setShowStock: chrome.setShowStock,
            canSeeMargin: false
          }
        ),
        /* @__PURE__ */ jsx(
          DocumentScan,
          {
            doc: DOC,
            open: scanning,
            onClose: () => setScanning(false),
            onConfirm: (rows) => setItems((prev) => {
              const made = rows.map((r) => ({
                id: uid(),
                product: r.product,
                quantity: num(r.quantity),
                available_stock: availableOf(r.product)
              }));
              const only = prev.length === 1 && !prev[0].product;
              return only ? made : [...prev, ...made];
            })
          }
        )
      ]
    }
  );
}
export {
  StockTransferCreate as default
};

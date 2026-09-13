import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useCallback, useRef, useMemo } from "react";
import { usePage, router } from "@inertiajs/react";
import { CheckCircle2, Plus, Zap, ScanBarcode } from "lucide-react";
import { f as formatCurrency } from "./format-131Nyq79.js";
import { u as useAlert } from "../ssr.js";
import { a as useDocumentChrome, d as documentType, c as computeTotals, D as DocumentShell, e as DocumentSettings, f as DocumentScan, g as DocumentCounts, Z as Zone, i as DocumentLines, F as Field, V as VqSelect } from "./useDocumentChrome-DON8WQ-L.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "./AsyncProductCombobox-BMa0miLw.js";
import "use-debounce";
import "./SmartCombobox-DfdFIseQ.js";
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
const DOC = documentType("stock-audit");
const today = () => (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const blankLine = () => ({ id: uid(), product: null, counted_quantity: 0 });
function StockTakeCreate({ warehouses = [], products = [], stocks = {} }) {
  const { settings, store } = usePage().props;
  const { showAlert, showConfirm } = useAlert();
  const money = (n) => formatCurrency(n, store || settings);
  const [d, setD] = useState(() => ({
    id: "audit",
    warehouse_id: warehouses.find((w) => w.is_default)?.id || warehouses[0]?.id || "",
    date: today(),
    status: "draft",
    notes: ""
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
    canFold: !!d.warehouse_id
  });
  const onHand = useCallback((productId) => {
    const rows = stocks?.[d.warehouse_id] || [];
    const row = rows.find?.((r) => String(r.product_id) === String(productId));
    return num(row?.quantity);
  }, [stocks, d.warehouse_id]);
  const totals = useMemo(
    () => computeTotals({ doc: DOC, items, document: d, settings, fields: chrome.fields }),
    [items, d, settings, chrome.fields]
  );
  const drift = useMemo(() => {
    let short = 0;
    let over = 0;
    let value = 0;
    let lines = 0;
    items.forEach((i) => {
      if (!i.product) return;
      const diff = num(i.counted_quantity) - onHand(i.product.id);
      if (Math.abs(diff) < 1e-4) return;
      lines += 1;
      if (diff < 0) short += -diff;
      else over += diff;
      value += diff * num(i.product.cost_price ?? i.product.cost);
    });
    return { short, over, value, lines };
  }, [items, onHand]);
  const update = useCallback((id, key, value) => {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, [key]: value } : i));
  }, []);
  const remove = useCallback((id) => {
    setItems((prev) => prev.length > 1 ? prev.filter((i) => i.id !== id) : [blankLine()]);
  }, []);
  const addLine = useCallback(() => setItems((prev) => [...prev, blankLine()]), []);
  const onPickProduct = useCallback((product, id) => {
    if (!product) return;
    setItems((prev) => prev.map((i) => i.id === id ? {
      ...i,
      product,
      /* Seeded with what the records say, so a shelf that agrees needs no
         typing at all — the operator only touches the ones that differ. */
      counted_quantity: onHand(product.id),
      available_stock: onHand(product.id)
    } : i));
  }, [onHand]);
  const validLines = items.filter((i) => i.product);
  const post = () => {
    setSaving(true);
    router.post(
      route("store.stock-takes.store", { store_slug: store?.slug }),
      {
        warehouse_id: d.warehouse_id,
        date: d.date,
        status: d.status,
        notes: d.notes || null,
        items: validLines.map((i) => ({
          product_id: i.product.id,
          counted_quantity: num(i.counted_quantity)
        }))
      },
      { onError: (e) => {
        setErrors(e);
        setSaving(false);
      }, onFinish: () => setSaving(false) }
    );
  };
  const save = () => {
    if (!d.warehouse_id) {
      setErrors({ warehouse_id: "Say which warehouse is being counted." });
      return;
    }
    if (!validLines.length) {
      showAlert({ title: "Nothing counted", message: "Add at least one item.", type: "warning" });
      return;
    }
    setErrors({});
    if (d.status === "completed" && drift.lines > 0) {
      showConfirm({
        title: "Write these corrections to stock?",
        message: `${drift.lines} line${drift.lines === 1 ? "" : "s"} differ from the records${drift.short ? ` — ${drift.short} short` : ""}${drift.over ? `${drift.short ? "," : " —"} ${drift.over} over` : ""}. Stock will be adjusted to match what you counted.`,
        type: "warning",
        confirmLabel: "Yes, correct the stock",
        onConfirm: post
      });
      return;
    }
    post();
  };
  saveRef.current = save;
  const wh = warehouses.find((w) => String(w.id) === String(d.warehouse_id));
  const ctx = {
    locked: false,
    showStock: false,
    freeOn: false,
    canDiscount: false,
    itemPlaceholder: "Search for what you are counting",
    defaultProducts: products,
    update,
    remove,
    addLine,
    onPickProduct,
    money,
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
      subtitle: wh ? `${wh.name} · ${d.date}` : "Choose a warehouse",
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
        /* @__PURE__ */ jsx("button", { type: "button", className: "vqdoc-icon", title: "Scan the shelf", onClick: () => setScanning(true), children: /* @__PURE__ */ jsx(ScanBarcode, { size: 17 }) })
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
            /* @__PURE__ */ jsx(Field, { label: "Warehouse", span: 4, required: true, error: errors.warehouse_id, children: /* @__PURE__ */ jsx(
              VqSelect,
              {
                ariaLabel: "Which warehouse is being counted",
                value: d.warehouse_id,
                placeholder: "Which shelves are being counted",
                onChange: (v) => {
                  if (validLines.length) {
                    showConfirm({
                      title: "Start again in another warehouse?",
                      message: "The lines already counted belong to this warehouse and will be cleared.",
                      type: "warning",
                      confirmLabel: "Yes, start again",
                      onConfirm: () => {
                        patch({ warehouse_id: v });
                        setItems([blankLine()]);
                      }
                    });
                    return;
                  }
                  patch({ warehouse_id: v });
                },
                options: warehouses.map((w) => ({ value: w.id, label: w.name }))
              }
            ) }),
            chrome.field("date") && /* @__PURE__ */ jsx(Field, { label: "Count date", span: 4, error: errors.date, children: /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                className: "vqdoc-in",
                value: d.date,
                onChange: (e) => patch({ date: e.target.value })
              }
            ) }),
            chrome.field("status") && /* @__PURE__ */ jsx(Field, { label: "Count", span: 4, children: /* @__PURE__ */ jsx(
              VqSelect,
              {
                ariaLabel: "Whether the count is finished",
                value: d.status,
                onChange: (v) => patch({ status: v }),
                options: [
                  { value: "draft", label: "Still counting", hint: "Saved as you go — stock is not touched" },
                  { value: "completed", label: "Finished", hint: "Stock is corrected to match what you counted" }
                ]
              }
            ) }),
            chrome.field("notes") && /* @__PURE__ */ jsx(Field, { label: "Note", span: 12, children: /* @__PURE__ */ jsx(
              "textarea",
              {
                className: "vqdoc-in",
                rows: 2,
                value: d.notes,
                placeholder: "Who counted, which aisles, anything that explains a difference",
                onChange: (e) => patch({ notes: e.target.value })
              }
            ) })
          ] })
        }
      ),
      strip: /* @__PURE__ */ jsxs("button", { type: "button", className: "vqdoc-strip", onClick: () => chrome.setFold("open"), title: "Open the details", children: [
        /* @__PURE__ */ jsx("span", { className: "chev", children: "▾" }),
        /* @__PURE__ */ jsx("span", { className: "who", children: wh?.name || "No warehouse chosen" }),
        /* @__PURE__ */ jsxs("span", { className: "meta", children: [
          d.date,
          " · ",
          d.status === "completed" ? "Finished" : "Still counting"
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "amt", "data-owed": drift.value < -5e-3 ? "true" : void 0, children: [
          /* @__PURE__ */ jsx("span", { className: "tag", children: drift.lines ? "Differences" : "All agree" }),
          drift.lines || "0"
        ] })
      ] }),
      lines: /* @__PURE__ */ jsxs(Zone, { title: "Counted", count: validLines.length || "none yet", onFocusCapture: chrome.onLinesFocus, children: [
        /* @__PURE__ */ jsx(
          DocumentLines,
          {
            doc: DOC,
            chrome,
            items,
            ctx,
            onQuickAdd: (line) => setItems((prev) => {
              const next = {
                id: uid(),
                product: line.product,
                counted_quantity: num(line.quantity),
                available_stock: onHand(line.product?.id)
              };
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
            unitLabel: "Units counted",
            extraRows: /* @__PURE__ */ jsxs("div", { className: "vqdoc-ledger", children: [
              /* @__PURE__ */ jsxs("div", { className: "vqdoc-sum-row", children: [
                /* @__PURE__ */ jsx("span", { className: "k", children: "Lines that differ" }),
                /* @__PURE__ */ jsx("span", { className: "v", "data-owed": drift.lines ? "true" : void 0, children: drift.lines })
              ] }),
              drift.short > 0 && /* @__PURE__ */ jsxs("div", { className: "vqdoc-sum-row", children: [
                /* @__PURE__ */ jsx("span", { className: "k", children: "Short on the shelf" }),
                /* @__PURE__ */ jsx("span", { className: "v", "data-owed": "true", children: drift.short })
              ] }),
              drift.over > 0 && /* @__PURE__ */ jsxs("div", { className: "vqdoc-sum-row", children: [
                /* @__PURE__ */ jsx("span", { className: "k", children: "More than recorded" }),
                /* @__PURE__ */ jsx("span", { className: "v", children: drift.over })
              ] }),
              Math.abs(drift.value) > 5e-3 && /* @__PURE__ */ jsxs("div", { className: "vqdoc-sum-row strong", children: [
                /* @__PURE__ */ jsx("span", { className: "k", children: drift.value < 0 ? "Value written off" : "Value found" }),
                /* @__PURE__ */ jsx("span", { className: "v", "data-owed": drift.value < 0 ? "true" : void 0, children: money(Math.abs(drift.value)) })
              ] })
            ] }),
            actions: /* @__PURE__ */ jsxs("div", { className: "vqdoc-actions", children: [
              /* @__PURE__ */ jsxs("button", { type: "button", className: "vqdoc-btn pri", disabled: saving, onClick: save, children: [
                /* @__PURE__ */ jsx(CheckCircle2, { size: 17 }),
                " ",
                saving ? "Saving" : d.status === "completed" ? "Finish the count" : "Save the count"
              ] }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  className: "vqdoc-btn",
                  onClick: () => router.visit(route("store.stock-takes.index", { store_slug: store?.slug })),
                  children: "Cancel"
                }
              )
            ] })
          }
        }
      ),
      dock: {
        total: String(totals.units),
        totalLabel: "Units counted",
        balance: String(drift.lines),
        balanceLabel: drift.lines ? "Lines that differ" : "All agree",
        actions: /* @__PURE__ */ jsxs("button", { type: "button", className: "vqdoc-btn", disabled: saving, onClick: save, children: [
          /* @__PURE__ */ jsx(CheckCircle2, { size: 17 }),
          " ",
          saving ? "Saving" : d.status === "completed" ? "Finish" : "Save"
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
                counted_quantity: num(r.counted_quantity),
                available_stock: onHand(r.product.id)
              }));
              const base = prev.length === 1 && !prev[0].product ? [] : prev;
              const out = [...base];
              made.forEach((m) => {
                const at = out.findIndex((x) => x.product?.id === m.product.id);
                if (at >= 0) {
                  out[at] = { ...out[at], counted_quantity: num(out[at].counted_quantity) + m.counted_quantity };
                } else out.push(m);
              });
              return out.length ? out : [blankLine()];
            })
          }
        )
      ]
    }
  );
}
export {
  StockTakeCreate as default
};

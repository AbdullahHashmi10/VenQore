import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import React, { useId, useRef, useState, useCallback, useLayoutEffect, useEffect, forwardRef, useImperativeHandle, useMemo } from "react";
import { PanelLeftClose, PanelLeft, AlertTriangle, X, Plus, ChevronDown, Settings, Receipt, Check, Zap, FileText, GripVertical, Minus, Trash2, LayoutGrid, Table2, ListChecks, Wallet, Type, RotateCcw, ScanBarcode } from "lucide-react";
import { A as AsyncProductCombobox } from "./AsyncProductCombobox-BMa0miLw.js";
import { createPortal } from "react-dom";
import { u as useTermText } from "./terms-DwYjlWsV.js";
import { Head, usePage } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-D0x15wPs.js";
function DocumentShell({
  doc,
  /* the spec from documentTypes.js               */
  chrome,
  /* everything from useDocumentChrome            */
  isEdit = false,
  locked = false,
  /* posted / converted — read only               */
  lockNote,
  subtitle,
  /* the small line under the title               */
  /* tabs — only for documents that can have several open at once */
  tabs = [],
  /* [{ id, label, count }]                       */
  activeTab,
  onTab,
  onCloseTab,
  onNewTab,
  tools,
  /* extra buttons on the right of the bar        */
  notice,
  /* a banner above the document                  */
  header,
  /* the party / details zone                     */
  extra,
  /* a block between the header and the lines —
     landed costs, a schedule, whatever this
     document has that the others do not          */
  strip,
  /* the folded one-line version of that zone     */
  lines,
  /* the items zone                               */
  totals,
  /* the totals column                            */
  dock,
  /* { total, totalLabel, balance, balanceLabel, actions } */
  children
  /* modals and overlays                          */
}) {
  const {
    rootRef,
    scrollRef,
    bodyRef,
    sumRef,
    splitRef,
    showRail,
    setShowRail,
    textSize,
    law,
    asCards,
    pinned,
    dockOn,
    detailsOpen,
    onSplitDown,
    onSplitKey,
    setSettingsOpen,
    setTotalsSheet
  } = chrome;
  const title = isEdit ? doc.title.edit : doc.title.new;
  const showTabs = doc.tabs && tabs.length > 0 && !isEdit;
  return /* @__PURE__ */ jsxs(
    OneGlanceLayout,
    {
      title,
      activeMenu: doc.menu,
      fullScreen: false,
      hideHeader: true,
      noPadding: true,
      hideSidebar: !showRail,
      children: [
        /* @__PURE__ */ jsx(Head, { title }),
        /* @__PURE__ */ jsxs(
          "div",
          {
            ref: rootRef,
            className: "vqdoc",
            "data-scale": textSize,
            "data-dock": dockOn ? "on" : "off",
            style: { "--d-split": `${law.split}%` },
            children: [
              /* @__PURE__ */ jsxs("header", { className: "vqdoc-bar", children: [
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    className: "vqdoc-icon",
                    onClick: () => setShowRail(!showRail),
                    "aria-pressed": !showRail,
                    title: showRail ? "Hide the navigation rail" : "Show the navigation rail",
                    children: showRail ? /* @__PURE__ */ jsx(PanelLeftClose, { size: 18 }) : /* @__PURE__ */ jsx(PanelLeft, { size: 18 })
                  }
                ),
                /* @__PURE__ */ jsxs("div", { style: { minWidth: 0, display: "flex", flexDirection: "column", marginRight: 6 }, children: [
                  /* @__PURE__ */ jsx("span", { className: "vqdoc-title", children: title }),
                  /* @__PURE__ */ jsx("span", { className: "vqdoc-sub", children: subtitle })
                ] }),
                locked && /* @__PURE__ */ jsxs("span", { className: "vqdoc-note", "data-tone": "warn", style: { padding: "6px 12px", gap: 6 }, children: [
                  /* @__PURE__ */ jsx(AlertTriangle, { size: 13 }),
                  " ",
                  lockNote || "Read only"
                ] }),
                showTabs && !asCards && /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx("span", { className: "sep" }),
                  /* @__PURE__ */ jsxs("div", { className: "vqdoc-tabs", role: "tablist", "aria-label": `Open ${doc.name.toLowerCase()}s`, children: [
                    tabs.map((t, idx) => /* @__PURE__ */ jsxs(
                      "span",
                      {
                        role: "tab",
                        "aria-selected": activeTab === t.id,
                        className: "vqdoc-tab",
                        onClick: () => onTab?.(t.id),
                        children: [
                          /* @__PURE__ */ jsx("span", { className: "lbl", children: t.label || `${doc.title.tab} ${idx + 1}` }),
                          t.count > 0 && /* @__PURE__ */ jsx("span", { className: "num", style: { opacity: 0.6, fontSize: "var(--d-t-micro)" }, children: t.count }),
                          /* @__PURE__ */ jsx("span", { className: "x", onClick: (e) => {
                            e.stopPropagation();
                            onCloseTab?.(t);
                          }, children: /* @__PURE__ */ jsx(X, { size: 12, strokeWidth: 2.5 }) })
                        ]
                      },
                      t.id
                    )),
                    onNewTab && /* @__PURE__ */ jsx("button", { type: "button", className: "vqdoc-icon sm", title: `Start another ${doc.name.toLowerCase()}`, onClick: onNewTab, children: /* @__PURE__ */ jsx(Plus, { size: 15 }) })
                  ] })
                ] }),
                showTabs && asCards && /* @__PURE__ */ jsxs("button", { type: "button", className: "vqdoc-tab", style: { maxWidth: "40%" }, onClick: () => onTab?.("__list__"), children: [
                  /* @__PURE__ */ jsx("span", { className: "lbl", children: tabs.find((t) => t.id === activeTab)?.label || doc.title.tab }),
                  /* @__PURE__ */ jsx(ChevronDown, { size: 13 })
                ] }),
                /* @__PURE__ */ jsxs("div", { style: { marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }, children: [
                  tools,
                  /* @__PURE__ */ jsx("button", { type: "button", className: "vqdoc-icon", title: "Screen settings", onClick: () => setSettingsOpen(true), children: /* @__PURE__ */ jsx(Settings, { size: 17 }) }),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      className: "vqdoc-icon hover:!bg-red-50 dark:hover:!bg-red-950/40 hover:!text-red-600 dark:hover:!text-red-400 hover:!border-red-300 transition-colors",
                      title: "Close and go back",
                      "aria-label": "Close and go back",
                      onClick: () => {
                        if (window.history.length > 1) window.history.back();
                        else window.location.href = "/dashboard";
                      },
                      children: /* @__PURE__ */ jsx(X, { size: 18 })
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxs(
                "div",
                {
                  className: "vqdoc-scroll",
                  ref: scrollRef,
                  "data-fill": law.summary === "side" && !asCards ? "1" : "0",
                  children: [
                    notice,
                    detailsOpen ? header : strip,
                    detailsOpen && extra && /* @__PURE__ */ jsx("div", { className: "vqdoc-extra", children: extra }),
                    /* @__PURE__ */ jsxs(
                      "div",
                      {
                        className: "vqdoc-body",
                        "data-sum": law.summary === "hidden" ? "below" : law.summary,
                        ref: bodyRef,
                        children: [
                          lines,
                          law.summary === "side" && /* @__PURE__ */ jsx(
                            "button",
                            {
                              type: "button",
                              ref: splitRef,
                              className: "vqdoc-split",
                              "aria-label": "Resize the totals column",
                              onPointerDown: onSplitDown,
                              onKeyDown: onSplitKey
                            }
                          ),
                          law.summary !== "hidden" && /* @__PURE__ */ jsx("aside", { className: `vqdoc-sumcol ${pinned ? "stick" : ""}`, ref: sumRef, children: totals })
                        ]
                      }
                    )
                  ]
                }
              ),
              dock && /* @__PURE__ */ jsx("div", { className: "vqdoc-dockrow", children: /* @__PURE__ */ jsxs("div", { className: `vqdoc-dock ${dockOn ? "on" : ""}`, children: [
                dock.total !== void 0 && /* @__PURE__ */ jsxs("div", { style: { minWidth: 0 }, children: [
                  /* @__PURE__ */ jsx("div", { className: "k", children: dock.totalLabel || "Total" }),
                  /* @__PURE__ */ jsx("div", { className: "v", children: dock.total })
                ] }),
                dock.balance !== void 0 && /* @__PURE__ */ jsxs("div", { style: { minWidth: 0 }, children: [
                  /* @__PURE__ */ jsx("div", { className: "k", children: dock.balanceLabel }),
                  /* @__PURE__ */ jsx("div", { className: "bal", children: dock.balance })
                ] }),
                law.summary === "hidden" && totals && /* @__PURE__ */ jsx("button", { type: "button", className: "vqdoc-icon", onClick: () => setTotalsSheet(true), title: "Totals", "aria-label": "Totals", children: /* @__PURE__ */ jsx(Receipt, { size: 17 }) }),
                dock.actions
              ] }) })
            ]
          }
        ),
        chrome.totalsSheet && totals && /* @__PURE__ */ jsx(
          "div",
          {
            className: "vqdoc-scope vqdoc-scrim",
            style: { height: "auto", alignItems: "flex-end", justifyContent: "flex-end", padding: 24 },
            onMouseDown: (e) => {
              if (e.target === e.currentTarget) chrome.setTotalsSheet(false);
            },
            children: /* @__PURE__ */ jsxs("div", { className: "vqdoc-modal", style: { width: "min(420px, 100%)" }, children: [
              /* @__PURE__ */ jsxs("header", { children: [
                /* @__PURE__ */ jsx("span", { className: "ico", children: /* @__PURE__ */ jsx(Receipt, { size: 18 }) }),
                /* @__PURE__ */ jsx("span", { className: "t", children: /* @__PURE__ */ jsx("h3", { children: "Totals" }) }),
                /* @__PURE__ */ jsx("button", { type: "button", className: "vqdoc-icon quiet", onClick: () => chrome.setTotalsSheet(false), "aria-label": "Close", children: /* @__PURE__ */ jsx(X, { size: 18 }) })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "body flush", children: totals })
            ] })
          }
        ),
        children
      ]
    }
  );
}
function Zone({ title, count, tone, actions, children, onFocusCapture, className = "" }) {
  return /* @__PURE__ */ jsxs("section", { className: `vqdoc-zone ${className}`, onFocusCapture, children: [
    (title || actions) && /* @__PURE__ */ jsxs("div", { className: "vqdoc-zone-h", "data-tone": tone, children: [
      /* @__PURE__ */ jsx("span", { children: title }),
      count !== void 0 && /* @__PURE__ */ jsx("span", { className: "count", children: count }),
      /* @__PURE__ */ jsx("span", { className: "spacer" }),
      actions
    ] }),
    children
  ] });
}
function Field({ label, span = 2, children, hint, required, error }) {
  return /* @__PURE__ */ jsxs("div", { className: "vqdoc-f", "data-span": span, "data-bad": error ? "true" : void 0, children: [
    /* @__PURE__ */ jsxs("span", { className: "vqdoc-lbl", children: [
      label,
      required && /* @__PURE__ */ jsx("span", { className: "req", children: "*" })
    ] }),
    children,
    error ? /* @__PURE__ */ jsx("span", { className: "err", children: error }) : hint && /* @__PURE__ */ jsx("span", { className: "hint", children: hint })
  ] });
}
function Sheet({ title, hint, icon, onClose, children, footer, width = 640 }) {
  return /* @__PURE__ */ jsx(Scrim, { onClose, children: /* @__PURE__ */ jsxs("div", { className: "vqdoc-modal", style: { width: `min(${width}px, 100%)` }, children: [
    /* @__PURE__ */ jsxs("header", { children: [
      icon && /* @__PURE__ */ jsx("span", { className: "ico", children: icon }),
      /* @__PURE__ */ jsxs("span", { className: "t", children: [
        /* @__PURE__ */ jsx("h3", { children: title }),
        hint && /* @__PURE__ */ jsx("p", { children: hint })
      ] }),
      /* @__PURE__ */ jsx("button", { type: "button", className: "vqdoc-icon quiet", onClick: onClose, "aria-label": "Close", children: /* @__PURE__ */ jsx(X, { size: 18 }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "body", children }),
    footer && /* @__PURE__ */ jsx("footer", { children: footer })
  ] }) });
}
function Scrim({ onClose, align = "center", children, padding }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: "vqdoc-scope vqdoc-scrim",
      style: {
        height: "auto",
        ...align === "end" ? { alignItems: "flex-end", justifyContent: "flex-end", padding: padding ?? 24 } : {}
      },
      onMouseDown: (e) => {
        if (e.target === e.currentTarget) onClose?.();
      },
      children
    }
  );
}
function VqSelect({
  value,
  onChange,
  options,
  /* [{ value, label, hint?, disabled? }]        */
  placeholder = "Choose",
  disabled = false,
  id,
  className = "",
  ariaLabel,
  maxHeight = 320
}) {
  const reactId = useId();
  const listId = id ? `${id}-list` : `vqsel-${reactId}`;
  const btnRef = useRef(null);
  const popRef = useRef(null);
  const typed = useRef({ str: "", at: 0 });
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [rect, setRect] = useState(null);
  const [scale, setScale] = useState("1");
  const items = options || [];
  const index = items.findIndex((o) => String(o.value) === String(value));
  const current = index >= 0 ? items[index] : null;
  const measure = useCallback(() => {
    const el = btnRef.current;
    if (!el) return;
    setRect(el.getBoundingClientRect());
    const s = getComputedStyle(el).getPropertyValue("--d-scale").trim();
    if (s) setScale(s);
  }, []);
  useLayoutEffect(() => {
    if (!open) return void 0;
    measure();
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [open, measure]);
  useEffect(() => {
    if (!open) return void 0;
    const onDown = (e) => {
      if (popRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);
  useEffect(() => {
    if (!open) return;
    setActive(index >= 0 ? index : 0);
  }, [open, index]);
  useEffect(() => {
    if (!open || active < 0) return;
    const el = popRef.current?.querySelector(`[data-i="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [open, active]);
  const choose = (i) => {
    const opt = items[i];
    if (!opt || opt.disabled) return;
    onChange(opt.value);
    setOpen(false);
    btnRef.current?.focus();
  };
  const step = (delta) => {
    if (!items.length) return;
    let i = active;
    for (let n = 0; n < items.length; n += 1) {
      i = (i + delta + items.length) % items.length;
      if (!items[i].disabled) break;
    }
    setActive(i);
  };
  const onKeyDown = (e) => {
    if (disabled) return;
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      btnRef.current?.focus();
      return;
    }
    if (e.key === "Tab") {
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      step(1);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      step(-1);
      return;
    }
    if (e.key === "Home") {
      e.preventDefault();
      setActive(items.findIndex((o) => !o.disabled));
      return;
    }
    if (e.key === "End") {
      e.preventDefault();
      for (let i = items.length - 1; i >= 0; i -= 1) {
        if (!items[i].disabled) {
          setActive(i);
          break;
        }
      }
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(active);
      return;
    }
    if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const now = Date.now();
      typed.current.str = now - typed.current.at > 700 ? e.key : typed.current.str + e.key;
      typed.current.at = now;
      const q = typed.current.str.toLowerCase();
      const hit = items.findIndex((o) => !o.disabled && String(o.label).toLowerCase().startsWith(q));
      if (hit >= 0) setActive(hit);
    }
  };
  const list = open && rect ? createPortal(
    /* @__PURE__ */ jsxs(
      "div",
      {
        ref: popRef,
        id: listId,
        role: "listbox",
        "aria-activedescendant": active >= 0 ? `${listId}-${active}` : void 0,
        className: "vqdoc-menu",
        style: {
          "--d-scale": scale,
          left: rect.left,
          width: Math.max(rect.width, 200 * Number(scale || 1)),
          maxHeight: maxHeight * Number(scale || 1),
          ...window.innerHeight - rect.bottom < Math.min(maxHeight, 240) && rect.top > window.innerHeight - rect.bottom ? { bottom: window.innerHeight - rect.top + 6 } : { top: rect.bottom + 6 }
        },
        children: [
          items.map((o, i) => /* @__PURE__ */ jsxs(
            "div",
            {
              id: `${listId}-${i}`,
              "data-i": i,
              role: "option",
              "aria-selected": String(o.value) === String(value),
              "aria-disabled": o.disabled || void 0,
              className: "vqdoc-menu-item",
              "data-active": i === active ? "true" : void 0,
              "data-chosen": String(o.value) === String(value) ? "true" : void 0,
              onMouseEnter: () => !o.disabled && setActive(i),
              onMouseDown: (e) => e.preventDefault(),
              onClick: () => choose(i),
              children: [
                /* @__PURE__ */ jsxs("span", { className: "lbl", children: [
                  o.label,
                  o.hint && /* @__PURE__ */ jsx("span", { className: "hint", children: o.hint })
                ] }),
                String(o.value) === String(value) && /* @__PURE__ */ jsx(Check, { size: 15, className: "tick" })
              ]
            },
            `${o.value}-${i}`
          )),
          !items.length && /* @__PURE__ */ jsx("div", { className: "vqdoc-menu-empty", children: "Nothing to choose from" })
        ]
      }
    ),
    document.body
  ) : null;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        id,
        ref: btnRef,
        className: `vqdoc-select ${className}`,
        disabled,
        "aria-haspopup": "listbox",
        "aria-expanded": open,
        "aria-controls": open ? listId : void 0,
        "aria-label": ariaLabel,
        onClick: () => !disabled && setOpen((o) => !o),
        onKeyDown,
        children: [
          /* @__PURE__ */ jsx("span", { className: "val", children: current ? current.label : /* @__PURE__ */ jsx("span", { className: "ph", children: placeholder }) }),
          /* @__PURE__ */ jsx(ChevronDown, { size: 16, className: "chev", "aria-hidden": "true" })
        ]
      }
    ),
    list
  ] });
}
const WheelInput = forwardRef(function WheelInput2({ onWheel, style, className, ...props }, forwarded) {
  const ref = useRef(null);
  useImperativeHandle(forwarded, () => ref.current, []);
  const onWheelRef = useRef(onWheel);
  useEffect(() => {
    onWheelRef.current = onWheel;
  }, [onWheel]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = (e) => {
      if (onWheelRef.current) {
        onWheelRef.current(e);
      }
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);
  return /* @__PURE__ */ jsx(
    "input",
    {
      ref,
      className,
      style,
      ...props
    }
  );
});
const num$3 = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};
function DocumentQuickRow({ doc, chrome, ctx, visible, onCommit }) {
  const { quickQuery, setQuickQuery, focusQuick } = chrome;
  const qtyRef = useRef(null);
  const blank = { product: null, name: "", quantity: 1, freeQuantity: 0, price: 0, discount: 0, discountType: "fixed" };
  const [draft, setDraft] = useState(blank);
  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));
  const pick = useCallback((product) => {
    if (!product) return;
    setDraft((d) => ({
      ...d,
      product,
      name: product.name,
      /* A purchase line opens at what the thing costs; a sale at what it
         sells for. The document says which. */
      price: num$3(ctx.priceOf ? ctx.priceOf(product) : product.price)
    }));
    setTimeout(() => qtyRef.current?.focus?.(), 40);
  }, [ctx]);
  const commit = useCallback(() => {
    if (!draft.product && !draft.name) return;
    onCommit(draft);
    setDraft(blank);
    setQuickQuery("");
    setTimeout(focusQuick, 30);
  }, [draft, onCommit, setQuickQuery, focusQuick]);
  const onKey = (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    commit();
  };
  const cell = (id) => {
    if (!visible.includes(id)) return null;
    switch (id) {
      case "idx":
        return /* @__PURE__ */ jsx("td", { className: "c fit", children: /* @__PURE__ */ jsx(Zap, { size: 13 }) }, "idx");
      case "item":
        return /* @__PURE__ */ jsx("td", { className: "item", children: /* @__PURE__ */ jsx("div", { className: "vqdoc-combo", id: "quick-entry-input", children: /* @__PURE__ */ jsx(
          AsyncProductCombobox,
          {
            selectedItem: draft.product,
            value: quickQuery,
            onQueryChange: setQuickQuery,
            onSelect: pick,
            onCreateNew: ctx.onCreateProduct,
            defaultOptions: ctx.defaultProducts,
            placeholder: "Just start typing — the first keystroke lands here",
            addNewLabel: "Add New Product",
            hideCostAndMargin: !ctx.isAdmin,
            portal: true
          }
        ) }) }, "item");
      case "qty":
      case "counted":
        return /* @__PURE__ */ jsx("td", { className: "c fit", children: /* @__PURE__ */ jsx(
          WheelInput,
          {
            ref: qtyRef,
            type: "number",
            className: "vqdoc-cell c w-qty",
            value: draft.quantity,
            onKeyDown: onKey,
            onChange: (e) => set("quantity", num$3(e.target.value)),
            onFocus: (e) => e.target.select()
          }
        ) }, id);
      case "free":
        return /* @__PURE__ */ jsx("td", { className: "c fit", children: /* @__PURE__ */ jsx(
          WheelInput,
          {
            type: "number",
            className: "vqdoc-cell c free w-qty",
            value: draft.freeQuantity || "",
            placeholder: "0",
            onKeyDown: onKey,
            onChange: (e) => set("freeQuantity", num$3(e.target.value))
          }
        ) }, "free");
      case "rate":
        return /* @__PURE__ */ jsx("td", { className: "n fit", children: /* @__PURE__ */ jsx(
          WheelInput,
          {
            type: "number",
            className: "vqdoc-cell w-num",
            value: draft.price,
            onKeyDown: onKey,
            onChange: (e) => set("price", num$3(e.target.value)),
            onFocus: (e) => e.target.select()
          }
        ) }, "rate");
      case "disc":
        return /* @__PURE__ */ jsx("td", { className: "n fit", children: /* @__PURE__ */ jsx(
          WheelInput,
          {
            type: "number",
            className: "vqdoc-cell w-num disc",
            value: draft.discount,
            onKeyDown: onKey,
            onChange: (e) => set("discount", num$3(e.target.value))
          }
        ) }, "disc");
      case "del":
        return /* @__PURE__ */ jsx("td", { className: "fit", children: /* @__PURE__ */ jsxs("button", { type: "button", className: "vqdoc-btn xs pri", onClick: commit, title: "Add this line (Enter)", children: [
          /* @__PURE__ */ jsx(Plus, { size: 13 }),
          " Add"
        ] }) }, "del");
      default:
        return /* @__PURE__ */ jsx("td", { className: "fit" }, id);
    }
  };
  return /* @__PURE__ */ jsxs("tr", { className: "quick", children: [
    /* @__PURE__ */ jsx("td", { className: "fit" }),
    visible.map(cell)
  ] });
}
const FIELD_LIBRARY = {
  account: { label: "Money goes to", hint: "Which drawer, cheque or bank account this is banked into." },
  accountOut: { label: "Money comes from", hint: "Which drawer or bank account this is paid out of." },
  refund: { label: "Refund from", hint: "Where the money goes back out of." },
  docno: { label: "Document number", hint: "Your own reference. Off means the system numbers it." },
  supplierRef: { label: "Supplier's bill no.", hint: "The number on THEIR document, so you can find it again when they call." },
  date: { label: "Date", hint: "Off means today, every time." },
  terms: { label: "Payment terms", hint: "Immediately, or within 7 / 15 / 30 / 60 days. Choosing terms sets the due date." },
  due: { label: "Due date", hint: "The date itself, editable — for when a customer has agreed something unusual." },
  validity: { label: "Valid until", hint: "After this date the quotation lapses and the prices on it no longer stand." },
  delivery: { label: "Delivery date", hint: "When the customer expects the goods." },
  expected: { label: "Expected on", hint: "When the supplier says the goods will arrive." },
  warehouse: { label: "Warehouse", hint: "Which stock these lines come out of or go into." },
  fromWh: { label: "From warehouse", hint: "Where the goods are now." },
  toWh: { label: "To warehouse", hint: "Where they are going." },
  source: { label: "Against", hint: "The document this one answers to. Picking it loads the lines and caps what can be returned." },
  reason: { label: "Reason", hint: "Why this was raised — it prints on the document and shows in the ledger." },
  frequency: { label: "Repeats", hint: "How often an invoice is raised from this template." },
  nextRun: { label: "Next one on", hint: "The date the next invoice is raised." },
  status: { label: "Status", hint: "A paused template raises nothing until you start it again." },
  attachment: { label: "Attachment", hint: "A photograph or scan of the bill, kept with the record." },
  notes: { label: "Note", hint: "A line of free text that prints on the document." },
  tax: { label: "Tax", hint: "The tax line in the totals, using the rates from your tax settings." },
  free: { label: "Free quantity", hint: "A free-goods column on every row — for buy-ten-get-one and samples." },
  prevbal: { label: "Previous balance", hint: "What this party owed before today, and what they will owe once this is added." },
  margin: { label: "Margin button", hint: "A margin figure that shows only while the button is held down." }
};
const base = {
  menu: "Sales",
  /* Most documents do not move anybody's balance. The ones that do say so. */
  ledger: 0,
  ref: { label: "Document no.", prefix: "DOC-" },
  fields: [],
  columns: ["idx", "item", "qty", "rate", "total", "del"],
  money: { lines: "priced", tax: false, charges: false, settle: "none", rounding: true, margin: false },
  stock: { effect: "none", check: "none", badge: false },
  tabs: true,
  api: {}
};
const merge = (spec) => ({
  ...base,
  ...spec,
  ref: { ...base.ref, ...spec.ref || {} },
  money: { ...base.money, ...spec.money || {} },
  stock: { ...base.stock, ...spec.stock || {} },
  party: spec.party ? { required: true, balance: false, ...spec.party } : { role: "none" }
});
const DOCUMENTS = {
  /* ── SELLING ────────────────────────────────────────────────────── */
  "sales-invoice": merge({
    id: "sales-invoice",
    name: "Sales invoice",
    title: { new: "New sale", edit: "Edit sale", tab: "Sale" },
    emptyTitle: "Nothing on this invoice yet",
    emptyHint: "Add an item below, or scan a barcode.",
    menu: "Sales",
    zone: "Customer & details",
    /* Selling to a supplier happens too — an offcut, a returned pallet —
        so the picker looks through everyone. */
    party: {
      role: "customer",
      label: "Customer",
      search: "all",
      balance: true,
      placeholder: "Search anyone you sell to"
    },
    ref: { label: "Invoice no.", prefix: "INV-" },
    /* No invoice-number box. The server numbers a sale itself, through
       SequenceService, and never reads a number sent with one — so the
       field, the browser-side counter behind it and the prefix setting
       that formatted it produced a number that was displayed, saved in the
       browser, printed on nothing and thrown away. What the customer's
       copy shows is what `store.sales.show` returns. */
    fields: ["account", "date", "terms", "due", "notes", "tax", "free", "prevbal", "margin"],
    /* The keys the screen this replaces saved its preferences under. */
    legacyKeys: {
      comp: "invoice_composition_v2",
      fields: "invoice_fields_v1",
      stock: "invoice_show_stock"
    },
    columns: ["idx", "item", "qty", "free", "uom", "rate", "disc", "total", "del"],
    /* The only document where every part of the money model is on: goods
       are sold, tax is charged, carriage is added and cash changes hands
       at the counter. Everything else below is this, minus something. */
    money: {
      lines: "priced",
      tax: true,
      charges: true,
      settle: "in",
      rounding: true,
      margin: true,
      settleLabel: "Amount paid",
      balanceLabels: ["Balance due", "Change owed", "Settled in full"]
    },
    stock: { effect: "out", check: "block", badge: "available" },
    /* Sold on credit: they owe the shop more. */
    ledger: 1,
    drafts: "sales",
    api: {
      store: "store.sales.store",
      update: "store.sales.update",
      show: "store.sales.show",
      print: "store.sales.print",
      index: "store.sales.index"
    }
  }),
  quotation: merge({
    id: "quotation",
    name: "Quotation",
    title: { new: "New quotation", edit: "Edit quotation", tab: "Quote" },
    menu: "Sales",
    zone: "Customer & details",
    party: { role: "customer", label: "Customer", balance: true },
    ref: { label: "Quotation no.", prefix: "QUO-" },
    /* No payment account, no due date, no amount paid. A quotation is an
       offer: nothing has been sold, so nothing can have been banked. What
       it needs instead is an expiry, because a price quoted in March
       cannot be held to in December — and the old screen saved that field
       as null on every single quotation because no input fed it. */
    /* No free-goods column: `proposal_items` has nowhere to put one and
       the controller validates no key for it, so the units would be shown,
       netted out of the quoted total, and then not be on the saved
       quotation at all. */
    fields: ["docno", "date", "validity", "terms", "notes", "tax", "prevbal", "margin"],
    columns: ["idx", "item", "qty", "uom", "rate", "disc", "total", "del"],
    /* Rounding off: only the sales and purchase invoices send the
       difference as `round_off`. Rounding here would print one figure and
       store another. */
    money: { lines: "priced", tax: true, charges: true, settle: "none", rounding: false, margin: true },
    /* Nothing moves and nothing is reserved, but the operator still wants
       to see what is on the shelf before promising it. */
    stock: { effect: "none", check: "none", badge: "available" },
    /* An offer posts nothing. The balance is shown so the operator knows
        who they are quoting, not because this document moves it. */
    ledger: 0,
    drafts: "quotation",
    api: {
      store: "store.proposals.store",
      update: "store.proposals.update",
      print: "store.proposals.print",
      index: "store.proposals.index",
      convertSale: "store.proposals.convert-to-sale",
      convertOrder: "store.proposals.convert-to-presale"
    }
  }),
  "sales-order": merge({
    id: "sales-order",
    name: "Sales order",
    title: { new: "New sales order", edit: "Edit sales order", tab: "Order" },
    menu: "Sales",
    zone: "Customer & details",
    party: { role: "customer", label: "Customer", balance: true },
    ref: { label: "Order no.", prefix: "SO-" },
    /* An order is often taken with money down, so the settlement row is
       an ADVANCE rather than payment in full — and it is wired, unlike
       the old screen which collected it and dropped it on the floor. */
    /* Same as the quotation: `sales_order_items` has no free-goods
       column and the controller validates no key for one. */
    fields: ["account", "docno", "date", "delivery", "terms", "notes", "tax", "prevbal", "margin"],
    columns: ["idx", "item", "qty", "uom", "rate", "disc", "total", "del"],
    money: {
      lines: "priced",
      tax: true,
      charges: true,
      settle: "advance",
      rounding: false,
      margin: true,
      settleLabel: "Advance received",
      balanceLabels: ["Balance on delivery", "Overpaid", "Paid in full"]
    },
    /* Ordered goods are spoken for, not gone. Selling past what is free
       is allowed but the operator is told they are going on backorder. */
    stock: { effect: "reserve", check: "warn", badge: "unreserved" },
    /* Once it has become a sale the document is history and must not be
       editable — the old screen got this right and it is worth keeping. */
    lockWhen: (doc) => ["completed", "converted"].includes(doc?.status),
    lockNote: "This order has been converted to a sale and can no longer be changed.",
    /* An order posts nothing until it becomes a sale. Any advance taken
        is real money, but it is handled as a payment, not by this line. */
    ledger: 0,
    drafts: "sales-order",
    /* No print route: `pre-sales.print` is still a stub, and the old
       screen's button printed `store.sales.print` with an ORDER id, which
       is a different document entirely. Once the order is converted the
       sale it became is what gets printed. */
    api: {
      store: "store.pre-sales.store",
      update: "store.sales.orders.update",
      index: "store.pre-sales.index",
      convert: "store.pre-sales.convert"
    }
  }),
  "sale-return": merge({
    id: "sale-return",
    name: "Sale return",
    title: { new: "New sale return", edit: "Edit sale return", tab: "Return" },
    menu: "Returns",
    zone: "Customer & details",
    party: { role: "customer", label: "Customer", balance: true },
    ref: { label: "Return no.", prefix: "RET-" },
    /* A return answers to a sale. Picking that sale loads its lines and
       caps every quantity at what was actually sold, net of anything
       already returned — without it, a return is a hole you can walk both
       stock and cash out through. */
    source: {
      doc: "sales-invoice",
      label: "Against invoice",
      required: true,
      api: "store.api.sales.returnable",
      show: "store.api.sales.returnable.show",
      capBy: "quantity"
    },
    /* No document number (the return is numbered by the system and the
       endpoint takes no reference), no free column and — see below — no
       document discount. Each of those was a box whose number went
       nowhere, and the discount one was worse than nothing: it lowered the
       refund on the screen while the server valued the return at full
       price and quietly turned the difference into store credit. */
    fields: ["refund", "source", "date", "reason", "notes", "tax", "prevbal"],
    columns: ["idx", "item", "ordered", "qty", "uom", "rate", "disc", "total", "del"],
    /* No carriage row. The returns endpoint has no column for one and
       validates no key for it, so an editable charge here would add to the
       total on the screen and be dropped on the way to the server — the
       exact defect this file exists to prevent. */
    money: {
      lines: "priced",
      tax: true,
      charges: false,
      settle: "refund",
      rounding: false,
      margin: false,
      docDiscount: false,
      settleLabel: "Refund given",
      balanceLabels: ["Credited to account", "Refunded over", "Settled in full"]
    },
    stock: { effect: "in", check: "none", badge: false },
    /* The return's own line spelling: `price` like the sale it answers to,
       and each line carries the id of the ORIGINAL line so the server can
       cap it. Per line rather than per product, because the same product
       can appear twice on one sale at two prices. */
    lineKeys: { source: "original_sale_item_id" },
    /* Goods came back: the shop owes the customer, so their net falls. */
    ledger: -1,
    drafts: "sale-return",
    api: { store: "store.returns.store", print: "store.sales.print", index: "store.returns-history.index" }
  }),
  "recurring-invoice": merge({
    id: "recurring-invoice",
    name: "Recurring invoice",
    title: { new: "New recurring invoice", edit: "Edit recurring invoice", tab: "Template" },
    menu: "Sales",
    zone: "Customer & schedule",
    party: { role: "customer", label: "Customer", balance: false },
    ref: { label: "Template name", prefix: "", free: true },
    /* A template is never paid — the invoices it raises are. So the
       settlement row comes off, and everything that shapes the invoices
       it will raise (tax, discounts, carriage) stays and, unlike before,
       actually saves. */
    /* A template has no number and no date of its own — it has a name
       and a schedule. What it CAN carry is what reaches the invoices it
       raises: the lines, their tax rates, and a discount on the whole
       document, which the generator spreads across the lines the same way
       the invoice screen does. Carriage stays off — the sale engine has no
       document-level charge, so a delivery fee here would show on the
       template and on no invoice it ever raised. */
    fields: ["warehouse", "frequency", "nextRun", "status", "terms", "notes", "tax", "free", "margin"],
    columns: ["idx", "item", "qty", "free", "uom", "rate", "disc", "total", "del"],
    money: { lines: "priced", tax: true, charges: false, settle: "none", rounding: false, margin: true },
    stock: { effect: "none", check: "none", badge: "available" },
    /* The template stores its lines as a JSON blob validated key by key,
       and it spells them differently from everything else. */
    lineKeys: { qty: "qty", price: "unit_price", free: "free_qty" },
    /* A template raises invoices; it is not one. */
    ledger: 0,
    tabs: false,
    drafts: null,
    api: {
      store: "store.recurring-invoices.store",
      update: "store.recurring-invoices.update",
      index: "store.recurring-invoices.index"
    }
  }),
  /* ── BUYING ─────────────────────────────────────────────────────── */
  "purchase-invoice": merge({
    id: "purchase-invoice",
    name: "Purchase invoice",
    title: { new: "New purchase", edit: "Edit purchase", tab: "Purchase" },
    emptyTitle: "Nothing on this purchase yet",
    emptyHint: "Search for what you are buying, or scan the delivery in.",
    menu: "Purchases",
    zone: "Supplier & details",
    /* Searches everyone, not only suppliers: buying stock back from a
        customer is an ordinary thing, and refusing it just forces the same
        person to be registered twice. */
    party: {
      role: "supplier",
      label: "Supplier",
      search: "all",
      balance: true,
      placeholder: "Search anyone you buy from"
    },
    /* Two numbers, and they are not the same number. Ours files the
       document; theirs is what the supplier will quote down the phone. */
    ref: { label: "Purchase no.", prefix: "PUR-" },
    /* No free-goods column: `purchase_items` has no column to put it in, so
        offering one would be a box that swallows a number. When the schema
        grows one, this list is where it comes back. */
    fields: [
      "accountOut",
      "supplierRef",
      "docno",
      "date",
      "terms",
      "due",
      "warehouse",
      "notes",
      "tax",
      "prevbal"
    ],
    columns: ["idx", "item", "qty", "uom", "rate", "taxpct", "bizpct", "disc", "total", "del"],
    /* Purchases were built with their own spelling of a line. Naming it
        here beats a special case in the payload builder. */
    lineKeys: { qty: "qty", price: "unit_cost", discount: "discount_amount", taxRate: "tax_rate" },
    dateKey: "purchase_date",
    /* Money leaves rather than arrives, and there is no margin on a
       purchase — the price IS the cost, so a margin button here would be
       showing the operator a number about nothing. */
    /* No delivery/extra rows. Freight and duty on a purchase are LANDED
        COSTS: the server spreads them across the goods so they end up in
        what the stock is worth, which a flat charge on the bill would not
        do. Leaving `charges` on rendered two editable rows that added to
        the on-screen total and were then dropped by the server — the very
        defect this kit was written to stop. */
    /* Rounding ON, and the difference is sent as `round_off`: the screen
        shows the figure the supplier will be paid and the ledger records
        where the odd paisa went. Rounding off while still sending a
        round-off was the one combination that made the two disagree. */
    money: {
      lines: "priced",
      tax: true,
      charges: false,
      settle: "out",
      rounding: true,
      margin: false,
      /* The supplier taxed their lines and the bill discount comes
         off afterwards — `PurchaseService` posts it that way, so the
         screen has to read it that way or the two totals differ by
         the tax on the discount. */
      taxAfterDocDiscount: false,
      /* Tax on a purchase is whatever the supplier charged, line by
         line — it is not the buyer's to choose. So the row reports
         rather than offers, and there is no rate dropdown. */
      taxRatePicker: false,
      settleLabel: "Amount paid",
      balanceLabels: ["Balance owed", "Paid over", "Settled in full"],
      chargeLabels: { delivery: "Freight", extra: "Other charges" }
    },
    /* Goods arrive. There is nothing to check against — you cannot buy
       more than exists. */
    stock: { effect: "in", check: "none", badge: "onhand" },
    /* Bought on account: the shop owes them, so their net FALLS. This is
        the one that was adding instead of subtracting. */
    ledger: -1,
    drafts: "purchase",
    api: {
      store: "store.v3.purchases.store",
      update: "store.v3.purchases.update",
      index: "store.v3.purchases.index"
    }
  }),
  "purchase-order": merge({
    id: "purchase-order",
    name: "Purchase order",
    title: { new: "New purchase order", edit: "Edit purchase order", tab: "PO" },
    menu: "Purchases",
    zone: "Supplier & details",
    party: { role: "supplier", label: "Supplier", balance: true },
    ref: { label: "Order no.", prefix: "PO-" },
    fields: [
      "accountOut",
      "supplierRef",
      "docno",
      "date",
      "expected",
      "terms",
      "warehouse",
      "notes",
      "tax",
      "free",
      "prevbal"
    ],
    columns: ["idx", "item", "qty", "free", "uom", "rate", "disc", "total", "del"],
    money: {
      lines: "priced",
      tax: true,
      charges: true,
      settle: "advance",
      rounding: false,
      margin: false,
      settleLabel: "Advance paid",
      balanceLabels: ["Balance on receipt", "Paid over", "Paid in full"],
      chargeLabels: { delivery: "Freight", extra: "Other charges" }
    },
    /* `purchase_order_items` calls it a unit cost, like the purchase
       invoice does. */
    lineKeys: { price: "unit_cost" },
    /* Nothing has arrived yet — an order puts goods on the incoming list,
       it does not put them on the shelf. */
    stock: { effect: "onorder", check: "none", badge: "onhand" },
    /* Ordering commits nothing to the ledger until the goods arrive. */
    ledger: 0,
    drafts: "purchase-order",
    api: {
      store: "store.purchase-orders.store",
      update: "store.purchase-orders.update",
      print: "store.purchase-orders.print",
      index: "store.purchase-orders.index",
      receive: "store.purchase-orders.receive"
    }
  }),
  "goods-receipt": merge({
    id: "goods-receipt",
    name: "Goods receipt",
    title: { new: "Receive goods", edit: "Edit goods receipt", tab: "GRN" },
    menu: "Purchases",
    zone: "Supplier & delivery",
    party: { role: "supplier", label: "Supplier", required: false, balance: false },
    ref: { label: "Receipt no.", prefix: "GRN-" },
    /* No lookup endpoint: the receipt is opened FROM the purchase, so
       the server hands the screen the lines and their remaining
       quantities as props. A second round trip would only be a chance for
       the two to disagree. */
    source: { doc: "purchase-invoice", label: "Against purchase", required: true, capBy: "quantity" },
    lineKeys: { qty: "receiving_qty", source: "purchase_item_id" },
    /* A receipt is a count, not a negotiation. The prices were agreed on
       the order; what matters at the door is how many turned up, in what
       condition and with what batch and expiry on them. Money stays off
       the screen unless the shop tracks landed cost. */
    /* The receipt is booked as of now, into the warehouse the purchase
       named, under a number the system gives it. None of those three is
       this screen's to decide, so none of them is offered. */
    fields: ["source", "notes"],
    /* No free column: `receiving_qty` is the only quantity the receive
       endpoint takes, so a second one would be a box that swallows a
       number. Free goods on a delivery are received as quantity. */
    columns: ["idx", "item", "ordered", "qty", "uom", "batch", "expiry", "del"],
    money: { lines: "count", tax: false, charges: false, settle: "none", rounding: false, margin: false },
    stock: { effect: "in", check: "none", badge: "onhand" },
    ledger: 0,
    tabs: false,
    drafts: null,
    api: { store: "store.v3.purchases.receive.store", index: "store.v3.purchases.index" }
  }),
  "purchase-return": merge({
    id: "purchase-return",
    name: "Purchase return",
    title: { new: "New purchase return", edit: "Edit purchase return", tab: "Return" },
    menu: "Purchases",
    zone: "Supplier & details",
    party: { role: "supplier", label: "Supplier", balance: true },
    ref: { label: "Return no.", prefix: "PRET-" },
    /* Same as the receipt: seeded from the purchase it answers to,
       including which FIFO batch each line came out of. */
    source: { doc: "purchase-invoice", label: "Against purchase", required: true, capBy: "quantity" },
    lineKeys: { qty: "return_qty", source: "purchase_item_id" },
    /* Everything about the money on a purchase return is decided by the
       batches the goods came out of: the endpoint takes a date, a reason
       and a quantity per line, and values the rest itself. A refund box, a
       tax row and a discount here would all have been figures that changed
       the screen and reached nothing. */
    fields: ["source", "date", "reason", "prevbal"],
    columns: ["idx", "item", "ordered", "qty", "uom", "rate", "total", "del"],
    money: {
      lines: "priced",
      tax: false,
      charges: false,
      settle: "none",
      rounding: false,
      margin: false,
      docDiscount: false
    },
    /* Goods go back to the supplier, so they leave the shelf — and unlike
       a sale, you cannot send back more than you bought. */
    stock: { effect: "out", check: "block", badge: "onhand" },
    /* Goods went back to the supplier: the shop owes them less, so their
        net rises back towards zero. */
    ledger: 1,
    /* NOT a tabbed document. It is opened from one purchase's URL and its
       lines carry that purchase's item and batch ids; keeping a draft
       queue meant opening a second purchase's return showed the first
       one's lines, and saving posted THOSE batches against THIS supplier. */
    tabs: false,
    drafts: null,
    api: { store: "store.v3.purchases.return.store", index: "store.v3.purchases.index" }
  }),
  "debit-note": merge({
    id: "debit-note",
    name: "Debit note",
    title: { new: "New debit note", edit: "Edit debit note", tab: "Note" },
    menu: "Purchases",
    zone: "Supplier & details",
    party: { role: "supplier", label: "Supplier", balance: true },
    ref: { label: "Note no.", prefix: "DN-" },
    source: { doc: "purchase-invoice", label: "Against purchase", required: false, capBy: null },
    /* A debit note says "we owe you less than your bill says" — short
       delivery, damaged goods, a price that was wrong. It adjusts the
       ledger, it is not paid, and it only moves stock if the goods are
       physically going back, which is why that is a switch rather than an
       assumption. */
    /* `debit_notes.reference_number` is unique and generated; a typed one
       would either be ignored or collide. */
    fields: ["source", "date", "reason", "notes", "tax", "prevbal"],
    columns: ["idx", "item", "qty", "uom", "rate", "total", "del"],
    money: { lines: "priced", tax: true, charges: false, settle: "none", rounding: false, margin: false },
    stock: {
      effect: "optional",
      check: "none",
      badge: "onhand",
      optionLabel: "Send the goods back too",
      optionHint: "Off means this is a price or billing adjustment only and nothing leaves the shelf."
    },
    /* A debit note says the shop owes them less than their bill claimed. */
    ledger: 1,
    drafts: "debit-note",
    api: {
      store: "store.debit-notes.store",
      update: "store.debit-notes.update",
      print: "store.debit-notes.print",
      index: "store.debit-notes.index"
    }
  }),
  /* ── MONEY OUT ──────────────────────────────────────────────────── */
  expense: merge({
    id: "expense",
    name: "Expense",
    title: { new: "Record an expense", edit: "Edit expense", tab: "Expense" },
    menu: "Money",
    zone: "Payee & details",
    party: { role: "supplier", label: "Paid to", required: false, balance: false },
    ref: { label: "Voucher no.", prefix: "EXP-" },
    /* An expense has no products on it, so the line is a category and an
       amount — but it IS still a line, because one voucher covering rent
       and utilities is a normal thing and the old single-amount form
       could not do it. */
    fields: ["accountOut", "docno", "date", "attachment", "notes", "tax"],
    columns: ["idx", "category", "desc", "amount", "del"],
    /* No document discount: the endpoint stores the sum of the lines, so
       a discount would lower the total on the screen, be excluded from the
       amount posted, and leave the difference sitting in the payee's
       account as money still owed to somebody who was paid in full. */
    money: {
      lines: "amount",
      tax: true,
      charges: false,
      settle: "out",
      rounding: false,
      margin: false,
      docDiscount: false,
      settleLabel: "Amount paid",
      balanceLabels: ["Still owing", "Paid over", "Settled in full"]
    },
    stock: { effect: "none", check: "none", badge: false },
    /* An unpaid expense is money the shop owes the payee. */
    ledger: -1,
    tabs: false,
    drafts: null,
    api: { store: "store.expenses.store", update: "store.expenses.update", index: "store.expenses.index" }
  }),
  /* ── STOCK ──────────────────────────────────────────────────────── */
  "stock-transfer": merge({
    id: "stock-transfer",
    name: "Stock transfer",
    title: { new: "New stock transfer", edit: "Edit stock transfer", tab: "Transfer" },
    emptyTitle: "Nothing to move yet",
    emptyHint: "Add the items going from one warehouse to the other.",
    menu: "Stock",
    zone: "Where it moves",
    /* Nobody is on the other side of a transfer — the shop is on both
       ends. So no party combobox, and warehouses take its place. */
    party: { role: "none" },
    ref: { label: "Transfer no.", prefix: "TRF-" },
    /* A transfer can be written down before the van leaves, so its status
        says whether the stock has actually moved yet. */
    fields: ["docno", "date", "fromWh", "toWh", "status", "notes"],
    columns: ["idx", "item", "qty", "uom", "del"],
    /* Not one figure of money anywhere. The same goods are worth the same
       after the van ride, so a total would be a number with no meaning. */
    money: { lines: "count", tax: false, charges: false, settle: "none", rounding: false, margin: false },
    stock: { effect: "move", check: "block", badge: "onhand" },
    tabs: false,
    drafts: null,
    api: { store: "store.stock-transfers.store", index: "store.stock-transfers.index" }
  }),
  "stock-audit": merge({
    id: "stock-audit",
    name: "Stock audit",
    title: { new: "New stock audit", edit: "Edit stock audit", tab: "Audit" },
    emptyTitle: "Nothing counted yet",
    emptyHint: "Scan the shelf, or search for what you are counting.",
    menu: "Stock",
    zone: "What is being counted",
    party: { role: "none" },
    ref: { label: "Audit no.", prefix: "AUD-" },
    /* A count can be saved half-done and finished later; only completing
        it writes the corrections to stock. */
    fields: ["docno", "date", "warehouse", "status", "notes"],
    /* The counted figure is not a quantity being moved, it is a
       correction: whatever is written here becomes the truth, and the
       difference column is the size of the correction. */
    columns: ["idx", "item", "expected", "counted", "diff", "uom", "del"],
    money: { lines: "count", tax: false, charges: false, settle: "none", rounding: false, margin: false },
    stock: { effect: "set", check: "none", badge: "onhand" },
    tabs: false,
    drafts: null,
    api: { store: "store.stock-takes.store", index: "store.stock-takes.index" }
  })
};
const documentType = (id, tt) => {
  const doc = DOCUMENTS[id] || DOCUMENTS["sales-invoice"];
  return doc;
};
const hasMoney = (d) => d.money.lines !== "count";
const settles = (d) => d.money.settle !== "none";
const num$2 = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};
const paisa = (n) => Math.round(n * 100) / 100;
function lineTotal(item, { freeOn = true } = {}) {
  const gross = num$2(item.quantity) * num$2(item.price);
  const disc = item.discountType === "percent" ? gross * (num$2(item.discount) / 100) : num$2(item.discount);
  return Math.max(0, gross - disc);
}
const amountOf = (item) => num$2(item.amount ?? item.value);
function computeTotals({
  doc,
  items = [],
  document: d = {},
  settings,
  fields = {},
  roundTotal
}) {
  if (!hasMoney(doc)) {
    const units = items.reduce((s, i) => s + num$2(i.quantity ?? i.counted_quantity), 0);
    return {
      none: true,
      lines: items.length,
      units,
      subtotal: 0,
      itemDiscounts: 0,
      afterDiscount: 0,
      taxAmount: 0,
      taxRate: 0,
      taxExempt: true,
      charges: 0,
      grandTotal: 0,
      settled: 0,
      balance: 0,
      balanceTone: "clear",
      balanceLabel: "",
      settleLabel: "",
      totalCost: 0,
      profit: 0,
      marginPct: 0,
      lineNets: []
    };
  }
  const byAmount = doc.money.lines === "amount";
  const freeOn = doc.fields.includes("free") && fields.free !== false;
  const freeQtyOf = (i) => freeOn ? num$2(i.freeQuantity) : 0;
  const subtotal = byAmount ? items.reduce((s, i) => s + amountOf(i), 0) : items.reduce((s, i) => s + (num$2(i.quantity) + freeQtyOf(i)) * num$2(i.price), 0);
  const totalCost = byAmount ? 0 : items.reduce(
    (s, i) => s + (num$2(i.quantity) + freeQtyOf(i)) * num$2(i.cost),
    0
  );
  const itemDiscounts = byAmount ? 0 : items.reduce((s, i) => {
    const gross = num$2(i.quantity) * num$2(i.price);
    const disc = i.discountType === "percent" ? gross * (num$2(i.discount) / 100) : num$2(i.discount);
    return s + disc + freeQtyOf(i) * num$2(i.price);
  }, 0);
  const afterItemDiscounts = subtotal - itemDiscounts;
  const invoiceDiscount = num$2(d.discount);
  const afterDiscount = Math.max(0, afterItemDiscounts - invoiceDiscount);
  const taxOn = doc.money.tax && doc.fields.includes("tax") && fields.tax !== false;
  const taxExempt = !taxOn;
  const taxRate = taxExempt ? 0 : num$2(d.tax);
  const lineNets = byAmount ? items.map((i) => ({ net: amountOf(i), raw: amountOf(i), rate: taxExempt ? 0 : num$2(i.tax_rate ?? taxRate) })) : items.map((i) => {
    const gross = num$2(i.quantity) * num$2(i.price);
    const disc = i.discountType === "percent" ? gross * (num$2(i.discount) / 100) : num$2(i.discount);
    return {
      /* Clamped for this line's own tax, unclamped for the pool the
         document discount is shared out of — exactly how the server
         does it, and the only way an over-discounted line lands on
         the same number at both ends. */
      net: Math.max(0, gross - disc),
      raw: gross - disc,
      /* A rate typed on the line wins over the product's own, which
         wins over the document's. Reading only the product's meant a
         typed override changed what was SENT and not what was shown,
         so the screen and the saved bill disagreed by the difference. */
      rate: taxExempt ? 0 : i.tax_rate !== void 0 && i.tax_rate !== null ? num$2(i.tax_rate) : i.product?.tax_rate !== void 0 && i.product?.tax_rate !== null ? num$2(i.product.tax_rate) : taxRate
    };
  });
  const pool = Math.max(0, lineNets.reduce((s, l) => s + l.raw, 0));
  const taxOnDiscounted = doc.money.taxAfterDocDiscount !== false;
  const taxAmount = lineNets.reduce((s, l) => {
    const share = taxOnDiscounted && pool > 0 ? invoiceDiscount * (l.net / pool) : 0;
    const taxable = Math.max(0, l.net - share);
    return s + paisa(taxable * (l.rate / 100));
  }, 0);
  const ratesInPlay = Array.from(new Set(lineNets.filter((l) => l.net > 0).map((l) => l.rate)));
  const taxRateLabel = ratesInPlay.length === 1 ? `${ratesInPlay[0]}%` : "mixed rates";
  const chargesOn = doc.money.charges;
  const deliveryCharge = chargesOn ? num$2(d.delivery_charge) : 0;
  const extraFields = Array.isArray(d.extraFields) ? d.extraFields : [];
  const extraCharge = !chargesOn ? 0 : extraFields.length ? extraFields.reduce((s, f) => s + num$2(f.value), 0) : num$2(d.extra_charge_value);
  const charges = deliveryCharge + extraCharge;
  const rawGrandTotal = afterDiscount + taxAmount + charges;
  const rounded = paisa(rawGrandTotal);
  const grandTotal = doc.money.rounding && roundTotal ? roundTotal(rounded, settings) : rounded;
  const settled = settles(doc) ? num$2(d.amountPaid) : 0;
  const balance = grandTotal - settled;
  const balanceTone = !settles(doc) ? "clear" : balance > 5e-3 ? "due" : balance < -5e-3 ? "over" : "clear";
  const [dueWord, overWord, clearWord] = doc.money.balanceLabels || ["Balance due", "Change owed", "Settled in full"];
  const balanceLabel = balanceTone === "due" ? dueWord : balanceTone === "over" ? overWord : clearWord;
  const profit = doc.money.margin ? afterDiscount - totalCost : 0;
  const marginPct = doc.money.margin && afterDiscount > 0 ? profit / afterDiscount * 100 : 0;
  return {
    none: false,
    lines: items.length,
    units: items.reduce((s, i) => s + num$2(i.quantity) + freeQtyOf(i), 0),
    subtotal,
    totalCost,
    itemDiscounts,
    afterItemDiscounts,
    invoiceDiscount,
    afterDiscount,
    taxOn,
    taxExempt,
    taxRate,
    taxAmount,
    taxRateLabel,
    lineNets,
    deliveryCharge,
    extraCharge,
    charges,
    rawGrandTotal,
    grandTotal,
    settled,
    balance,
    balanceTone,
    balanceLabel,
    settleLabel: doc.money.settleLabel || "Amount paid",
    profit,
    marginPct,
    freeOn
  };
}
function moneyPayload({ doc, totals, document: d = {} }) {
  if (!hasMoney(doc)) return {};
  const out = {
    /* Only where the document actually takes one — see `docDiscount`. */
    ...doc.money.docDiscount === false ? {} : { discount: totals.invoiceDiscount },
    tax: totals.taxAmount,
    /* The server recomputes tax from the RATE and ignores the amount. Until
       this line existed it was recomputing from the shop default, so a
       document shown at 18% could be saved at 0%. */
    tax_rate: totals.taxRate,
    tax_inclusive: false,
    tax_exempt: totals.taxExempt
  };
  if (doc.money.charges) {
    const extras = Array.isArray(d.extraFields) ? d.extraFields : [];
    out.delivery_charge = totals.deliveryCharge;
    out.extra_charge_value = totals.extraCharge;
    out.extra_charge_label = extras.length ? JSON.stringify(extras) : d.extra_charge_label || "";
  }
  if (settles(doc)) out.amount_paid = totals.settled;
  return out;
}
function linePayload({ doc, items, totals }) {
  const freeQtyOf = (i) => totals.freeOn ? num$2(i.freeQuantity) : 0;
  if (doc.money.lines === "amount") {
    return items.filter((i) => i.category || i.category_id || i.desc).map((i) => ({
      category_id: i.category?.id ?? i.category_id ?? null,
      description: i.desc || "",
      amount: amountOf(i)
    }));
  }
  if (doc.money.lines === "count") {
    return items.filter((i) => i.product).map((i) => ({
      product_id: i.product.id,
      variant_id: i.variant?.id || null,
      quantity: num$2(i.quantity),
      ...i.counted_quantity !== void 0 ? { counted_quantity: num$2(i.counted_quantity) } : {},
      ...i.batch ? { batch: i.batch } : {},
      ...i.expiry ? { expiry: i.expiry } : {}
    }));
  }
  const K = doc.lineKeys || {};
  return items.filter((i) => i.product).map((i) => {
    const gross = num$2(i.quantity) * num$2(i.price);
    const disc = i.discountType === "percent" ? gross * (num$2(i.discount) / 100) : num$2(i.discount);
    const line = {
      product_id: i.product.id,
      variant_id: i.variant?.id || null,
      [K.qty || "quantity"]: num$2(i.quantity),
      [K.price || "price"]: num$2(i.price),
      [K.discount || "discount"]: disc
    };
    line[K.free || "free_quantity"] = freeQtyOf(i);
    line[K.discountType || "discount_type"] = "fixed";
    if (!K.price) line.unit_price = num$2(i.price);
    if (K.qty && K.qty !== "quantity") line.quantity = num$2(i.quantity);
    const rate = totals?.taxExempt ? null : i.tax_rate ?? i.product?.tax_rate;
    if (rate !== void 0 && rate !== null) line[K.taxRate || "tax_rate"] = num$2(rate);
    if (i.source_line_id) line[K.source || "source_line_id"] = i.source_line_id;
    if (i.batch) line.batch_number = i.batch;
    if (i.expiry) line.expiry_date = i.expiry;
    return line;
  });
}
const num$1 = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};
const stockOf = (product, stored, mode = "available") => {
  if (mode === "onhand" && product) {
    const total = parseFloat(product.stock_quantity);
    if (Number.isFinite(total)) return total;
  }
  return availableOf(product, stored);
};
const availableOf = (product, stored) => {
  if (product) {
    if (product.available_stock !== void 0 && product.available_stock !== null) {
      return num$1(product.available_stock);
    }
    const total = parseFloat(product.stock_quantity);
    if (Number.isFinite(total)) return Math.max(0, total - num$1(product.reserved_quantity));
  }
  return num$1(stored);
};
const HEADS = {
  idx: { label: "#", cls: "c fit" },
  item: { label: "Item", cls: "item" },
  category: { label: "Category", cls: "item" },
  desc: { label: "Description", cls: "item" },
  ordered: { label: "Ordered", cls: "c fit" },
  qty: { label: "Qty", cls: "c fit" },
  counted: { label: "Counted", cls: "c fit" },
  expected: { label: "On record", cls: "c fit" },
  diff: { label: "Difference", cls: "c fit" },
  free: { label: "Free", cls: "c fit" },
  uom: { label: "Unit", cls: "c fit" },
  batch: { label: "Batch", cls: "c fit" },
  expiry: { label: "Expires", cls: "c fit" },
  rate: { label: "Price", cls: "n fit" },
  taxpct: { label: "Tax %", cls: "n fit" },
  bizpct: { label: "Business %", cls: "n fit" },
  cost: { label: "Cost", cls: "n fit" },
  disc: { label: "Discount", cls: "n fit" },
  amount: { label: "Amount", cls: "n fit" },
  total: { label: "Amount", cls: "n fit" },
  del: { label: "", cls: "fit" }
};
const CELLS = {
  idx: (item, idx) => /* @__PURE__ */ jsx("span", { className: "vqdoc-idx", children: idx + 1 }),
  item: (item, idx, c) => (
    /* The onboarding tour points at the first item cell. It was pointing at
       an id nothing rendered, so that step of the tour had no spotlight and
       never advanced by itself. */
    /* @__PURE__ */ jsxs(
      "div",
      {
        id: idx === 0 ? "tour-invoice-product" : void 0,
        className: "vqdoc-combo",
        style: { position: "relative", minWidth: 0 },
        children: [
          /* @__PURE__ */ jsx(
            AsyncProductCombobox,
            {
              selectedItem: item.product,
              onSelect: (product) => c.onPickProduct(product, item.id),
              onCreateNew: c.onCreateProduct,
              onEdit: c.onEditProduct,
              defaultOptions: c.defaultProducts,
              placeholder: c.itemPlaceholder || "Search for an item",
              addNewLabel: "Add New Product",
              hideCostAndMargin: !c.isAdmin,
              portal: true
            }
          ),
          (c.locked || c.lockItems) && /* @__PURE__ */ jsx("div", { style: { position: "absolute", inset: 0, cursor: "not-allowed" } })
        ]
      }
    )
  ),
  category: (item, idx, c) => /* @__PURE__ */ jsx(
    VqSelect,
    {
      ariaLabel: "Expense category",
      disabled: c.locked,
      value: item.category_id ?? "",
      placeholder: "Choose a category",
      onChange: (v) => c.update(item.id, "category_id", v),
      options: (c.categories || []).map((x) => ({ value: x.id, label: x.name }))
    }
  ),
  desc: (item, idx, c) => /* @__PURE__ */ jsx(
    "input",
    {
      type: "text",
      className: "vqdoc-in",
      value: item.desc || "",
      disabled: c.locked,
      placeholder: "What it was for",
      onChange: (e) => c.update(item.id, "desc", e.target.value)
    }
  ),
  /* Read-only, and deliberately so: this is what the order or the original
     invoice said, and it is the ceiling the line is checked against. */
  ordered: (item) => /* @__PURE__ */ jsx("span", { style: { color: "var(--vq-text-3)" }, children: item.ordered_quantity ?? item.max_quantity ?? "—" }),
  qty: (item, idx, c) => {
    const cap = item.max_quantity;
    const over = cap !== void 0 && cap !== null && num$1(item.quantity) > num$1(cap);
    return /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(
        WheelInput,
        {
          type: "number",
          className: `vqdoc-cell c w-qty ${over ? "bad" : ""}`,
          value: item.quantity ?? 1,
          disabled: c.locked,
          onChange: (e) => c.update(item.id, "quantity", num$1(e.target.value)),
          onWheel: (e) => {
            e.preventDefault();
            const f = c.qtyFloor ?? 1;
            const cap2 = item.max_quantity;
            const next = num$1(item.quantity) + (e.deltaY < 0 ? 1 : -1);
            c.update(item.id, "quantity", Math.min(cap2 === void 0 || cap2 === null ? Infinity : num$1(cap2), Math.max(f, next)));
          },
          onFocus: (e) => {
            e.target.select();
            c.onCellFocus?.();
          }
        }
      ),
      over && /* @__PURE__ */ jsxs("span", { className: "vqdoc-stock", "data-low": "true", children: [
        "only ",
        cap,
        " available"
      ] }),
      !over && item.product && c.showStock && c.stockBadge !== false && (() => {
        if (item.product.type === "service") {
          return /* @__PURE__ */ jsx("span", { className: "vqdoc-stock", style: { color: "var(--vq-accent-text, #6366f1)", fontWeight: 600 }, children: item.product.default_duration ? `${item.product.default_duration}m` : "Service" });
        }
        const n = stockOf(item.product, item.available_stock, c.stockMode);
        return /* @__PURE__ */ jsxs("span", { className: "vqdoc-stock", "data-low": c.stockMode !== "onhand" && !(n > 0), children: [
          n,
          " ",
          c.stockWord || "in hand"
        ] });
      })()
    ] });
  },
  counted: (item, idx, c) => /* @__PURE__ */ jsx(
    WheelInput,
    {
      type: "number",
      className: "vqdoc-cell c w-qty",
      value: item.counted_quantity ?? 0,
      disabled: c.locked,
      onChange: (e) => c.update(item.id, "counted_quantity", num$1(e.target.value)),
      onWheel: (e) => {
        e.preventDefault();
        c.update(item.id, "counted_quantity", Math.max(0, num$1(item.counted_quantity) + (e.deltaY < 0 ? 1 : -1)));
      },
      onFocus: (e) => e.target.select()
    }
  ),
  expected: (item) => /* @__PURE__ */ jsx("span", { style: { color: "var(--vq-text-3)" }, children: item.product ? availableOf(item.product, item.available_stock) : "—" }),
  /* The size of the correction, and which way it goes. Short stock is the
     one that costs money, so it is the one that is coloured. */
  diff: (item) => {
    if (!item.product) return /* @__PURE__ */ jsx("span", { children: "—" });
    const on = availableOf(item.product, item.available_stock);
    const d = num$1(item.counted_quantity) - on;
    return /* @__PURE__ */ jsx("span", { className: "vqdoc-stock", "data-low": d < 0, style: d > 0 ? { color: "var(--vq-success)" } : void 0, children: d > 0 ? `+${d}` : d });
  },
  free: (item, idx, c) => /* @__PURE__ */ jsx(
    WheelInput,
    {
      type: "number",
      className: "vqdoc-cell c free w-qty",
      value: item.freeQuantity || "",
      placeholder: "0",
      disabled: c.locked,
      onChange: (e) => c.update(item.id, "freeQuantity", num$1(e.target.value)),
      onWheel: (e) => {
        e.preventDefault();
        c.update(item.id, "freeQuantity", Math.max(0, num$1(item.freeQuantity) + (e.deltaY < 0 ? 1 : -1)));
      }
    }
  ),
  uom: (item) => /* @__PURE__ */ jsx("span", { style: { color: "var(--vq-text-3)", fontSize: "var(--d-t-2xs)" }, children: item.product?.unit || item.product?.uom || "—" }),
  batch: (item, idx, c) => /* @__PURE__ */ jsx(
    "input",
    {
      type: "text",
      className: "vqdoc-in c",
      style: { width: "var(--d-w-num)" },
      value: item.batch || "",
      placeholder: "—",
      disabled: c.locked,
      onChange: (e) => c.update(item.id, "batch", e.target.value)
    }
  ),
  expiry: (item, idx, c) => /* @__PURE__ */ jsx(
    "input",
    {
      type: "date",
      className: "vqdoc-in c",
      style: { width: "var(--d-w-amt)" },
      value: item.expiry || "",
      disabled: c.locked,
      onChange: (e) => c.update(item.id, "expiry", e.target.value)
    }
  ),
  /* `readOnly.rate` is not `locked`. On a purchase return the value of a
     line is the FIFO batch cost it came in at — a real figure, worth showing,
     and not one this document is allowed to change. An editable box that the
     server ignores is the exact defect this kit exists to prevent. */
  rate: (item, idx, c) => /* @__PURE__ */ jsx(
    WheelInput,
    {
      type: "number",
      className: "vqdoc-cell w-num",
      value: item.price ?? 0,
      disabled: c.locked || c.readOnly?.rate,
      onChange: (e) => c.update(item.id, "price", num$1(e.target.value)),
      onWheel: (e) => {
        e.preventDefault();
        const step = num$1(item.price) >= 100 ? 10 : 1;
        c.update(item.id, "price", Math.max(0, num$1(item.price) + (e.deltaY < 0 ? 1 : -1) * step));
      },
      onFocus: (e) => {
        e.target.select();
        c.onCellFocus?.();
      }
    }
  ),
  /* What the supplier actually billed on this line. Blank means "whatever
     this product's rate is", which is where it starts. */
  taxpct: (item, idx, c) => /* @__PURE__ */ jsx(
    WheelInput,
    {
      type: "number",
      className: "vqdoc-cell c w-qty",
      value: item.tax_rate ?? "",
      disabled: c.locked,
      placeholder: item.product?.tax_rate ?? "0",
      onChange: (e) => c.update(item.id, "tax_rate", e.target.value === "" ? null : num$1(e.target.value)),
      onFocus: (e) => e.target.select()
    }
  ),
  /* How much of this line was bought for the business. Anything below 100
     means part of its tax is not reclaimable, and the server splits it. */
  bizpct: (item, idx, c) => /* @__PURE__ */ jsx(
    WheelInput,
    {
      type: "number",
      className: "vqdoc-cell c w-qty",
      value: item.business_pct ?? 100,
      disabled: c.locked,
      onChange: (e) => c.update(item.id, "business_pct", Math.max(0, Math.min(100, num$1(e.target.value)))),
      onWheel: (e) => {
        e.preventDefault();
        c.update(item.id, "business_pct", Math.max(0, Math.min(100, num$1(item.business_pct ?? 100) + (e.deltaY < 0 ? 5 : -5))));
      },
      onFocus: (e) => e.target.select()
    }
  ),
  disc: (item, idx, c) => /* @__PURE__ */ jsxs("div", { className: "vqdoc-pair", children: [
    /* @__PURE__ */ jsx(
      WheelInput,
      {
        type: "number",
        className: "vqdoc-cell w-num disc",
        value: item.discount ?? 0,
        disabled: c.locked || c.readOnly?.disc,
        onChange: (e) => c.update(item.id, "discount", num$1(e.target.value)),
        onWheel: (e) => {
          e.preventDefault();
          const step = item.discountType === "percent" ? 1 : num$1(item.price) >= 100 ? 5 : 1;
          c.update(item.id, "discount", Math.max(0, num$1(item.discount) + (e.deltaY < 0 ? 1 : -1) * step));
        }
      }
    ),
    /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        className: "vqdoc-flip",
        "data-on": item.discountType === "percent" ? "true" : "false",
        disabled: c.locked || c.readOnly?.disc,
        title: item.discountType === "percent" ? "Percentage off" : "Amount off",
        onClick: () => !c.locked && c.update(item.id, "discountType", item.discountType === "fixed" ? "percent" : "fixed"),
        children: item.discountType === "percent" ? "%" : c.currency
      }
    )
  ] }),
  amount: (item, idx, c) => /* @__PURE__ */ jsx(
    WheelInput,
    {
      type: "number",
      className: "vqdoc-cell total w-amt",
      value: item.amount ?? 0,
      disabled: c.locked,
      onChange: (e) => c.update(item.id, "amount", num$1(e.target.value)),
      onFocus: (e) => e.target.select()
    }
  ),
  /* The amount is editable, and the little button says which way the sum is
     solved when you edit it — change the price, or change the quantity. */
  total: (item, idx, c) => /* @__PURE__ */ jsxs("div", { className: "vqdoc-pair", children: [
    /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        className: "vqdoc-flip",
        "data-on": c.totalMode(item.id) === "price" ? "true" : "false",
        disabled: c.locked || c.readOnly?.total,
        title: c.totalMode(item.id) === "price" ? "Editing the amount changes the price" : "Editing the amount changes the quantity",
        onClick: () => !c.locked && c.toggleTotalMode(item.id),
        children: c.totalMode(item.id) === "price" ? c.currency : "#"
      }
    ),
    /* @__PURE__ */ jsx(
      WheelInput,
      {
        type: "number",
        className: "vqdoc-cell total w-amt",
        value: parseFloat(lineTotal(item).toFixed(2)),
        disabled: c.locked || c.readOnly?.total,
        onChange: (e) => c.onTotalChange(item, e.target.value),
        onWheel: (e) => {
          e.preventDefault();
          const cur = lineTotal(item);
          const step = cur >= 100 ? 10 : 1;
          c.onTotalChange(item, String(Math.max(0, cur + (e.deltaY < 0 ? 1 : -1) * step)));
        },
        onFocus: (e) => e.target.select()
      }
    )
  ] }),
  del: (item, idx, c) => !c.locked ? /* @__PURE__ */ jsx("button", { type: "button", className: "vqdoc-icon sm quiet danger", onClick: () => c.remove(item.id), title: "Remove this line", children: /* @__PURE__ */ jsx(Trash2, { size: 15 }) }) : null
};
function DocumentLines({ doc, chrome, items = [], ctx, onQuickAdd }) {
  const { level, asCards, armedRow, setArmedRow, showQuickEntry } = chrome;
  const boxRef = useRef(null);
  const count = items.length;
  const visible = doc.columns.filter((id) => {
    if (id === "del" || id === "item" || id === "category" || id === "desc") return true;
    if (id === "free") return ctx.freeOn && (level.cols.includes("free") || items.some((i) => num$1(i.freeQuantity) > 0));
    if (id === "disc") return ctx.canDiscount && level.cols.includes("disc");
    if (id === "idx" || id === "uom") return level.cols.includes(id);
    if (id === "taxpct" || id === "bizpct") return !asCards;
    return true;
  });
  const pick = useCallback((product, id) => {
    ctx.onPickProduct(product, id);
    if (items.length && items[items.length - 1].id === id && ctx.addLine) ctx.addLine();
  }, [ctx, items]);
  const cellCtx = { ...ctx, onPickProduct: pick };
  const grew = useRef(count);
  useEffect(() => {
    if (count > grew.current && boxRef.current) {
      boxRef.current.scrollTo({ top: boxRef.current.scrollHeight, behavior: "smooth" });
    }
    grew.current = count;
  }, [count]);
  const empty = !count && !showQuickEntry ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: visible.length + 1, children: /* @__PURE__ */ jsxs("div", { className: "vqdoc-empty", children: [
    /* @__PURE__ */ jsx("span", { className: "ico", children: /* @__PURE__ */ jsx(FileText, { size: 22 }) }),
    /* @__PURE__ */ jsx("p", { children: doc.emptyTitle || `Nothing on this ${doc.name.toLowerCase()} yet` }),
    /* @__PURE__ */ jsx("small", { children: doc.emptyHint || "Add an item below." })
  ] }) }) }) : null;
  const quickRow = showQuickEntry && !ctx.locked && onQuickAdd ? /* @__PURE__ */ jsx(DocumentQuickRow, { doc, chrome, ctx: cellCtx, visible, onCommit: onQuickAdd }) : null;
  if (asCards) {
    return /* @__PURE__ */ jsx(CardList, { doc, chrome, items, ctx: cellCtx, visible });
  }
  return /* @__PURE__ */ jsx("div", { className: "vqdoc-linesbox", ref: boxRef, children: /* @__PURE__ */ jsxs("table", { className: "vqdoc-lines", children: [
    /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
      /* @__PURE__ */ jsx("th", { className: "fit", "aria-label": "Reorder" }),
      visible.map((id) => /* @__PURE__ */ jsx("th", { className: HEADS[id]?.cls, children: HEADS[id]?.label }, id))
    ] }) }),
    /* @__PURE__ */ jsxs("tbody", { children: [
      quickRow,
      !items.length && empty,
      items.map((item, idx) => /* @__PURE__ */ jsxs(
        "tr",
        {
          className: `${ctx.draggedIndex === idx ? "dragging" : ""} ${ctx.invalid?.includes(idx) ? "bad" : ""}`,
          draggable: armedRow === idx && !ctx.locked,
          onDragStart: (e) => ctx.onDragStart?.(e, idx),
          onDragOver: (e) => ctx.onDragOver?.(e, idx),
          onDragEnd: () => {
            ctx.onDragEnd?.();
            setArmedRow(null);
          },
          children: [
            /* @__PURE__ */ jsx("td", { className: "fit", children: /* @__PURE__ */ jsx(
              "span",
              {
                className: "grip",
                title: "Drag to reorder",
                onPointerDown: () => {
                  if (!ctx.locked) setArmedRow(idx);
                },
                onPointerUp: () => setArmedRow(null),
                children: /* @__PURE__ */ jsx(GripVertical, { size: 14 })
              }
            ) }),
            visible.map((id) => /* @__PURE__ */ jsx("td", { className: HEADS[id]?.cls, children: CELLS[id]?.(item, idx, cellCtx) }, id))
          ]
        },
        item.id
      ))
    ] })
  ] }) });
}
function CardList({ doc, chrome, items, ctx, visible }) {
  const { openLine, setOpenLine } = chrome;
  const priced = doc.money.lines === "priced";
  return /* @__PURE__ */ jsxs("div", { className: "vqdoc-linesbox", children: [
    !items.length && /* @__PURE__ */ jsxs("div", { className: "vqdoc-empty", children: [
      /* @__PURE__ */ jsx("span", { className: "ico", children: /* @__PURE__ */ jsx(FileText, { size: 22 }) }),
      /* @__PURE__ */ jsx("p", { children: doc.emptyTitle || `Nothing on this ${doc.name.toLowerCase()} yet` }),
      /* @__PURE__ */ jsx("small", { children: doc.emptyHint || "Add an item below." })
    ] }),
    items.map((item, idx) => {
      const open = openLine === item.id;
      return /* @__PURE__ */ jsxs(React.Fragment, { children: [
        /* @__PURE__ */ jsxs("div", { className: `vqdoc-card ${open ? "open" : ""}`, onClick: () => setOpenLine(open ? null : item.id), children: [
          /* @__PURE__ */ jsxs("div", { className: "top", children: [
            /* @__PURE__ */ jsx("span", { className: "vqdoc-idx", children: idx + 1 }),
            /* @__PURE__ */ jsx("span", { className: "nm", children: item.product?.name || item.name || item.desc || "Choose an item" }),
            priced && /* @__PURE__ */ jsx("span", { className: "amt", children: ctx.money(lineTotal(item)) }),
            doc.money.lines === "amount" && /* @__PURE__ */ jsx("span", { className: "amt", children: ctx.money(num$1(item.amount)) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mini-row", children: [
            visible.includes("qty") && /* @__PURE__ */ jsxs("span", { className: "vqdoc-mini", children: [
              /* @__PURE__ */ jsx("span", { className: "k", children: "Qty" }),
              /* @__PURE__ */ jsx("span", { className: "v", children: item.quantity ?? 0 })
            ] }),
            visible.includes("counted") && /* @__PURE__ */ jsxs("span", { className: "vqdoc-mini", children: [
              /* @__PURE__ */ jsx("span", { className: "k", children: "Counted" }),
              /* @__PURE__ */ jsx("span", { className: "v", children: item.counted_quantity ?? 0 })
            ] }),
            visible.includes("free") && !!item.freeQuantity && /* @__PURE__ */ jsxs("span", { className: "vqdoc-mini", children: [
              /* @__PURE__ */ jsx("span", { className: "k", children: "Free" }),
              /* @__PURE__ */ jsx("span", { className: "v", children: item.freeQuantity })
            ] }),
            priced && /* @__PURE__ */ jsxs("span", { className: "vqdoc-mini", children: [
              /* @__PURE__ */ jsx("span", { className: "k", children: "Price" }),
              /* @__PURE__ */ jsx("span", { className: "v", children: item.price ?? 0 })
            ] }),
            visible.includes("disc") && !!item.discount && /* @__PURE__ */ jsxs("span", { className: "vqdoc-mini", children: [
              /* @__PURE__ */ jsx("span", { className: "k", children: "Off" }),
              /* @__PURE__ */ jsxs("span", { className: "v", children: [
                item.discount,
                item.discountType === "percent" ? "%" : ""
              ] })
            ] })
          ] })
        ] }),
        open && /* @__PURE__ */ jsxs("div", { className: "vqdoc-adjust", onClick: (e) => e.stopPropagation(), children: [
          visible.filter((id) => id !== "idx" && id !== "del" && id !== "diff" && id !== "expected" && id !== "ordered").map((id) => /* @__PURE__ */ jsxs("div", { className: "f", style: id === "item" || id === "desc" || id === "category" ? { gridColumn: "1 / -1" } : void 0, children: [
            /* @__PURE__ */ jsx("span", { className: "vqdoc-lbl", children: HEADS[id]?.label || id }),
            id === "qty" ? /* @__PURE__ */ jsxs("div", { className: "vqdoc-stepper", children: [
              /* @__PURE__ */ jsx("button", { type: "button", disabled: ctx.locked, onClick: () => ctx.update(item.id, "quantity", Math.max(0, num$1(item.quantity) - 1)), children: /* @__PURE__ */ jsx(Minus, { size: 15 }) }),
              /* @__PURE__ */ jsx("input", { type: "number", value: item.quantity ?? 1, disabled: ctx.locked, onChange: (e) => ctx.update(item.id, "quantity", num$1(e.target.value)) }),
              /* @__PURE__ */ jsx("button", { type: "button", disabled: ctx.locked, onClick: () => ctx.update(item.id, "quantity", num$1(item.quantity) + 1), children: /* @__PURE__ */ jsx(Plus, { size: 15 }) })
            ] }) : CELLS[id]?.(item, idx, ctx)
          ] }, id)),
          !ctx.locked && /* @__PURE__ */ jsx("div", { className: "f", style: { gridColumn: "1 / -1" }, children: /* @__PURE__ */ jsxs("button", { type: "button", className: "vqdoc-btn danger", onClick: () => {
            setOpenLine(null);
            ctx.remove(item.id);
          }, children: [
            /* @__PURE__ */ jsx(Trash2, { size: 15 }),
            " Remove this line"
          ] }) })
        ] })
      ] }, item.id);
    })
  ] });
}
function usePartyBalance({ storeSlug, partyId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!partyId) {
      setData(null);
      return void 0;
    }
    let alive = true;
    setLoading(true);
    window.axios.get(route("store.api.party-balance", { store_slug: storeSlug, party: partyId })).then((res) => {
      if (alive) setData(res.data);
    }).catch(() => {
      if (alive) setData(null);
    }).finally(() => {
      if (alive) setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [storeSlug, partyId]);
  return useMemo(() => ({
    loading,
    known: !!data,
    net: data ? Number(data.net) || 0 : 0,
    receivable: data ? Number(data.receivable) || 0 : 0,
    payable: data ? Number(data.payable) || 0 : 0
  }), [data, loading]);
}
function projectBalance({ net, unsettled, direction }) {
  const after = net + (direction || 0) * (unsettled || 0);
  return {
    before: net,
    after,
    moves: !!direction && Math.abs(unsettled || 0) > 5e-3,
    /* Said the way a shopkeeper would say it, in whichever direction it
       happens to fall. "Al Ujrat will owe" is simply wrong once the shop
       is the one in debt. */
    label: (name) => after >= -5e-3 ? `${name} will owe` : `You will owe ${name}`,
    beforeLabel: (name) => net >= -5e-3 ? "Previous balance" : `Already owed to ${name}`
  };
}
function DocumentTotals({
  doc,
  chrome,
  totals,
  document: d,
  ctx
}) {
  const { level, showAllTotals, setShowAllTotals, totalRef } = chrome;
  const { money, currency, locked, patch, taxRates } = ctx;
  const patchSettle = ctx.patchSettle || patch;
  const SWITCHED = { tax: "tax", prevbal: "prevbal" };
  const row = (id) => {
    if (SWITCHED[id] && !chrome.carries(SWITCHED[id])) return false;
    return level.summary.includes(id) || showAllTotals;
  };
  const hasHidden = level.summary.length < 9;
  const docDiscount = doc.money.docDiscount !== false;
  const charges = doc.money.charges;
  const chargeLabels = doc.money.chargeLabels || {};
  const settles2 = doc.money.settle !== "none";
  const bal = projectBalance({
    net: ctx.prevBalance || 0,
    unsettled: totals.balance,
    direction: doc.ledger
  });
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("section", { className: "vqdoc-zone", children: [
      /* @__PURE__ */ jsxs("div", { className: "vqdoc-zone-h", children: [
        /* @__PURE__ */ jsx("span", { children: "Totals" }),
        /* @__PURE__ */ jsx("span", { className: "spacer" }),
        hasHidden && /* @__PURE__ */ jsx("button", { type: "button", className: "togg", onClick: () => setShowAllTotals((p) => !p), children: showAllTotals ? "Less" : "Show all" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "vqdoc-sum", children: [
        row("subtotal") && /* @__PURE__ */ jsxs("div", { className: "vqdoc-sum-row", children: [
          /* @__PURE__ */ jsx("span", { className: "k", children: "Subtotal" }),
          /* @__PURE__ */ jsx("span", { className: "v", children: money(totals.subtotal) })
        ] }),
        row("item_disc") && totals.itemDiscounts > 0 && /* @__PURE__ */ jsxs("div", { className: "vqdoc-sum-row neg", children: [
          /* @__PURE__ */ jsx("span", { className: "k", children: "Line discounts" }),
          /* @__PURE__ */ jsxs("span", { className: "v", children: [
            "−",
            money(totals.itemDiscounts)
          ] })
        ] }),
        docDiscount && row("doc_disc") && /* @__PURE__ */ jsxs("div", { className: "vqdoc-sum-row edit", children: [
          /* @__PURE__ */ jsx("span", { className: "k", children: "Discount" }),
          /* @__PURE__ */ jsxs("span", { className: "v", children: [
            /* @__PURE__ */ jsx("span", { className: "cur", children: currency }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                className: "vqdoc-cell",
                value: d.discount ?? 0,
                disabled: locked,
                placeholder: "0",
                onFocus: (e) => e.target.select(),
                onChange: (e) => patch({ discount: parseFloat(e.target.value) || 0 })
              }
            )
          ] })
        ] }),
        doc.money.tax && row("tax") && /* @__PURE__ */ jsxs("div", { className: "vqdoc-sum-row edit", children: [
          /* @__PURE__ */ jsxs("span", { className: "k", children: [
            "Tax",
            totals.taxAmount > 0 ? ` · ${money(totals.taxAmount)}` : "",
            totals.taxAmount > 0 && totals.taxRateLabel === "mixed rates" && /* @__PURE__ */ jsx("span", { className: "sub", children: "at each product’s own rate" })
          ] }),
          /* @__PURE__ */ jsx("span", { className: "v", children: doc.money.taxRatePicker === false ? (
            /* Reported, not chosen. */
            /* @__PURE__ */ jsx("span", { children: money(totals.taxAmount) })
          ) : /* @__PURE__ */ jsx(
            VqSelect,
            {
              className: "sm",
              ariaLabel: "Tax rate",
              disabled: locked,
              value: d.tax ?? 0,
              onChange: (v) => patch({ tax: parseFloat(v) || 0 }),
              options: [
                { value: 0, label: "No tax" },
                ...(taxRates || []).map((t) => ({ value: t.rate, label: t.name, hint: `${t.rate}%` })),
                ...d.tax && !(taxRates || []).some((t) => t.rate === d.tax) ? [{ value: d.tax, label: `Custom ${d.tax}%` }] : []
              ]
            }
          ) })
        ] }),
        charges && ctx.chargeVisible?.delivery !== false && row("shipping") && /* @__PURE__ */ jsxs("div", { className: "vqdoc-sum-row edit", children: [
          /* @__PURE__ */ jsx("span", { className: "k", children: chargeLabels.delivery || "Delivery" }),
          /* @__PURE__ */ jsxs("span", { className: "v", children: [
            /* @__PURE__ */ jsx("span", { className: "cur", children: currency }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                className: "vqdoc-cell",
                value: d.delivery_charge ?? 0,
                disabled: locked,
                placeholder: "0",
                onFocus: (e) => e.target.select(),
                onChange: (e) => patch({ delivery_charge: parseFloat(e.target.value) || 0 })
              }
            )
          ] })
        ] }),
        charges && ctx.chargeVisible?.extra !== false && row("extra") && /* @__PURE__ */ jsxs("div", { className: "vqdoc-sum-row edit", children: [
          /* @__PURE__ */ jsx("span", { className: "k", children: /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              className: "lbl-in",
              value: d.extra_charge_label || "",
              disabled: locked,
              placeholder: chargeLabels.extra || "Other charge",
              onChange: (e) => patch({ extra_charge_label: e.target.value })
            }
          ) }),
          /* @__PURE__ */ jsxs("span", { className: "v", children: [
            /* @__PURE__ */ jsx("span", { className: "cur", children: currency }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                className: "vqdoc-cell",
                value: d.extra_charge_value ?? 0,
                disabled: locked,
                placeholder: "0",
                onFocus: (e) => e.target.select(),
                onChange: (e) => patch({ extra_charge_value: parseFloat(e.target.value) || 0 })
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "vqdoc-total", ref: totalRef, children: [
          /* @__PURE__ */ jsx("span", { className: "k", children: "Total" }),
          /* @__PURE__ */ jsx("span", { className: "v", children: money(totals.grandTotal) })
        ] }),
        settles2 && row("settled") && /* @__PURE__ */ jsxs("div", { id: "tour-invoice-paid", className: "vqdoc-sum-row edit", children: [
          /* @__PURE__ */ jsxs("span", { className: "k", children: [
            totals.settleLabel,
            !locked && /* @__PURE__ */ jsxs("span", { className: "vqdoc-quickamt", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  className: "vqdoc-btn xs",
                  title: "Settled in full",
                  disabled: totals.grandTotal <= 0 || Math.abs((d.amountPaid || 0) - totals.grandTotal) < 5e-3,
                  onClick: () => patchSettle({ amountPaid: totals.grandTotal }),
                  children: "Exact"
                }
              ),
              !!d.amountPaid && /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  className: "vqdoc-icon xs quiet",
                  title: "Clear",
                  "aria-label": "Clear the amount",
                  onClick: () => patchSettle({ amountPaid: 0 }),
                  children: /* @__PURE__ */ jsx(X, { size: 13 })
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "v", children: [
            /* @__PURE__ */ jsx("span", { className: "cur", children: currency }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                className: "vqdoc-cell",
                value: d.amountPaid ?? 0,
                disabled: locked,
                placeholder: "0",
                onFocus: (e) => e.target.select(),
                onChange: (e) => patchSettle({ amountPaid: parseFloat(e.target.value) || 0 })
              }
            )
          ] })
        ] }),
        settles2 && row("balance") && /* @__PURE__ */ jsxs("div", { className: "vqdoc-callout", "data-tone": totals.balanceTone, children: [
          /* @__PURE__ */ jsx("span", { children: totals.balanceLabel }),
          /* @__PURE__ */ jsx("span", { className: "v", children: money(Math.abs(totals.balance)) })
        ] }),
        ctx.extraRows,
        row("prevbal") && ctx.party && ctx.balanceKnown !== false && /* @__PURE__ */ jsxs("div", { className: "vqdoc-ledger", children: [
          /* @__PURE__ */ jsxs("div", { className: "vqdoc-sum-row", children: [
            /* @__PURE__ */ jsx("span", { className: "k", children: bal.beforeLabel(ctx.party.name) }),
            /* @__PURE__ */ jsxs("span", { className: "v", "data-owed": bal.before > 5e-3 ? "true" : void 0, children: [
              money(Math.abs(bal.before)),
              bal.before < -5e-3 && /* @__PURE__ */ jsx("span", { className: "cur", children: "the shop owes" })
            ] })
          ] }),
          bal.moves && /* @__PURE__ */ jsxs("div", { className: "vqdoc-sum-row strong", children: [
            /* @__PURE__ */ jsx("span", { className: "k", children: bal.label(ctx.party.name) }),
            /* @__PURE__ */ jsx("span", { className: "v", "data-owed": bal.after > 5e-3 ? "true" : void 0, children: money(Math.abs(bal.after)) })
          ] })
        ] })
      ] })
    ] }),
    ctx.actions
  ] });
}
function DocumentCounts({ doc, chrome, totals, ctx }) {
  const { totalRef } = chrome;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("section", { className: "vqdoc-zone", children: [
      /* @__PURE__ */ jsx("div", { className: "vqdoc-zone-h", children: /* @__PURE__ */ jsx("span", { children: "Summary" }) }),
      /* @__PURE__ */ jsxs("div", { className: "vqdoc-sum", children: [
        /* @__PURE__ */ jsxs("div", { className: "vqdoc-sum-row", children: [
          /* @__PURE__ */ jsx("span", { className: "k", children: "Lines" }),
          /* @__PURE__ */ jsx("span", { className: "v", children: totals.lines })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "vqdoc-total", ref: totalRef, children: [
          /* @__PURE__ */ jsx("span", { className: "k", children: ctx.unitLabel || "Units" }),
          /* @__PURE__ */ jsx("span", { className: "v", children: totals.units })
        ] }),
        ctx.extraRows
      ] })
    ] }),
    ctx.actions
  ] });
}
const FIT_FLOOR = { full: 933, standard: 693, compact: 561 };
const FIT_ORDER = ["cards", "compact", "standard", "full"];
const SUM_FLOOR = { panel: 384, tight: 262 };
const LEVEL_WANTS = { simple: "compact", standard: "standard", detailed: "full" };
const FIT_ALLOWS = { full: "detailed", standard: "standard", compact: "simple", cards: "simple" };
const LEVEL_ORDER = ["simple", "standard", "detailed"];
const UI_SCALE = { 1: 1, 2: 1.09, 3: 1.18, 4: 1.3, 5: 1.45 };
const SPLIT_MIN = 22;
const SPLIT_MAX = 44;
const SPLIT_GUTTER = 16;
const LEVELS = {
  simple: {
    id: "simple",
    name: "Simple",
    blurb: "Item, quantity, price, total. Nothing else on the row.",
    who: "A counter, a single-product shop, someone new to the till.",
    cols: ["item", "qty", "rate", "total", "del"],
    header: ["party", "method", "date"],
    summary: ["total", "settled", "balance"]
  },
  standard: {
    id: "standard",
    name: "Standard",
    blurb: "Adds line numbers, discounts and the running breakdown.",
    who: "The everyday setting, and the one most shops keep.",
    cols: ["idx", "item", "qty", "rate", "disc", "total", "del"],
    /* Header ids other documents rely on live here too. A purchase whose
        supplier bill number and warehouse were only reachable behind "All
        fields" is a purchase screen missing its two most-typed boxes. */
    header: ["party", "method", "account", "accountOut", "refund", "supplierRef", "docno", "date", "terms", "warehouse"],
    summary: ["subtotal", "item_disc", "doc_disc", "tax", "total", "settled", "balance", "prevbal"]
  },
  detailed: {
    id: "detailed",
    name: "Detailed",
    blurb: "Adds free goods, units, due dates and every charge line.",
    who: "Wholesale, accounts, and anywhere tax has to be itemised.",
    cols: ["idx", "item", "qty", "free", "uom", "rate", "disc", "total", "del"],
    header: [
      "party",
      "method",
      "account",
      "accountOut",
      "refund",
      "supplierRef",
      "source",
      "docno",
      "date",
      "terms",
      "due",
      "validity",
      "delivery",
      "expected",
      "warehouse",
      "fromWh",
      "toWh",
      "frequency",
      "nextRun",
      "status",
      "reason",
      "attachment",
      "notes"
    ],
    summary: ["subtotal", "item_disc", "doc_disc", "tax", "shipping", "extra", "total", "settled", "balance", "prevbal"]
  }
};
const ALL_HEADER = [
  "party",
  "method",
  "account",
  "accountOut",
  "refund",
  "supplierRef",
  "source",
  "docno",
  "date",
  "terms",
  "due",
  "validity",
  "delivery",
  "expected",
  "warehouse",
  "fromWh",
  "toWh",
  "frequency",
  "nextRun",
  "status",
  "reason",
  "attachment",
  "notes"
];
const DEFAULT_COMP = {
  details: "open",
  /* open | collapsed                    */
  summary: "auto",
  /* auto | side | below | hidden        */
  pin: "auto",
  /* auto | pinned | docked | scroll     */
  split: 32,
  level: "standard"
};
const LAYOUTS = [
  {
    id: "panel",
    name: "Side panel",
    blurb: "Details open, totals resident on the right.",
    comp: { details: "open", summary: "auto", pin: "auto", split: 32, level: "standard" },
    art: { details: true, sum: "side", dock: false }
  },
  {
    id: "wide",
    name: "Wide lines",
    blurb: "Customer block folded away so the items get the width.",
    comp: { details: "collapsed", summary: "auto", pin: "auto", split: 26, level: "standard" },
    art: { details: "strip", sum: "side", dock: false }
  },
  {
    id: "focus",
    name: "Focus",
    blurb: "Nothing but the item table. Totals live in the bar.",
    comp: { details: "collapsed", summary: "hidden", pin: "docked", split: 32, level: "standard" },
    art: { details: "strip", sum: null, dock: true }
  },
  {
    id: "stack",
    name: "Stacked",
    blurb: "Totals under the last line, with the bar following you down.",
    comp: { details: "open", summary: "below", pin: "docked", split: 32, level: "standard" },
    art: { details: true, sum: "below", dock: true }
  },
  {
    id: "ledger",
    name: "Pro ledger",
    blurb: "Every column, every field, the full breakdown.",
    comp: { details: "open", summary: "auto", pin: "auto", split: 34, level: "detailed" },
    art: { details: true, sum: "side", dock: true }
  }
];
const CHOICES = {
  details: [["open", "Open"], ["collapsed", "Folded away"]],
  summary: [["auto", "Automatic"], ["side", "Beside the items"], ["below", "Under the items"], ["hidden", "In the bar only"]],
  pin: [["auto", "Automatic"], ["pinned", "Stay in view"], ["docked", "Follow in the bar"], ["scroll", "Scroll away"]]
};
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, Number.isFinite(n) ? n : lo));
const fitFor = (w) => {
  if (w >= FIT_FLOOR.full) return "full";
  if (w >= FIT_FLOOR.standard) return "standard";
  if (w >= FIT_FLOOR.compact) return "compact";
  return "cards";
};
const sumFitFor = (w) => w >= SUM_FLOOR.panel ? "panel" : w >= SUM_FLOOR.tight ? "tight" : null;
const rankFit = (f) => FIT_ORDER.indexOf(f);
const rankLevel = (l) => LEVEL_ORDER.indexOf(l);
const matchLayout = (comp) => {
  const hit = LAYOUTS.find((l) => l.comp.details === comp.details && l.comp.summary === comp.summary && l.comp.pin === comp.pin && l.comp.level === comp.level && Math.abs(l.comp.split - comp.split) < 2);
  return hit ? hit.id : null;
};
function composeDocument(width, comp) {
  const w = Math.max(0, Math.round(width || 0));
  const split = clamp(comp.split, SPLIT_MIN, SPLIT_MAX);
  const sideSumW = Math.floor(w * split / 100);
  const sideLinesW = w - sideSumW - SPLIT_GUTTER;
  const sideSum = sumFitFor(sideSumW);
  const wants = LEVEL_WANTS[comp.level] || "standard";
  let summary;
  if (comp.summary === "hidden") {
    summary = "hidden";
  } else if (comp.summary === "below") {
    summary = "below";
  } else if (comp.summary === "side") {
    summary = sideSum && rankFit(fitFor(sideLinesW)) >= rankFit("compact") ? "side" : "below";
  } else {
    summary = sideSum && rankFit(fitFor(sideLinesW)) >= rankFit(wants) ? "side" : "below";
  }
  const moved = comp.summary !== "auto" && comp.summary !== summary && comp.summary !== "hidden";
  const linesW = summary === "side" ? sideLinesW : w;
  const fit = fitFor(linesW);
  const allowed = FIT_ALLOWS[fit];
  const simplified = rankLevel(comp.level) > rankLevel(allowed);
  const level = simplified ? allowed : comp.level;
  return {
    split,
    summary,
    /* side | below | hidden          */
    cards: fit === "cards",
    level,
    /* what the row can actually show */
    wantedLevel: comp.level,
    simplified,
    /* the width had to simplify it   */
    moved,
    /* the summary could not stay     */
    narrow: fit === "cards" || fit === "compact",
    pinnable: summary === "side"
  };
}
const PREVIEW_DEVICES = [
  { id: "phone", name: "Phone", w: 390, h: 760 },
  { id: "tablet", name: "Tablet", w: 1024, h: 740 },
  { id: "laptop", name: "Laptop", w: 1440, h: 860 },
  { id: "desktop", name: "Desktop", w: 1920, h: 1040 }
];
const RAIL_PUSH_FROM = 1216;
const RAIL_W = 248;
const SECTIONS = [
  { id: "layout", name: "Layout", icon: LayoutGrid },
  { id: "items", name: "Items", icon: Table2 },
  { id: "fields", name: "Fields", icon: ListChecks },
  { id: "charges", name: "Charges", icon: Wallet },
  { id: "display", name: "Display", icon: Type }
];
function Switch({ checked, onChange, label }) {
  return /* @__PURE__ */ jsx(
    "button",
    {
      type: "button",
      role: "switch",
      "aria-checked": checked,
      "aria-label": label,
      className: "vqdoc-switch",
      onClick: () => onChange(!checked)
    }
  );
}
function Opt({ title, hint, children, stack }) {
  return /* @__PURE__ */ jsxs("div", { className: `vqdoc-opt${stack ? " stack" : ""}`, children: [
    /* @__PURE__ */ jsxs("div", { className: "t", children: [
      /* @__PURE__ */ jsx("b", { children: title }),
      hint && /* @__PURE__ */ jsx("span", { children: hint })
    ] }),
    children
  ] });
}
function Seg({ value, options, onChange, size, fill }) {
  return /* @__PURE__ */ jsx("div", { className: `vqdoc-seg${size === "sm" ? " sm" : ""}${fill ? " fill" : ""}`, children: options.map(([v, l]) => /* @__PURE__ */ jsx("button", { type: "button", "aria-pressed": String(value) === String(v), onClick: () => onChange(v), children: l }, v)) });
}
function LayoutArt({ art }) {
  const BAR = 13;
  const PAD = 7;
  const detailsH = art.details === "strip" ? 9 : 25;
  const top = BAR + 6;
  const contentTop = top + detailsH + 5;
  const floor = art.dock ? 21 : PAD;
  const sumSide = art.sum === "side";
  const sumBelow = art.sum === "below";
  const linesBottom = sumBelow ? floor + 26 : floor;
  const linesRight = sumSide ? PAD + 26 + 4 : PAD;
  const rows = [];
  const rowTop = contentTop + 7;
  const rowGap = 8;
  const avail = 100 - rowTop - linesBottom - 4;
  for (let i = 0; i * rowGap + 4 < avail; i += 1) {
    rows.push(
      /* @__PURE__ */ jsx(
        "i",
        {
          style: {
            left: `${PAD + 4}%`,
            right: `${linesRight + 4}%`,
            top: `${rowTop + i * rowGap}%`,
            height: "3%",
            background: "var(--vq-line)",
            opacity: i === 0 ? 0 : 0.75
          }
        },
        i
      )
    );
  }
  return /* @__PURE__ */ jsxs("div", { className: "art", children: [
    /* @__PURE__ */ jsx("i", { className: "bar", style: { height: `${BAR}%` } }),
    /* @__PURE__ */ jsx(
      "i",
      {
        className: "det",
        style: { left: `${PAD}%`, right: `${PAD}%`, top: `${top}%`, height: `${detailsH}%` }
      }
    ),
    /* @__PURE__ */ jsx(
      "i",
      {
        className: "lines",
        style: { left: `${PAD}%`, right: `${linesRight}%`, top: `${contentTop}%`, bottom: `${linesBottom}%` }
      }
    ),
    /* @__PURE__ */ jsx(
      "i",
      {
        style: {
          left: `${PAD}%`,
          right: `${linesRight}%`,
          top: `${contentTop}%`,
          height: "6%",
          background: "var(--vq-surface-2)",
          borderBottom: "1px solid var(--vq-line)",
          borderRadius: "2px 2px 0 0"
        }
      }
    ),
    rows,
    sumSide && /* @__PURE__ */ jsx(
      "i",
      {
        className: "sum",
        style: { right: `${PAD}%`, width: "26%", top: `${contentTop}%`, bottom: `${floor}%` }
      }
    ),
    sumBelow && /* @__PURE__ */ jsx(
      "i",
      {
        className: "sum",
        style: { left: `${PAD}%`, right: `${PAD}%`, bottom: `${floor}%`, height: "26%" }
      }
    ),
    art.dock && /* @__PURE__ */ jsx("i", { className: "dock" })
  ] });
}
function Preview({ device, comp, showRail }) {
  const MARGIN = 20;
  const railW = showRail && device.w >= RAIL_PUSH_FROM ? RAIL_W : 0;
  const inner = device.w - railW - MARGIN * 2;
  const law = composeDocument(inner, comp);
  const scale = 296 / device.w;
  const px = (n) => Math.round(n * scale * 100) / 100;
  const W = Math.round(device.w * scale);
  const H = Math.round(device.h * scale);
  const barH = px(64);
  const dockShown = comp.pin === "docked" || law.summary === "hidden";
  const dockH = dockShown ? px(68 + 20) : 0;
  const detH = comp.details === "open" ? px(law.cards ? 250 : 176) : px(62);
  const top = barH + px(MARGIN) + detH + px(16);
  const bodyH = Math.max(px(80), H - top - dockH - px(MARGIN));
  const linesH = law.summary === "below" ? bodyH * 0.6 : bodyH;
  const sumW = law.summary === "side" ? px(inner * (law.split / 100)) : 0;
  const linesW = law.summary === "side" ? px(inner) - sumW - px(16) : px(inner);
  const line = (w, o = 1, h = px(6)) => ({
    position: "absolute",
    height: h,
    width: w,
    borderRadius: 2,
    background: "var(--vq-line-strong)",
    opacity: o
  });
  const rowH = px(52);
  const headH = px(38);
  const rows = Math.max(0, Math.floor((linesH - headH - px(50)) / rowH));
  const cols = law.cards ? 0 : LEVELS[law.level].cols.filter((c) => c !== "del" && c !== "idx" && c !== "item").length;
  const sumRows = LEVELS[law.level].summary.filter((r) => !["total", "settled", "balance"].includes(r)).length;
  return /* @__PURE__ */ jsx("div", { className: "vqdoc-device", style: { width: W + 16 }, children: /* @__PURE__ */ jsxs("div", { className: "screen", style: { width: W, height: H }, children: [
    railW > 0 && /* @__PURE__ */ jsx("i", { style: { left: 0, top: 0, bottom: 0, width: px(railW), background: "var(--vq-ink-950)", borderRadius: 0 } }),
    /* @__PURE__ */ jsx("i", { style: { left: px(railW), right: 0, top: 0, height: barH, background: "var(--vq-surface)", borderBottom: "1px solid var(--vq-line)", borderRadius: 0 } }),
    /* @__PURE__ */ jsx("i", { style: { ...line(px(90), 0.8), left: px(railW + MARGIN), top: barH / 2 - px(3) } }),
    /* @__PURE__ */ jsx("i", { style: { ...line(px(52), 0.35), right: px(MARGIN + 60), top: barH / 2 - px(3) } }),
    /* @__PURE__ */ jsx("i", { style: { ...line(px(44), 0.35), right: px(MARGIN), top: barH / 2 - px(3) } }),
    /* @__PURE__ */ jsx("i", { style: {
      left: px(railW + MARGIN),
      width: px(inner),
      top: barH + px(MARGIN),
      height: detH,
      background: "var(--vq-surface)",
      border: "1px solid var(--vq-line)",
      borderRadius: 4
    } }),
    comp.details === "open" ? /* @__PURE__ */ jsxs(Fragment, { children: [
      [0, 1, 2, 3].map((i) => {
        const colW = px(inner) / (law.cards ? 1 : 4);
        const x = px(railW + MARGIN) + px(10) + (law.cards ? 0 : i * colW);
        const y = barH + px(MARGIN) + px(46) + (law.cards ? i * px(46) : 0);
        if (law.cards && i > 2) return null;
        return /* @__PURE__ */ jsxs(React.Fragment, { children: [
          /* @__PURE__ */ jsx("i", { style: { ...line(colW * 0.35, 0.35, px(4)), left: x, top: y } }),
          /* @__PURE__ */ jsx("i", { style: {
            left: x,
            top: y + px(10),
            width: colW - px(16),
            height: px(24),
            borderRadius: 3,
            background: i === 0 ? "var(--vq-accent-quiet)" : "var(--vq-sunken)",
            border: i === 0 ? "1px solid var(--vq-accent-quiet-line)" : "1px solid var(--vq-line)"
          } })
        ] }, i);
      }),
      /* @__PURE__ */ jsx("i", { style: { ...line(px(120), 0.3, px(4)), left: px(railW + MARGIN + 10), top: barH + px(MARGIN) + px(16) } })
    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("i", { style: { ...line(px(110), 0.7), left: px(railW + MARGIN + 12), top: barH + px(MARGIN) + detH / 2 - px(3) } }),
      /* @__PURE__ */ jsx("i", { style: { ...line(px(64), 0.9, px(8)), right: px(MARGIN + 10), top: barH + px(MARGIN) + detH / 2 - px(4), background: "var(--vq-accent)" } })
    ] }),
    /* @__PURE__ */ jsx("i", { style: {
      left: px(railW + MARGIN),
      width: linesW,
      top,
      height: linesH,
      background: "var(--vq-surface)",
      border: "1px solid var(--vq-line)",
      borderRadius: 4
    } }),
    /* @__PURE__ */ jsx("i", { style: { left: px(railW + MARGIN) + 1, width: linesW - 2, top: top + 1, height: headH, background: "var(--vq-surface-2)", borderRadius: "3px 3px 0 0" } }),
    /* @__PURE__ */ jsx("i", { style: { ...line(px(52), 0.5, px(4)), left: px(railW + MARGIN + 14), top: top + headH / 2 - px(2) } }),
    Array.from({ length: rows }).map((_, r) => {
      const y = top + headH + r * rowH + rowH / 2 - px(8);
      const x0 = px(railW + MARGIN + 14);
      const usable = linesW - px(28);
      if (law.cards) {
        return /* @__PURE__ */ jsxs(React.Fragment, { children: [
          /* @__PURE__ */ jsx("i", { style: { ...line(usable * 0.5, 0.8, px(7)), left: x0, top: y } }),
          /* @__PURE__ */ jsx("i", { style: { ...line(usable * 0.22, 0.9, px(7)), right: px(MARGIN + 14), top: y, background: "var(--vq-accent)" } }),
          /* @__PURE__ */ jsx("i", { style: { ...line(usable * 0.34, 0.3, px(5)), left: x0, top: y + px(13) } })
        ] }, r);
      }
      const nameW = usable * (cols >= 6 ? 0.3 : cols >= 4 ? 0.4 : 0.5);
      const cellW = (usable - nameW - px(8)) / (cols + 1);
      return /* @__PURE__ */ jsxs(React.Fragment, { children: [
        /* @__PURE__ */ jsx("i", { style: {
          left: x0,
          top: y,
          width: nameW,
          height: px(16),
          borderRadius: 3,
          background: "var(--vq-sunken)"
        } }),
        Array.from({ length: cols + 1 }).map((__, c) => /* @__PURE__ */ jsx(
          "i",
          {
            style: {
              left: x0 + nameW + px(8) + c * cellW,
              top: y,
              width: Math.max(px(10), cellW - px(5)),
              height: px(16),
              borderRadius: 3,
              background: c === cols ? "var(--vq-accent-quiet)" : "var(--vq-sunken)"
            }
          },
          c
        ))
      ] }, r);
    }),
    /* @__PURE__ */ jsx("i", { style: { ...line(px(70), 0.6, px(6)), left: px(railW + MARGIN) + linesW / 2 - px(35), top: top + linesH - px(26), background: "var(--vq-accent)" } }),
    law.summary === "side" && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("i", { style: {
        left: px(railW + MARGIN) + linesW + px(16),
        width: sumW,
        top,
        height: Math.min(linesH, px(60) + sumRows * px(40) + px(150)),
        background: "var(--vq-surface)",
        border: "1px solid var(--vq-line)",
        borderRadius: 4
      } }),
      Array.from({ length: sumRows }).map((_, i) => /* @__PURE__ */ jsxs(React.Fragment, { children: [
        /* @__PURE__ */ jsx("i", { style: { ...line(sumW * 0.4, 0.3, px(5)), left: px(railW + MARGIN) + linesW + px(28), top: top + px(56) + i * px(40) } }),
        /* @__PURE__ */ jsx("i", { style: { ...line(sumW * 0.24, 0.55, px(5)), right: px(MARGIN + 12), top: top + px(56) + i * px(40) } })
      ] }, i)),
      /* @__PURE__ */ jsx("i", { style: {
        left: px(railW + MARGIN) + linesW + px(28),
        right: px(MARGIN + 12),
        top: top + px(56) + sumRows * px(40) + px(8),
        height: px(58),
        background: "var(--vq-accent-quiet)",
        border: "1px solid var(--vq-accent-quiet-line)",
        borderRadius: 4
      } }),
      /* @__PURE__ */ jsx("i", { style: {
        left: px(railW + MARGIN) + linesW + px(28),
        right: px(MARGIN + 12),
        top: top + px(56) + sumRows * px(40) + px(78),
        height: px(46),
        background: "var(--vq-accent)",
        borderRadius: 4
      } })
    ] }),
    law.summary === "below" && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("i", { style: {
        left: px(railW + MARGIN),
        width: px(inner),
        top: top + linesH + px(16),
        height: bodyH - linesH - px(16),
        background: "var(--vq-surface)",
        border: "1px solid var(--vq-line)",
        borderRadius: 4
      } }),
      /* @__PURE__ */ jsx("i", { style: {
        right: px(MARGIN + 12),
        top: top + linesH + px(34),
        width: px(inner) * 0.34,
        height: px(52),
        background: "var(--vq-accent-quiet)",
        border: "1px solid var(--vq-accent-quiet-line)",
        borderRadius: 4
      } }),
      /* @__PURE__ */ jsx("i", { style: { left: px(railW + MARGIN + 12), top: top + linesH + px(38), width: px(inner) * 0.3, height: px(44), background: "var(--vq-accent)", borderRadius: 4 } })
    ] }),
    dockShown && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("i", { style: {
        right: px(MARGIN),
        bottom: px(MARGIN),
        width: Math.min(px(360), px(inner)),
        height: px(68),
        background: "var(--vq-ink-950)",
        borderRadius: 5
      } }),
      /* @__PURE__ */ jsx("i", { style: { ...line(px(84), 1, px(9)), right: px(MARGIN + 150), bottom: px(MARGIN + 30), background: "var(--vq-teal-300)" } }),
      /* @__PURE__ */ jsx("i", { style: { right: px(MARGIN + 12), bottom: px(MARGIN + 12), width: px(120), height: px(44), background: "var(--vq-accent)", borderRadius: 4 } })
    ] })
  ] }) });
}
function DocumentSettings({
  /* Which document this belongs to. Without it the Fields section listed
     the sales invoice's fields on every screen, so a stock audit would have
     offered a switch for "Payment terms". */
  doc,
  onClose,
  comp,
  setComp,
  applyLayout,
  showRail,
  setShowRail,
  textSize,
  setTextSize,
  showQuickEntry,
  setShowQuickEntry,
  showStock,
  setShowStock,
  showMargin,
  setShowMargin,
  canSeeMargin,
  applyDefaults,
  setApplyDefaults,
  fields,
  setField,
  showDeliveryCharges,
  setShowDeliveryCharges,
  showExtraField,
  setShowExtraField,
  enableMultipleExtras,
  setEnableMultipleExtras,
  defaultDelivery,
  setDefaultDelivery,
  defaultExtraLabel,
  setDefaultExtraLabel,
  defaultExtraValue,
  setDefaultExtraValue,
  currency,
  onReset
}) {
  const noop = (name) => () => {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[DocumentSettings] "${name}" is on screen but the page passed no setter for it, so it does nothing.`);
    }
  };
  setShowRail = setShowRail || noop("setShowRail");
  setShowQuickEntry = setShowQuickEntry || noop("setShowQuickEntry");
  setShowDeliveryCharges = setShowDeliveryCharges || noop("setShowDeliveryCharges");
  setShowExtraField = setShowExtraField || noop("setShowExtraField");
  setEnableMultipleExtras = setEnableMultipleExtras || noop("setEnableMultipleExtras");
  setDefaultDelivery = setDefaultDelivery || noop("setDefaultDelivery");
  setDefaultExtraLabel = setDefaultExtraLabel || noop("setDefaultExtraLabel");
  setDefaultExtraValue = setDefaultExtraValue || noop("setDefaultExtraValue");
  setApplyDefaults = setApplyDefaults || noop("setApplyDefaults");
  setShowMargin = setShowMargin || noop("setShowMargin");
  setShowStock = setShowStock || noop("setShowStock");
  onReset = onReset || noop("onReset");
  const tt = useTermText();
  const [section, setSection] = useState("layout");
  const sections = useMemo(
    () => SECTIONS.filter((x) => {
      if (x.id === "charges") return doc ? doc.money?.charges !== false : true;
      if (x.id === "fields") return !doc || (doc.fields || []).length > 0;
      return true;
    }),
    [doc]
  );
  const fieldRows = useMemo(
    () => (doc?.fields || []).filter((k) => FIELD_LIBRARY[k]).map((k) => [k, FIELD_LIBRARY[k].label, FIELD_LIBRARY[k].hint]),
    [doc]
  );
  const [deviceId, setDeviceId] = useState("laptop");
  const device = PREVIEW_DEVICES.find((d) => d.id === deviceId) || PREVIEW_DEVICES[2];
  const chosen = useMemo(() => matchLayout(comp), [comp]);
  return /* @__PURE__ */ jsx("div", { className: "vqdoc vqdoc-scrim", style: { height: "auto", display: "flex" }, onMouseDown: (e) => {
    if (e.target === e.currentTarget) onClose();
  }, children: /* @__PURE__ */ jsxs("div", { className: "vqdoc-modal wide", role: "dialog", "aria-modal": "true", "aria-label": "Document settings", style: { height: "min(880px, 92vh)" }, children: [
    /* @__PURE__ */ jsxs("header", { children: [
      /* @__PURE__ */ jsx("span", { className: "ico", children: /* @__PURE__ */ jsx(LayoutGrid, { size: 18 }) }),
      /* @__PURE__ */ jsxs("span", { className: "t", children: [
        /* @__PURE__ */ jsx("h3", { children: "Screen settings" }),
        /* @__PURE__ */ jsxs("p", { children: [
          chosen ? LAYOUTS.find((l) => l.id === chosen).name : "Custom",
          " · saved on this device"
        ] })
      ] }),
      /* @__PURE__ */ jsx("button", { type: "button", className: "vqdoc-icon quiet", onClick: onClose, "aria-label": "Close", children: /* @__PURE__ */ jsx(X, { size: 18 }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: { flex: 1, minHeight: 0, display: "flex" }, children: [
      /* @__PURE__ */ jsx("nav", { style: {
        flex: "0 0 auto",
        width: 168,
        borderRight: "1px solid var(--vq-line)",
        background: "var(--vq-surface)",
        padding: 12,
        display: "flex",
        flexDirection: "column",
        gap: 4
      }, children: sections.map(({ id, name, icon: Icon }) => /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          className: "vqdoc-btn quiet",
          "aria-pressed": section === id,
          style: {
            justifyContent: "flex-start",
            background: section === id ? "var(--vq-accent-quiet)" : "transparent",
            color: section === id ? "var(--vq-accent-text)" : "var(--vq-text-2)",
            fontWeight: section === id ? "var(--vq-fw-bold)" : "var(--vq-fw-semi)"
          },
          onClick: () => setSection(id),
          children: [
            /* @__PURE__ */ jsx(Icon, { size: 16 }),
            " ",
            name
          ]
        },
        id
      )) }),
      /* @__PURE__ */ jsxs("div", { style: { flex: "1 1 auto", minWidth: 0, minHeight: 0, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 22 }, children: [
        section === "layout" && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs("div", { className: "vqdoc-group", children: [
            /* @__PURE__ */ jsx("h4", { children: "Arrangement" }),
            /* @__PURE__ */ jsx("p", { children: tt("Pick where the customer block, the items and the totals sit. You can fine-tune any of it below.") }),
            /* @__PURE__ */ jsx("div", { className: "vqdoc-layouts", children: LAYOUTS.map((l) => /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                className: "vqdoc-layout",
                "aria-pressed": chosen === l.id,
                onClick: () => applyLayout(l.id),
                children: [
                  /* @__PURE__ */ jsx(LayoutArt, { art: l.art }),
                  /* @__PURE__ */ jsxs("span", { className: "nm", children: [
                    l.name,
                    chosen === l.id && /* @__PURE__ */ jsx(Check, { size: 13 })
                  ] }),
                  /* @__PURE__ */ jsx("span", { className: "ds", children: l.blurb })
                ]
              },
              l.id
            )) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "vqdoc-group", children: [
            /* @__PURE__ */ jsx("h4", { children: "Fine tuning" }),
            /* @__PURE__ */ jsx(Opt, { title: tt("Customer &amp; details"), hint: "Folded away leaves one line — name, number, date and running total — and gives the height to the items.", children: /* @__PURE__ */ jsx(Seg, { value: comp.details, options: CHOICES.details, onChange: (v) => setComp({ details: v }) }) }),
            /* @__PURE__ */ jsx(Opt, { stack: true, title: "Totals", hint: "Automatic keeps them beside the items while there is room, and moves them underneath when there is not.", children: /* @__PURE__ */ jsx(Seg, { fill: true, value: comp.summary, options: CHOICES.summary, onChange: (v) => setComp({ summary: v }) }) }),
            /* @__PURE__ */ jsx(Opt, { stack: true, title: "While you scroll", hint: "Automatic keeps the totals in view when they fit, and follows you down in the bar when they do not.", children: /* @__PURE__ */ jsx(Seg, { fill: true, value: comp.pin, options: CHOICES.pin, onChange: (v) => setComp({ pin: v }) }) }),
            /* @__PURE__ */ jsx(Opt, { title: "Navigation rail", hint: "An invoice is a document you write, not a place you navigate from. Alt+L brings it back.", children: /* @__PURE__ */ jsx(Switch, { checked: showRail, onChange: setShowRail, label: "Navigation rail" }) })
          ] })
        ] }),
        section === "items" && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs("div", { className: "vqdoc-group", children: [
            /* @__PURE__ */ jsx("h4", { children: "Detail on each row" }),
            /* @__PURE__ */ jsx("p", { children: "How much of each line you want to see while you type. Nothing is ever lost — anything a simpler row leaves out is still on the document and one click away." }),
            ["simple", "standard", "detailed"].map((id) => {
              const L = LEVELS[id];
              const on = comp.level === id;
              return /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  className: "vqdoc-opt",
                  "aria-pressed": on,
                  style: {
                    textAlign: "left",
                    cursor: "pointer",
                    width: "100%",
                    borderColor: on ? "var(--vq-accent)" : void 0,
                    background: on ? "var(--vq-accent-quiet)" : void 0,
                    boxShadow: on ? "0 0 0 1px var(--vq-accent)" : void 0
                  },
                  onClick: () => setComp({ level: id }),
                  children: /* @__PURE__ */ jsxs("span", { className: "t", children: [
                    /* @__PURE__ */ jsxs("b", { children: [
                      L.name,
                      on && /* @__PURE__ */ jsx(Check, { size: 13, style: { marginLeft: 6, verticalAlign: "-2px" } })
                    ] }),
                    /* @__PURE__ */ jsxs("span", { children: [
                      L.blurb,
                      " ",
                      L.who
                    ] })
                  ] })
                },
                id
              );
            })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "vqdoc-group", children: [
            /* @__PURE__ */ jsx("h4", { children: "On the table" }),
            /* @__PURE__ */ jsx(Opt, { title: "Quick add row", hint: "A single row at the top for adding item after item without leaving the keyboard. Alt+Q.", children: /* @__PURE__ */ jsx(Switch, { checked: showQuickEntry, onChange: setShowQuickEntry, label: "Quick add row" }) }),
            /* @__PURE__ */ jsx(Opt, { title: "Stock in hand", hint: "Shows what is available under the quantity as you type it.", children: /* @__PURE__ */ jsx(Switch, { checked: showStock, onChange: setShowStock, label: "Stock in hand" }) })
          ] }),
          canSeeMargin && /* @__PURE__ */ jsxs("div", { className: "vqdoc-group", children: [
            /* @__PURE__ */ jsx("h4", { children: "Margin" }),
            /* @__PURE__ */ jsx("p", { children: "What the sale is making. Only people with permission to see cost prices ever see any of this." }),
            /* @__PURE__ */ jsx(
              Opt,
              {
                title: "Margin button",
                hint: "Puts the hold-to-see button in the bar. The figures appear only while it is held, and the per-item breakdown opens if you drag it downwards — never left sitting on the screen.",
                children: /* @__PURE__ */ jsx(Switch, { checked: showMargin, onChange: setShowMargin, label: "Margin button" })
              }
            )
          ] })
        ] }),
        section === "fields" && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs("div", { className: "vqdoc-group", children: [
            /* @__PURE__ */ jsx("h4", { children: "What an invoice carries" }),
            /* @__PURE__ */ jsx("p", { children: "Turn off what your shop never uses and it stops taking room on every sale — on the screen and on the printed invoice. A cash counter rarely needs terms or a due date; a wholesaler needs both." }),
            fieldRows.map(([key, title, hint]) => /* @__PURE__ */ jsx(Opt, { title, hint, children: /* @__PURE__ */ jsx(
              Switch,
              {
                checked: fields[key] !== false,
                onChange: (v) => setField(key, v),
                label: title
              }
            ) }, key))
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "vqdoc-group", children: [
            /* @__PURE__ */ jsx("h4", { children: "Always there" }),
            /* @__PURE__ */ jsx("p", { children: tt("The customer, the items and the money are the invoice. They have no switch, because a sale without them is not a sale.") })
          ] })
        ] }),
        section === "charges" && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs("div", { className: "vqdoc-group", children: [
            /* @__PURE__ */ jsx("h4", { children: "Charges on the total" }),
            /* @__PURE__ */ jsx(Opt, { title: "Delivery", hint: "A delivery line in the totals.", children: /* @__PURE__ */ jsx(Switch, { checked: showDeliveryCharges, onChange: setShowDeliveryCharges, label: "Delivery" }) }),
            /* @__PURE__ */ jsx(Opt, { title: "Extra charge", hint: tt("One named charge — packing, service, anything. The name is editable on the invoice."), children: /* @__PURE__ */ jsx(Switch, { checked: showExtraField, onChange: setShowExtraField, label: "Extra charge" }) }),
            /* @__PURE__ */ jsx(Opt, { title: "Several extra charges", hint: "Up to ten named charges instead of one.", children: /* @__PURE__ */ jsx(Switch, { checked: enableMultipleExtras, onChange: setEnableMultipleExtras, label: "Several extra charges" }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "vqdoc-group", children: [
            /* @__PURE__ */ jsx("h4", { children: "Standing charges" }),
            /* @__PURE__ */ jsx(
              Opt,
              {
                title: "Put these on every new invoice",
                hint: tt("A delivery fee or a service charge you always add, filled in the moment a sale starts. It never touches an invoice you have already begun pricing."),
                children: /* @__PURE__ */ jsx(Switch, { checked: applyDefaults, onChange: setApplyDefaults, label: "Put these on every new invoice" })
              }
            ),
            /* @__PURE__ */ jsx("p", { style: { marginTop: "var(--d-s2)" }, children: applyDefaults ? "Every new sale starts with the amounts below." : "Saved, but only used when you switch this on." }),
            /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }, children: [
              /* @__PURE__ */ jsxs("label", { style: { display: "flex", flexDirection: "column", gap: 7, minWidth: 0 }, children: [
                /* @__PURE__ */ jsxs("span", { className: "vqdoc-lbl", children: [
                  "Delivery (",
                  currency,
                  ")"
                ] }),
                /* @__PURE__ */ jsx("input", { type: "number", className: "vqdoc-in n", value: defaultDelivery, onChange: (e) => setDefaultDelivery(parseFloat(e.target.value) || 0) })
              ] }),
              /* @__PURE__ */ jsxs("label", { style: { display: "flex", flexDirection: "column", gap: 7, minWidth: 0 }, children: [
                /* @__PURE__ */ jsx("span", { className: "vqdoc-lbl", children: "Charge name" }),
                /* @__PURE__ */ jsx("input", { type: "text", className: "vqdoc-in", value: defaultExtraLabel, placeholder: tt("Service"), onChange: (e) => setDefaultExtraLabel(e.target.value) })
              ] }),
              /* @__PURE__ */ jsxs("label", { style: { display: "flex", flexDirection: "column", gap: 7, minWidth: 0 }, children: [
                /* @__PURE__ */ jsxs("span", { className: "vqdoc-lbl", children: [
                  "Amount (",
                  currency,
                  ")"
                ] }),
                /* @__PURE__ */ jsx("input", { type: "number", className: "vqdoc-in n", value: defaultExtraValue, onChange: (e) => setDefaultExtraValue(parseFloat(e.target.value) || 0) })
              ] })
            ] })
          ] })
        ] }),
        section === "display" && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs("div", { className: "vqdoc-group", children: [
            /* @__PURE__ */ jsx("h4", { children: "Text size" }),
            /* @__PURE__ */ jsx("p", { children: "Everything on the screen grows together — the type, the buttons and the rows — and the layout re-composes around the larger controls instead of clipping them." }),
            /* @__PURE__ */ jsx(
              Seg,
              {
                value: String(textSize),
                fill: true,
                options: [["1", "Normal"], ["2", "Large"], ["3", "Larger"], ["4", "Senior"], ["5", "Maximum"]],
                onChange: (v) => setTextSize(Number(v))
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "vqdoc-group", children: [
            /* @__PURE__ */ jsx("h4", { children: "Shortcuts" }),
            /* @__PURE__ */ jsx("div", { className: "vqdoc-opt", style: { display: "block" }, children: [
              ["Alt + L", "Show or hide the navigation rail"],
              ["Alt + D", tt("Fold the customer block away")],
              ["Alt + Q", "Jump to the quick add row"],
              ["Esc", "Close whatever is on top"]
            ].map(([k, v]) => /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 12, padding: "5px 0", fontSize: "var(--d-t-2xs)" }, children: [
              /* @__PURE__ */ jsx("span", { style: {
                fontFamily: "var(--vq-font-numeric)",
                fontWeight: 700,
                fontSize: "var(--d-t-micro)",
                border: "1px solid var(--vq-line)",
                borderRadius: 6,
                padding: "3px 7px",
                background: "var(--vq-sunken)",
                whiteSpace: "nowrap"
              }, children: k }),
              /* @__PURE__ */ jsx("span", { style: { color: "var(--vq-text-2)" }, children: v })
            ] }, k)) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "vqdoc-group", children: [
            /* @__PURE__ */ jsx("h4", { children: "Start over" }),
            /* @__PURE__ */ jsx("p", { children: "Puts the layout, the text size and the rail back the way they came. Your store settings, products and sales are not touched." }),
            /* @__PURE__ */ jsxs("button", { type: "button", className: "vqdoc-btn danger", style: { alignSelf: "flex-start" }, onClick: onReset, children: [
              /* @__PURE__ */ jsx(RotateCcw, { size: 15 }),
              " Reset this screen"
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("aside", { style: {
        flex: "0 0 auto",
        width: 348,
        borderLeft: "1px solid var(--vq-line)",
        background: "var(--vq-surface)",
        padding: 20,
        minHeight: 0,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        alignItems: "center"
      }, children: [
        /* @__PURE__ */ jsx(
          Seg,
          {
            value: deviceId,
            options: PREVIEW_DEVICES.map((d) => [d.id, d.name]),
            onChange: setDeviceId,
            size: "sm"
          }
        ),
        /* @__PURE__ */ jsx(Preview, { device, comp, showRail }),
        /* @__PURE__ */ jsxs("p", { style: {
          margin: 0,
          fontSize: "var(--d-t-2xs)",
          color: "var(--vq-text-3)",
          textAlign: "center",
          lineHeight: 1.6,
          maxWidth: 280
        }, children: [
          "A live preview of this screen at ",
          device.name.toLowerCase(),
          " size."
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("footer", { children: [
      /* @__PURE__ */ jsx("span", { style: { fontSize: "var(--d-t-2xs)", color: "var(--vq-text-3)", marginRight: "auto" }, children: "Changes save as you make them." }),
      /* @__PURE__ */ jsx("button", { type: "button", className: "vqdoc-btn pri", onClick: onClose, children: "Done" })
    ] })
  ] }) });
}
const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};
function DocumentScan({ doc, open, onClose, onConfirm, priceOf }) {
  const { store } = usePage().props;
  const [buffer, setBuffer] = useState("");
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const [miss, setMiss] = useState(null);
  const inputRef = useRef(null);
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 60);
    if (!open) {
      setBuffer("");
      setRows([]);
      setMiss(null);
    }
  }, [open]);
  const qtyField = doc.columns.includes("counted") ? "counted_quantity" : "quantity";
  const onKey = useCallback(async (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const code = buffer.trim();
    if (!code) return;
    if (/^\d+$/.test(code) && code.length <= 3 && rows.length) {
      const qty = num(code);
      setRows((prev) => {
        const next = [...prev];
        next[next.length - 1] = { ...next[next.length - 1], [qtyField]: qty };
        return next;
      });
      setBuffer("");
      return;
    }
    setBusy(true);
    setMiss(null);
    try {
      const res = await window.axios.get(
        route("store.inventory.search", { store_slug: store?.slug }),
        { params: { query: code } }
      );
      const found = (res.data || [])[0];
      if (!found) {
        setMiss(code);
        setBuffer("");
        return;
      }
      setRows((prev) => {
        const at = prev.findIndex((r) => r.product.id === found.id);
        if (at >= 0) {
          const next = [...prev];
          const [row] = next.splice(at, 1);
          next.push({ ...row, [qtyField]: num(row[qtyField]) + 1 });
          return next;
        }
        return [...prev, {
          id: `${found.id}-${Date.now()}`,
          product: found,
          [qtyField]: 1,
          price: num(priceOf ? priceOf(found) : found.price)
        }];
      });
      setBuffer("");
    } catch (_) {
      setMiss(code);
      setBuffer("");
    } finally {
      setBusy(false);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [buffer, rows.length, qtyField, store?.slug, priceOf]);
  if (!open) return null;
  const units = rows.reduce((s, r) => s + num(r[qtyField]), 0);
  return /* @__PURE__ */ jsxs(
    Sheet,
    {
      title: `Scan into this ${doc.name.toLowerCase()}`,
      hint: "Scan one after another. Type a number and press Enter to set how many of the last one.",
      icon: /* @__PURE__ */ jsx(ScanBarcode, { size: 18 }),
      width: 620,
      onClose,
      footer: /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("span", { style: { marginRight: "auto", color: "var(--vq-text-2)", fontSize: "var(--d-t-sm)" }, children: rows.length ? `${rows.length} line${rows.length === 1 ? "" : "s"} · ${units} unit${units === 1 ? "" : "s"}` : "Nothing scanned yet" }),
        /* @__PURE__ */ jsx("button", { type: "button", className: "vqdoc-btn", disabled: !rows.length, onClick: () => setRows([]), children: "Clear" }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            className: "vqdoc-btn pri",
            disabled: !rows.length,
            onClick: () => {
              onConfirm(rows);
              onClose();
            },
            children: [
              "Add ",
              rows.length ? `${rows.length} line${rows.length === 1 ? "" : "s"}` : ""
            ]
          }
        )
      ] }),
      children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            ref: inputRef,
            className: "vqdoc-scanfield",
            value: buffer,
            disabled: busy,
            placeholder: "Scan a barcode…",
            onChange: (e) => setBuffer(e.target.value),
            onKeyDown: onKey,
            onBlur: () => setTimeout(() => inputRef.current?.focus(), 30)
          }
        ),
        miss && /* @__PURE__ */ jsxs("p", { className: "vqdoc-note", "data-tone": "warn", style: { marginTop: "var(--d-s3)" }, children: [
          "Nothing matches ",
          /* @__PURE__ */ jsx("strong", { children: miss }),
          ". Check the code, or add the product first."
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "vqdoc-list", style: { marginTop: "var(--d-s4)" }, children: [
          !rows.length && /* @__PURE__ */ jsxs("div", { className: "vqdoc-empty", children: [
            /* @__PURE__ */ jsx("span", { className: "ico", children: /* @__PURE__ */ jsx(ScanBarcode, { size: 22 }) }),
            /* @__PURE__ */ jsx("p", { children: "Nothing scanned yet" }),
            /* @__PURE__ */ jsx("small", { children: "The list builds as you scan. Nothing reaches the document until you add it." })
          ] }),
          rows.map((r, i) => /* @__PURE__ */ jsxs("div", { className: "vqdoc-list-row", children: [
            /* @__PURE__ */ jsx("span", { className: "vqdoc-idx", children: i + 1 }),
            /* @__PURE__ */ jsx("span", { style: { flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: r.product.name }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                className: "vqdoc-cell c w-qty",
                value: r[qtyField],
                onChange: (e) => setRows((prev) => prev.map((x) => x.id === r.id ? { ...x, [qtyField]: num(e.target.value) } : x)),
                onFocus: (e) => e.target.select()
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                className: "vqdoc-icon sm quiet danger",
                title: "Remove",
                onClick: () => setRows((prev) => prev.filter((x) => x.id !== r.id)),
                children: /* @__PURE__ */ jsx(Trash2, { size: 15 })
              }
            )
          ] }, r.id))
        ] })
      ]
    }
  );
}
const read = (key, fallback) => {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : JSON.parse(v);
  } catch (_) {
    return fallback;
  }
};
const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (_) {
  }
};
const RAIL_KEY = "vqdoc_rail";
const keysFor = (typeId) => ({
  comp: `vqdoc_${typeId}_layout`,
  fields: `vqdoc_${typeId}_fields`,
  scale: `vqdoc_${typeId}_scale`,
  stock: `vqdoc_${typeId}_stock`,
  quick: `vqdoc_${typeId}_quick`,
  margin: `vqdoc_${typeId}_margin`,
  defaults: `vqdoc_${typeId}_defaults`
});
const defaultFields = (doc) => {
  const out = {};
  doc.fields.forEach((f) => {
    out[f] = true;
  });
  return out;
};
function useDocumentChrome({
  doc,
  activeId,
  seniorMode = false,
  marginDefault = false,
  /* What the senior-mode space bar does. A till operator who cannot see a
     small button still has to be able to finish a sale. */
  onSave,
  /* Whether the header may fold itself away yet — see onLinesFocus. */
  canFold = true,
  locked = false
}) {
  const K = useMemo(() => keysFor(doc.id), [doc.id]);
  const L = doc.legacyKeys || {};
  const readK = (key, legacy, fallback) => {
    const v = read(key, void 0);
    if (v !== void 0) return v;
    return legacy ? read(legacy, fallback) : fallback;
  };
  const focusQuick = useCallback(() => {
    const el = document.querySelector("#quick-entry-input input") || document.getElementById("quick-entry-input");
    if (el) {
      el.focus();
      el.select?.();
    }
  }, []);
  const rootRef = useRef(null);
  const scrollRef = useRef(null);
  const bodyRef = useRef(null);
  const sumRef = useRef(null);
  const totalRef = useRef(null);
  const splitRef = useRef(null);
  const [showRail, setShowRailState] = useState(() => read(RAIL_KEY, true));
  const setShowRail = useCallback((v) => {
    setShowRailState(v);
    write(RAIL_KEY, v);
  }, []);
  const [textSize, setTextSizeState] = useState(() => readK(K.scale, L.scale, seniorMode ? 4 : 1));
  const setTextSize = useCallback((v) => {
    setTextSizeState(v);
    write(K.scale, v);
  }, [K.scale]);
  const [comp, setCompState] = useState(() => {
    const saved = readK(K.comp, L.comp, null);
    return { ...DEFAULT_COMP, ...saved && typeof saved === "object" ? saved : {} };
  });
  const setComp = useCallback((patch) => {
    setCompState((prev) => {
      const next = { ...prev, ...patch };
      write(K.comp, next);
      return next;
    });
  }, [K.comp]);
  const applyLayout = useCallback((id) => {
    const l = LAYOUTS.find((x) => x.id === id);
    if (!l) return;
    setCompState(() => {
      write(K.comp, l.comp);
      return { ...l.comp };
    });
  }, [K.comp]);
  const [fields, setFieldsState] = useState(() => ({ ...defaultFields(doc), ...readK(K.fields, L.fields, null) || {} }));
  const setField = useCallback((key, on) => {
    setFieldsState((prev) => {
      const next = { ...prev, [key]: on };
      write(K.fields, next);
      return next;
    });
  }, [K.fields]);
  const carries = useCallback((id) => doc.fields.includes(id) && fields[id] !== false, [doc.fields, fields]);
  const [showStock, setShowStockState] = useState(() => readK(K.stock, L.stock, true));
  const setShowStock = useCallback((v) => {
    setShowStockState(v);
    write(K.stock, v);
  }, [K.stock]);
  const [showQuickEntry, setShowQuickEntryState] = useState(() => read(K.quick, false));
  const setShowQuickEntry = useCallback((v) => {
    setShowQuickEntryState(v);
    write(K.quick, v);
    if (v) setTimeout(() => focusQuick(), 50);
  }, [K.quick]);
  const [showMargin, setShowMarginState] = useState(() => read(K.margin, marginDefault));
  const setShowMargin = useCallback((v) => {
    setShowMarginState(v);
    write(K.margin, v);
  }, [K.margin]);
  const [applyDefaults, setApplyDefaultsState] = useState(() => read(K.defaults, false));
  const setApplyDefaults = useCallback((v) => {
    setApplyDefaultsState(v);
    write(K.defaults, v);
  }, [K.defaults]);
  const [fold, setFold] = useState(null);
  const autoFolded = useRef(null);
  const [showAllFields, setShowAllFields] = useState(false);
  const [showAllTotals, setShowAllTotals] = useState(false);
  const [totalsSheet, setTotalsSheet] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [openLine, setOpenLine] = useState(null);
  const [armedRow, setArmedRow] = useState(null);
  useEffect(() => {
    setFold(null);
    autoFolded.current = null;
  }, [activeId]);
  const detailsOpen = fold === null ? comp.details === "open" : fold === "open";
  const onLinesFocus = useCallback(() => {
    if (autoFolded.current === activeId) return;
    if (!canFold) return;
    autoFolded.current = activeId;
    if (comp.details === "open" && comp.autofold !== false) setFold("collapsed");
  }, [activeId, canFold, comp.details, comp.autofold]);
  const [bodyW, setBodyW] = useState(1200);
  const [canPin, setCanPin] = useState(false);
  const [totalSeen, setTotalSeen] = useState(true);
  useLayoutEffect(() => {
    const el = bodyRef.current;
    if (!el || typeof ResizeObserver === "undefined") return void 0;
    const measure = () => setBodyW(el.clientWidth || 0);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const law = useMemo(
    () => composeDocument(bodyW / (UI_SCALE[textSize] || 1), comp),
    [bodyW, comp, textSize]
  );
  const level = LEVELS[law.level];
  const asCards = law.cards;
  useLayoutEffect(() => {
    const sc = scrollRef.current;
    const sm = sumRef.current;
    if (!sc || !sm || law.summary !== "side" || typeof ResizeObserver === "undefined") {
      setCanPin(false);
      return void 0;
    }
    const measure = () => setCanPin(sm.scrollHeight <= sc.clientHeight - 8);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(sm);
    ro.observe(sc);
    return () => ro.disconnect();
  }, [law.summary, detailsOpen, law.level]);
  useEffect(() => {
    const target = totalRef.current;
    if (!target || typeof IntersectionObserver === "undefined") {
      setTotalSeen(true);
      return void 0;
    }
    const io = new IntersectionObserver(([e]) => setTotalSeen(e.isIntersecting), { root: scrollRef.current, threshold: 0.5 });
    io.observe(target);
    return () => io.disconnect();
  }, [law.summary, detailsOpen, law.level, activeId]);
  const pinned = law.summary === "side" && canPin && (comp.pin === "auto" || comp.pin === "pinned");
  const dockOn = law.summary === "hidden" || comp.pin === "docked" ? true : comp.pin === "scroll" ? false : !totalSeen;
  const onSplitDown = useCallback((e) => {
    const body = bodyRef.current;
    const handle = splitRef.current;
    if (!body) return;
    e.preventDefault();
    handle?.classList.add("dragging");
    const rect = body.getBoundingClientRect();
    const move = (ev) => {
      const x = ev.touches ? ev.touches[0].clientX : ev.clientX;
      setCompState((prev) => ({ ...prev, split: clamp((rect.right - x) / rect.width * 100, SPLIT_MIN, SPLIT_MAX) }));
    };
    const up = () => {
      handle?.classList.remove("dragging");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      setCompState((prev) => {
        const n = { ...prev, split: Math.round(prev.split) };
        write(K.comp, n);
        return n;
      });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }, [K.comp]);
  const onSplitKey = useCallback((e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    setCompState((prev) => {
      const n = { ...prev, split: clamp(prev.split + (e.key === "ArrowLeft" ? 2 : -2), SPLIT_MIN, SPLIT_MAX) };
      write(K.comp, n);
      return n;
    });
  }, [K.comp]);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setTotalsSheet(false);
        return;
      }
      if (e.altKey && (e.key || "").toLowerCase() === "q") {
        e.preventDefault();
        if (!showQuickEntry) setShowQuickEntry(true);
        else focusQuick();
        return;
      }
      if (seniorMode && e.key === "F1") {
        e.preventDefault();
        if (!showQuickEntry) setShowQuickEntry(true);
        else focusQuick();
        return;
      }
      if (seniorMode && e.key === " " && onSave && !locked) {
        const tag = (document.activeElement?.tagName || "").toLowerCase();
        if (tag !== "input" && tag !== "textarea" && tag !== "select" && !document.activeElement?.isContentEditable) {
          e.preventDefault();
          onSave();
          return;
        }
      }
      if (!e.altKey) return;
      const k = (e.key || "").toLowerCase();
      if (k === "l") {
        e.preventDefault();
        setShowRail(!showRail);
      }
      if (k === "d") {
        e.preventDefault();
        setFold(detailsOpen ? "collapsed" : "open");
        autoFolded.current = activeId;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setShowRail, showRail, detailsOpen, activeId, seniorMode, onSave, locked, showQuickEntry, setShowQuickEntry]);
  const [quickQuery, setQuickQuery] = useState("");
  useEffect(() => {
    if (!showQuickEntry || locked || asCards) return void 0;
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
      const t = e.target;
      const tag = (t && t.tagName ? t.tagName : "").toLowerCase();
      if (tag === "input" || tag === "select" || tag === "textarea" || t && t.isContentEditable) return;
      e.preventDefault();
      setQuickQuery((prev) => prev + e.key);
      focusQuick();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showQuickEntry, locked, asCards]);
  const field = useCallback(
    (id) => carries(id) && (level.header.includes(id) || showAllFields || !FIELD_LIBRARY[id]),
    [carries, level.header, showAllFields]
  );
  const hasHiddenFields = useMemo(
    () => (doc.fields || []).some((f) => ALL_HEADER.includes(f) && !level.header.includes(f)),
    [doc.fields, level.header]
  );
  return {
    /* refs the shell wires up */
    rootRef,
    scrollRef,
    bodyRef,
    sumRef,
    totalRef,
    splitRef,
    /* preferences */
    showRail,
    setShowRail,
    textSize,
    setTextSize,
    comp,
    setComp,
    applyLayout,
    fields,
    setField,
    carries,
    showStock,
    setShowStock,
    showQuickEntry,
    setShowQuickEntry,
    quickQuery,
    setQuickQuery,
    focusQuick,
    showMargin,
    setShowMargin,
    applyDefaults,
    setApplyDefaults,
    /* right now */
    fold,
    setFold,
    detailsOpen,
    onLinesFocus,
    showAllFields,
    setShowAllFields,
    showAllTotals,
    setShowAllTotals,
    totalsSheet,
    setTotalsSheet,
    settingsOpen,
    setSettingsOpen,
    openLine,
    setOpenLine,
    armedRow,
    setArmedRow,
    /* the law, measured */
    law,
    level,
    asCards,
    bodyW,
    pinned,
    dockOn,
    onSplitDown,
    onSplitKey,
    /* helpers */
    field,
    hasHiddenFields
  };
}
export {
  DocumentShell as D,
  Field as F,
  Sheet as S,
  VqSelect as V,
  Zone as Z,
  useDocumentChrome as a,
  availableOf as b,
  computeTotals as c,
  documentType as d,
  DocumentSettings as e,
  DocumentScan as f,
  DocumentCounts as g,
  DocumentTotals as h,
  DocumentLines as i,
  Scrim as j,
  linePayload as l,
  moneyPayload as m,
  usePartyBalance as u
};

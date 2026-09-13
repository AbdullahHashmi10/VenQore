import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { usePage, router } from "@inertiajs/react";
import { CheckCircle2, Plus, Zap, ScanBarcode, TrendingUp } from "lucide-react";
import { g as getCurrencySymbol, f as formatCurrency } from "./format-131Nyq79.js";
import { r as roundTotal } from "./settings-DUqQ1JdE.js";
import { u as useAlert } from "../ssr.js";
import { A as AsyncPartyCombobox } from "./AsyncPartyCombobox-C_xHT5vA.js";
import { P as ProductModal } from "./ProductModal-DTGv60aX.js";
import { Q as QuickPartyModal } from "./QuickPartyModal-BjRmNiLb.js";
import { u as usePartyBalance, a as useDocumentChrome, c as computeTotals, b as availableOf, D as DocumentShell, e as DocumentSettings, f as DocumentScan, g as DocumentCounts, h as DocumentTotals, Z as Zone, i as DocumentLines, F as Field, l as linePayload, m as moneyPayload } from "./useDocumentChrome-DON8WQ-L.js";
const keyFor = (ns) => `vqdoc_drafts_${ns}`;
const read = (ns, seed) => {
  try {
    const raw = sessionStorage.getItem(keyFor(ns));
    if (!raw) return [seed()];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : [seed()];
  } catch (_) {
    return [seed()];
  }
};
const write = (ns, list) => {
  try {
    sessionStorage.setItem(keyFor(ns), JSON.stringify(list));
  } catch (_) {
  }
};
function useDocumentDrafts({ doc, seed, enabled = true }) {
  const ns = doc.drafts;
  const live = enabled && !!ns && doc.tabs !== false;
  const [list, setList] = useState(() => live ? read(ns, seed) : [seed()]);
  const [activeId, setActiveId] = useState(() => list[0]?.id);
  useEffect(() => {
    if (live) write(ns, list);
  }, [live, ns, list]);
  useEffect(() => {
    if (!list.some((x) => x.id === activeId)) setActiveId(list[0]?.id);
  }, [list, activeId]);
  const current = useMemo(
    () => list.find((x) => x.id === activeId) || list[0],
    [list, activeId]
  );
  const patch = useCallback((p) => {
    setList((prev) => prev.map((x) => x.id === activeId ? { ...x, ...p } : x));
  }, [activeId]);
  const add = useCallback((initial) => {
    const next = { ...seed(), ...initial || {} };
    setList((prev) => [...prev, next]);
    setActiveId(next.id);
    return next;
  }, [seed]);
  const close = useCallback((id) => {
    setList((prev) => {
      const rest = prev.filter((x) => x.id !== id);
      return rest.length ? rest : [seed()];
    });
  }, [seed]);
  const replace = useCallback((id, value) => {
    setList((prev) => prev.map((x) => x.id === id ? value : x));
  }, []);
  return { list, current, activeId, setActiveId, patch, add, close, replace, live };
}
const CHEQUE = "CHEQUE";
function useDocumentAccounts({ storeSlug, direction = "in", withCheque = true }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [accRes, bankRes] = await Promise.all([
          window.axios.get(route("store.accounting.accounts.api", { store_slug: storeSlug, type: "asset" })),
          window.axios.get(route("store.api.bank-accounts", { store_slug: storeSlug }))
        ]);
        if (!alive) return;
        const raw = accRes.data?.data || accRes.data || [];
        const byCode = (code, ...names) => raw.find(
          (a) => a.code === code || names.includes(a.name)
        );
        const cashGL = byCode("1000", "Cash on Hand", "Cash in Hand");
        const bankGL = byCode("1010", "Bank Account");
        const chequeGL = raw.find((a) => a.code === "1020" || /cheque/i.test(a.name || ""));
        const tills = (bankRes.data || []).map((b) => ({
          id: `BANK_${b.id}`,
          kind: b.type === "cash" ? "cash" : b.type === "mobile_wallet" ? "wallet" : "bank",
          name: b.name || b.bank_name || "Account",
          bankName: b.bank_name || null,
          accountNumber: b.account_number || null,
          /* A till posts to cash, a wallet and a bank to the bank
             account — the same split the ledger makes. */
          realAccountId: (b.type === "cash" ? cashGL?.id : bankGL?.id) || null,
          bankReferenceId: b.id
        }));
        const ownTill = tills.some((t) => t.kind === "cash");
        const out = [
          ...ownTill ? [] : [{ id: "CASH", name: "Cash in Hand", kind: "cash", realAccountId: cashGL?.id || null }],
          ...tills.filter((t) => t.kind === "cash"),
          ...withCheque ? [{ id: CHEQUE, name: "Cheque", kind: "cheque", realAccountId: chequeGL?.id || null }] : [],
          ...tills.filter((t) => t.kind !== "cash")
        ];
        const seen = /* @__PURE__ */ new Set();
        setAccounts(out.filter((a) => {
          const key = `${String(a.name).trim().toLowerCase()}|${String(a.bankName || a.kind).trim().toLowerCase()}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        }));
      } catch (_) {
        if (alive) setAccounts([{ id: "CASH", name: "Cash in Hand", kind: "cash", realAccountId: null }]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [storeSlug, withCheque]);
  const options = useMemo(() => accounts.map((a) => ({
    value: a.id,
    label: a.name,
    hint: a.kind === "bank" || a.kind === "wallet" ? [a.bankName, a.accountNumber && `…${String(a.accountNumber).slice(-4)}`].filter(Boolean).join(" · ") || (a.kind === "wallet" ? "Mobile wallet" : "Bank account") : a.kind === "cheque" ? "Held until it clears" : direction === "out" ? "Straight out of the drawer" : "Straight into the drawer"
  })), [accounts, direction]);
  const hasBank = accounts.some((a) => a.kind === "bank" || a.kind === "wallet");
  const resolve = useCallback((value) => {
    const acc = accounts.find((a) => String(a.id) === String(value));
    if (!acc) return null;
    return {
      paymentAccountKey: acc.id,
      /* 'cash' | 'bank' | 'wallet' | 'cheque'. Screens were deducing this
         from the shape of the key, which is how an expense paid by bank
         came to be posted out of the till. */
      paymentAccountKind: acc.kind,
      paymentAccountId: acc.realAccountId || (acc.id === CHEQUE ? "CHEQUE" : null),
      bankReferenceId: acc.bankReferenceId || null,
      selectedBankName: acc.kind === "bank" || acc.kind === "wallet" ? acc.name : null,
      isCheque: acc.kind === "cheque"
    };
  }, [accounts]);
  const fallbackAccountId = useMemo(
    () => accounts.find((a) => a.kind === "cash")?.realAccountId || null,
    [accounts]
  );
  const defaultKey = useMemo(
    () => accounts.find((a) => a.kind === "cash")?.id || accounts[0]?.id || null,
    [accounts]
  );
  return { accounts, options, resolve, hasBank, loading, fallbackAccountId, defaultKey, CHEQUE };
}
const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const blankLine = (extra) => ({
  id: uid(),
  product: null,
  quantity: 1,
  freeQuantity: 0,
  price: 0,
  discount: 0,
  discountType: "fixed",
  ...extra || {}
});
const today = () => (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
const flowOf = (doc) => {
  if (doc.fields.includes("account")) return "in";
  if (doc.fields.includes("accountOut")) return "out";
  if (doc.fields.includes("refund")) return doc.party.role === "customer" ? "out" : "in";
  return doc.party.role === "supplier" ? "out" : "in";
};
function MoneyDocument({
  doc,
  seed,
  /* () => a blank document                           */
  editSeed,
  /* () => the one being edited                       */
  isEdit = false,
  locked = false,
  lockNote,
  notice,
  /* a banner above the document                      */
  header,
  /* (bag) => the header fields that are its own      */
  extra,
  /* a block between the header and the lines         */
  buildPayload,
  /* (bag) => the rest of the payload                 */
  beforeSave,
  /* (bag) => false to stop and ask something first   */
  validate,
  /* (bag) => { field: message } | null               */
  onSaved,
  /* (response, d) => void                            */
  products = [],
  parties = [],
  categories = [],
  saveLabel,
  strip,
  /* override the folded one-line summary             */
  extraTools,
  extraActions,
  extraRows,
  /* extra rows in the totals column                  */
  extraSheets,
  priceOf,
  /* which price a picked product opens at            */
  lockItems = false,
  /* lines come from a source document, not a search  */
  partyLocked = false,
  /* the other side is settled by that source document */
  readOnlyCells,
  /* { rate, disc, total } — columns that report only  */
  qtyFloor = 1,
  /* the lowest a quantity may be wheeled to           */
  canAddLines = true,
  dockTotal,
  /* (bag) => the figure on the phone dock            */
  dockLabel,
  settleDefault,
  /* (d, totals) => the settlement to fill in         */
  drafts: externalDrafts,
  /* a tab source of the screen's own              */
  saveRef: outerSaveRef,
  /* so a screen can finish a save it interrupted  */
  closeOnSave = true,
  /* whether a saved tab leaves the drawer          */
  settingsExtras,
  /* extra switches for the settings sheet         */
  chargeVisible,
  /* which of the charge rows are offered at all   */
  transport = "axios",
  /* 'axios' | 'inertia'                              */
  method,
  /* 'post' | 'put' — defaults from isEdit            */
  url,
  /* ({ d }) => string                                */
  afterUrl
  /* where to go once it is saved                     */
}) {
  const { settings, auth, store } = usePage().props;
  const { showAlert, showConfirm } = useAlert();
  const isAdmin = ["admin", "owner", "platform_admin"].includes(auth?.user?.role);
  const currency = getCurrencySymbol(store || settings);
  const money = (n) => formatCurrency(n, store || settings);
  const ownDrafts = useDocumentDrafts({
    doc,
    seed: isEdit && editSeed ? editSeed : seed,
    enabled: !isEdit && !externalDrafts
  });
  const drafts = externalDrafts || ownDrafts;
  const d = drafts.current;
  const patch = useCallback((p) => {
    if (locked) return;
    drafts.patch(p);
  }, [locked, drafts]);
  const items = d.items || [];
  const setItems = useCallback((next) => {
    patch({ items: typeof next === "function" ? next(d.items || []) : next });
  }, [patch, d.items]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [invalid, setInvalid] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [productModal, setProductModal] = useState(null);
  const [partyModal, setPartyModal] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [totalModes, setTotalModes] = useState({});
  const [peek, setPeek] = useState(false);
  const saveRef = useRef(null);
  const partyRole = doc.party.role;
  const settles = doc.money.settle !== "none";
  const acct = useDocumentAccounts({
    storeSlug: store?.slug,
    direction: flowOf(doc),
    withCheque: settles
  });
  const partyBal = usePartyBalance({ storeSlug: store?.slug, partyId: d.party?.id });
  const chrome = useDocumentChrome({
    doc,
    activeId: d.id,
    seniorMode: settings?.senior_mode === "1",
    marginDefault: settings?.show_margin_percentage === "1",
    onSave: () => saveRef.current?.(),
    /* The header may not fold itself away until the one field the document
       cannot be saved without is answered. */
    canFold: partyRole === "none" || doc.party.required === false || !!d.party?.id,
    locked
  });
  const totals = useMemo(() => computeTotals({
    doc,
    items,
    document: d,
    settings,
    fields: chrome.fields,
    roundTotal
  }), [doc, items, d, settings, chrome.fields]);
  useEffect(() => {
    if (!settles || locked || isEdit) return;
    if (d.paymentAccountKey || !acct.defaultKey) return;
    const picked = acct.resolve(acct.defaultKey);
    if (picked) patch(picked);
  }, [settles, locked, acct.defaultKey, d.paymentAccountKey, acct.resolve, patch]);
  const settleTouched = useRef({});
  const settleDefaultRef = useRef(settleDefault);
  settleDefaultRef.current = settleDefault;
  useEffect(() => {
    if (!settles || isEdit || locked || settleTouched.current[d.id]) return;
    const fn = settleDefaultRef.current;
    const fill = fn ? fn(d, totals) : d.paymentMethod === "cash" ? totals.grandTotal : 0;
    if (Math.abs(num(d.amountPaid) - num(fill)) > 4e-3) patch({ amountPaid: fill });
  }, [settles, isEdit, locked, d.id, d.paymentMethod, totals.grandTotal]);
  const patchSettle = useCallback((p) => {
    if ("amountPaid" in p) settleTouched.current[d.id] = true;
    patch(p);
  }, [patch, d.id]);
  const setSettleMode = useCallback((mode) => {
    if (mode === d.paymentMethod) return;
    delete settleTouched.current[d.id];
    patch({ paymentMethod: mode });
  }, [patch, d.id, d.paymentMethod]);
  const update = useCallback((id, key, value) => {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, [key]: value } : i));
  }, [setItems]);
  const remove = useCallback((id) => {
    setItems((prev) => prev.length > 1 ? prev.filter((i) => i.id !== id) : [blankLine()]);
  }, [setItems]);
  const addLine = useCallback(() => setItems((prev) => [...prev, blankLine()]), [setItems]);
  const onPickProduct = useCallback((product, id) => {
    if (!product) return;
    setItems((prev) => prev.map((i) => i.id === id ? {
      ...i,
      product,
      price: num(priceOf ? priceOf(product) : product.price ?? product.selling_price),
      cost: num(product.cost ?? product.cost_price),
      available_stock: availableOf(product)
    } : i));
    setInvalid([]);
  }, [setItems, priceOf]);
  const onTotalChange = useCallback((item, value) => {
    const target = num(value);
    const mode = totalModes[item.id] || "price";
    if (mode === "price") {
      const qty = num(item.quantity) || 1;
      update(item.id, "price", Math.max(0, (target + num(item.discount)) / qty));
    } else {
      const price = num(item.price) || 1;
      update(item.id, "quantity", Math.max(0, (target + num(item.discount)) / price));
    }
  }, [totalModes, update]);
  const validLines = items.filter((i) => doc.money.lines === "amount" ? i.category_id || i.desc : i.product || i.description || i.desc || i.name);
  const bag = {
    d,
    patch,
    patchSettle,
    setSettleMode,
    items,
    setItems,
    totals,
    acct,
    chrome,
    errors,
    money,
    currency,
    isEdit,
    locked,
    partyBal,
    validLines,
    settings,
    store,
    showAlert
  };
  const save = async (opts = {}) => {
    if (locked || saving) return;
    const found = {};
    if (partyRole !== "none" && doc.party.required !== false && !d.party?.id) {
      found.party = `Choose a saved ${doc.party.label.toLowerCase()} — typing a name is not enough.`;
    }
    Object.assign(found, validate?.({ ...bag, opts }) || {});
    setErrors(found);
    if (Object.keys(found).length) {
      showAlert({ title: "Not ready to save", message: Object.values(found)[0], type: "warning" });
      return;
    }
    if (!validLines.length) {
      showAlert({ title: "Nothing on it", message: "Add at least one line first.", type: "warning" });
      return;
    }
    if (doc.money.lines === "priced" && num(d.discount) > totals.subtotal - totals.itemDiscounts + 4e-3) {
      showAlert({
        title: "Discount is too big",
        message: `${money(num(d.discount))} is more than the ${money(totals.subtotal - totals.itemDiscounts)} of goods on this document.`,
        type: "warning"
      });
      return;
    }
    if (beforeSave && beforeSave({ ...bag, opts }) === false) return;
    setSaving(true);
    try {
      const payload = {
        ...moneyPayload({ doc, totals, document: d }),
        items: linePayload({ doc, items, totals }),
        ...buildPayload({ ...bag, opts })
      };
      const target = url({ d, opts });
      const verb = method || (isEdit ? "put" : "post");
      if (transport === "inertia") {
        router[verb](target, payload, {
          onError: (e) => {
            setErrors(e);
            setInvalid(rowsFrom(e));
            setSaving(false);
            showAlert({ title: "Could not save", message: Object.values(e)[0] || "Check the highlighted lines.", type: "error" });
          },
          onSuccess: () => onSaved?.(null, d, opts),
          onFinish: () => setSaving(false)
        });
        return;
      }
      const res = await window.axios[verb](target, payload);
      showAlert({
        title: "Saved",
        message: `${doc.name} ${isEdit ? "updated" : "saved"}.`,
        type: "success"
      });
      if (!isEdit && closeOnSave && drafts.live) drafts.close(d.id);
      if (onSaved) onSaved(res, d, opts);
      else if (afterUrl) router.visit(afterUrl);
      else router.visit(route(doc.api.index, { store_slug: store?.slug }));
    } catch (err) {
      const errs = err?.response?.data?.errors;
      const first = errs ? Object.values(errs)[0]?.[0] : null;
      showAlert({
        title: "Could not save",
        message: first || err?.response?.data?.message || "Something went wrong.",
        type: "error"
      });
      if (errs) {
        setErrors(errs);
        setInvalid(rowsFrom(errs));
      }
    } finally {
      if (transport !== "inertia") setSaving(false);
    }
  };
  saveRef.current = save;
  if (outerSaveRef) outerSaveRef.current = save;
  const ctx = {
    locked,
    isAdmin,
    currency,
    money,
    categories,
    showStock: chrome.showStock,
    stockMode: doc.stock.badge,
    stockBadge: doc.stock.badge,
    stockWord: doc.stock.badge === "onhand" ? "in stock" : "available",
    freeOn: totals.freeOn,
    canDiscount: settings?.billing_type !== "lite",
    itemPlaceholder: doc.itemPlaceholder || "Search for an item",
    defaultProducts: products,
    showTaxDetail: chrome.showAllFields,
    lockItems,
    readOnly: readOnlyCells || {},
    qtyFloor,
    update,
    remove,
    addLine,
    onPickProduct,
    onTotalChange,
    priceOf,
    onCreateProduct: (name) => setProductModal({ mode: "create", product: { name } }),
    onEditProduct: (product) => setProductModal({ mode: "edit", product }),
    totalMode: (id) => totalModes[id] || "price",
    toggleTotalMode: (id) => setTotalModes((p) => ({ ...p, [id]: (p[id] || "price") === "price" ? "qty" : "price" })),
    draggedIndex,
    invalid,
    onCellFocus: () => {
    },
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
  const slot = (v) => typeof v === "function" ? v(bag) : v;
  const countsOnly = doc.money.lines === "count";
  const canMargin = doc.money.margin && isAdmin && chrome.showMargin;
  const partyName = d.party?.name || `No ${doc.party.label ? doc.party.label.toLowerCase() : "party"} chosen`;
  return /* @__PURE__ */ jsxs(
    DocumentShell,
    {
      doc,
      chrome,
      isEdit,
      locked,
      lockNote,
      notice: slot(notice),
      subtitle: `${d.reference || "Not numbered"}${validLines.length ? ` · ${validLines.length} line${validLines.length === 1 ? "" : "s"}` : ""}`,
      tabs: drafts.list.map((x, i) => ({
        id: x.id,
        label: x.party?.name || `${doc.title.tab} ${i + 1}`,
        count: (x.items || []).filter((l) => l.product || l.category_id).length
      })),
      activeTab: drafts.activeId,
      onTab: drafts.setActiveId,
      onCloseTab: (t) => {
        const doomed = drafts.list.find((x) => x.id === t.id);
        const lines = (doomed?.items || []).filter((l) => l.product || l.category_id).length;
        if (!lines) {
          drafts.close(t.id);
          return;
        }
        showConfirm({
          title: `Discard this ${doc.name.toLowerCase()}?`,
          message: `It has ${lines} line${lines === 1 ? "" : "s"} on it and nothing has been saved.`,
          type: "warning",
          confirmLabel: "Yes, discard",
          onConfirm: () => drafts.close(t.id)
        });
      },
      onNewTab: () => drafts.add(),
      tools: /* @__PURE__ */ jsxs(Fragment, { children: [
        !locked && !lockItems && /* @__PURE__ */ jsx(
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
        !locked && !lockItems && doc.money.lines !== "amount" && /* @__PURE__ */ jsx("button", { type: "button", className: "vqdoc-icon", title: "Scan barcodes", onClick: () => setScanning(true), children: /* @__PURE__ */ jsx(ScanBarcode, { size: 17 }) }),
        canMargin && /* Held, not toggled: a number this sensitive should not
        stay on the screen by accident. */
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            className: "vqdoc-icon",
            "aria-pressed": peek,
            title: "Hold to see the margin",
            onPointerDown: () => setPeek(true),
            onPointerUp: () => setPeek(false),
            onPointerLeave: () => setPeek(false),
            children: /* @__PURE__ */ jsx(TrendingUp, { size: 17 })
          }
        ),
        slot(extraTools)
      ] }),
      header: /* @__PURE__ */ jsx(
        Zone,
        {
          title: doc.zone,
          actions: /* @__PURE__ */ jsxs(Fragment, { children: [
            chrome.hasHiddenFields && /* @__PURE__ */ jsx("button", { type: "button", className: "togg", onClick: () => chrome.setShowAllFields((p) => !p), children: chrome.showAllFields ? "Fewer fields" : "All fields" }),
            /* @__PURE__ */ jsx("button", { type: "button", className: "togg", onClick: () => chrome.setFold("collapsed"), children: "Fold away" })
          ] }),
          children: /* @__PURE__ */ jsxs("div", { className: "vqdoc-hdr", children: [
            partyRole !== "none" && partyLocked && /* Settled by the document this one answers to.
            Offering a picker here would suggest it could be
            changed, and the server would ignore it. */
            /* @__PURE__ */ jsx(Field, { label: doc.party.label, span: 4, children: /* @__PURE__ */ jsx("div", { className: "vqdoc-in", style: { display: "flex", alignItems: "center" }, children: d.party?.name || "—" }) }),
            partyRole !== "none" && !partyLocked && /* @__PURE__ */ jsx(
              Field,
              {
                label: doc.party.label,
                span: 4,
                required: doc.party.required !== false,
                error: errors.party,
                children: /* @__PURE__ */ jsx("div", { id: "tour-invoice-customer", className: "vqdoc-combo", "data-bad": errors.party ? "true" : void 0, children: /* @__PURE__ */ jsx(
                  AsyncPartyCombobox,
                  {
                    type: doc.party.search || partyRole,
                    selectedItem: d.party,
                    onSelect: (p) => {
                      patch({ party: p });
                      setErrors((e) => ({ ...e, party: null }));
                    },
                    onCreateNew: (name) => setPartyModal({ name }),
                    defaultOptions: parties,
                    placeholder: doc.party.placeholder || `Search ${doc.party.label.toLowerCase()}s`,
                    addNewLabel: "Add a new one",
                    portal: true
                  }
                ) })
              }
            ),
            header?.(bag)
          ] })
        }
      ),
      extra: slot(extra),
      strip: strip !== void 0 ? slot(strip) : /* @__PURE__ */ jsxs("button", { type: "button", className: "vqdoc-strip", onClick: () => chrome.setFold("open"), title: "Open the details", children: [
        /* @__PURE__ */ jsx("span", { className: "chev", children: "▾" }),
        /* @__PURE__ */ jsx("span", { className: "who", children: partyRole === "none" ? doc.name : partyName }),
        /* @__PURE__ */ jsxs("span", { className: "meta", children: [
          d.reference || "Not numbered",
          " · ",
          d[doc.dateKey || "date"] || ""
        ] }),
        /* @__PURE__ */ jsx("span", { className: "amt", children: countsOnly ? `${totals.units} units` : money(totals.grandTotal) })
      ] }),
      lines: /* @__PURE__ */ jsxs(
        Zone,
        {
          title: doc.money.lines === "amount" ? "What it was for" : "Items",
          count: validLines.length || "none yet",
          onFocusCapture: chrome.onLinesFocus,
          children: [
            /* @__PURE__ */ jsx(
              DocumentLines,
              {
                doc,
                chrome,
                items,
                ctx,
                onQuickAdd: (line) => setItems((prev) => {
                  const next = { ...blankLine(), ...line, id: uid() };
                  const only = prev.length === 1 && !prev[0].product;
                  return only ? [next] : [...prev, next];
                })
              }
            ),
            !locked && canAddLines && /* @__PURE__ */ jsxs("button", { type: "button", className: "vqdoc-addline", onClick: addLine, children: [
              /* @__PURE__ */ jsx(Plus, { size: 16 }),
              " ",
              doc.money.lines === "amount" ? "Add another line" : "Add an item"
            ] })
          ]
        }
      ),
      totals: countsOnly ? (
        /* A receipt, a transfer or an audit has no money on it. The
           money column would show a subtotal of nothing, an editable
           discount bound to a key no endpoint accepts, and a total of
           zero beside a line saying what the delivery is worth. */
        /* @__PURE__ */ jsx(
          DocumentCounts,
          {
            doc,
            chrome,
            totals,
            ctx: {
              unitLabel: doc.countLabel || "Units",
              extraRows: slot(extraRows),
              actions: /* @__PURE__ */ jsxs("div", { className: "vqdoc-actions", children: [
                !locked && /* @__PURE__ */ jsxs("button", { type: "button", className: "vqdoc-btn pri", disabled: saving, onClick: () => save(), children: [
                  /* @__PURE__ */ jsx(CheckCircle2, { size: 17 }),
                  saving ? "Saving" : saveLabel || `Save ${doc.name.toLowerCase()}`
                ] }),
                slot(extraActions),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    className: "vqdoc-btn",
                    onClick: () => router.visit(afterUrl || route(doc.api.index, { store_slug: store?.slug })),
                    children: locked ? "Back" : "Cancel"
                  }
                )
              ] })
            }
          }
        )
      ) : /* @__PURE__ */ jsx(
        DocumentTotals,
        {
          doc,
          chrome,
          totals,
          document: d,
          ctx: {
            money,
            currency,
            locked,
            patch,
            patchSettle,
            taxRates: parseTaxRates(settings),
            chargeVisible,
            party: d.party,
            prevBalance: partyBal.net,
            balanceKnown: partyBal.known,
            extraRows: slot(extraRows),
            actions: /* @__PURE__ */ jsxs("div", { className: "vqdoc-actions", children: [
              !locked && /* @__PURE__ */ jsxs("button", { type: "button", id: "tour-invoice-complete", className: "vqdoc-btn pri", disabled: saving, onClick: () => save(), children: [
                /* @__PURE__ */ jsx(CheckCircle2, { size: 17 }),
                saving ? "Saving" : saveLabel || (isEdit ? `Update ${doc.name.toLowerCase()}` : `Save ${doc.name.toLowerCase()}`)
              ] }),
              slot(extraActions),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  className: "vqdoc-btn",
                  onClick: () => router.visit(afterUrl || route(doc.api.index, { store_slug: store?.slug })),
                  children: locked ? "Back" : "Cancel"
                }
              )
            ] })
          }
        }
      ),
      dock: {
        total: dockTotal ? dockTotal(bag) : countsOnly ? `${totals.units}` : money(totals.grandTotal),
        totalLabel: dockLabel || (countsOnly ? "Units" : `${doc.name} total`),
        ...settles ? { balance: money(Math.abs(totals.balance)), balanceLabel: totals.balanceLabel } : {},
        actions: !locked && /* @__PURE__ */ jsxs("button", { type: "button", className: "vqdoc-btn", disabled: saving, onClick: () => save(), children: [
          /* @__PURE__ */ jsx(CheckCircle2, { size: 17 }),
          " ",
          saving ? "Saving" : "Save"
        ] })
      },
      children: [
        peek && /* @__PURE__ */ jsx("div", { className: "vqdoc-scope vqdoc-peek", "data-scale": chrome.textSize, children: /* @__PURE__ */ jsxs("div", { className: "vqdoc-dock on", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "k", children: "Cost of goods" }),
            /* @__PURE__ */ jsx("div", { className: "v", children: money(totals.totalCost) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "k", children: "Gross profit" }),
            /* @__PURE__ */ jsx("div", { className: "v", children: money(totals.profit) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "k", children: "Margin" }),
            /* @__PURE__ */ jsxs("div", { className: "v", children: [
              totals.marginPct.toFixed(1),
              "%"
            ] })
          ] }),
          /* @__PURE__ */ jsx("span", { style: { color: "var(--vq-text-3)", fontSize: "var(--d-t-micro)" }, children: "Let go to hide" })
        ] }) }),
        chrome.settingsOpen && /* @__PURE__ */ jsx(
          DocumentSettings,
          {
            doc,
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
            showMargin: chrome.showMargin,
            setShowMargin: chrome.setShowMargin,
            canSeeMargin: !!doc.money.margin && isAdmin,
            applyDefaults: chrome.applyDefaults,
            setApplyDefaults: chrome.setApplyDefaults,
            currency,
            ...settingsExtras || {}
          }
        ),
        !lockItems && doc.money.lines !== "amount" && /* @__PURE__ */ jsx(
          DocumentScan,
          {
            doc,
            open: scanning,
            onClose: () => setScanning(false),
            priceOf,
            onConfirm: (rows) => setItems((prev) => {
              const made = rows.map((r) => ({
                ...blankLine(),
                id: uid(),
                product: r.product,
                quantity: num(r.quantity),
                price: num(r.price),
                cost: num(r.product.cost ?? r.product.cost_price),
                available_stock: availableOf(r.product)
              }));
              const only = prev.length === 1 && !prev[0].product;
              return only ? made : [...prev, ...made];
            })
          }
        ),
        slot(extraSheets),
        productModal && /* @__PURE__ */ jsx(
          ProductModal,
          {
            isOpen: true,
            mode: productModal.mode,
            product: productModal.product,
            onClose: () => setProductModal(null),
            onSuccess: () => setProductModal(null)
          }
        ),
        partyModal && /* @__PURE__ */ jsx(
          QuickPartyModal,
          {
            isOpen: true,
            initialName: partyModal.name,
            type: partyRole,
            onClose: () => setPartyModal(null),
            onCreated: (p) => {
              patch({ party: p });
              setPartyModal(null);
            }
          }
        )
      ]
    }
  );
}
function rowsFrom(errs) {
  return Object.keys(errs || {}).map((k) => k.match(/^items\.(\d+)\./)?.[1]).filter((x) => x !== void 0 && x !== null).map(Number);
}
function parseTaxRates(settings) {
  try {
    const raw = settings?.tax_rates;
    if (!raw) return [{ id: 1, name: "GST 18%", rate: 18 }, { id: 2, name: "VAT 5%", rate: 5 }];
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch (_) {
    return [];
  }
}
export {
  MoneyDocument as M,
  blankLine as b,
  today as t,
  uid as u
};

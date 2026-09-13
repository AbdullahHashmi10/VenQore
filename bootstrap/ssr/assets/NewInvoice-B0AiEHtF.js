import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import React, { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { Head } from "@inertiajs/react";
import { u as useTermText } from "./terms-DwYjlWsV.js";
import { L as LAW, p as presetDocument, f as formatToFit, D as DOC_COLW, d as docDensities, a as docPresets, b as docTableWidth, c as composeDocument, e as docMetrics, m as marginAt } from "./engine-Cd795qy4.js";
import { M as Money, S as Sheet, K as Kbd, f as focusTrap, a as Switch, b as Slider, u as useViewport, I as Icon, T as Toasts } from "./ui-_8sZpHCB.js";
const PRODUCTS = [
  { id: 1, name: "Panadol Extra 500mg", sku: "PAN-500", hsn: "3004.90", uom: "strip", rate: 185, cost: 141, tax: 0, stock: 240, hue: "teal" },
  { id: 2, name: "Surf Excel 1kg", sku: "SRF-1K", hsn: "3402.20", uom: "pack", rate: 640, cost: 522, tax: 18, stock: 96, hue: "sky" },
  { id: 3, name: "Nestle Milk Pak 1L", sku: "NML-1L", hsn: "0401.20", uom: "pc", rate: 285, cost: 246, tax: 0, stock: 480, hue: "lime" },
  { id: 4, name: "Colgate MaxFresh 150g", sku: "CLG-150", hsn: "3306.10", uom: "pc", rate: 410, cost: 331, tax: 18, stock: 130, hue: "coral" },
  { id: 5, name: "Lays Masala 62g", sku: "LAY-62", hsn: "2005.20", uom: "pc", rate: 120, cost: 96, tax: 18, stock: 900, hue: "butter" },
  { id: 6, name: "Dettol Soap 100g", sku: "DTL-100", hsn: "3401.11", uom: "pc", rate: 175, cost: 138, tax: 18, stock: 400, hue: "plum" },
  { id: 7, name: "Tapal Danedar 950g", sku: "TPL-950", hsn: "0902.30", uom: "pack", rate: 1650, cost: 1394, tax: 0, stock: 72, hue: "teal" },
  { id: 8, name: "Shan Biryani Masala", sku: "SHN-BIR", hsn: "0910.91", uom: "pc", rate: 190, cost: 152, tax: 18, stock: 260, hue: "coral" },
  { id: 9, name: "Olpers Cream 200ml", sku: "OLP-200", hsn: "0401.30", uom: "pc", rate: 230, cost: 191, tax: 0, stock: 150, hue: "sky" },
  { id: 10, name: "Head & Shoulders 360ml", sku: "HNS-360", hsn: "3305.10", uom: "pc", rate: 1290, cost: 1053, tax: 18, stock: 60, hue: "butter" },
  { id: 11, name: "Kurkure Chutney 55g", sku: "KUR-55", hsn: "1905.90", uom: "pc", rate: 60, cost: 47, tax: 18, stock: 1200, hue: "lime" },
  { id: 12, name: "Sufi Cooking Oil 5L", sku: "SUF-5L", hsn: "1512.19", uom: "can", rate: 4850, cost: 4180, tax: 18, stock: 40, hue: "plum" },
  { id: 13, name: "Knorr Noodles 66g", sku: "KNR-66", hsn: "1902.30", uom: "pc", rate: 95, cost: 74, tax: 18, stock: 640, hue: "teal" },
  { id: 14, name: "Safeguard Soap 130g", sku: "SFG-130", hsn: "3401.11", uom: "pc", rate: 210, cost: 168, tax: 18, stock: 320, hue: "sky" },
  { id: 15, name: "Nurpur Butter 200g", sku: "NUR-200", hsn: "0405.10", uom: "pc", rate: 620, cost: 512, tax: 0, stock: 90, hue: "butter" },
  { id: 16, name: "Bake Parlor Ketchup 1kg", sku: "BKP-1K", hsn: "2103.20", uom: "pc", rate: 780, cost: 640, tax: 18, stock: 110, hue: "coral" },
  { id: 17, name: "Peek Freans Sooper", sku: "PKF-SOO", hsn: "1905.31", uom: "pc", rate: 50, cost: 38, tax: 18, stock: 2400, hue: "lime" },
  { id: 18, name: "Ariel Powder 500g", sku: "ARL-500", hsn: "3402.20", uom: "pack", rate: 545, cost: 444, tax: 18, stock: 180, hue: "teal" },
  { id: 19, name: "Pepsi 1.5L", sku: "PEP-15", hsn: "2202.10", uom: "bottle", rate: 260, cost: 212, tax: 18, stock: 700, hue: "sky" },
  { id: 20, name: "Fresher Juice 1L", sku: "FRS-1L", hsn: "2009.89", uom: "pc", rate: 320, cost: 262, tax: 18, stock: 240, hue: "coral" }
];
const OPENING_LINES = [
  { pid: 12, qty: 4, disc: 5 },
  { pid: 7, qty: 12, disc: 0 },
  { pid: 2, qty: 24, disc: 8 },
  { pid: 10, qty: 6, disc: 0 },
  { pid: 5, qty: 120, disc: 12 },
  { pid: 3, qty: 48, disc: 0 },
  { pid: 17, qty: 200, disc: 10 },
  { pid: 19, qty: 60, disc: 6 },
  { pid: 6, qty: 36, disc: 0 },
  { pid: 8, qty: 24, disc: 0 }
];
const CUSTOMERS = [
  { id: 1, name: "Ahsan Traders", side: "sell", ref: "CUS-0041", phone: "0300-2244881", balance: 18400, terms: "Net 30", discount: 5 },
  { id: 2, name: "Bilal General Store", side: "sell", ref: "CUS-0088", phone: "0321-9080711", balance: 0, terms: "Net 15", discount: 3 },
  { id: 3, name: "Nadia Khan", side: "sell", ref: "CUS-0132", phone: "0333-1122009", balance: -1200, terms: "Due on receipt", discount: 0 },
  { id: 4, name: "Zaheer Wholesale", side: "sell", ref: "CUS-0007", phone: "0345-6677001", balance: 96500, terms: "Net 60", discount: 8 },
  { id: 5, name: "Café Rumi", side: "sell", ref: "CUS-0210", phone: "0301-4455332", balance: 3200, terms: "Net 7", discount: 0 }
];
const SUPPLIERS = [
  { id: 101, name: "Sufi Traders", side: "buy", ref: "SUP-0012", phone: "042-35881100", balance: 240900, terms: "Net 30", discount: 0 },
  { id: 102, name: "Unilever Pakistan", side: "buy", ref: "SUP-0003", phone: "021-38101010", balance: 1120400, terms: "Net 45", discount: 0 },
  { id: 103, name: "Tapal Tea (Pvt) Ltd", side: "buy", ref: "SUP-0021", phone: "021-34530000", balance: 88e3, terms: "Net 30", discount: 0 },
  { id: 104, name: "Ravi Distributors", side: "buy", ref: "SUP-0044", phone: "042-37220099", balance: 0, terms: "Due on receipt", discount: 0 }
];
const partiesFor = (side) => side === "buy" ? SUPPLIERS : CUSTOMERS;
const TERMS = [
  { id: "receipt", label: "Due on receipt", days: 0 },
  { id: "net7", label: "Net 7", days: 7 },
  { id: "net15", label: "Net 15", days: 15 },
  { id: "net30", label: "Net 30", days: 30 },
  { id: "net45", label: "Net 45", days: 45 },
  { id: "net60", label: "Net 60", days: 60 }
];
const METHODS = ["Cash", "Bank", "Card", "UPI", "Credit", "Cheque"];
const ACCOUNTS = [
  { id: 1, name: "Cash in hand", kind: "cash" },
  { id: 2, name: "Meezan · Current", kind: "bank", code: "0102-7781" },
  { id: 3, name: "HBL · Business", kind: "bank", code: "0044-9902" },
  { id: 4, name: "JazzCash merchant", kind: "wallet", code: "JC-88102" }
];
const LOCATIONS = [
  { id: 1, name: "Main warehouse", is_default: true },
  { id: 2, name: "Ravi Road store" },
  { id: 3, name: "Gulberg branch" }
];
const PROJECTS = [
  { id: 1, name: "Retail · Karachi" },
  { id: 2, name: "Wholesale · Punjab" },
  { id: 3, name: "Online" }
];
const CURRENCIES = [
  { code: "PKR", name: "Pakistan Rupee", fx: 1 },
  { code: "USD", name: "US Dollar", fx: 278.5 },
  { code: "AED", name: "UAE Dirham", fx: 75.8 }
];
const TAX_RATES = [
  { id: 0, label: "No tax", rate: 0 },
  { id: 1, label: "GST 18%", rate: 18 },
  { id: 2, label: "GST 17% + 1% further", rate: 18, breakdown: "GST 17% + further 1%" },
  { id: 3, label: "GST 5%", rate: 5 },
  { id: 4, label: "Services 15%", rate: 15 }
];
const GOODS_STATUS = ["Not received", "Partially received", "Received in full"];
const DOC_STATUS = ["Draft", "Sent", "Accepted", "Declined", "Expired"];
const FREQUENCIES = ["Weekly", "Fortnightly", "Monthly", "Quarterly", "Yearly"];
const EXPENSE_CATEGORIES = ["Rent", "Utilities", "Salaries", "Freight", "Repairs", "Marketing", "Other"];
const SOURCE_DOCS = [
  { id: "INV-000142", party: "Ahsan Traders", at: "12 Aug 2026", total: 184320 },
  { id: "INV-000139", party: "Zaheer Wholesale", at: "08 Aug 2026", total: 962100 },
  { id: "SO-000061", party: "Bilal General Store", at: "02 Aug 2026", total: 47800 },
  { id: "BILL-000210", party: "Sufi Traders", at: "28 Jul 2026", total: 1204e3 }
];
const RECENT_DOCS = [
  { id: "INV-000147", type: "sales_invoice", party: "Bilal General Store", at: "today 11:04", total: 62400, status: "Posted" },
  { id: "INV-000146", type: "sales_invoice", party: "Café Rumi", at: "today 09:52", total: 15600, status: "Posted" },
  { id: "QT-000033", type: "quotation", party: "Nadia Khan", at: "yesterday", total: 8900, status: "Sent" },
  { id: "BILL-000211", type: "purchase_invoice", party: "Ravi Distributors", at: "yesterday", total: 412300, status: "Posted" },
  { id: "INV-000145", type: "sales_invoice", party: "Ahsan Traders", at: "19 Aug", total: 41230, status: "Draft" }
];
const NAV = [
  { id: "home", label: "Home", glyph: "⌂" },
  { id: "sell", label: "Sell", glyph: "▤" },
  { id: "purchase", label: "Purchase", glyph: "↻" },
  { id: "stock", label: "Stock", glyph: "⛁" },
  { id: "contacts", label: "Contacts", glyph: "☺" },
  { id: "money", label: "Money", glyph: "₨" },
  { id: "insights", label: "Insights", glyph: "◴" },
  { id: "settings", label: "Settings", glyph: "⚙" }
];
const productById = (id, list = PRODUCTS) => list.find((p) => p.id === id);
function searchProducts(term, list = PRODUCTS) {
  const q = String(term || "").trim().toLowerCase();
  if (!q) return { exact: null, matches: [] };
  const exact = list.find((p) => p.sku.toLowerCase() === q) || null;
  const matches = list.filter(
    (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
  );
  return { exact, matches };
}
const TODAY = "20 Aug 2026";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const parseDate = (label2) => {
  if (!label2) return null;
  const m = String(label2).trim().match(/^(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s+(\d{4})$/);
  if (!m) return null;
  const mi = MONTHS.indexOf(m[2][0].toUpperCase() + m[2].slice(1, 3).toLowerCase());
  if (mi < 0) return null;
  const dt = new Date(Number(m[3]), mi, Number(m[1]));
  if (dt.getDate() !== Number(m[1]) || dt.getMonth() !== mi) return null;
  return dt;
};
const fmtDate = (dt) => `${String(dt.getDate()).padStart(2, "0")} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`;
const toISO = (label2) => {
  const dt = parseDate(label2);
  if (!dt) return "";
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
};
const fromISO = (iso) => {
  const m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return "";
  return fmtDate(new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
};
const addDays = (label2, days) => {
  const dt = parseDate(label2);
  if (!dt) return label2 || "";
  dt.setDate(dt.getDate() + days);
  return fmtDate(dt);
};
const TYPES = LAW.document.types;
const typeById = (id) => TYPES.find((t) => t.id === id) || TYPES[0];
const label = (type, key, fallback) => type.labels && type.labels[key] || fallback;
const has = (type, cap) => type.on.includes(cap);
const off = (type, cap) => type.off.includes(cap);
const HEADER_FIELDS = {
  party: (t) => ({ label: label(t, "party", "Party"), kind: "party", required: true }),
  docno: (t) => ({ label: label(t, "docno", "Document #"), kind: "text", required: false }),
  partyref: (t) => ({ label: label(t, "partyref", "Their reference"), kind: "text", required: false }),
  date: () => ({ label: "Document date", kind: "date", required: true }),
  due: () => ({ label: "Due date", kind: "date", required: false }),
  terms: () => ({
    label: "Payment terms",
    kind: "select",
    required: false,
    // FIX · the Net 7/15/30/60 select was never submitted on any screen, and
    // due_date was sent from a `dueDate` key that no input wrote. Terms
    // WRITES the due date — one control, not two — and the date stays
    // editable, because a term is a default and not a cage.
    hint: "writes the due date — one control, not two"
  }),
  method: () => ({ label: "Settlement method", kind: "select", required: false }),
  account: () => ({ label: "Money account", kind: "select", required: false }),
  location: () => ({ label: "Location", kind: "select", required: false }),
  project: () => ({ label: "Project / cost centre", kind: "select", required: false }),
  currency: () => ({ label: "Currency", kind: "select", required: false }),
  fx: () => ({ label: "Exchange rate", kind: "num", required: false })
};
const CAP_FIELDS = {
  location: { label: "Location", kind: "select", required: false, hint: "the server needs it — so it is here at every density" },
  valid_until: { label: "Valid until", kind: "date", required: true, hint: "the defining field of a quote — it had no input at all before" },
  expected_date: { label: "Expected delivery", kind: "date", required: false, hint: "accepted by the server, never rendered before" },
  frequency: { label: "Billing frequency", kind: "select", required: false },
  next_run: { label: "Next run date", kind: "date", required: false },
  active_paused: { label: "Status", kind: "select", required: false },
  goods_status: { label: "Goods status", kind: "select", required: false },
  reason: { label: "Reason", kind: "text", required: true },
  category: { label: "Expense category", kind: "select", required: true },
  attachment: { label: "Attachment", kind: "file", required: false },
  location_pair: { label: "From → To location", kind: "select", required: true },
  source_doc: { label: "Against document", kind: "doc", required: true },
  doc_status: { label: "Status", kind: "select", required: false },
  tax_inclusive_flag: { label: "Prices include tax", kind: "toggle", required: false },
  description: { label: "Description", kind: "text", required: true },
  tax_amount: { label: "Tax amount", kind: "num", required: false },
  business_pct: { label: "Business use %", kind: "num", required: false },
  refund_account: { label: "Refund to", kind: "select", required: true },
  landed_costs: { label: "Landed costs", kind: "num", required: false }
};
function headerKeysFor(type, densityHeader) {
  return densityHeader.filter((k) => {
    if (off(type, k)) return false;
    if (k === "party" && off(type, "party")) return false;
    if (k === "location" && !has(type, "location") && !has(type, "location_pair")) return false;
    if (k === "docno" && off(type, "docno_manual")) return false;
    return true;
  });
}
function capKeysFor(type, headerKeys = []) {
  const out = Object.keys(CAP_FIELDS).filter((k) => k !== "location" && has(type, k));
  if ((has(type, "location") || has(type, "location_pair")) && !headerKeys.includes("location")) {
    out.unshift("location");
  }
  return out;
}
function columnsFor(type, densityCols) {
  return densityCols.filter((c) => {
    if (c === "free" && (off(type, "free_qty") || !has(type, "free_qty"))) return false;
    if (c === "disc" && off(type, "disc")) return false;
    if (off(type, c)) return false;
    if (c === "tax" && !has(type, "per_line_tax")) return false;
    if (c === "rate" && has(type, "qty_only")) return false;
    if (c === "total" && has(type, "qty_only")) return false;
    return true;
  });
}
function secondaryActions(type) {
  const out = [];
  if (has(type, "print")) out.push("Print");
  if (has(type, "convert")) out.push("Convert");
  if (has(type, "receive")) out.push("Receive");
  return out;
}
function overflowActions(type) {
  const out = ["Save as draft", "Duplicate", "Download PDF"];
  if (type.side === "sell") out.push("Email", "WhatsApp");
  if (has(type, "print")) out.push("Print");
  if (has(type, "convert")) out.push("Convert to invoice");
  if (type.side !== "stock") out.push("Record a payment");
  out.push("Delete");
  return out;
}
const num = (v) => {
  if (v === "" || v === null || v === void 0) return void 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : void 0;
};
const termDays = (id) => (TERMS.find((t) => t.id === id) || TERMS[0]).days;
const dueFromTerms = (date, termId) => addDays(date, termDays(termId));
function buildPayload(doc, type, computed) {
  const lines = (has(type, "no_lines") ? [] : doc.lines).map((l, i) => ({
    line_no: i + 1,
    product_id: l.pid,
    description: l.name,
    qty: l.qty,
    free_qty: has(type, "free_qty") ? l.free : void 0,
    sale_uom: l.uom,
    hsn: l.hsn || void 0,
    unit_price: l.rate,
    discount_percent: l.disc,
    tax_percent: has(type, "per_line_tax") ? l.tax : void 0,
    cost_price: l.cost,
    batch: l.batch || void 0,
    note: l.note || void 0,
    line_total: computed.lineNet(l)
  }));
  return {
    type: type.id,
    document_no: doc.docno,
    party_id: off(type, "party") ? void 0 : doc.party?.id,
    party_reference: doc.partyref || void 0,
    // A date leaves here as `YYYY-MM-DD`, because that is what the server
    // stores. `20 Aug 2026` is a way of SHOWING a date, not of sending one.
    document_date: toISO(doc.date),
    due_date: toISO(doc.due) || void 0,
    payment_terms: doc.terms || void 0,
    settlement_method: doc.method || void 0,
    account_id: doc.account || void 0,
    warehouse_id: doc.location || void 0,
    to_warehouse_id: has(type, "location_pair") ? doc.locationTo : void 0,
    project_id: doc.project || void 0,
    currency: doc.currency,
    exchange_rate: num(doc.fx),
    // FIX · notes was in six payloads with no input anywhere. It is resident
    // on every type now, and it travels on the one path.
    notes: doc.notes,
    valid_until: has(type, "valid_until") ? toISO(doc.validUntil) : void 0,
    expected_date: has(type, "expected_date") ? toISO(doc.expectedDate) : void 0,
    goods_status: has(type, "goods_status") ? doc.goodsStatus : void 0,
    status: has(type, "doc_status") ? doc.status : void 0,
    category: has(type, "category") ? doc.category : void 0,
    reason: has(type, "reason") ? doc.reason : void 0,
    description: has(type, "description") ? doc.description : void 0,
    attachment: has(type, "attachment") ? doc.attachment : void 0,
    source_document: has(type, "source_doc") ? doc.sourceDoc : void 0,
    tax_inclusive: has(type, "tax_inclusive_flag") ? doc.taxInclusive : void 0,
    business_use_percent: has(type, "business_pct") ? num(doc.businessPct) : void 0,
    landed_costs: has(type, "landed_costs") ? num(doc.landedCosts) : void 0,
    refund_account_id: has(type, "refund_account") ? doc.refundAccount : void 0,
    // A recurring invoice is defined by these three. All three rendered and
    // none of them posted.
    frequency: has(type, "frequency") ? doc.frequency : void 0,
    next_run_date: has(type, "next_run") ? toISO(doc.nextRun) : void 0,
    schedule_state: has(type, "active_paused") ? doc.activePaused : void 0,
    // FIX · only sales invoice and recurring invoice applied roundTotal(), so
    // the same cart totalled differently per type. Round-off is a document
    // property, applied once, by this builder.
    round_off: computed.round,
    tax_rate: doc.taxRate,
    // An expense has no lines, so its tax is the figure that was typed —
    // deriving it from `computed` posted zero, every time.
    tax_amount_entered: has(type, "tax_amount") ? num(doc.taxAmount) : void 0,
    header_discount: num(doc.discount) ?? 0,
    shipping: num(doc.shipping) ?? 0,
    other_charges: num(doc.extra) ?? 0,
    subtotal: computed.sub,
    tax_amount: computed.tax,
    total: computed.total,
    amount_settled: has(type, "overpayment") || type.side !== "stock" ? doc.settled : void 0,
    items: has(type, "no_lines") ? void 0 : lines,
    idempotency_key: doc.idem
  };
}
const PROFILES = [
  {
    id: "balanced",
    name: "Balanced",
    note: "Details open, summary on the right. The default.",
    family: { desk: "panel", short: "wide", tablet: "stack", phone: "touch" }
  },
  {
    id: "items",
    name: "Items first",
    note: "Collapse the customer block and give the width to the lines.",
    family: { desk: "wide", short: "focus", tablet: "focus", phone: "touch" }
  },
  {
    id: "ledger",
    name: "Accounting",
    note: "Ten line columns, twelve header fields, the full summary.",
    family: { desk: "pro", short: "wide", tablet: "stack", phone: "touch" }
  },
  {
    id: "touch",
    name: "Touch",
    note: "Warehouse tablet or phone: cards, one action, nothing else.",
    family: { desk: "touch", short: "touch", tablet: "touch", phone: "touch" }
  }
];
const DEFAULT_OPS = {
  uiScale: 1,
  senior: false,
  defaultTax: 1,
  // TAX_RATES id — read by EVERY type, not just the invoice
  taxInclusive: false,
  roundOff: true,
  // a document property, applied once
  defaultTerms: "net30",
  defaultLocation: 1,
  defaultAccount: 1,
  defaultCurrency: "PKR",
  autoNumber: true,
  requireLocation: true,
  // the server needs it; so the field is resident
  confirmZeroCost: true,
  showMargin: false,
  printOnSave: false
};
const DEFAULT_PERMS = {
  "documents.create": true,
  "documents.discount": true,
  "documents.price_override": true,
  "documents.delete_line": true,
  "documents.post": true
};
const DEFAULTS = {
  auto: true,
  profile: "balanced",
  preset: "panel",
  type: "sales_invoice",
  comp: presetDocument("panel"),
  ops: { ...DEFAULT_OPS },
  perms: { ...DEFAULT_PERMS },
  rail: true
};
function screenBand(vw, vh) {
  if (vw <= LAW.pos.phoneMax) return "phone";
  if (vw < LAW.measuredFloors.doc_table_full + LAW.measuredFloors.doc_summary_min) return "tablet";
  return vh < 800 ? "short" : "desk";
}
function autoPreset(profileId, vw, vh) {
  const p = PROFILES.find((x) => x.id === profileId) || PROFILES[0];
  return p.family[screenBand(vw, vh)];
}
function autoComposition(profileId, typeId, vw, vh) {
  const id = autoPreset(profileId, vw, vh);
  const comp = presetDocument(id);
  const type = typeById(typeId);
  const order = LAW.document.density.map((d) => d.id);
  comp.density = id === "touch" ? "simple" : profileId === "ledger" ? order[Math.max(order.indexOf(comp.density), order.indexOf(type.density))] : type.density;
  return { preset: id, comp };
}
const KEY = "venqore.newinvoice.prefs.v1";
const scoped = (userId, dev) => `${KEY}.${userId ?? "anon"}.${dev ?? "this"}`;
function deviceId() {
  try {
    let d = localStorage.getItem("venqore.device.id");
    if (!d) {
      d = `dev-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem("venqore.device.id", d);
    }
    return d;
  } catch {
    return "this";
  }
}
function loadPrefs(userId) {
  const base = {
    ...DEFAULTS,
    comp: presetDocument("panel"),
    ops: { ...DEFAULT_OPS },
    perms: { ...DEFAULT_PERMS }
  };
  try {
    const raw = localStorage.getItem(scoped(userId, deviceId()));
    if (!raw) return base;
    const saved = JSON.parse(raw);
    return {
      ...base,
      ...saved,
      comp: saved.comp ? { ...base.comp, ...saved.comp } : base.comp,
      ops: { ...base.ops, ...saved.ops || {} },
      perms: { ...base.perms, ...saved.perms || {} }
    };
  } catch {
    return base;
  }
}
function savePrefs(userId, prefs) {
  try {
    localStorage.setItem(scoped(userId, deviceId()), JSON.stringify(prefs));
  } catch {
  }
}
const DRAFT_KEY = "venqore.newinvoice.draft.v1";
const draftKey = (userId) => `${DRAFT_KEY}.${userId ?? "anon"}.${deviceId()}`;
function saveDraft(userId, doc) {
  try {
    localStorage.setItem(draftKey(userId), JSON.stringify({ at: Date.now(), doc }));
  } catch {
  }
}
function loadDraft(userId) {
  try {
    const raw = localStorage.getItem(draftKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || Date.now() - parsed.at > 24 * 3600 * 1e3) return null;
    return parsed.doc;
  } catch {
    return null;
  }
}
function clearDraft(userId) {
  try {
    localStorage.removeItem(draftKey(userId));
  } catch {
  }
}
const n2 = (v) => (Number.isFinite(v) ? v : 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const n0 = (v) => Math.round(Number.isFinite(v) ? v : 0).toLocaleString("en-US");
const r2 = (v) => Math.round(v * 100) / 100;
const keep = (raw) => String(raw).replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");
const nz = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const pct = (v) => Math.min(100, Math.max(0, nz(v)));
const COLW = {
  idx: `${DOC_COLW.idx + 6}px`,
  item: "minmax(140px,1fr)",
  qty: `${DOC_COLW.qty}px`,
  free: `${DOC_COLW.free}px`,
  uom: `${DOC_COLW.uom}px`,
  rate: `${DOC_COLW.rate}px`,
  disc: `${DOC_COLW.disc}px`,
  tax: `${DOC_COLW.tax}px`,
  total: `${DOC_COLW.total}px`,
  del: `${DOC_COLW.del + 4}px`
};
const COLLBL = {
  idx: "#",
  item: "Item",
  qty: "Qty",
  free: "Free",
  uom: "Unit",
  rate: "Rate",
  disc: "Disc",
  tax: "Tax %",
  total: "Amount",
  del: ""
};
const NUMC = ["idx", "qty", "free", "rate", "disc", "tax", "total"];
const SELECT_OPTIONS = {
  terms: () => TERMS.map((t) => [t.id, t.label]),
  method: () => METHODS.map((m) => [m, m]),
  account: () => ACCOUNTS.map((a) => [a.id, a.name]),
  location: () => LOCATIONS.map((l) => [l.id, l.name]),
  locationTo: () => LOCATIONS.map((l) => [l.id, l.name]),
  project: () => PROJECTS.map((p) => [p.id, p.name]),
  currency: () => CURRENCIES.map((c) => [c.code, `${c.code} — ${c.name}`]),
  goodsStatus: () => GOODS_STATUS.map((g) => [g, g]),
  status: () => DOC_STATUS.map((s) => [s, s]),
  category: () => EXPENSE_CATEGORIES.map((c) => [c, c]),
  frequency: () => FREQUENCIES.map((f) => [f, f]),
  activePaused: () => [["active", "Active"], ["paused", "Paused"]]
};
function Field({
  id,
  label: lbl,
  kind,
  required,
  value,
  hint,
  error,
  options,
  onChange,
  onOpen,
  rank = 2
}) {
  const common = {
    id,
    "aria-invalid": error ? "true" : void 0,
    "aria-label": lbl
  };
  const shownValue = kind === "toggle" ? value ? "Yes" : "No" : value || "not set";
  const named = { ...common, "aria-label": `${lbl}: ${shownValue}` };
  let control;
  if (kind === "party" || kind === "doc") {
    control = /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        className: "nqd-ctl",
        "data-party": value ? "true" : void 0,
        "data-rank": rank,
        onClick: onOpen,
        ...named,
        children: [
          value ? /* @__PURE__ */ jsx("span", { className: "nqd-avatar", children: String(value)[0] }) : null,
          /* @__PURE__ */ jsx("span", { className: value ? void 0 : "ph", children: value || `Choose a ${lbl.toLowerCase()}` }),
          /* @__PURE__ */ jsx("span", { className: "chev", "aria-hidden": true, children: "⌄" })
        ]
      }
    );
  } else if (kind === "select") {
    const unchosen = required && (value === void 0 || value === null || value === "");
    const back = (raw) => {
      const hit = (options || []).find(([v]) => String(v) === raw);
      onChange(hit ? hit[0] : raw);
    };
    control = /* @__PURE__ */ jsxs("select", { className: "nqd-ctl", "data-rank": rank, value: unchosen ? "" : value ?? "", onChange: (e) => back(e.target.value), ...common, children: [
      unchosen ? /* @__PURE__ */ jsx("option", { value: "", children: "Choose one…" }) : null,
      (options || []).map(([v, t]) => /* @__PURE__ */ jsx("option", { value: v, children: t }, v))
    ] });
  } else if (kind === "date") {
    control = /* @__PURE__ */ jsx(
      "input",
      {
        type: "date",
        className: "nqd-ctl num",
        "data-rank": rank,
        value: toISO(value),
        onChange: (e) => onChange(fromISO(e.target.value)),
        ...common
      }
    );
  } else if (kind === "toggle") {
    control = /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        className: "nqd-ctl",
        "data-rank": rank,
        "aria-pressed": !!value,
        onClick: () => onChange(!value),
        ...named,
        children: [
          /* @__PURE__ */ jsx("span", { children: value ? "Yes" : "No" }),
          /* @__PURE__ */ jsx("span", { className: "chev", "aria-hidden": true, children: "⇄" })
        ]
      }
    );
  } else if (kind === "file") {
    control = /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "file",
          id,
          className: "nqd-file",
          "aria-label": lbl,
          "aria-invalid": error ? "true" : void 0,
          onChange: (e) => {
            const f = e.target.files && e.target.files[0];
            onChange(f ? f.name : "");
            e.target.value = "";
          }
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "nqd-ctl", "data-rank": rank, "data-file": "true", children: [
        /* @__PURE__ */ jsx("label", { htmlFor: id, className: "nqd-filebtn nqd-tight", children: value ? "Replace" : "Choose a file" }),
        /* @__PURE__ */ jsx("span", { className: value ? "fname" : "ph", children: value || "Nothing attached" }),
        value ? /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            className: "nqd-tight nqd-filex",
            "aria-label": `Remove ${value}`,
            title: "Remove",
            onClick: () => onChange(""),
            children: "✕"
          }
        ) : null
      ] })
    ] });
  } else if (kind === "textarea") {
    control = /* @__PURE__ */ jsx("textarea", { "data-rank": rank, value: value ?? "", onChange: (e) => onChange(e.target.value), ...common });
  } else {
    control = /* @__PURE__ */ jsx(
      "input",
      {
        className: `nqd-ctl${kind === "num" ? " num" : ""}`,
        "data-rank": rank,
        inputMode: kind === "num" ? "decimal" : void 0,
        value: value ?? "",
        onChange: (e) => onChange(kind === "num" ? keep(e.target.value) : e.target.value),
        ...common
      }
    );
  }
  return /* @__PURE__ */ jsxs("div", { className: "nqd-f", children: [
    ["file", "party", "doc", "toggle"].includes(kind) ? /* @__PURE__ */ jsxs("span", { className: "nqd-flbl", children: [
      lbl,
      required ? /* @__PURE__ */ jsx("span", { className: "nqd-req", "aria-hidden": true, children: "*" }) : null
    ] }) : /* @__PURE__ */ jsxs("label", { htmlFor: id, children: [
      lbl,
      required ? /* @__PURE__ */ jsx("span", { className: "nqd-req", "aria-hidden": true, children: "*" }) : null
    ] }),
    control,
    error ? /* @__PURE__ */ jsx("span", { className: "err", children: error }) : hint ? /* @__PURE__ */ jsx("span", { className: "hint", children: hint }) : null
  ] });
}
function DetailsZone({ D, type, doc, set, errors, onOpenParty, onOpenSource, total, onToggle, forced, inSheet }) {
  if (D.details.mode === "collapsed") {
    const f = formatToFit(total, Math.max(90, D.avail * 0.28), 15, "PKR");
    return /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        className: "nqd-strip",
        "data-rank": "2",
        onClick: onToggle,
        title: forced ? "This screen is too short to hold the block open, so it opens as a sheet. Every field is in it." : "Open the customer and details block",
        "aria-label": `Customer and details: ${off(type, "party") ? type.name : doc.party?.name || "no party yet"}, ${doc.docno}, ${doc.date}. Open.`,
        children: [
          /* @__PURE__ */ jsx("span", { className: "chev", "aria-hidden": true, children: forced ? "⤢" : "▸" }),
          /* @__PURE__ */ jsxs("span", { style: { minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }, children: [
            /* @__PURE__ */ jsx("span", { className: "who", children: off(type, "party") ? type.name : doc.party?.name || `No ${label(type, "party", "party").toLowerCase()} yet` }),
            /* @__PURE__ */ jsxs("span", { className: "meta", children: [
              doc.docno,
              " · ",
              doc.date,
              doc.terms ? ` · ${(TERMS.find((t) => t.id === doc.terms) || {}).label}` : ""
            ] })
          ] }),
          /* @__PURE__ */ jsx("span", { className: "amt num", title: f.exact, children: f.text })
        ]
      }
    );
  }
  const keys = headerKeysFor(type, D.headerFields);
  const capKeys = capKeysFor(type, keys);
  const cols = D.details.twoCol ? D.avail > 1100 ? 4 : 2 : 1;
  const VAL = {
    party: doc.party?.name,
    docno: doc.docno,
    partyref: doc.partyref,
    date: doc.date,
    due: doc.due,
    terms: doc.terms,
    method: doc.method,
    account: doc.account,
    location: doc.location,
    project: doc.project,
    currency: doc.currency,
    fx: doc.fx
  };
  return /* @__PURE__ */ jsxs("section", { className: "nqd-zone", "data-rank": "2", style: inSheet ? { border: 0, background: "transparent" } : void 0, children: [
    inSheet ? null : /* @__PURE__ */ jsxs("header", { className: "nqd-zh", children: [
      /* @__PURE__ */ jsx("span", { children: "Details" }),
      /* @__PURE__ */ jsx("button", { type: "button", className: "nqd-togg", onClick: onToggle, title: "Collapse to one line and give the height to the items", children: "Collapse ▴" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "nqd-hdr", style: { gridTemplateColumns: `repeat(${cols},minmax(0,1fr))` }, children: [
      keys.map((k) => {
        const def = HEADER_FIELDS[k](type);
        return /* @__PURE__ */ jsx(
          Field,
          {
            id: `nqd-h-${k}`,
            label: def.label,
            kind: def.kind,
            required: def.required,
            hint: def.hint,
            error: errors[k],
            value: VAL[k],
            options: SELECT_OPTIONS[k] ? SELECT_OPTIONS[k]() : void 0,
            onOpen: k === "party" ? onOpenParty : void 0,
            onChange: (v) => set(k === "due" ? { due: v, dueTouched: true } : k === "terms" ? { terms: v, dueTouched: false } : { [k]: v }),
            rank: k === "party" ? 1 : 2
          },
          k
        );
      }),
      capKeys.map((k) => {
        const def = CAP_FIELDS[k];
        const stateKey = {
          valid_until: "validUntil",
          expected_date: "expectedDate",
          next_run: "nextRun",
          active_paused: "activePaused",
          goods_status: "goodsStatus",
          doc_status: "status",
          source_doc: "sourceDoc",
          tax_inclusive_flag: "taxInclusive",
          tax_amount: "taxAmount",
          business_pct: "businessPct",
          location_pair: "locationTo",
          refund_account: "refundAccount",
          landed_costs: "landedCosts"
        }[k] || k;
        const capDef = k === "location" && has(type, "location_pair") ? { ...def, label: "From location", required: true } : def;
        const optKey = { location_pair: "locationTo", doc_status: "status", goods_status: "goodsStatus", active_paused: "activePaused", refund_account: "account" }[k] || k;
        return /* @__PURE__ */ jsx(
          Field,
          {
            id: `nqd-c-${k}`,
            label: k === "location_pair" ? "To location" : capDef.label,
            kind: capDef.kind,
            required: capDef.required,
            hint: capDef.hint,
            error: errors[stateKey],
            value: doc[stateKey],
            options: SELECT_OPTIONS[optKey] ? SELECT_OPTIONS[optKey]() : void 0,
            onOpen: k === "source_doc" ? onOpenSource : void 0,
            onChange: (v) => set({ [stateKey]: v })
          },
          k
        );
      }),
      /* @__PURE__ */ jsxs("div", { className: "nqd-f", style: { gridColumn: cols > 1 ? `span ${Math.min(2, cols)}` : "auto" }, children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "nqd-h-notes", children: "Notes" }),
        /* @__PURE__ */ jsx(
          "textarea",
          {
            id: "nqd-h-notes",
            "data-rank": "2",
            value: doc.notes,
            placeholder: "Anything that should appear on the document…",
            onChange: (e) => set({ notes: e.target.value })
          }
        ),
        /* @__PURE__ */ jsx("span", { className: "hint", children: "resident on every type — it was in six payloads with no input anywhere" })
      ] })
    ] })
  ] });
}
function EditableCell({ value, numeric, suffix, disabled, onCommit, ariaLabel }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const ref = useRef(null);
  useEffect(() => {
    if (editing && ref.current) ref.current.select();
  }, [editing]);
  if (editing) {
    return /* @__PURE__ */ jsx(
      "input",
      {
        ref,
        className: "nqd-cellinput",
        inputMode: numeric ? "decimal" : void 0,
        value: draft,
        "aria-label": ariaLabel,
        onChange: (e) => setDraft(e.target.value),
        onBlur: () => {
          setEditing(false);
          onCommit(draft);
        },
        onKeyDown: (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            setEditing(false);
            onCommit(draft);
          }
          if (e.key === "Escape") {
            e.preventDefault();
            setEditing(false);
          }
        }
      }
    );
  }
  const shown = `${numeric ? n2(nz(value)) : value}${suffix || ""}`;
  return /* @__PURE__ */ jsx(
    "button",
    {
      type: "button",
      className: `nqd-cell${numeric ? " n" : ""}`,
      disabled,
      "aria-label": `${ariaLabel}: ${shown}${disabled ? "" : ". Press to edit."}`,
      onClick: () => {
        setDraft(String(value));
        setEditing(true);
      },
      children: shown
    }
  );
}
function LinesZone({
  D,
  type,
  doc,
  columns,
  perms,
  computed,
  selected,
  onSelect,
  onPatchLine,
  onRemoveLine,
  onAddLine,
  onOpenPicker,
  onOpenLine,
  openCard,
  setOpenCard,
  showMargin
}) {
  const rateLabel = label(type, "rate", "Rate");
  const canPrice = perms["documents.price_override"] && !off(type, "rate_edit");
  const canDisc = perms["documents.discount"] && !off(type, "disc");
  const canDel = perms["documents.delete_line"];
  const marginable = showMargin && type.side === "sell" && perms["documents.price_override"] && doc.lines.length > 0;
  const head = /* @__PURE__ */ jsxs("header", { className: "nqd-zh", children: [
    /* @__PURE__ */ jsx("span", { children: "Items" }),
    marginable ? /* @__PURE__ */ jsxs(
      "span",
      {
        className: "nqd-margin",
        "data-rank": "2",
        "data-tone": computed.margin < 0 ? "bad" : void 0,
        title: `Sold ${n2(computed.sub - computed.docDisc)} against a cost of ${n2(computed.cost)}, net of both discounts and before tax. Free quantity is counted as cost.`,
        children: [
          "Margin ",
          computed.marginPct,
          "% · ",
          n2(computed.margin)
        ]
      }
    ) : null,
    /* @__PURE__ */ jsx("span", { style: { flex: 1 } }),
    /* @__PURE__ */ jsxs("span", { className: "mono", children: [
      doc.lines.length,
      " lines · ",
      D.lines.fit
    ] })
  ] });
  const addRow = /* @__PURE__ */ jsxs("button", { type: "button", className: "nqd-addline", "data-rank": "1", onClick: onAddLine, children: [
    /* @__PURE__ */ jsx("span", { "aria-hidden": true, children: "+" }),
    /* @__PURE__ */ jsx("span", { children: "Add a line" }),
    /* @__PURE__ */ jsx("span", { className: "nqd-kbd", style: { marginLeft: "auto" }, children: "Alt+Q" })
  ] });
  if (!doc.lines.length) {
    return /* @__PURE__ */ jsxs("section", { className: "nqd-zone", "data-rank": "1", children: [
      head,
      /* @__PURE__ */ jsx("div", { className: "nqd-empty", children: "Nothing on this document yet. Add a line, or scan." }),
      addRow
    ] });
  }
  if (D.lines.fit === "cards") {
    return /* @__PURE__ */ jsxs("section", { className: "nqd-zone", "data-rank": "1", children: [
      head,
      doc.lines.map((l, i) => /* @__PURE__ */ jsxs(React.Fragment, { children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            className: "nqd-card",
            "data-open": openCard === l.u ? "true" : void 0,
            onClick: () => setOpenCard(openCard === l.u ? null : l.u),
            children: [
              /* @__PURE__ */ jsxs("span", { className: "top", children: [
                /* @__PURE__ */ jsx("span", { className: "nm", children: l.name }),
                /* @__PURE__ */ jsx(Money, { value: computed.lineNet(l), font: 14, avail: 110 })
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "grid", children: [
                /* @__PURE__ */ jsxs("span", { className: "nqd-mini", children: [
                  /* @__PURE__ */ jsx("span", { className: "k", children: "Qty" }),
                  /* @__PURE__ */ jsx("span", { className: "v", children: l.qty })
                ] }),
                columns.includes("rate") ? /* @__PURE__ */ jsxs("span", { className: "nqd-mini", children: [
                  /* @__PURE__ */ jsx("span", { className: "k", children: rateLabel }),
                  /* @__PURE__ */ jsx("span", { className: "v", children: n2(nz(l.rate)) })
                ] }) : null,
                columns.includes("disc") ? /* @__PURE__ */ jsxs("span", { className: "nqd-mini", children: [
                  /* @__PURE__ */ jsx("span", { className: "k", children: "Disc" }),
                  /* @__PURE__ */ jsxs("span", { className: "v", children: [
                    l.disc,
                    "%"
                  ] })
                ] }) : null,
                columns.includes("uom") ? /* @__PURE__ */ jsxs("span", { className: "nqd-mini", children: [
                  /* @__PURE__ */ jsx("span", { className: "k", children: "Unit" }),
                  /* @__PURE__ */ jsx("span", { className: "v", children: l.uom })
                ] }) : null
              ] })
            ]
          }
        ),
        openCard === l.u ? (
          /* Tap-to-adjust: a line is a summary until you touch
             it, then it opens its own controls IN PLACE. No
             modal, no separate edit screen. */
          /* @__PURE__ */ jsxs("div", { className: "nqd-adjust", children: [
            /* @__PURE__ */ jsxs("div", { className: "nqd-adjf", children: [
              /* @__PURE__ */ jsx("span", { className: "k", children: "Quantity" }),
              /* @__PURE__ */ jsxs("div", { className: "nqd-step", children: [
                /* @__PURE__ */ jsx("button", { type: "button", "aria-label": "One fewer", onClick: (e) => {
                  e.stopPropagation();
                  onPatchLine(l.u, { qty: Math.max(0, nz(l.qty) - 1) });
                }, children: "−" }),
                /* @__PURE__ */ jsx("span", { className: "n", children: l.qty }),
                /* @__PURE__ */ jsx("button", { type: "button", "aria-label": "One more", onClick: (e) => {
                  e.stopPropagation();
                  onPatchLine(l.u, { qty: nz(l.qty) + 1 });
                }, children: "+" })
              ] })
            ] }),
            has(type, "qty_only") ? null : /* @__PURE__ */ jsxs("div", { className: "nqd-adjf", children: [
              /* @__PURE__ */ jsx("span", { className: "k", children: rateLabel }),
              /* @__PURE__ */ jsx("input", { className: "num", inputMode: "decimal", disabled: !canPrice, value: l.rate, "aria-label": `${rateLabel} for ${l.name}`, onChange: (e) => onPatchLine(l.u, { rate: keep(e.target.value) }) })
            ] }),
            off(type, "disc") || has(type, "qty_only") ? null : /* @__PURE__ */ jsxs("div", { className: "nqd-adjf", children: [
              /* @__PURE__ */ jsx("span", { className: "k", children: "Discount %" }),
              /* @__PURE__ */ jsx("input", { className: "num", inputMode: "decimal", disabled: !canDisc, value: l.disc, "aria-label": `Discount percent for ${l.name}`, onChange: (e) => onPatchLine(l.u, { disc: keep(e.target.value) }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "nqd-adjf", children: [
              /* @__PURE__ */ jsx("span", { className: "k", children: "Unit" }),
              /* @__PURE__ */ jsx("select", { value: l.uom, "aria-label": `Unit for ${l.name}`, onChange: (e) => onPatchLine(l.u, { uom: e.target.value }), children: ["pc", "strip", "pack", "box", "can", "bottle", "kg", "dozen"].map((u) => /* @__PURE__ */ jsx("option", { value: u, children: u }, u)) })
            ] }),
            has(type, "per_line_tax") ? /* @__PURE__ */ jsxs("div", { className: "nqd-adjf", children: [
              /* @__PURE__ */ jsx("span", { className: "k", children: "Tax %" }),
              /* @__PURE__ */ jsx("input", { className: "num", inputMode: "decimal", value: l.tax, "aria-label": `Tax percent for ${l.name}`, onChange: (e) => onPatchLine(l.u, { tax: keep(e.target.value) }) })
            ] }) : null,
            has(type, "free_qty") ? /* @__PURE__ */ jsxs("div", { className: "nqd-adjf", children: [
              /* @__PURE__ */ jsx("span", { className: "k", children: "Free" }),
              /* @__PURE__ */ jsx("input", { className: "num", inputMode: "decimal", value: l.free, "aria-label": `Free quantity for ${l.name}`, onChange: (e) => onPatchLine(l.u, { free: keep(e.target.value) }) })
            ] }) : null,
            has(type, "batch_entry") || has(type, "batch_pick") ? /* @__PURE__ */ jsxs("div", { className: "nqd-adjf", children: [
              /* @__PURE__ */ jsx("span", { className: "k", children: has(type, "expiry_entry") ? "Batch / expiry" : "Batch" }),
              /* @__PURE__ */ jsx("input", { value: l.batch || "", "aria-label": `Batch for ${l.name}`, onChange: (e) => onPatchLine(l.u, { batch: e.target.value }) })
            ] }) : null,
            /* @__PURE__ */ jsxs("div", { className: "nqd-adjf", children: [
              /* @__PURE__ */ jsx("span", { className: "k", children: "Note" }),
              /* @__PURE__ */ jsx("input", { value: l.note || "", "aria-label": `Note on ${l.name}`, onChange: (e) => onPatchLine(l.u, { note: e.target.value }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "nqd-adjf", children: [
              /* @__PURE__ */ jsx("span", { className: "k", children: " " }),
              /* @__PURE__ */ jsx("button", { type: "button", className: "nqd-rm", disabled: !canDel, onClick: (e) => {
                e.stopPropagation();
                onRemoveLine(l);
              }, children: "Remove line" })
            ] })
          ] })
        ) : null
      ] }, l.u)),
      addRow
    ] });
  }
  return /* @__PURE__ */ jsxs("section", { className: "nqd-zone", "data-rank": "1", children: [
    head,
    /* @__PURE__ */ jsx("div", { className: "nqd-tblwrap", children: /* @__PURE__ */ jsxs("table", { className: "nqd-tbl", children: [
      /* @__PURE__ */ jsx("colgroup", { children: columns.map((c) => /* @__PURE__ */ jsx("col", { style: { width: COLW[c] } }, c)) }),
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", { children: columns.map((c) => /* @__PURE__ */ jsx("th", { className: NUMC.includes(c) ? "n" : void 0, scope: "col", children: c === "rate" ? rateLabel : COLLBL[c] }, c)) }) }),
      /* @__PURE__ */ jsx("tbody", { children: doc.lines.map((l, i) => /* @__PURE__ */ jsx("tr", { "data-sel": selected === l.u ? "true" : void 0, onFocus: () => onSelect(l.u), children: columns.map((c) => {
        if (c === "idx") return /* @__PURE__ */ jsx("td", { className: "n", children: /* @__PURE__ */ jsx("span", { className: "nqd-cell n", children: i + 1 }) }, c);
        if (c === "item") {
          return /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              className: "nqd-cell name",
              "data-rank": "2",
              title: `${l.name} · ${l.sku} — open this line`,
              "aria-label": `Line ${i + 1}: ${l.name}. Open its fields.`,
              onClick: () => onOpenLine(l.u),
              children: l.name
            }
          ) }, c);
        }
        if (c === "total") {
          return /* @__PURE__ */ jsx("td", { className: "n", children: /* @__PURE__ */ jsx("span", { className: "nqd-cell n", children: /* @__PURE__ */ jsx(Money, { value: computed.lineNet(l), font: 13, avail: DOC_COLW.total - 20 }) }) }, c);
        }
        if (c === "del") {
          return /* @__PURE__ */ jsx("td", { className: "n", children: /* @__PURE__ */ jsx("button", { type: "button", className: "nqd-cell n", disabled: !canDel, "aria-label": `Remove ${l.name}`, style: { color: "var(--vq-text-3)" }, onClick: () => onRemoveLine(l), children: "✕" }) }, c);
        }
        if (c === "uom") {
          return /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("select", { className: "nqd-cell", "aria-label": `Unit for ${l.name}`, value: l.uom, onChange: (e) => onPatchLine(l.u, { uom: e.target.value }), children: ["pc", "strip", "pack", "box", "can", "bottle", "kg", "dozen"].map((u) => /* @__PURE__ */ jsx("option", { value: u, children: u }, u)) }) }, c);
        }
        const map = {
          qty: { v: l.qty, dis: false, suf: "" },
          free: { v: l.free, dis: false, suf: "" },
          rate: { v: l.rate, dis: !canPrice, suf: "" },
          disc: { v: l.disc, dis: !canDisc, suf: "%" },
          tax: { v: l.tax, dis: false, suf: "%" }
        }[c];
        return /* @__PURE__ */ jsx("td", { className: "n", children: /* @__PURE__ */ jsx(
          EditableCell,
          {
            value: map.v,
            numeric: true,
            suffix: map.suf,
            disabled: map.dis,
            ariaLabel: `${COLLBL[c]} for ${l.name}`,
            onCommit: (raw) => {
              let v = Number(String(raw).replace(/[^\d.]/g, "")) || 0;
              if (c === "disc") v = Math.min(100, Math.max(0, v));
              if (c === "qty") v = Math.max(0, v);
              onPatchLine(l.u, { [c]: v });
            }
          }
        ) }, c);
      }) }, l.u)) })
    ] }) }),
    addRow
  ] });
}
function SummaryZone({ D, type, doc, computed, width, onBreakdown, onPrimary, onAction, saving }) {
  const wpx = D.summary.mode === "right" ? D.summary.px : width;
  const taxRate = TAX_RATES.find((t) => t.id === doc.taxRate) || TAX_RATES[1];
  const carried = [];
  const charges = D.summaryRows.includes("shipping") || D.summaryRows.includes("extra") ? 0 : computed.charges;
  const round = D.summaryRows.includes("roundoff") ? 0 : computed.round;
  if (charges) carried.push("charges");
  if (round) carried.push("rounding");
  const taxLabel = () => {
    if (has(type, "no_lines")) return "Tax (as entered)";
    if (computed.perLineTax) return "Tax (per line)";
    if (computed.inclusive) return `Tax ${taxRate.rate}% (included in the prices)`;
    return `Tax ${taxRate.rate}%`;
  };
  const taxLabelLong = () => {
    if (has(type, "no_lines") || computed.perLineTax) return taxLabel();
    return `Tax · ${taxRate.breakdown || `${taxRate.rate}%`}${computed.inclusive ? " (included)" : ""}`;
  };
  const ROWS = {
    subtotal: () => [
      carried.length ? `Subtotal incl. ${carried.join(" & ")}` : "Subtotal",
      r2(computed.gross + charges + round)
    ],
    item_disc: () => ["Item discounts", -computed.lineDisc],
    doc_disc: () => ["Document discount", -computed.docDisc],
    tax: () => [taxLabel(), computed.tax],
    tax_breakdown: () => [taxLabelLong(), computed.tax],
    shipping: () => ["Delivery", nz(doc.shipping)],
    extra: () => ["Other charges", nz(doc.extra)],
    roundoff: () => ["Round off", computed.round],
    total: () => [label(type, "total", "Total"), computed.total, "tot"],
    settled: () => [label(type, "settled", "Amount settled"), nz(doc.settled)],
    balance: () => ["Balance", r2(computed.total - nz(doc.settled)), "bal"]
  };
  const moneyOff = off(type, "summary_money");
  const STOCK = [
    () => ["Lines", doc.lines.length, "count"],
    () => ["Units", computed.units, "count"],
    () => [has(type, "expected_counted_difference") ? "Counted" : "Moving", computed.units, "tot"]
  ];
  const keys = moneyOff ? STOCK.map((_, i) => `stock${i}`) : D.summaryRows;
  const rowAt = (k, i) => moneyOff ? STOCK[i]() : (ROWS[k] || (() => [k, 0]))();
  const secondary = secondaryActions(type);
  const primaryLabel = label(type, "save", "Save");
  const bw = (s) => Math.round(s.length * 7.6) + 34;
  let room = wpx - 28 - Math.max(120, bw(primaryLabel)) - 8 - 44;
  const shown = [];
  for (const s of secondary) {
    if (room - bw(s) - 8 < 0) break;
    room -= bw(s) + 8;
    shown.push(s);
  }
  return /* @__PURE__ */ jsxs("section", { className: "nqd-zone", "data-rank": "1", children: [
    /* @__PURE__ */ jsxs("header", { className: "nqd-zh", children: [
      /* @__PURE__ */ jsx("span", { children: "Summary" }),
      D.summary.pin === "sticky" ? /* @__PURE__ */ jsx("span", { className: "mono", style: { marginLeft: "auto" }, title: "The whole column fits on this screen, so it holds still while the items scroll.", children: "pinned" }) : null
    ] }),
    keys.map((k, i) => {
      const [lbl, val, kind] = rowAt(k, i);
      const tot = kind === "tot";
      const count = kind === "count" || moneyOff && tot;
      const why = k === "subtotal" && carried.length ? `This density has no ${carried.join(" or ")} row, so the subtotal carries ${[charges ? `${n2(charges)} of charges` : null, round ? `${n2(round)} of rounding` : null].filter(Boolean).join(" and ")}. The rows sum to the total.` : void 0;
      return /* @__PURE__ */ jsxs("div", { className: "nqd-sumrow", "data-kind": kind, title: why, children: [
        /* @__PURE__ */ jsx("span", { className: "k", children: lbl }),
        count ? /* @__PURE__ */ jsx("span", { className: "v num", style: tot ? { fontSize: 22 } : void 0, children: n0(val) }) : tot ? /* @__PURE__ */ jsx("button", { type: "button", "data-rank": "2", title: "Tap for the breakdown (Ctrl+F)", onClick: onBreakdown, style: { minWidth: 0 }, children: /* @__PURE__ */ jsx(Money, { value: val, font: 22, avail: Math.max(80, wpx - 150), ccy: "PKR", className: "v" }) }) : /* @__PURE__ */ jsx(Money, { value: val, font: 13, avail: Math.max(80, wpx - 150), className: "v" })
      ] }, k);
    }),
    /* @__PURE__ */ jsxs("div", { className: "nqd-actions", children: [
      /* @__PURE__ */ jsx("button", { type: "button", className: "nqd-btn", "data-pri": "true", "data-rank": "1", disabled: saving, onClick: onPrimary, children: primaryLabel }),
      shown.map((s) => /* @__PURE__ */ jsx("button", { type: "button", className: "nqd-btn", "data-rank": "2", onClick: () => onAction(s), children: s }, s)),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          className: "nqd-btn",
          "data-rank": "2",
          "aria-label": "More actions",
          title: shown.length < secondary.length ? `${secondary.slice(shown.length).join(" · ")} — and everything else this type can do` : "Everything else this type can do",
          onClick: () => onAction("__more__"),
          children: "⋯"
        }
      )
    ] })
  ] });
}
function DockBar({ D, type, doc, computed, on, onBreakdown, onPrimary, saving }) {
  const primaryLabel = label(type, "save", "Save");
  const btnW = Math.round(primaryLabel.length * 7.6) + 34;
  const showBd = D.avail > 560;
  const numW = Math.max(86, D.avail - 28 - 12 - btnW - (showBd ? 12 + 116 : 0));
  const moneyOff = off(type, "summary_money");
  const f = moneyOff ? { text: `${n0(computed.units)} units`, exact: `${computed.units} units across ${doc.lines.length} lines` } : formatToFit(computed.total, numW * 0.88, 20, "PKR");
  const balance = r2(computed.total - nz(doc.settled));
  const dockRef = useRef(null);
  useEffect(() => {
    if (dockRef.current) dockRef.current.inert = !on;
  }, [on]);
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ref: dockRef,
      className: "nqd-dock",
      "data-on": on ? "true" : "false",
      "data-rank": "1",
      "aria-hidden": on ? void 0 : "true",
      children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "k", children: moneyOff ? "Moving" : label(type, "total", "Total") }),
          /* @__PURE__ */ jsx("div", { className: "v", title: f.exact, children: f.text }),
          !moneyOff && nz(doc.settled) ? /* @__PURE__ */ jsxs("div", { className: "bal", children: [
            "Balance ",
            formatToFit(balance, (numW - 52) * 0.88, 11, "").text
          ] }) : null
        ] }),
        showBd && !moneyOff ? /* @__PURE__ */ jsx("button", { type: "button", className: "nqd-btn", "data-ghost": "true", "data-rank": "2", onClick: onBreakdown, children: "Breakdown" }) : null,
        /* @__PURE__ */ jsx("button", { type: "button", className: "nqd-btn", "data-rank": "1", disabled: saving, onClick: onPrimary, children: primaryLabel })
      ]
    }
  );
}
function VSplit({ value, inner, onChange, onReset, disabled }) {
  const ref = useRef(null);
  const nudge = (d) => onChange(Math.max(0.12, Math.min(0.55, value + d)));
  const down = (e) => {
    if (disabled) return;
    e.preventDefault();
    const node = ref.current;
    node.setPointerCapture(e.pointerId);
    node.dataset.drag = "true";
    const x0 = e.clientX;
    const f0 = value;
    const move = (ev) => {
      onChange(Math.max(0.12, Math.min(0.55, f0 - (ev.clientX - x0) / inner)));
    };
    const up = () => {
      node.removeEventListener("pointermove", move);
      node.removeEventListener("pointerup", up);
      node.removeEventListener("pointercancel", up);
      delete node.dataset.drag;
    };
    node.addEventListener("pointermove", move);
    node.addEventListener("pointerup", up);
    node.addEventListener("pointercancel", up);
  };
  return /* @__PURE__ */ jsx(
    "div",
    {
      ref,
      className: "nqd-vsplit",
      role: "separator",
      tabIndex: 0,
      "aria-orientation": "vertical",
      "aria-label": "Resize the summary",
      "aria-valuenow": Math.round(value * 100),
      "aria-valuemin": 12,
      "aria-valuemax": 55,
      title: "Drag to resize · arrow keys work too · double-click restores the preset",
      onPointerDown: down,
      onDoubleClick: onReset,
      onKeyDown: (e) => {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          nudge(0.02);
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          nudge(-0.02);
        } else if (e.key === "Home") {
          e.preventDefault();
          onChange(0.55);
        } else if (e.key === "End") {
          e.preventDefault();
          onChange(0.12);
        }
      }
    }
  );
}
function PartySheet({ open, onClose, type, current, onPick, narrow }) {
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(null);
  useEffect(() => {
    if (open) {
      setQ("");
      setCreating(null);
    }
  }, [open]);
  const list = partiesFor(type.side).filter(
    (p) => p.name.toLowerCase().includes(q.toLowerCase()) || (p.phone || "").includes(q)
  );
  const noun = label(type, "party", "Party");
  if (creating) {
    return /* @__PURE__ */ jsx(
      Sheet,
      {
        open,
        onClose: () => setCreating(null),
        title: `New ${noun.toLowerCase()}`,
        size: narrow ? "bottom" : "side",
        ns: "nqd",
        footer: /* @__PURE__ */ jsxs("div", { className: "nqd-actions", children: [
          /* @__PURE__ */ jsx("button", { type: "button", className: "nqd-btn", onClick: () => setCreating(null), children: "Back" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              className: "nqd-btn",
              "data-pri": "true",
              disabled: !creating.name.trim(),
              onClick: () => {
                onPick({ ...creating, id: Date.now(), side: type.side });
                setCreating(null);
                onClose();
              },
              children: "Save and use"
            }
          )
        ] }),
        children: /* @__PURE__ */ jsxs("div", { className: "nqd-hdr", style: { gridTemplateColumns: "1fr" }, children: [
          /* @__PURE__ */ jsxs("div", { className: "nqd-f", children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "nqd-np-n", children: "Name" }),
            /* @__PURE__ */ jsx("input", { id: "nqd-np-n", className: "nqd-ctl", "data-sheet-focus": true, value: creating.name, onChange: (e) => setCreating({ ...creating, name: e.target.value }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "nqd-f", children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "nqd-np-p", children: "Phone" }),
            /* @__PURE__ */ jsx("input", { id: "nqd-np-p", className: "nqd-ctl", inputMode: "tel", value: creating.phone, onChange: (e) => setCreating({ ...creating, phone: e.target.value }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "nqd-f", children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "nqd-np-d", children: "Default discount %" }),
            /* @__PURE__ */ jsx("input", { id: "nqd-np-d", className: "nqd-ctl num", inputMode: "decimal", value: creating.discount, onChange: (e) => setCreating({ ...creating, discount: keep(e.target.value) }) })
          ] })
        ] })
      }
    );
  }
  return /* @__PURE__ */ jsxs(
    Sheet,
    {
      open,
      onClose,
      title: noun,
      subtitle: type.side === "buy" ? "suppliers only" : "customers only",
      size: narrow ? "bottom" : "side",
      ns: "nqd",
      footer: /* @__PURE__ */ jsx("div", { className: "nqd-actions", children: /* @__PURE__ */ jsxs("button", { type: "button", className: "nqd-btn", onClick: () => setCreating({ name: q, phone: "", discount: 0, balance: 0, terms: "Net 30" }), children: [
        "New ",
        noun.toLowerCase(),
        " ",
        /* @__PURE__ */ jsx(Kbd, { ns: "nqd", children: "Ctrl+D" })
      ] }) }),
      children: [
        /* @__PURE__ */ jsxs("div", { className: "nqd-note", style: { margin: "12px 16px" }, children: [
          "This list is ",
          /* @__PURE__ */ jsx("b", { children: type.side === "buy" ? "suppliers" : "customers" }),
          ", derived from the document’s side. Every picker in the shipped code except V3 Purchase asked for",
          /* @__PURE__ */ jsx("code", { children: " type=all" }),
          ", so a purchase order would happily accept a customer."
        ] }),
        /* @__PURE__ */ jsx("div", { className: "nqd-hdr", style: { gridTemplateColumns: "1fr", paddingBottom: 0 }, children: /* @__PURE__ */ jsx("input", { className: "nqd-ctl", "data-sheet-focus": true, placeholder: "Name or phone…", "aria-label": "Search", value: q, onChange: (e) => setQ(e.target.value) }) }),
        list.map((p) => /* @__PURE__ */ jsxs("button", { type: "button", className: "nqd-row", onClick: () => {
          onPick(p);
          onClose();
        }, children: [
          /* @__PURE__ */ jsx("span", { className: "nqd-avatar", style: { width: 34, height: 34, fontSize: 14 }, children: p.name[0] }),
          /* @__PURE__ */ jsxs("span", { className: "nqd-rowmain", children: [
            /* @__PURE__ */ jsx("span", { className: "nqd-rowtitle", children: p.name }),
            /* @__PURE__ */ jsxs("span", { className: "nqd-rowsub", children: [
              p.ref,
              " · ",
              p.phone,
              " · balance ",
              n0(p.balance),
              " · ",
              p.terms
            ] })
          ] }),
          current && current.id === p.id ? /* @__PURE__ */ jsx("span", { className: "nqd-flag", children: "Current" }) : null
        ] }, p.id)),
        !list.length ? /* @__PURE__ */ jsxs("div", { className: "nqd-empty", children: [
          "No ",
          type.side === "buy" ? "supplier" : "customer",
          " matches."
        ] }) : null
      ]
    }
  );
}
function ProductSheet({ open, onClose, onPick, onCreate, narrow, products = PRODUCTS }) {
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(null);
  useEffect(() => {
    if (open) {
      setQ("");
      setCreating(null);
    }
  }, [open]);
  const { matches } = searchProducts(q, products);
  const list = q.trim() ? matches : products;
  if (creating) {
    return /* @__PURE__ */ jsx(
      Sheet,
      {
        open,
        onClose: () => setCreating(null),
        title: "New product",
        size: narrow ? "bottom" : "side",
        ns: "nqd",
        footer: /* @__PURE__ */ jsxs("div", { className: "nqd-actions", children: [
          /* @__PURE__ */ jsx("button", { type: "button", className: "nqd-btn", onClick: () => setCreating(null), children: "Back" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              className: "nqd-btn",
              "data-pri": "true",
              disabled: !creating.name.trim() || !Number(creating.rate),
              onClick: () => {
                onCreate(creating);
                setCreating(null);
                onClose();
              },
              children: "Create and add"
            }
          )
        ] }),
        children: /* @__PURE__ */ jsxs("div", { className: "nqd-hdr", style: { gridTemplateColumns: "1fr" }, children: [
          /* @__PURE__ */ jsxs("div", { className: "nqd-f", children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "nqd-npr-n", children: "Name" }),
            /* @__PURE__ */ jsx("input", { id: "nqd-npr-n", className: "nqd-ctl", "data-sheet-focus": true, value: creating.name, onChange: (e) => setCreating({ ...creating, name: e.target.value }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "nqd-f", children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "nqd-npr-s", children: "SKU" }),
            /* @__PURE__ */ jsx("input", { id: "nqd-npr-s", className: "nqd-ctl", value: creating.sku, onChange: (e) => setCreating({ ...creating, sku: e.target.value }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "nqd-f", children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "nqd-npr-r", children: "Rate" }),
            /* @__PURE__ */ jsx("input", { id: "nqd-npr-r", className: "nqd-ctl num", inputMode: "decimal", value: creating.rate, onChange: (e) => setCreating({ ...creating, rate: keep(e.target.value) }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "nqd-f", children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "nqd-npr-u", children: "Unit" }),
            /* @__PURE__ */ jsx("input", { id: "nqd-npr-u", className: "nqd-ctl", value: creating.uom, onChange: (e) => setCreating({ ...creating, uom: e.target.value }) })
          ] })
        ] })
      }
    );
  }
  return /* @__PURE__ */ jsxs(
    Sheet,
    {
      open,
      onClose,
      title: "Item",
      size: narrow ? "bottom" : "side",
      ns: "nqd",
      footer: /* @__PURE__ */ jsx("div", { className: "nqd-actions", children: /* @__PURE__ */ jsx("button", { type: "button", className: "nqd-btn", onClick: () => setCreating({ name: q, sku: "", rate: "", uom: "pc" }), children: "New product" }) }),
      children: [
        /* @__PURE__ */ jsx("div", { className: "nqd-hdr", style: { gridTemplateColumns: "1fr", paddingBottom: 0 }, children: /* @__PURE__ */ jsx("input", { className: "nqd-ctl", "data-sheet-focus": true, placeholder: "Name or SKU…", "aria-label": "Search items", value: q, onChange: (e) => setQ(e.target.value) }) }),
        list.map((p) => /* @__PURE__ */ jsxs("button", { type: "button", className: "nqd-row", onClick: () => {
          onPick(p);
          onClose();
        }, children: [
          /* @__PURE__ */ jsxs("span", { className: "nqd-rowmain", children: [
            /* @__PURE__ */ jsx("span", { className: "nqd-rowtitle", children: p.name }),
            /* @__PURE__ */ jsxs("span", { className: "nqd-rowsub", children: [
              p.sku,
              " · HSN ",
              p.hsn,
              " · ",
              p.stock,
              " ",
              p.uom,
              " on hand"
            ] })
          ] }),
          /* @__PURE__ */ jsx(Money, { value: p.rate, font: 14, avail: 100 })
        ] }, p.id)),
        !list.length ? /* @__PURE__ */ jsx("div", { className: "nqd-empty", children: "Nothing matches." }) : null
      ]
    }
  );
}
function TypeSheet({ open, onClose, current, onPick, narrow }) {
  return /* @__PURE__ */ jsxs(
    Sheet,
    {
      open,
      onClose,
      title: "Document type",
      subtitle: "one editor, thirteen",
      size: narrow ? "bottom" : "side",
      ns: "nqd",
      children: [
        /* @__PURE__ */ jsxs("div", { className: "nqd-note", style: { margin: "12px 16px" }, children: [
          "A type is a ",
          /* @__PURE__ */ jsx("b", { children: "configuration" }),
          " — labels, a set of switched-on capabilities and a default density — never a different screen. Eight of the thirteen in the codebase are the same file copy-pasted."
        ] }),
        TYPES.map((t) => /* @__PURE__ */ jsxs("button", { type: "button", className: "nqd-row", onClick: () => {
          onPick(t.id);
          onClose();
        }, children: [
          /* @__PURE__ */ jsxs("span", { className: "nqd-rowmain", children: [
            /* @__PURE__ */ jsx("span", { className: "nqd-rowtitle", children: t.name }),
            /* @__PURE__ */ jsxs("span", { className: "nqd-rowsub", children: [
              t.prefix,
              " · ",
              t.side,
              " side · wants ",
              t.density,
              " · ",
              t.on.length,
              " capabilities on",
              t.off.length ? `, ${t.off.length} off` : ""
            ] })
          ] }),
          current === t.id ? /* @__PURE__ */ jsx("span", { className: "nqd-flag", children: "Current" }) : null
        ] }, t.id))
      ]
    }
  );
}
function SourceSheet({ open, onClose, onPick, narrow }) {
  return /* @__PURE__ */ jsx(Sheet, { open, onClose, title: "Against document", size: narrow ? "bottom" : "side", ns: "nqd", children: SOURCE_DOCS.map((d) => /* @__PURE__ */ jsxs("button", { type: "button", className: "nqd-row", onClick: () => {
    onPick(d);
    onClose();
  }, children: [
    /* @__PURE__ */ jsxs("span", { className: "nqd-rowmain", children: [
      /* @__PURE__ */ jsx("span", { className: "nqd-rowtitle", children: d.id }),
      /* @__PURE__ */ jsxs("span", { className: "nqd-rowsub", children: [
        d.party,
        " · ",
        d.at
      ] })
    ] }),
    /* @__PURE__ */ jsx(Money, { value: d.total, font: 14, avail: 110 })
  ] }, d.id)) });
}
function LineSheet({ open, onClose, line, type, perms, onPatch, onRemove, onChangeItem, narrow }) {
  if (!line) return /* @__PURE__ */ jsx(Sheet, { open: false, onClose, title: "Line", ns: "nqd" });
  const canPrice = perms["documents.price_override"] && !off(type, "rate_edit") && !has(type, "qty_only");
  const canDisc = perms["documents.discount"] && !off(type, "disc");
  const batch = has(type, "batch_entry") || has(type, "batch_pick");
  const num2 = (k, lbl, opts = {}) => /* @__PURE__ */ jsxs("div", { className: "nqd-f", children: [
    /* @__PURE__ */ jsx("label", { htmlFor: `nqd-l-${k}`, children: lbl }),
    /* @__PURE__ */ jsx(
      "input",
      {
        id: `nqd-l-${k}`,
        className: "nqd-ctl num",
        inputMode: "decimal",
        disabled: opts.disabled,
        value: line[k] ?? "",
        onChange: (e) => onPatch(line.u, { [k]: keep(e.target.value) })
      }
    ),
    opts.hint ? /* @__PURE__ */ jsx("span", { className: "hint", children: opts.hint }) : null
  ] }, k);
  return /* @__PURE__ */ jsxs(
    Sheet,
    {
      open,
      onClose,
      title: line.name,
      subtitle: line.sku,
      size: narrow ? "bottom" : "side",
      ns: "nqd",
      footer: /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          className: "nqd-btn",
          "data-rank": "2",
          disabled: !perms["documents.delete_line"],
          onClick: () => {
            onRemove(line);
            onClose();
          },
          children: "Remove this line"
        }
      ),
      children: [
        /* @__PURE__ */ jsxs("div", { className: "nqd-hdr", style: { gridTemplateColumns: "repeat(2,minmax(0,1fr))", padding: "12px 16px" }, children: [
          /* @__PURE__ */ jsxs("div", { className: "nqd-f", style: { gridColumn: "span 2" }, children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "nqd-l-item", children: "Item" }),
            /* @__PURE__ */ jsxs("button", { type: "button", id: "nqd-l-item", className: "nqd-ctl", "data-sheet-focus": true, "aria-label": `Item: ${line.name}. Change it.`, onClick: () => onChangeItem(line.u), children: [
              /* @__PURE__ */ jsx("span", { children: line.name }),
              /* @__PURE__ */ jsx("span", { className: "chev", "aria-hidden": true, children: "⌄" })
            ] })
          ] }),
          num2("qty", has(type, "expected_counted_difference") ? "Counted quantity" : "Quantity"),
          has(type, "free_qty") ? num2("free", "Free quantity", { hint: "reached the database from 2 of 7 sell-side types" }) : null,
          /* @__PURE__ */ jsxs("div", { className: "nqd-f", children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "nqd-l-uom", children: "Unit" }),
            /* @__PURE__ */ jsx("select", { id: "nqd-l-uom", className: "nqd-ctl", value: line.uom, onChange: (e) => onPatch(line.u, { uom: e.target.value }), children: ["pc", "strip", "pack", "box", "can", "bottle", "kg", "dozen"].map((u) => /* @__PURE__ */ jsx("option", { value: u, children: u }, u)) }),
            /* @__PURE__ */ jsx("span", { className: "hint", children: "StoreSaleRequest requires it; no shipped screen collects it" })
          ] }),
          has(type, "qty_only") ? null : num2("rate", label(type, "rate", "Rate"), { disabled: !canPrice }),
          off(type, "disc") || has(type, "qty_only") ? null : num2("disc", "Discount %", { disabled: !canDisc }),
          has(type, "per_line_tax") ? num2("tax", "Tax %") : null,
          batch ? /* @__PURE__ */ jsxs("div", { className: "nqd-f", children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "nqd-l-batch", children: has(type, "expiry_entry") ? "Batch / expiry" : "Batch" }),
            /* @__PURE__ */ jsx("input", { id: "nqd-l-batch", className: "nqd-ctl", value: line.batch || "", onChange: (e) => onPatch(line.u, { batch: e.target.value }) })
          ] }) : null,
          /* @__PURE__ */ jsxs("div", { className: "nqd-f", style: { gridColumn: "span 2" }, children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "nqd-l-note", children: "Line note" }),
            /* @__PURE__ */ jsx("input", { id: "nqd-l-note", className: "nqd-ctl", value: line.note || "", onChange: (e) => onPatch(line.u, { note: e.target.value }) }),
            /* @__PURE__ */ jsx("span", { className: "hint", children: "the payload has always carried it; nothing ever wrote it" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "nqd-note", style: { margin: "4px 16px 20px" }, children: [
          "A density decides which of these are ",
          /* @__PURE__ */ jsx("b", { children: "columns" }),
          ". It never decides which",
          /* @__PURE__ */ jsx("b", { children: " exist" }),
          " — that is the type’s to decide, and it decides it at every width."
        ] })
      ]
    }
  );
}
function BreakdownSheet({ open, onClose, type, doc, computed, narrow, showMargin }) {
  const taxRate = TAX_RATES.find((t) => t.id === doc.taxRate) || TAX_RATES[1];
  const taxLbl = has(type, "no_lines") ? "Tax (as entered)" : computed.perLineTax ? "Tax (per line)" : `Tax · ${taxRate.breakdown || `${taxRate.rate}%`}${computed.inclusive ? " — included in the prices" : ""}`;
  const rows = [
    [computed.inclusive ? "Subtotal (ex tax)" : "Subtotal", computed.gross],
    ["Item discounts", -computed.lineDisc],
    ["Document discount", -computed.docDisc],
    ["Delivery", nz(doc.shipping)],
    ["Other charges", nz(doc.extra)],
    [taxLbl, computed.tax],
    computed.round ? ["Round off", computed.round] : null
  ].filter(Boolean);
  return /* @__PURE__ */ jsxs(Sheet, { open, onClose, title: "Breakdown", subtitle: doc.docno, size: narrow ? "bottom" : "side", ns: "nqd", children: [
    rows.map(([k, v]) => /* @__PURE__ */ jsxs("div", { className: "nqd-sumrow", children: [
      /* @__PURE__ */ jsx("span", { className: "k", children: k }),
      /* @__PURE__ */ jsx(Money, { value: v, font: 13, avail: 150, className: "v" })
    ] }, k)),
    /* @__PURE__ */ jsxs("div", { className: "nqd-sumrow", "data-kind": "tot", children: [
      /* @__PURE__ */ jsx("span", { className: "k", children: label(type, "total", "Total") }),
      /* @__PURE__ */ jsx(Money, { value: computed.total, font: 26, avail: 210, ccy: "PKR", className: "v" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "nqd-sumrow", children: [
      /* @__PURE__ */ jsx("span", { className: "k", children: "Lines" }),
      /* @__PURE__ */ jsx("span", { className: "v num", children: doc.lines.length })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "nqd-sumrow", children: [
      /* @__PURE__ */ jsx("span", { className: "k", children: "Units" }),
      /* @__PURE__ */ jsx("span", { className: "v num", children: n2(computed.units) })
    ] }),
    has(type, "landed_costs") && nz(doc.landedCosts) ? /* @__PURE__ */ jsxs("div", { className: "nqd-sumrow", title: "Allocated to the cost of the items received. It is not part of what is owed to this supplier, so it is not in the total.", children: [
      /* @__PURE__ */ jsx("span", { className: "k", children: "Landed costs (to item cost)" }),
      /* @__PURE__ */ jsx(Money, { value: nz(doc.landedCosts), font: 13, avail: 150, className: "v" })
    ] }) : null,
    showMargin && type.side === "sell" ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("div", { className: "nqd-sumrow", children: [
        /* @__PURE__ */ jsx("span", { className: "k", children: "Cost of goods" }),
        /* @__PURE__ */ jsx(Money, { value: computed.cost, font: 13, avail: 150, className: "v" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "nqd-sumrow", children: [
        /* @__PURE__ */ jsxs("span", { className: "k", children: [
          "Margin · ",
          computed.marginPct,
          "%"
        ] }),
        /* @__PURE__ */ jsx(Money, { value: computed.margin, font: 13, avail: 150, className: "v" })
      ] })
    ] }) : null,
    /* @__PURE__ */ jsxs("div", { className: "nqd-note", style: { margin: "10px 16px 20px" }, children: [
      "Round-off is a ",
      /* @__PURE__ */ jsx("b", { children: "document" }),
      " property, applied once, here. Only the sales invoice and the recurring invoice ever called ",
      /* @__PURE__ */ jsx("code", { children: "roundTotal()" }),
      ", so the same cart totalled differently depending on which of the thirteen screens you were on."
    ] })
  ] });
}
function PayloadSheet({ open, onClose, type, doc, computed, narrow }) {
  const payload = buildPayload(doc, type, computed);
  const pruned = JSON.parse(JSON.stringify(payload, (k, v) => v === void 0 ? void 0 : v));
  return /* @__PURE__ */ jsxs(Sheet, { open, onClose, title: "What this would post", subtitle: type.id, size: narrow ? "bottom" : "wide", ns: "nqd", children: [
    /* @__PURE__ */ jsxs("div", { className: "nqd-note", style: { margin: "12px 16px" }, children: [
      "One payload builder, for all thirteen types. ",
      /* @__PURE__ */ jsx("b", { children: "A field that renders is a field that posts." }),
      " Quotation collected tax, delivery, extra charges, amount paid, free quantity, date and reference in the UI and dropped all seven; sales order sent five keys its controller ignored. Both are unreachable from here."
    ] }),
    /* @__PURE__ */ jsx("pre", { className: "nqd-pre", children: JSON.stringify(pruned, null, 2) })
  ] });
}
function MoneySheet({ open, onClose, doc, set, perms, narrow }) {
  return /* @__PURE__ */ jsx(
    Sheet,
    {
      open,
      onClose,
      title: "Document totals",
      size: narrow ? "bottom" : "side",
      ns: "nqd",
      footer: /* @__PURE__ */ jsx("div", { className: "nqd-actions", children: /* @__PURE__ */ jsx("button", { type: "button", className: "nqd-btn", "data-pri": "true", onClick: onClose, children: "Done" }) }),
      children: /* @__PURE__ */ jsxs("div", { className: "nqd-hdr", style: { gridTemplateColumns: "1fr" }, children: [
        /* @__PURE__ */ jsxs("div", { className: "nqd-f", children: [
          /* @__PURE__ */ jsxs("label", { htmlFor: "nqd-m-tax", children: [
            "Document tax ",
            /* @__PURE__ */ jsx(Kbd, { ns: "nqd", children: "F7" })
          ] }),
          /* @__PURE__ */ jsx("select", { id: "nqd-m-tax", className: "nqd-ctl", "data-sheet-focus": true, value: doc.taxRate, onChange: (e) => set({ taxRate: Number(e.target.value) }), children: TAX_RATES.map((t) => /* @__PURE__ */ jsx("option", { value: t.id, children: t.label }, t.id)) }),
          /* @__PURE__ */ jsx("span", { className: "hint", children: "from settings.tax_rates — read by every type, not only the sales invoice" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "nqd-f", children: [
          /* @__PURE__ */ jsxs("label", { htmlFor: "nqd-m-disc", children: [
            "Document discount ",
            /* @__PURE__ */ jsx(Kbd, { ns: "nqd", children: "F9" })
          ] }),
          /* @__PURE__ */ jsx(
            "input",
            {
              id: "nqd-m-disc",
              className: "nqd-ctl num",
              inputMode: "decimal",
              disabled: !perms["documents.discount"],
              value: doc.discount,
              onChange: (e) => set({ discount: keep(e.target.value) })
            }
          ),
          /* @__PURE__ */ jsx("span", { className: "hint", children: "a percentage of the subtotal, clamped at 100" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "nqd-f", children: [
          /* @__PURE__ */ jsxs("label", { htmlFor: "nqd-m-ship", children: [
            "Delivery ",
            /* @__PURE__ */ jsx(Kbd, { ns: "nqd", children: "F8" })
          ] }),
          /* @__PURE__ */ jsx("input", { id: "nqd-m-ship", className: "nqd-ctl num", inputMode: "decimal", value: doc.shipping, onChange: (e) => set({ shipping: keep(e.target.value) }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "nqd-f", children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "nqd-m-extra", children: "Other charges" }),
          /* @__PURE__ */ jsx("input", { id: "nqd-m-extra", className: "nqd-ctl num", inputMode: "decimal", value: doc.extra, onChange: (e) => set({ extra: keep(e.target.value) }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "nqd-f", children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "nqd-m-settled", children: "Amount settled" }),
          /* @__PURE__ */ jsx("input", { id: "nqd-m-settled", className: "nqd-ctl num", inputMode: "decimal", value: doc.settled, onChange: (e) => set({ settled: keep(e.target.value) }) })
        ] })
      ] })
    }
  );
}
function KeysSheet({ open, onClose, narrow }) {
  return /* @__PURE__ */ jsxs(Sheet, { open, onClose, title: "Keyboard", subtitle: "one map for the whole product", size: narrow ? "bottom" : "side", ns: "nqd", children: [
    /* @__PURE__ */ jsxs("div", { className: "nqd-note", style: { margin: "12px 16px" }, children: [
      "The documented F-key map existed only in ",
      /* @__PURE__ */ jsx("code", { children: "Pos.jsx" }),
      ".",
      /* @__PURE__ */ jsx("code", { children: " KeyboardShortcutsModal.jsx" }),
      " advertised it to every user and no document screen implemented any of it."
    ] }),
    /* @__PURE__ */ jsx("div", { className: "nqd-keymap", children: LAW.pos.keymap.filter(([, , where]) => where.includes("document") || where === "everywhere").map(([k, action, where]) => /* @__PURE__ */ jsxs(React.Fragment, { children: [
      /* @__PURE__ */ jsx(Kbd, { ns: "nqd", children: k }),
      /* @__PURE__ */ jsx("span", { children: action }),
      /* @__PURE__ */ jsx("span", { className: "mono", children: where })
    ] }, k)) })
  ] });
}
function ActionsSheet({ open, onClose, type, onRun, narrow }) {
  return /* @__PURE__ */ jsxs(Sheet, { open, onClose, title: "Document actions", subtitle: type.name, size: narrow ? "bottom" : "side", ns: "nqd", children: [
    /* @__PURE__ */ jsxs("div", { className: "nqd-note", style: { margin: "12px 16px" }, children: [
      "No email, WhatsApp, PDF, duplicate or record-payment action exists on any editor in the shipped code — email and WhatsApp live only on ",
      /* @__PURE__ */ jsx("code", { children: "Sales/Show.jsx" }),
      ". They are document actions, so they belong to the document."
    ] }),
    overflowActions(type).map((a) => /* @__PURE__ */ jsx("button", { type: "button", className: "nqd-row", onClick: () => {
      onRun(a);
      onClose();
    }, children: /* @__PURE__ */ jsx("span", { className: "nqd-rowmain", children: /* @__PURE__ */ jsx("span", { className: "nqd-rowtitle", children: a }) }) }, a))
  ] });
}
function RecentSheet({ open, onClose, onOpenDoc, narrow }) {
  return /* @__PURE__ */ jsx(Sheet, { open, onClose, title: "Recent documents", size: narrow ? "bottom" : "side", ns: "nqd", children: RECENT_DOCS.map((d) => /* @__PURE__ */ jsxs("button", { type: "button", className: "nqd-row", onClick: () => {
    onOpenDoc(d);
    onClose();
  }, children: [
    /* @__PURE__ */ jsxs("span", { className: "nqd-rowmain", children: [
      /* @__PURE__ */ jsxs("span", { className: "nqd-rowtitle", children: [
        d.id,
        " · ",
        d.party
      ] }),
      /* @__PURE__ */ jsxs("span", { className: "nqd-rowsub", children: [
        d.at,
        " · ",
        d.status
      ] })
    ] }),
    /* @__PURE__ */ jsx(Money, { value: d.total, font: 14, avail: 110 })
  ] }, d.id)) });
}
function Palette({ open, onClose, commands }) {
  const [q, setQ] = useState("");
  const ref = useRef(null);
  useEffect(() => {
    if (open) setQ("");
  }, [open]);
  const trap = focusTrap(ref, open);
  if (!open) return null;
  const list = commands.filter((c) => c.label.toLowerCase().includes(q.toLowerCase()));
  return (
    // The palette is its own dialog rather than a Sheet, so it needs the
    // same promise kept by hand.
    /* @__PURE__ */ jsxs("div", { ref, className: "nqd-palette", role: "dialog", "aria-modal": "true", "aria-label": "Commands", onKeyDown: trap, children: [
      /* @__PURE__ */ jsx("input", { autoFocus: true, placeholder: "Type a command…", value: q, onChange: (e) => setQ(e.target.value), onKeyDown: (e) => {
        if (e.key === "Enter" && list[0]) {
          list[0].run();
          onClose();
        }
      } }),
      /* @__PURE__ */ jsxs("div", { className: "nqd-sb", children: [
        list.map((c) => /* @__PURE__ */ jsxs("button", { type: "button", className: "nqd-row", onClick: () => {
          c.run();
          onClose();
        }, children: [
          /* @__PURE__ */ jsxs("span", { className: "nqd-rowmain", children: [
            /* @__PURE__ */ jsx("span", { className: "nqd-rowtitle", children: c.label }),
            c.note ? /* @__PURE__ */ jsx("span", { className: "nqd-rowsub", children: c.note }) : null
          ] }),
          c.key ? /* @__PURE__ */ jsx(Kbd, { ns: "nqd", children: c.key }) : null
        ] }, c.label)),
        !list.length ? /* @__PURE__ */ jsx("div", { className: "nqd-empty", children: "Nothing matches." }) : null
      ] })
    ] })
  );
}
function NavDrawer({ open, onClose, items, current, width }) {
  return /* @__PURE__ */ jsx(Sheet, { open, onClose, title: "VenQore", side: "left", width, ns: "nqd", children: items.map((n) => /* @__PURE__ */ jsxs("button", { type: "button", className: "nqd-navitem", "aria-current": n.id === current ? "true" : void 0, children: [
    /* @__PURE__ */ jsx("span", { "aria-hidden": true, style: { width: 20, textAlign: "center" }, children: n.glyph }),
    n.label
  ] }, n.id)) });
}
const PCT = (v) => `${Math.round(v * 100)}%`;
const BAND_LABEL = {
  phone: "a phone",
  tablet: "a tablet",
  short: "a wide, short screen",
  desk: "a desktop"
};
function Seg({ label: label2, value, options, onPick, note, disabledFor, hintFor }) {
  return /* @__PURE__ */ jsxs("div", { className: "nqd-ctlbox", children: [
    label2 ? /* @__PURE__ */ jsx("div", { className: "lbl", children: /* @__PURE__ */ jsx("span", { children: label2 }) }) : null,
    /* @__PURE__ */ jsx("div", { className: "nqd-seg", role: "group", "aria-label": label2, children: options.map(([v, t]) => /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        "aria-pressed": v === value,
        disabled: disabledFor ? disabledFor(v) : false,
        title: hintFor ? hintFor(v) : void 0,
        onClick: () => onPick(v),
        children: t
      },
      v
    )) }),
    note ? /* @__PURE__ */ jsx("div", { className: "note", children: note }) : null
  ] });
}
function SettingsDrawer({
  open,
  onClose,
  prefs,
  D,
  vp,
  type,
  setComp,
  setPreset,
  setProfile,
  setAuto,
  setOps,
  setPerm,
  setRail,
  setType,
  rankMode,
  setRankMode,
  tab,
  setTab,
  onReset
}) {
  const tt = useTermText();
  const c = prefs.comp;
  const band = screenBand(vp.w, vp.h);
  const geo = (fn) => (...args) => {
    setAuto(false);
    fn(...args);
  };
  const set = geo((patch) => setComp({ ...c, ...patch }));
  const pickPreset = geo((id) => setPreset(id));
  const densities = docDensities();
  densities.map((d) => d.id);
  const wanted = type;
  const current = densities.find((d) => d.id === c.density) || densities[0];
  const shownCols = columnsFor(wanted, D.columns);
  const dropped = D.columns.filter((k) => !shownCols.includes(k));
  return /* @__PURE__ */ jsx(
    Sheet,
    {
      open,
      onClose,
      title: "Editor settings",
      size: "wide",
      ns: "nqd",
      labelExtra: /* @__PURE__ */ jsxs("span", { className: "nqd-seg", style: { marginLeft: 12 }, children: [
        /* @__PURE__ */ jsx("button", { type: "button", "aria-pressed": tab === "arrange", onClick: () => setTab("arrange"), children: "Arrange" }),
        /* @__PURE__ */ jsx("button", { type: "button", "aria-pressed": tab === "operate", onClick: () => setTab("operate"), children: "Operate" })
      ] }),
      footer: /* @__PURE__ */ jsxs("div", { className: "nqd-actions", children: [
        /* @__PURE__ */ jsx("button", { type: "button", className: "nqd-btn", onClick: onReset, children: "Reset to defaults" }),
        /* @__PURE__ */ jsx("button", { type: "button", className: "nqd-btn", "data-pri": "true", onClick: onClose, children: "Done" })
      ] }),
      children: tab === "arrange" ? /* @__PURE__ */ jsxs("div", { className: "nqd-set", children: [
        /* @__PURE__ */ jsxs("div", { className: "nqd-auto", children: [
          /* @__PURE__ */ jsx(
            Switch,
            {
              ns: "nqd",
              label: prefs.auto ? "Auto — arranged for this screen" : "Manual — you are arranging this yourself",
              note: prefs.auto ? `This is ${BAND_LABEL[band]}, so Auto is running the ${prefs.preset} arrangement. Change the window, or the document type, and it re-picks.` : "Auto stopped when you moved a knob. Turn it back on and this screen goes back to what your profile asks for.",
              value: prefs.auto,
              onChange: setAuto
            }
          ),
          prefs.auto ? /* @__PURE__ */ jsxs("div", { className: "nqd-ctlbox", children: [
            /* @__PURE__ */ jsx("div", { className: "lbl", children: /* @__PURE__ */ jsx("span", { children: "How do you work?" }) }),
            /* @__PURE__ */ jsx("div", { className: "nqd-presets", children: PROFILES.map((p) => /* @__PURE__ */ jsxs("button", { type: "button", className: "nqd-preset", "aria-pressed": prefs.profile === p.id, onClick: () => setProfile(p.id), children: [
              /* @__PURE__ */ jsx("b", { children: p.name }),
              /* @__PURE__ */ jsx("span", { children: p.note })
            ] }, p.id)) }),
            /* @__PURE__ */ jsx("div", { className: "note", children: "Auto decides geometry only. The DENSITY still comes from the document — a purchase bill asks for Pro and an expense for Simple — because a screen size should not decide what a document is." })
          ] }) : null
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "nqd-setgroup", children: [
          /* @__PURE__ */ jsx("h3", { children: "Document type" }),
          /* @__PURE__ */ jsxs("button", { type: "button", className: "nqd-preset", onClick: () => setType("__open__"), children: [
            /* @__PURE__ */ jsx("b", { children: type.name }),
            /* @__PURE__ */ jsxs("span", { children: [
              type.prefix,
              " · ",
              type.side,
              " side · wants ",
              type.density,
              ". One editor, thirteen configurations — tap to switch."
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "nqd-setgroup", children: [
          /* @__PURE__ */ jsx("h3", { children: "Start from" }),
          /* @__PURE__ */ jsx("div", { className: "nqd-presets", children: docPresets().map((p) => /* @__PURE__ */ jsxs("button", { type: "button", className: "nqd-preset", "aria-pressed": prefs.preset === p.id, title: p.for, onClick: () => pickPreset(p.id), children: [
            /* @__PURE__ */ jsx("b", { children: p.name }),
            /* @__PURE__ */ jsx("span", { children: p.for })
          ] }, p.id)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "nqd-setgroup", children: [
          /* @__PURE__ */ jsx("h3", { children: "Arrangement" }),
          /* @__PURE__ */ jsx(
            Seg,
            {
              label: tt("Customer &amp; details"),
              value: c.details,
              options: [["open", "Open"], ["collapsed", "Collapsed"]],
              onPick: (v) => set({ details: v }),
              note: D.details.mode === "collapsed" && c.details === "open" ? "This screen is too short to hold the block open, so the law is holding it collapsed. Tapping the strip opens it as a sheet — every field is in it." : `Collapsed is one line — party, number, date, running total. Here it is worth ${Math.max(0, Math.round((D.details.mode === "open" ? D.details.h - 60 : 0) / 49))} more item rows.`
            }
          ),
          /* @__PURE__ */ jsx(
            Seg,
            {
              label: "Summary",
              value: c.summary,
              options: [["auto", "Auto"], ["right", "Right"], ["below", "Below"], ["off", "Off"]],
              onPick: (v) => set({ summary: v }),
              note: "Auto keeps the column while it costs the line table nothing, and drops it below when it would."
            }
          ),
          /* @__PURE__ */ jsx(
            Seg,
            {
              label: "While you scroll",
              value: c.pin,
              options: [["auto", "Auto"], ["sticky", "Hold it"], ["dock", "Dock"], ["none", "Let it scroll"]],
              onPick: (v) => set({ pin: v }),
              note: D.summary.canStick ? `The column is ${D.summary.h}px and this screen has room, so it can be held in place.` : `The column is ${D.summary.h}px and only ${Math.round(D.usable - (D.summary.mode === "right" ? D.details.h : 0))}px are on screen — a sticky panel taller than its viewport still scrolls, it just scrolls late. So it docks.`
            }
          ),
          /* @__PURE__ */ jsx(
            Slider,
            {
              ns: "nqd",
              label: "Summary width",
              value: c.split,
              lo: 0.12,
              hi: 0.55,
              step: 0.01,
              fmt: PCT,
              disabled: D.summary.mode !== "right",
              onSet: (v) => set({ split: v }),
              note: D.summary.mode === "right" ? "Clamped by the measured floors of both the summary and the line table." : "Only applies while the summary is a right-hand column."
            }
          ),
          /* @__PURE__ */ jsx(
            Seg,
            {
              label: "Density",
              value: c.density,
              options: densities.map((d) => [d.id, d.name]),
              onPick: (v) => set({ density: v }),
              hintFor: (v) => {
                const d = densities.find((x) => x.id === v);
                if (!d) return "";
                return `${d.line_cols.length} line columns · ${d.header.length} header fields · ${d.summary.length} summary rows · needs ${docTableWidth(d.line_cols)}px`;
              },
              note: D.capped ? `You asked for ${D.wantedDensity}; this width supports ${D.density}. The width can veto a density — it can never veto a capability.` : `${wanted.name} wants ${wanted.density}. A ${current.line_cols.length}-column table needs ${docTableWidth(current.line_cols)}px and the lines have ${Math.round(D.lines.px)}px.`
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "nqd-setgroup", children: [
          /* @__PURE__ */ jsx("h3", { children: "This screen" }),
          /* @__PURE__ */ jsx(Switch, { ns: "nqd", label: "Icon rail", note: "The hamburger stays at every width either way.", value: prefs.rail, onChange: setRail }),
          /* @__PURE__ */ jsx(Slider, { ns: "nqd", label: "Interface scale", value: prefs.ops.uiScale, lo: 0.85, hi: 1.35, step: 0.05, fmt: (v) => `${Math.round(v * 100)}%`, onSet: (v) => setOps({ uiScale: v }) }),
          /* @__PURE__ */ jsx(Switch, { ns: "nqd", label: "Large text mode", value: prefs.ops.senior, onChange: (v) => setOps({ senior: v }) }),
          /* @__PURE__ */ jsx(Switch, { ns: "nqd", label: "Show control ranks", note: "Teal = act, blue = adjust, grey = configure.", value: rankMode, onChange: setRankMode })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "nqd-setgroup", children: [
          /* @__PURE__ */ jsx("h3", { children: "What the law did with that" }),
          /* @__PURE__ */ jsxs("div", { className: "nqd-readout", children: [
            /* @__PURE__ */ jsx("b", { children: type.name }),
            " at ",
            /* @__PURE__ */ jsxs("b", { children: [
              vp.w,
              "×",
              vp.h
            ] }),
            " · nav ",
            /* @__PURE__ */ jsx("b", { children: D.nav }),
            D.navHeld ? " (held)" : "",
            " · content ",
            /* @__PURE__ */ jsxs("b", { children: [
              Math.round(D.avail),
              "px"
            ] }),
            " ",
            "· usable height ",
            /* @__PURE__ */ jsxs("b", { children: [
              Math.round(D.usable),
              "px"
            ] }),
            /* @__PURE__ */ jsx("br", {}),
            "details ",
            /* @__PURE__ */ jsxs("b", { children: [
              D.details.mode,
              D.details.mode === "open" ? ` · ${D.details.twoCol ? "2 columns" : "1 column"}` : ""
            ] }),
            /* @__PURE__ */ jsx("br", {}),
            "items ",
            /* @__PURE__ */ jsx("b", { children: D.lines.fit }),
            " @ ",
            /* @__PURE__ */ jsxs("b", { children: [
              Math.round(D.lines.px),
              "px"
            ] }),
            " · ",
            /* @__PURE__ */ jsxs("b", { children: [
              D.lines.rowsVisible,
              " lines"
            ] }),
            " visible without scrolling",
            /* @__PURE__ */ jsx("br", {}),
            "summary ",
            /* @__PURE__ */ jsxs("b", { children: [
              D.summary.mode,
              D.summary.mode === "right" ? ` ${Math.round(D.summary.px)}px · ${D.summary.fit}` : ""
            ] }),
            " ",
            "· while you scroll ",
            /* @__PURE__ */ jsx("b", { children: D.summary.pin }),
            " (the column is ",
            D.summary.h,
            "px and ",
            D.summary.canStick ? "fits" : "does not fit",
            ")",
            D.dock.length ? /* @__PURE__ */ jsxs(Fragment, { children: [
              " · dock ",
              /* @__PURE__ */ jsxs("b", { children: [
                D.dockH,
                "px"
              ] }),
              " reserved"
            ] }) : null,
            /* @__PURE__ */ jsx("br", {}),
            "density ",
            /* @__PURE__ */ jsx("b", { children: D.density }),
            D.capped ? ` (you asked for ${D.wantedDensity})` : "",
            /* @__PURE__ */ jsx("br", {}),
            "columns ",
            /* @__PURE__ */ jsx("b", { children: shownCols.join(" · ") }),
            dropped.length ? /* @__PURE__ */ jsxs(Fragment, { children: [
              " · ",
              /* @__PURE__ */ jsxs("span", { title: `${type.name} switches these off. A width may veto a density; a TYPE vetoes a capability.`, children: [
                "dropped by this type: ",
                /* @__PURE__ */ jsx("b", { children: dropped.join(" · ") })
              ] })
            ] }) : null
          ] }),
          D.demoted ? /* @__PURE__ */ jsxs("div", { className: "nqd-note", children: [
            /* @__PURE__ */ jsx("b", { children: "Why it looks like this here:" }),
            " ",
            D.demoted,
            "."
          ] }) : null,
          D.navHeld ? /* @__PURE__ */ jsxs("div", { className: "nqd-note", children: [
            "the nav is ",
            /* @__PURE__ */ jsx("b", { children: "holding the rail" }),
            ": expanding it would cost this composition a line column, and buying a bigger screen should never make the invoice worse"
          ] }) : null
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "nqd-setgroup", children: [
          /* @__PURE__ */ jsxs("h3", { children: [
            type.name,
            " — capabilities"
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            type.on.map((k) => /* @__PURE__ */ jsx("span", { className: "nqd-cap", children: k }, k)),
            type.off.map((k) => /* @__PURE__ */ jsx("span", { className: "nqd-cap", "data-off": "true", children: k }, k))
          ] }),
          /* @__PURE__ */ jsx("div", { className: "note", children: "Switched on, and the ones explicitly switched off. A capability is on or off, never half — free quantity reached the database from 2 of 7 sell-side types and inflated the on-screen subtotal on the other five." })
        ] })
      ] }) : /* @__PURE__ */ jsxs("div", { className: "nqd-set", children: [
        /* @__PURE__ */ jsxs("div", { className: "nqd-setgroup", children: [
          /* @__PURE__ */ jsx("h3", { children: "Tax" }),
          /* @__PURE__ */ jsx(
            Seg,
            {
              label: "Default rate",
              value: prefs.ops.defaultTax,
              options: TAX_RATES.map((t) => [t.id, t.label]),
              onPick: (v) => setOps({ defaultTax: Number(v) }),
              note: "Only the sales invoice read settings.tax_rates. Every other screen made the user type a raw percentage."
            }
          ),
          /* @__PURE__ */ jsx(Switch, { ns: "nqd", label: "Prices include tax by default", value: prefs.ops.taxInclusive, onChange: (v) => setOps({ taxInclusive: v }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "nqd-setgroup", children: [
          /* @__PURE__ */ jsx("h3", { children: "Money" }),
          /* @__PURE__ */ jsx(Switch, { ns: "nqd", label: "Round off the total", note: "A document property, applied once — not something only two of thirteen types do.", value: prefs.ops.roundOff, onChange: (v) => setOps({ roundOff: v }) }),
          /* @__PURE__ */ jsx(Switch, { ns: "nqd", label: "Show margin", note: "In the Items header and the breakdown, on the sell side, for roles that may see a cost price. Free quantity counts as cost.", value: prefs.ops.showMargin, onChange: (v) => setOps({ showMargin: v }) }),
          /* @__PURE__ */ jsx(Switch, { ns: "nqd", label: "Confirm a zero-cost line", note: "A purchase line with no cost is almost always a mistake.", value: prefs.ops.confirmZeroCost, onChange: (v) => setOps({ confirmZeroCost: v }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "nqd-setgroup", children: [
          /* @__PURE__ */ jsx("h3", { children: "Defaults for a new document" }),
          /* @__PURE__ */ jsx(Seg, { label: "Payment terms", value: prefs.ops.defaultTerms, options: TERMS.map((t) => [t.id, t.label]), onPick: (v) => setOps({ defaultTerms: v }), note: "Terms writes the due date — one control, not two. The date stays editable." }),
          /* @__PURE__ */ jsx(Seg, { label: "Location", value: prefs.ops.defaultLocation, options: LOCATIONS.map((l) => [l.id, l.name]), onPick: (v) => setOps({ defaultLocation: Number(v) }) }),
          /* @__PURE__ */ jsx(Seg, { label: "Money account", value: prefs.ops.defaultAccount, options: ACCOUNTS.map((a) => [a.id, a.name.split(" · ")[0]]), onPick: (v) => setOps({ defaultAccount: Number(v) }) }),
          /* @__PURE__ */ jsx(Switch, { ns: "nqd", label: "Number documents automatically", value: prefs.ops.autoNumber, onChange: (v) => setOps({ autoNumber: v }) }),
          /* @__PURE__ */ jsx(Switch, { ns: "nqd", label: "Require a location", note: "Purchase order requires warehouse_id server-side and rendered no input; it silently fell back to warehouses[0].", value: prefs.ops.requireLocation, onChange: (v) => setOps({ requireLocation: v }) }),
          /* @__PURE__ */ jsx(Switch, { ns: "nqd", label: "Print on save", value: prefs.ops.printOnSave, onChange: (v) => setOps({ printOnSave: v }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "nqd-setgroup", children: [
          /* @__PURE__ */ jsx("h3", { children: "This user may" }),
          /* @__PURE__ */ jsx("div", { className: "note", style: { marginTop: -4 }, children: "Simulated here so the controls can be seen doing what the permission says." }),
          /* @__PURE__ */ jsx(Switch, { ns: "nqd", label: "Post a document", value: prefs.perms["documents.post"], onChange: (v) => setPerm("documents.post", v) }),
          /* @__PURE__ */ jsx(Switch, { ns: "nqd", label: "Override a price", value: prefs.perms["documents.price_override"], onChange: (v) => setPerm("documents.price_override", v) }),
          /* @__PURE__ */ jsx(Switch, { ns: "nqd", label: "Give a discount", value: prefs.perms["documents.discount"], onChange: (v) => setPerm("documents.discount", v) }),
          /* @__PURE__ */ jsx(Switch, { ns: "nqd", label: "Delete a line", value: prefs.perms["documents.delete_line"], onChange: (v) => setPerm("documents.delete_line", v) })
        ] })
      ] })
    }
  );
}
let uidSeq = 1;
const uid = () => `l${uidSeq += 1}-${Math.random().toString(36).slice(2, 7)}`;
const idemKey = () => `idem-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
function newLine(product, qty = 1, disc = 0) {
  return {
    u: uid(),
    pid: product.id,
    name: product.name,
    sku: product.sku,
    hsn: product.hsn,
    qty,
    free: 0,
    uom: product.uom,
    rate: product.rate,
    cost: product.cost,
    disc,
    tax: product.tax,
    batch: "",
    note: ""
  };
}
function newDoc(type, ops, seq = 148) {
  const date = TODAY;
  const terms = ops.defaultTerms;
  return {
    type: type.id,
    docno: ops.autoNumber ? `${type.prefix}-${String(seq).padStart(6, "0")}` : "",
    party: off(type, "party") ? null : partiesFor(type.side)[0],
    partyref: "",
    date,
    terms,
    // FIX · Terms WRITES the due date. The Net 7/15/30/60 select was never
    // submitted on any screen, and due_date was sent from a `dueDate` key
    // that no input wrote.
    due: dueFromTerms(date, terms),
    method: type.side === "buy" ? "Bank" : "Credit",
    account: ops.defaultAccount,
    location: ops.defaultLocation,
    locationTo: 2,
    project: 1,
    currency: ops.defaultCurrency,
    fx: "1.0000",
    notes: "",
    lines: [],
    taxRate: ops.defaultTax,
    // Only a type that RENDERS the toggle carries the flag.
    taxInclusive: has(type, "tax_inclusive_flag") ? ops.taxInclusive : false,
    discount: 0,
    shipping: 0,
    extra: 0,
    settled: 0,
    validUntil: "",
    expectedDate: "",
    frequency: "Monthly",
    nextRun: "",
    activePaused: "active",
    goodsStatus: "Not received",
    status: "Draft",
    category: "",
    reason: "",
    description: "",
    sourceDoc: "",
    businessPct: 100,
    taxAmount: 0,
    refundAccount: 1,
    landedCosts: 0,
    attachment: "",
    idem: idemKey()
  };
}
function NewInvoice({ auth }) {
  const userId = auth?.user?.id ?? "demo";
  const vp = useViewport();
  const tt = useTermText();
  const [prefs, setPrefs] = useState(() => loadPrefs(userId));
  const [rankMode, setRankMode] = useState(false);
  const [setTab, setSetTab] = useState("arrange");
  useEffect(() => {
    const id = setTimeout(() => savePrefs(userId, prefs), 250);
    return () => clearTimeout(id);
  }, [userId, prefs]);
  const D = useMemo(
    () => composeDocument(prefs.comp, vp.w, vp.h, prefs.rail ? {} : { navW: 0 }),
    [prefs.comp, vp.w, vp.h, prefs.rail]
  );
  const canOpenDetails = useMemo(
    () => composeDocument({ ...prefs.comp, details: "open" }, vp.w, vp.h, prefs.rail ? {} : { navW: 0 }).details.mode === "open",
    [prefs.comp, vp.w, vp.h, prefs.rail]
  );
  const narrow = vp.w < 620;
  const M = docMetrics();
  const [docs, setDocs] = useState(() => {
    const d = newDoc(typeById(DEFAULTS.type), DEFAULTS.ops);
    d.lines = OPENING_LINES.map(({ pid, qty, disc }) => newLine(productById(pid), qty, disc));
    return [d];
  });
  const [active, setActive] = useState(0);
  const doc = docs[Math.min(active, docs.length - 1)];
  const type = typeById(doc.type);
  useEffect(() => {
    if (!prefs.auto) return;
    const { preset, comp } = autoComposition(prefs.profile, doc.type, vp.w, vp.h);
    if (preset !== prefs.preset || JSON.stringify(comp) !== JSON.stringify(prefs.comp)) {
      setPrefs((p) => p.auto ? { ...p, preset, comp } : p);
    }
  }, [prefs.auto, prefs.profile, doc.type, prefs.preset, prefs.comp, vp.w, vp.h]);
  const activeIdRef = useRef(null);
  activeIdRef.current = docs[Math.min(active, docs.length - 1)]?.idem;
  const setDoc = useCallback((next) => {
    setDocs((ds) => ds.map((d) => d.idem === activeIdRef.current ? typeof next === "function" ? next(d) : { ...d, ...next } : d));
  }, []);
  const [selected, setSelected] = useState(null);
  const [openCard, setOpenCard] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [pickerFor, setPickerFor] = useState(null);
  const [lineFor, setLineFor] = useState(null);
  const [navOpen, setNavOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [scrolled, setScrolled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState(PRODUCTS);
  const [touched, setTouched] = useState(false);
  const scrollRef = useRef(null);
  const undoRef = useRef({});
  const docsRef = useRef(docs);
  docsRef.current = docs;
  const anyOverlay = !!sheet || navOpen || settingsOpen || paletteOpen;
  const openLine = useCallback((u) => {
    setSelected(u);
    setLineFor(u);
    setSheet("line");
  }, []);
  const set = useCallback((patch) => {
    setTouched(true);
    setDoc((d) => ({ ...d, ...patch }));
  }, [setDoc]);
  const hasLines = !has(type, "no_lines");
  const toast = useCallback((text, opts = {}) => {
    const t = { id: `${Date.now()}-${Math.random()}`, text, ...opts };
    setToasts((ts) => [...ts.slice(-2), t]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== t.id)), opts.ms || 3400);
    return t;
  }, []);
  useEffect(() => {
    if (!doc.terms || doc.dueTouched) return;
    const next = dueFromTerms(doc.date, doc.terms);
    if (next !== doc.due) setDoc((d) => ({ ...d, due: next }));
  }, [doc.idem, doc.terms, doc.date, doc.dueTouched]);
  const computed = useMemo(() => {
    const t = typeById(doc.type);
    const noLines = has(t, "no_lines");
    const src = noLines ? [] : doc.lines;
    const lineNet = (l) => r2(nz(l.qty) * nz(l.rate) * (1 - pct(l.disc) / 100));
    const gross = r2(src.reduce((a, l) => a + nz(l.qty) * nz(l.rate), 0));
    const sub = r2(src.reduce((a, l) => a + lineNet(l), 0));
    const lineDisc = r2(gross - sub);
    const docDisc = r2(sub * pct(doc.discount) / 100);
    const taxable = Math.max(0, sub - docDisc);
    const rate = (TAX_RATES.find((x) => x.id === doc.taxRate) || TAX_RATES[0]).rate;
    const perLine = has(t, "per_line_tax");
    const docDiscFactor = sub > 0 ? 1 - docDisc / sub : 1;
    const inclusive = has(t, "tax_inclusive_flag") && !!doc.taxInclusive;
    const tax = noLines ? r2(nz(doc.taxAmount)) : inclusive ? r2(taxable - r2(taxable * 100 / (100 + rate))) : perLine ? r2(src.reduce((a, l) => a + lineNet(l) * docDiscFactor * nz(l.tax) / 100, 0)) : r2(taxable * rate / 100);
    const charges = r2(nz(doc.shipping) + nz(doc.extra));
    const before = r2(taxable + (inclusive ? 0 : tax) + charges);
    const total = prefs.ops.roundOff ? Math.round(before) : before;
    const cost = r2(src.reduce((a, l) => a + (nz(l.qty) + nz(l.free)) * nz(l.cost), 0));
    const net = r2(sub - docDisc);
    const margin = r2(net - cost);
    const f = inclusive ? 100 / (100 + rate) : 1;
    const grossD = inclusive ? r2(gross * f) : gross;
    const lineDiscD = inclusive ? r2(lineDisc * f) : lineDisc;
    const docDiscD = inclusive ? r2(grossD - lineDiscD - r2(taxable - tax)) : docDisc;
    return {
      lineNet,
      perLineTax: perLine,
      taxRate: rate,
      gross: grossD,
      sub: inclusive ? r2(sub * f) : sub,
      lineDisc: lineDiscD,
      docDisc: docDiscD,
      tax,
      inclusive,
      charges,
      cost,
      margin,
      marginPct: net > 0 ? r2(margin / net * 100) : 0,
      round: r2(total - before),
      total,
      units: r2(src.reduce((a, l) => a + nz(l.qty) + nz(l.free), 0))
    };
  }, [doc, prefs.ops.roundOff]);
  const errors = useMemo(() => {
    const e = {};
    if (!off(type, "party") && !doc.party) e.party = `A ${label(type, "party", "party").toLowerCase()} is required.`;
    if (!doc.date) e.date = "A document date is required.";
    if (prefs.ops.requireLocation && !doc.location && (has(type, "location") || has(type, "location_pair"))) {
      e.location = "The server requires a location for this type.";
    }
    if (has(type, "valid_until") && !doc.validUntil) e.validUntil = "A quotation needs a valid-until date.";
    if (has(type, "category") && !doc.category) e.category = "An expense needs a category.";
    if (has(type, "reason") && !doc.reason) e.reason = "A reason is required.";
    if (has(type, "source_doc") && !doc.sourceDoc) e.sourceDoc = "Pick the document this is against.";
    if (has(type, "description") && !String(doc.description || "").trim()) e.description = "A description is required.";
    if (has(type, "location_pair") && doc.location != null && String(doc.location) === String(doc.locationTo)) e.locationTo = "From and To cannot be the same location.";
    return e;
  }, [doc, type, prefs.ops.requireLocation]);
  const patchLine = useCallback((u, patch) => {
    setTouched(true);
    setDoc((d) => ({ ...d, lines: d.lines.map((l) => l.u === u ? { ...l, ...patch } : l) }));
  }, [setDoc]);
  const removeLine = useCallback((line) => {
    if (!prefs.perms["documents.delete_line"]) {
      toast("Your role may not delete a line.", { tone: "bad" });
      return;
    }
    setTouched(true);
    setDoc((d) => ({ ...d, lines: d.lines.filter((l) => l.u !== line.u) }));
    setOpenCard(null);
    const t = toast(`${line.name} removed.`, { action: "Undo", ms: 8e3 });
    undoRef.current = { ...undoRef.current, [t.id]: { line, docId: activeIdRef.current } };
  }, [prefs.perms, setDoc, toast]);
  const onToastAction = useCallback((t) => {
    const entry = (undoRef.current || {})[t.id];
    if (entry) {
      setDocs((ds) => ds.map((d) => d.idem === entry.docId && !d.lines.some((l) => l.u === entry.line.u) ? { ...d, lines: [...d.lines, entry.line] } : d));
      const next = { ...undoRef.current };
      delete next[t.id];
      undoRef.current = next;
    }
    setToasts((ts) => ts.filter((x) => x.id !== t.id));
  }, []);
  const addLine = useCallback((product) => {
    const p = product || products[0];
    setTouched(true);
    setDoc((d) => ({ ...d, lines: [...d.lines, newLine(p)] }));
  }, [products, setDoc]);
  const save = useCallback(() => {
    if (has(type, "posted_lock") && !prefs.perms["documents.post"]) {
      toast(`Your role may not post a ${type.name.toLowerCase()}.`, { tone: "bad" });
      return false;
    }
    const keys = Object.keys(errors);
    if (keys.length) {
      setDoc((d) => ({ ...d, submitted: true }));
      if (D.details.mode === "collapsed") {
        if (canOpenDetails) setPrefs((p) => ({ ...p, auto: false, comp: { ...p.comp, details: "open" } }));
        else setSheet("details");
      }
      toast(errors[keys[0]], { tone: "bad", ms: 5e3 });
      return false;
    }
    if (hasLines && !doc.lines.length) {
      toast("Add at least one line.", { tone: "bad" });
      return false;
    }
    if (prefs.ops.confirmZeroCost && type.side === "buy" && doc.lines.some((l) => !l.rate)) {
      toast("A purchase line has no cost. Set it, or turn the check off in Settings → Operate.", { tone: "bad", ms: 5e3 });
      return false;
    }
    setSaving(true);
    const payload = buildPayload(doc, type, computed);
    setTimeout(() => {
      setSaving(false);
      toast(
        `${type.name} ${doc.docno} posted${prefs.ops.printOnSave ? " · printing" : ""} — ${Object.keys(payload).filter((k) => payload[k] !== void 0).length} fields, ${(payload.items || []).length} lines.`,
        { tone: "good", ms: 5e3 }
      );
      const rest = docsRef.current.filter((d) => d.idem !== doc.idem);
      if (rest.length) saveDraft(userId, rest);
      else clearDraft(userId);
    }, 320);
    return true;
  }, [D.details.mode, canOpenDetails, computed, doc, errors, hasLines, prefs.ops, prefs.perms, setDoc, toast, type, userId]);
  useEffect(() => {
    const saved = loadDraft(userId);
    const list = Array.isArray(saved) ? saved : saved && saved.lines ? [saved] : null;
    const worth = (d) => !!(d.lines?.length || d.notes || d.partyref || d.description || d.category || d.reason || nz(d.extra) || nz(d.shipping) || nz(d.settled) || d.attachment);
    if (list && list.some(worth)) {
      setDocs(list.map((d) => ({ ...d, submitted: false })));
      toast(
        list.length > 1 ? `Your ${list.length} open drafts were restored from before the page closed.` : "Your draft was restored from before the page closed.",
        { tone: "good", ms: 5e3 }
      );
    }
  }, []);
  useEffect(() => {
    if (!touched) return void 0;
    const id = setTimeout(() => saveDraft(userId, docs), 500);
    return () => clearTimeout(id);
  }, [docs, touched, userId]);
  const tabLabel = (d) => d.docno || d.party?.name || `${typeById(d.type).prefix} draft`;
  const addTab = useCallback(() => {
    setDocs((ds) => {
      const highest = ds.reduce((a, d) => Math.max(a, Number((d.docno || "").split("-")[1]) || 0), 148);
      return [...ds, newDoc(type, prefs.ops, highest + 1)];
    });
    setActive(docs.length);
    setSelected(null);
    setOpenCard(null);
  }, [docs.length, prefs.ops, type]);
  const closeTab = useCallback((i) => {
    if (docs.length === 1) {
      toast("This is the only document open.");
      return;
    }
    setDocs((ds) => ds.filter((_, j) => j !== i));
    setActive((a) => Math.max(0, a >= i ? a - 1 : a));
    setSelected(null);
    setOpenCard(null);
  }, [docs.length, toast]);
  const switchType = useCallback((id) => {
    const next = typeById(id);
    setPrefs((p) => ({ ...p, type: id }));
    setDoc((d) => ({
      ...d,
      type: id,
      docno: prefs.ops.autoNumber ? `${next.prefix}-${d.docno.split("-")[1] || "000148"}` : d.docno,
      // The party list is derived from the side, so a party from the wrong
      // side cannot survive the switch.
      party: off(next, "party") ? null : d.party && d.party.side === next.side ? d.party : partiesFor(next.side)[0],
      // The lines SURVIVE a switch to a type that has none. `computed`
      // and `buildPayload` both ignore them for a `no_lines` type, so
      // nothing they hold reaches the total or the server — and switching
      // back gives the document back instead of an empty one.
      lines: d.lines,
      // A different type has a different set of rules. Carrying the flag
      // across painted a document you had only just configured red.
      submitted: false,
      // Only a type that renders the toggle carries the flag.
      taxInclusive: has(next, "tax_inclusive_flag") ? d.taxInclusive : false
    }));
    const noun = next.name.toLowerCase();
    toast(`Now ${/^[aeiou]/.test(noun) ? "an" : "a"} ${noun}. Same editor — the labels, the fields and the columns follow the type.`);
  }, [prefs.ops.autoNumber, setDoc, toast]);
  useEffect(() => {
    const typing = () => {
      const el = document.activeElement;
      if (!el) return false;
      return el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable;
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (paletteOpen) setPaletteOpen(false);
        else if (settingsOpen) setSettingsOpen(false);
        else if (sheet) setSheet(null);
        else if (navOpen) setNavOpen(false);
        else if (openCard) setOpenCard(null);
        else if (selected) setSelected(null);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
        return;
      }
      if (anyOverlay) return;
      if ((e.ctrlKey || e.metaKey) && !e.altKey) {
        if (e.key === "Tab") {
          e.preventDefault();
          setActive((a) => (a + 1) % docs.length);
          setSelected(null);
          setOpenCard(null);
          return;
        }
        const k = e.key.toLowerCase();
        if (k === "s" || k === "p") {
          e.preventDefault();
          save();
        } else if (k === "n") {
          e.preventDefault();
          if (save()) addTab();
        } else if (k === "d") {
          e.preventDefault();
          setSheet("party");
        } else if (k === "f") {
          e.preventDefault();
          setSheet("breakdown");
        } else if (k === "t") {
          e.preventDefault();
          addTab();
        } else if (k === "w") {
          e.preventDefault();
          closeTab(active);
        } else if (/^[1-9]$/.test(e.key)) {
          e.preventDefault();
          const l = doc.lines[Number(e.key) - 1];
          if (l) {
            setSelected(l.u);
            setOpenCard(l.u);
          }
        }
        return;
      }
      if (e.altKey && e.key.toLowerCase() === "q") {
        e.preventDefault();
        setSheet("product");
        setPickerFor(null);
        return;
      }
      switch (e.key) {
        case "F1":
          e.preventDefault();
          setSheet("product");
          setPickerFor(null);
          break;
        // F2–F6 act on the ACTIVE LINE, so they open that line's controls
        // in place — the same tap-to-adjust the register uses.
        // The line's own controls, in place — in the card fit AND in the
        // table fit, where they open as a row beneath the line. A key
        // that works at one width and silently does nothing at another
        // is a key that is not on the map.
        case "F2":
        case "F3":
        case "F5":
        case "F6": {
          e.preventDefault();
          const u = selected || doc.lines[0]?.u;
          if (!u) {
            toast("Nothing to edit — add a line first.");
            break;
          }
          setSelected(u);
          if (D.lines.fit === "cards") setOpenCard(u);
          else openLine(u);
          break;
        }
        case "F4":
          e.preventDefault();
          if (selected) {
            const l = doc.lines.find((x) => x.u === selected);
            if (l) removeLine(l);
          } else toast("Select a line first — Ctrl+1…9, or tap it.");
          break;
        case "F7":
        case "F8":
        case "F9":
          e.preventDefault();
          setSheet("money");
          break;
        case "F11":
          e.preventDefault();
          setSheet("party");
          break;
        case "F12":
          e.preventDefault();
          setSheet("notes");
          break;
        // The one key on the map that is a character you might type.
        case "?":
          if (!typing()) {
            e.preventDefault();
            setSheet("keys");
          }
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  const dockAlways = D.summary.mode === "off";
  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return void 0;
    const on = () => setScrolled(node.scrollTop > 40);
    node.addEventListener("scroll", on, { passive: true });
    on();
    return () => node.removeEventListener("scroll", on);
  }, [D.dock.length]);
  const setComp = (patch) => setPrefs((p) => ({ ...p, auto: false, comp: { ...p.comp, ...patch } }));
  const commands = [
    { label: "Add a line", key: "Alt+Q", run: () => {
      setPickerFor(null);
      setSheet("product");
    } },
    { label: "New document", key: "Ctrl+T", run: addTab },
    { label: "Change the document type", run: () => setSheet("type") },
    { label: `Choose a ${label(type, "party", "party").toLowerCase()}`, key: "F11", run: () => setSheet("party") },
    { label: "Document totals — tax, discount, delivery", key: "F9", run: () => setSheet("money") },
    { label: "Breakdown", key: "Ctrl+F", run: () => setSheet("breakdown") },
    { label: "What this would post", run: () => setSheet("payload") },
    { label: "Recent documents", run: () => setSheet("recent") },
    { label: "Document actions", run: () => setSheet("actions") },
    { label: "Collapse the details block", run: () => setComp({ details: D.details.mode === "open" ? "collapsed" : "open" }) },
    { label: "Keyboard map", key: "?", run: () => setSheet("keys") },
    { label: "Editor settings", run: () => setSettingsOpen(true) },
    { label: "Save", key: "Ctrl+S", run: save }
  ];
  const railW = prefs.rail && D.nav !== "hidden" ? Math.round(D.vw - D.avail - 2 * D.margin) : 0;
  const columns = columnsFor(type, D.columns);
  const summaryWidth = D.summary.mode === "right" ? D.summary.px : D.avail;
  const onAction = (a) => {
    if (a === "__more__") {
      setSheet("actions");
      return;
    }
    toast(`${a} — this is where the document would ${a.toLowerCase()}.`);
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Head, { title: `New ${type.name.toLowerCase()}` }),
    /* @__PURE__ */ jsxs(
      "div",
      {
        className: "nqd",
        "data-rankmode": rankMode ? "true" : void 0,
        "data-senior": prefs.ops.senior ? "true" : "false",
        style: {
          "--nqd-scale": prefs.ops.uiScale,
          "--nqd-margin": `${Math.round(marginAt(vp.w))}px`,
          // The law's own box heights, handed to the stylesheet. One
          // source of truth: a 38px summary row where the law measured
          // 36 is a column the law calls stickable and the browser
          // does not.
          "--nqd-zoneh": `${M.zone_h}px`,
          "--nqd-sumrow": `${M.sum_row}px`,
          "--nqd-sumtot": `${M.sum_tot_row}px`,
          "--nqd-actions": `${M.actions_h}px`,
          "--nqd-btnh": `${M.actions_h - 24}px`,
          "--nqd-dockh": `${M.dock_h}px`
        },
        children: [
          railW > 0 ? /* @__PURE__ */ jsxs(
            "nav",
            {
              className: "nqd-rail",
              style: { width: railW },
              "data-rank": "2",
              "data-expanded": D.nav === "expanded" ? "true" : void 0,
              "aria-label": "Sections",
              children: [
                NAV.filter((n) => n.id !== "settings").map((n) => /* @__PURE__ */ jsxs("button", { type: "button", className: "nqd-railicon", "aria-label": n.label, title: n.label, "aria-current": n.id === "sell" ? "true" : void 0, children: [
                  /* @__PURE__ */ jsx("span", { className: "glyph", "aria-hidden": true, children: n.glyph }),
                  D.nav === "expanded" ? /* @__PURE__ */ jsx("span", { children: n.label }) : null
                ] }, n.id)),
                /* @__PURE__ */ jsx("span", { className: "nqd-rail-sp" }),
                /* @__PURE__ */ jsxs("button", { type: "button", className: "nqd-railicon", "aria-label": "Editor settings", "data-rank": "3", onClick: () => setSettingsOpen(true), children: [
                  /* @__PURE__ */ jsx("span", { className: "glyph", "aria-hidden": true, children: "⚙" }),
                  D.nav === "expanded" ? /* @__PURE__ */ jsx("span", { children: "Settings" }) : null
                ] })
              ]
            }
          ) : null,
          /* @__PURE__ */ jsxs("div", { className: "nqd-main", children: [
            /* @__PURE__ */ jsxs("header", { className: "nqd-bar", children: [
              /* @__PURE__ */ jsx(Icon, { ns: "nqd", label: "Menu", rank: "2", title: "The nav — present at every width", onClick: () => setNavOpen(true), children: "☰" }),
              /* @__PURE__ */ jsx(Icon, { ns: "nqd", label: "Leave the document", rank: "2", onClick: () => toast("This is where the editor hands you back to the list."), children: "←" }),
              /* @__PURE__ */ jsxs("button", { type: "button", style: { minWidth: 0, flex: 1, textAlign: "left", minHeight: 0 }, "data-rank": "2", onClick: () => setSheet("type"), title: "One editor, thirteen document types", children: [
                /* @__PURE__ */ jsx("span", { className: "nqd-title", style: { display: "block" }, children: type.name }),
                /* @__PURE__ */ jsxs("span", { className: "nqd-docno", children: [
                  doc.docno,
                  " · ",
                  doc.status || "Draft"
                ] })
              ] }),
              vp.w >= 720 || docs.length > 1 ? /* @__PURE__ */ jsx("div", { className: "nqd-tabs", role: "group", "aria-label": "Open documents", children: docs.map((d, i) => /* @__PURE__ */ jsxs("span", { className: "nqd-tab", "data-current": i === active ? "true" : void 0, children: [
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    className: "nqd-tab-lab nqd-tight",
                    "aria-current": i === active ? "true" : void 0,
                    onClick: () => {
                      setActive(i);
                      setSelected(null);
                      setOpenCard(null);
                    },
                    children: tabLabel(d)
                  }
                ),
                /* @__PURE__ */ jsx("button", { type: "button", className: "nqd-tab-x nqd-tight", "aria-label": `Close ${tabLabel(d)}`, onClick: () => closeTab(i), children: "✕" })
              ] }, d.idem)) }) : null,
              /* @__PURE__ */ jsx(Icon, { ns: "nqd", label: "New document", rank: "2", title: "New document (Ctrl+T)", onClick: addTab, children: "＋" }),
              D.navHeld && vp.w > 700 ? /* @__PURE__ */ jsx("span", { className: "nqd-held", title: "Expanding the nav would cost this composition a line column, so it is holding the rail. Buying a bigger screen should never make the invoice worse.", children: "▤ rail held" }) : null,
              D.capped && vp.w > 900 ? /* @__PURE__ */ jsxs("span", { className: "nqd-status", title: `You asked for ${D.wantedDensity}; this width supports ${D.density}.`, children: [
                D.density,
                " density"
              ] }) : null,
              vp.w > 560 ? /* @__PURE__ */ jsx(Kbd, { ns: "nqd", children: "Ctrl+K" }) : null,
              /* @__PURE__ */ jsx(Icon, { ns: "nqd", label: "Keyboard map", rank: "2", onClick: () => setSheet("keys"), children: "⌨" }),
              /* @__PURE__ */ jsx(Icon, { ns: "nqd", label: "Editor settings", rank: "3", onClick: () => setSettingsOpen(true), children: "⚙" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "nqd-body", children: [
              /* @__PURE__ */ jsxs("div", { className: "nqd-scroll", ref: scrollRef, children: [
                /* @__PURE__ */ jsx(
                  DetailsZone,
                  {
                    D,
                    type,
                    doc,
                    set,
                    errors: doc.submitted ? errors : {},
                    total: computed.total,
                    onOpenParty: () => setSheet("party"),
                    onOpenSource: () => setSheet("source"),
                    onToggle: () => {
                      if (D.details.mode === "open") {
                        setComp({ details: "collapsed" });
                        return;
                      }
                      if (canOpenDetails) {
                        setComp({ details: "open" });
                        return;
                      }
                      setSheet("details");
                    },
                    forced: !canOpenDetails
                  }
                ),
                /* @__PURE__ */ jsxs(
                  "div",
                  {
                    className: "nqd-grid",
                    style: {
                      gridTemplateColumns: D.summary.mode === "right" ? `minmax(0,1fr) 14px ${Math.round(D.summary.px)}px` : "minmax(0,1fr)"
                    },
                    children: [
                      hasLines ? /* @__PURE__ */ jsx(
                        LinesZone,
                        {
                          D,
                          type,
                          doc,
                          columns,
                          perms: prefs.perms,
                          computed,
                          selected,
                          onSelect: setSelected,
                          openCard,
                          setOpenCard: (u) => {
                            setOpenCard(u);
                            if (u) setSelected(u);
                          },
                          onPatchLine: patchLine,
                          onRemoveLine: removeLine,
                          onAddLine: () => {
                            setPickerFor(null);
                            setSheet("product");
                          },
                          onOpenPicker: (u) => {
                            setPickerFor(u);
                            setSheet("product");
                          },
                          onOpenLine: openLine,
                          showMargin: prefs.ops.showMargin
                        }
                      ) : (
                        /* `no_lines` types — an expense is an amount,
                           not a table. The same editor, with the line
                           capability switched off. */
                        /* @__PURE__ */ jsxs("section", { className: "nqd-zone", "data-rank": "1", children: [
                          /* @__PURE__ */ jsx("header", { className: "nqd-zh", children: /* @__PURE__ */ jsx("span", { children: "Amount" }) }),
                          /* @__PURE__ */ jsxs("div", { className: "nqd-hdr", style: { gridTemplateColumns: D.details.twoCol ? "repeat(2,minmax(0,1fr))" : "1fr" }, children: [
                            /* @__PURE__ */ jsxs("div", { className: "nqd-f", children: [
                              /* @__PURE__ */ jsxs("label", { htmlFor: "nqd-amt", children: [
                                "Amount excluding tax",
                                /* @__PURE__ */ jsx("span", { className: "nqd-req", children: "*" })
                              ] }),
                              /* @__PURE__ */ jsx("input", { id: "nqd-amt", className: "nqd-ctl num", inputMode: "decimal", "data-rank": "1", value: doc.extra, onChange: (e) => set({ extra: keep(e.target.value) }) })
                            ] }),
                            !has(type, "tax_amount") ? /* @__PURE__ */ jsxs("div", { className: "nqd-f", children: [
                              /* @__PURE__ */ jsx("label", { htmlFor: "nqd-taxamt", children: "Tax amount" }),
                              /* @__PURE__ */ jsx("input", { id: "nqd-taxamt", className: "nqd-ctl num", inputMode: "decimal", value: doc.taxAmount, onChange: (e) => set({ taxAmount: keep(e.target.value) }) })
                            ] }) : null
                          ] })
                        ] })
                      ),
                      D.summary.mode === "right" ? /* @__PURE__ */ jsxs(Fragment, { children: [
                        /* @__PURE__ */ jsx(
                          VSplit,
                          {
                            value: prefs.comp.split,
                            inner: D.avail - 24,
                            onChange: (v) => setComp({ split: v }),
                            onReset: () => setComp({ split: presetDocument(prefs.preset || "panel").split })
                          }
                        ),
                        /* @__PURE__ */ jsx(
                          "div",
                          {
                            className: "nqd-sumcol",
                            "data-stick": D.summary.pin === "sticky" ? "true" : void 0,
                            style: D.summary.pin === "sticky" ? { maxHeight: Math.round(D.usable - D.details.h) } : void 0,
                            children: /* @__PURE__ */ jsx(
                              SummaryZone,
                              {
                                D,
                                type,
                                doc,
                                computed,
                                width: summaryWidth,
                                saving,
                                onBreakdown: () => setSheet("breakdown"),
                                onPrimary: save,
                                onAction
                              }
                            )
                          }
                        )
                      ] }) : null
                    ]
                  }
                ),
                D.summary.mode === "below" ? /* @__PURE__ */ jsx("div", { className: "nqd-sumcol", children: /* @__PURE__ */ jsx(
                  SummaryZone,
                  {
                    D,
                    type,
                    doc,
                    computed,
                    width: summaryWidth,
                    saving,
                    onBreakdown: () => setSheet("breakdown"),
                    onPrimary: save,
                    onAction
                  }
                ) }) : null
              ] }),
              D.dock.length ? /* @__PURE__ */ jsx("div", { className: "nqd-dockrow", style: { height: D.dockH + Math.round(marginAt(vp.w)) }, children: /* @__PURE__ */ jsx(
                DockBar,
                {
                  D,
                  type,
                  doc,
                  computed,
                  on: dockAlways || scrolled,
                  saving,
                  onBreakdown: () => setSheet("breakdown"),
                  onPrimary: save
                }
              ) }) : null
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            "div",
            {
              className: "nqd-scrim",
              "data-open": anyOverlay ? "true" : "false",
              "aria-hidden": "true",
              onClick: () => {
                setSheet(null);
                setNavOpen(false);
                setSettingsOpen(false);
                setPaletteOpen(false);
              }
            }
          ),
          /* @__PURE__ */ jsx(
            PartySheet,
            {
              open: sheet === "party",
              onClose: () => setSheet(null),
              type,
              current: doc.party,
              narrow,
              onPick: (p) => {
                const terms = (TERMS.find((t) => t.label === p.terms) || {}).id || doc.terms;
                const mayDiscount = prefs.perms["documents.discount"];
                const fromParty = { party: p, terms, dueTouched: false };
                if (p.discount && mayDiscount) {
                  set({ ...fromParty, discount: p.discount });
                  toast(`${p.name} has a ${p.discount}% default discount — applied to the document.`, { tone: "good" });
                } else {
                  set(fromParty);
                  if (p.discount) toast(`${p.name} has a ${p.discount}% default discount, but your role may not give one.`, { tone: "bad" });
                }
              }
            }
          ),
          /* @__PURE__ */ jsx(
            ProductSheet,
            {
              open: sheet === "product",
              onClose: () => {
                setSheet(null);
                setPickerFor(null);
              },
              narrow,
              products,
              onPick: (p) => {
                if (pickerFor) {
                  patchLine(pickerFor, { pid: p.id, name: p.name, sku: p.sku, hsn: p.hsn, uom: p.uom, rate: p.rate, cost: p.cost, tax: p.tax });
                } else {
                  addLine(p);
                }
              },
              onCreate: (f) => {
                const p = {
                  id: Date.now(),
                  name: f.name,
                  sku: f.sku || `NEW-${Date.now() % 1e3}`,
                  hsn: "0000.00",
                  uom: f.uom || "pc",
                  rate: Number(f.rate) || 0,
                  cost: Math.round((Number(f.rate) || 0) * 0.8),
                  tax: 18,
                  stock: 0,
                  hue: "teal"
                };
                setProducts((ps) => [p, ...ps]);
                addLine(p);
                toast(`${p.name} created and added.`, { tone: "good" });
              }
            }
          ),
          /* @__PURE__ */ jsx(
            LineSheet,
            {
              open: sheet === "line",
              onClose: () => {
                setSheet(null);
                setLineFor(null);
              },
              line: doc.lines.find((l) => l.u === lineFor) || null,
              type,
              perms: prefs.perms,
              narrow,
              onPatch: patchLine,
              onRemove: removeLine,
              onChangeItem: (u) => {
                setPickerFor(u);
                setSheet("product");
              }
            }
          ),
          /* @__PURE__ */ jsx(
            Sheet,
            {
              open: sheet === "details",
              onClose: () => setSheet(null),
              title: tt("Customer &amp; details"),
              size: narrow ? "bottom" : "wide",
              ns: "nqd",
              footer: /* @__PURE__ */ jsx("button", { type: "button", className: "nqd-btn", "data-pri": "true", onClick: () => setSheet(null), children: "Done" }),
              children: D.details.mode !== "collapsed" ? null : /* @__PURE__ */ jsx(
                DetailsZone,
                {
                  D: { ...D, details: { ...D.details, mode: "open", twoCol: !narrow }, avail: narrow ? 380 : 560 },
                  type,
                  doc,
                  set,
                  errors: doc.submitted ? errors : {},
                  total: computed.total,
                  onOpenParty: () => setSheet("party"),
                  onOpenSource: () => setSheet("source"),
                  onToggle: () => setSheet(null),
                  inSheet: true
                }
              )
            }
          ),
          /* @__PURE__ */ jsx(TypeSheet, { open: sheet === "type", onClose: () => setSheet(null), current: doc.type, onPick: switchType, narrow }),
          /* @__PURE__ */ jsx(SourceSheet, { open: sheet === "source", onClose: () => setSheet(null), narrow, onPick: (d) => set({ sourceDoc: d.id }) }),
          /* @__PURE__ */ jsx(BreakdownSheet, { open: sheet === "breakdown", onClose: () => setSheet(null), type, doc, computed, narrow, showMargin: prefs.ops.showMargin && prefs.perms["documents.price_override"] }),
          /* @__PURE__ */ jsx(PayloadSheet, { open: sheet === "payload", onClose: () => setSheet(null), type, doc, computed, narrow }),
          /* @__PURE__ */ jsx(MoneySheet, { open: sheet === "money", onClose: () => setSheet(null), doc, set, perms: prefs.perms, narrow }),
          /* @__PURE__ */ jsx(KeysSheet, { open: sheet === "keys", onClose: () => setSheet(null), narrow }),
          /* @__PURE__ */ jsx(
            ActionsSheet,
            {
              open: sheet === "actions",
              onClose: () => setSheet(null),
              type,
              narrow,
              onRun: (a) => {
                if (a === "Download PDF" || a === "Duplicate" || a === "Email" || a === "WhatsApp") toast(`${a} — a document action, on the document.`);
                else onAction(a);
              }
            }
          ),
          /* @__PURE__ */ jsx(RecentSheet, { open: sheet === "recent", onClose: () => setSheet(null), narrow, onOpenDoc: (d) => toast(`${d.id} would open here.`) }),
          /* @__PURE__ */ jsx(MoneyNotesSheet, { open: sheet === "notes", onClose: () => setSheet(null), doc, set, narrow }),
          /* @__PURE__ */ jsx(NavDrawer, { open: navOpen, onClose: () => setNavOpen(false), items: NAV, current: "sell", width: Math.min(264, vp.w - 56) }),
          /* @__PURE__ */ jsx(
            SettingsDrawer,
            {
              open: settingsOpen,
              onClose: () => setSettingsOpen(false),
              prefs,
              D,
              vp,
              type,
              tab: setTab,
              setTab: setSetTab,
              rankMode,
              setRankMode,
              setComp: (comp) => setPrefs((p) => ({ ...p, comp })),
              setPreset: (id) => setPrefs((p) => ({ ...p, preset: id, comp: presetDocument(id) })),
              setProfile: (id) => setPrefs((p) => ({ ...p, profile: id })),
              setAuto: (v) => setPrefs((p) => ({ ...p, auto: v })),
              setOps: (patch) => setPrefs((p) => ({ ...p, ops: { ...p.ops, ...patch } })),
              setPerm: (k, v) => setPrefs((p) => ({ ...p, perms: { ...p.perms, [k]: v } })),
              setRail: (v) => setPrefs((p) => ({ ...p, rail: v })),
              setType: () => setSheet("type"),
              onReset: () => {
                setPrefs({ ...DEFAULTS, comp: presetDocument("panel"), ops: { ...DEFAULTS.ops }, perms: { ...DEFAULTS.perms } });
                toast("Editor settings reset.");
              }
            }
          ),
          /* @__PURE__ */ jsx(Palette, { open: paletteOpen, onClose: () => setPaletteOpen(false), commands }),
          /* @__PURE__ */ jsx(Toasts, { ns: "nqd", items: toasts, onAction: onToastAction, onDismiss: (t) => setToasts((ts) => ts.filter((x) => x.id !== t.id)) })
        ]
      }
    )
  ] });
}
function MoneyNotesSheet({ open, onClose, doc, set, narrow }) {
  return /* @__PURE__ */ jsxs(Sheet, { open, onClose, title: "Notes", size: narrow ? "bottom" : "side", ns: "nqd", children: [
    /* @__PURE__ */ jsx("div", { className: "nqd-hdr", style: { gridTemplateColumns: "1fr" }, children: /* @__PURE__ */ jsxs("div", { className: "nqd-f", children: [
      /* @__PURE__ */ jsx("label", { htmlFor: "nqd-notes-sheet", children: "Notes on this document" }),
      /* @__PURE__ */ jsx("textarea", { id: "nqd-notes-sheet", "data-sheet-focus": true, value: doc.notes, onChange: (e) => set({ notes: e.target.value }), style: { minHeight: 140 } }),
      /* @__PURE__ */ jsx("span", { className: "hint", children: "The same field as the one in the details block, and the same payload key. Notes was in six payloads with no input on any of the eight clone screens." })
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "nqd-actions", children: /* @__PURE__ */ jsx("button", { type: "button", className: "nqd-btn", "data-pri": "true", onClick: onClose, children: "Done" }) })
  ] });
}
export {
  NewInvoice as default
};

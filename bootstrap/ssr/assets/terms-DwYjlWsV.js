import { usePage } from "@inertiajs/react";
function useTerms() {
  const map = usePage().props.terms ?? {};
  const t = (key, fallback) => {
    return map[key]?.singular ?? fallback ?? key;
  };
  const tp = (key, fallback) => {
    return map[key]?.plural ?? fallback ?? key;
  };
  return { t, tp };
}
const NAV_TERMS = {
  Customers: ["customer", "plural"],
  Suppliers: ["supplier", "plural"],
  Products: ["product", "plural"],
  Services: ["service", "plural"],
  "Service Jobs": ["job", "plural"],
  Orders: ["order", "plural"],
  Purchases: ["purchase", "plural"],
  Payments: ["payment", "plural"],
  Expenses: ["expense", "plural"],
  Tables: ["position", "plural"],
  "Staff Attendance": ["staff", "singular", (w) => `${w} Attendance`],
  "Stock Levels": ["stock", "singular", (w) => `${w} Levels`],
  "Returns History": ["return", "plural", (w) => `${w} History`]
};
function useNavLabel() {
  const map = usePage().props.terms ?? {};
  return (label) => {
    const rule = NAV_TERMS[label];
    if (!rule) return label;
    const [key, form, wrap] = rule;
    const word = map[key]?.[form];
    if (!word) return label;
    return wrap ? wrap(word) : word;
  };
}
const TEXT_TERMS = [
  ["customer", "Customer", "Customers"],
  ["supplier", "Supplier", "Suppliers"],
  ["product", "Product", "Products"],
  ["service", "Service", "Services"],
  ["job", "Job", "Jobs"],
  ["order", "Order", "Orders"],
  ["sale", "Sale", "Sales"],
  ["invoice", "Invoice", "Invoices"],
  ["position", "Table", "Tables"],
  ["occupancy", "Occupancy", "Occupancies"],
  ["technician", "Technician", "Technicians"],
  ["staff", "Staff", "Staff"],
  ["location", "Location", "Locations"]
];
const swapWord = (text, from, to) => text.replace(new RegExp(`\\b${from}\\b`, "g"), to).replace(new RegExp(`\\b${from.toLowerCase()}\\b`, "g"), to.toLowerCase());
function applyTerms(text, map) {
  if (typeof text !== "string" || !text) return text;
  let out = text;
  for (const [key, sing, plur] of TEXT_TERMS) {
    const t = map?.[key];
    if (!t?.singular || !t?.plural) continue;
    if (t.singular === sing && t.plural === plur) continue;
    if (plur !== sing) out = swapWord(out, plur, t.plural);
    out = swapWord(out, sing, t.singular);
  }
  return out;
}
function useTermText() {
  const map = usePage().props.terms ?? {};
  return (text) => applyTerms(text, map);
}
export {
  useNavLabel as a,
  useTerms as b,
  useTermText as u
};

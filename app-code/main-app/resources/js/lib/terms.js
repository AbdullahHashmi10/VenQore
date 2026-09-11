import { usePage } from '@inertiajs/react';

export function useTerms() {
    const map = usePage().props.terms ?? {};
    
    const t = (key, fallback) => {
        return map[key]?.singular ?? fallback ?? key;
    };
    
    const tp = (key, fallback) => {
        return map[key]?.plural ?? fallback ?? key;
    };
    
    return { t, tp };
}

/**
 * Sidebar / menu entries that name a thing the store may call something else.
 * The entry's KEY stays the same (routes and module gates key off it); only
 * the text on screen changes — "Customers" becomes "Clients" for a law firm,
 * "Service Jobs" becomes "Jobs" for a plumber, "Products" becomes "Parts".
 * The words come from config/business_types.php via tenant_terminology.
 */
const NAV_TERMS = {
    Customers: ['customer', 'plural'],
    Suppliers: ['supplier', 'plural'],
    Products: ['product', 'plural'],
    Services: ['service', 'plural'],
    'Service Jobs': ['job', 'plural'],
    Orders: ['order', 'plural'],
    Purchases: ['purchase', 'plural'],
    Payments: ['payment', 'plural'],
    Expenses: ['expense', 'plural'],
    Tables: ['position', 'plural'],
    'Staff Attendance': ['staff', 'singular', (w) => `${w} Attendance`],
    'Stock Levels': ['stock', 'singular', (w) => `${w} Levels`],
    'Returns History': ['return', 'plural', (w) => `${w} History`],
};

export function useNavLabel() {
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

/*
 * useTermText() → tt(text): rewrite the store's own words inside any UI string.
 *   tt('Add Customer')      → 'Add Client'       (law firm)
 *   tt('3 products low')    → '3 parts low'      (auto repair)
 * Whole words only, singular and plural, Title-case and lower-case. A word the
 * store has not renamed is left exactly as written. This is the tool for the
 * screen-by-screen sweep (docs/TERMINOLOGY_SWEEP.md): wrap visible strings,
 * never keys, routes or API values.
 */
const TEXT_TERMS = [
    ['customer', 'Customer', 'Customers'],
    ['supplier', 'Supplier', 'Suppliers'],
    ['product', 'Product', 'Products'],
    ['service', 'Service', 'Services'],
    ['job', 'Job', 'Jobs'],
    ['order', 'Order', 'Orders'],
    ['sale', 'Sale', 'Sales'],
    ['invoice', 'Invoice', 'Invoices'],
    ['position', 'Table', 'Tables'],
    ['occupancy', 'Occupancy', 'Occupancies'],
    ['technician', 'Technician', 'Technicians'],
    ['staff', 'Staff', 'Staff'],
    ['location', 'Location', 'Locations'],
];

const swapWord = (text, from, to) => text
    .replace(new RegExp(`\\b${from}\\b`, 'g'), to)
    .replace(new RegExp(`\\b${from.toLowerCase()}\\b`, 'g'), to.toLowerCase());

export function applyTerms(text, map) {
    if (typeof text !== 'string' || !text) return text;
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

export function useTermText() {
    const map = usePage().props.terms ?? {};
    return (text) => applyTerms(text, map);
}

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  NewPos — sample data                                                     ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * NOTHING HERE IS REAL. This file exists so the register can be judged on its
 * shape before it is wired to `/api/pos/*`. Every field is named the way the
 * real payload names it, so swapping this module for the live props is a
 * one-line change in NewPos.jsx and not a rewrite:
 *
 *   products    → GET /api/pos/featured  ·  /api/pos/search?q=  ·  /api/pos/barcode/{code}
 *   parties     → GET /api/parties?type=customer
 *   parked      → GET /api/pos/parked
 *   recent      → GET /api/pos/recent-sales
 *   warehouses  → Inertia prop  (Warehouse::all)
 *   banks       → Inertia prop  (BankAccount, non-cash)
 *   queue       → Dexie table   (Hooks/useOfflineSync.js)
 *
 * cost_price travels WITH the line on purpose. Margin display in the shipped
 * POS required `item.cost_price`, which was never set on a cart item, so the
 * margin readout was dead code for its whole life.
 */

/* ── Catalogue ───────────────────────────────────────────────────────────── */
export const CATEGORIES = [
    { id: 'all', name: 'All items' },
    { id: 'med', name: 'Pharmacy' },
    { id: 'gro', name: 'Grocery' },
    { id: 'hyg', name: 'Home & hygiene' },
    { id: 'bev', name: 'Beverages' },
    { id: 'snk', name: 'Snacks' },
];

/**
 * kind:  'simple' | 'variant' | 'composite' | 'serial'
 * bands: wholesale price banding — [minQty, unitPrice], applied automatically.
 * recipe: a composite that can be manufactured on demand from raw materials.
 */
export const PRODUCTS = [
    { id: 1, name: 'Panadol Extra 500mg', sku: 'PAN-500', barcode: '8964000101018', cat: 'med', stock: 4, price: 185, cost: 141, unit: 'strip', hue: 'teal', kind: 'simple', tax: 0, batch: 'B-2291 · exp 04/27' },
    { id: 2, name: 'Surf Excel 1kg', sku: 'SRF-1K', barcode: '8964000101025', cat: 'hyg', stock: 12, price: 640, cost: 522, unit: 'pack', hue: 'sky', kind: 'simple', tax: 18, bands: [[6, 615], [12, 596]] },
    { id: 3, name: 'Nestle Milk Pak 1L', sku: 'NML-1L', barcode: '8964000101032', cat: 'gro', stock: 40, price: 285, cost: 246, unit: 'pc', hue: 'lime', kind: 'simple', tax: 0, batch: 'B-4410 · exp 12/26' },
    { id: 4, name: 'Colgate MaxFresh 150g', sku: 'CLG-150', barcode: '8964000101049', cat: 'hyg', stock: 18, price: 410, cost: 331, unit: 'pc', hue: 'coral', kind: 'variant', tax: 18, variants: [{ id: 41, name: 'Blue Gel', sku: 'CLG-150-B', price: 410 }, { id: 42, name: 'Red Gel', sku: 'CLG-150-R', price: 410 }, { id: 43, name: 'Charcoal', sku: 'CLG-150-C', price: 465 }] },
    { id: 5, name: 'Lays Masala 62g', sku: 'LAY-62', barcode: '8964000101056', cat: 'snk', stock: 96, price: 120, cost: 96, unit: 'pc', hue: 'butter', kind: 'simple', tax: 18, bands: [[12, 114], [24, 108]] },
    { id: 6, name: 'Dettol Soap 100g', sku: 'DTL-100', barcode: '8964000101063', cat: 'hyg', stock: 55, price: 175, cost: 138, unit: 'pc', hue: 'plum', kind: 'simple', tax: 18 },
    { id: 7, name: 'Tapal Danedar 950g', sku: 'TPL-950', barcode: '8964000101070', cat: 'bev', stock: 8, price: 1650, cost: 1394, unit: 'pack', hue: 'teal', kind: 'simple', tax: 0 },
    { id: 8, name: 'Shan Biryani Masala', sku: 'SHN-BIR', barcode: '8964000101087', cat: 'gro', stock: 34, price: 190, cost: 152, unit: 'pc', hue: 'coral', kind: 'simple', tax: 18 },
    { id: 9, name: 'Olpers Cream 200ml', sku: 'OLP-200', barcode: '8964000101094', cat: 'gro', stock: 21, price: 230, cost: 191, unit: 'pc', hue: 'sky', kind: 'simple', tax: 0, batch: 'B-1180 · exp 02/27' },
    { id: 10, name: 'Head & Shoulders 360ml', sku: 'HNS-360', barcode: '8964000101100', cat: 'hyg', stock: 6, price: 1290, cost: 1053, unit: 'pc', hue: 'butter', kind: 'simple', tax: 18 },
    { id: 11, name: 'Kurkure Chutney 55g', sku: 'KUR-55', barcode: '8964000101117', cat: 'snk', stock: 120, price: 60, cost: 47, unit: 'pc', hue: 'lime', kind: 'simple', tax: 18, bands: [[24, 56]] },
    { id: 12, name: 'Sufi Cooking Oil 5L', sku: 'SUF-5L', barcode: '8964000101124', cat: 'gro', stock: 3, price: 4850, cost: 4180, unit: 'can', hue: 'plum', kind: 'simple', tax: 18 },
    { id: 13, name: 'Knorr Noodles 66g', sku: 'KNR-66', barcode: '8964000101131', cat: 'snk', stock: 74, price: 95, cost: 74, unit: 'pc', hue: 'teal', kind: 'simple', tax: 18, bands: [[12, 90]] },
    { id: 14, name: 'Safeguard Soap 130g', sku: 'SFG-130', barcode: '8964000101148', cat: 'hyg', stock: 44, price: 210, cost: 168, unit: 'pc', hue: 'sky', kind: 'simple', tax: 18 },
    { id: 15, name: 'Nurpur Butter 200g', sku: 'NUR-200', barcode: '8964000101155', cat: 'gro', stock: 15, price: 620, cost: 512, unit: 'pc', hue: 'butter', kind: 'simple', tax: 0, batch: 'B-7702 · exp 09/26' },
    { id: 16, name: 'Bake Parlor Ketchup 1kg', sku: 'BKP-1K', barcode: '8964000101162', cat: 'gro', stock: 9, price: 780, cost: 640, unit: 'pc', hue: 'coral', kind: 'simple', tax: 18 },
    { id: 17, name: 'Peek Freans Sooper', sku: 'PKF-SOO', barcode: '8964000101179', cat: 'snk', stock: 210, price: 50, cost: 38, unit: 'pc', hue: 'lime', kind: 'simple', tax: 18, bands: [[24, 47], [48, 44]] },
    { id: 18, name: 'Vim Dishwash Bar', sku: 'VIM-BAR', barcode: '8964000101186', cat: 'hyg', stock: 63, price: 85, cost: 66, unit: 'pc', hue: 'plum', kind: 'simple', tax: 18 },
    { id: 19, name: 'Ariel Powder 500g', sku: 'ARL-500', barcode: '8964000101193', cat: 'hyg', stock: 27, price: 545, cost: 444, unit: 'pack', hue: 'teal', kind: 'simple', tax: 18 },
    { id: 20, name: 'Pepsi 1.5L', sku: 'PEP-15', barcode: '8964000101209', cat: 'bev', stock: 88, price: 260, cost: 212, unit: 'bottle', hue: 'sky', kind: 'simple', tax: 18, bands: [[6, 249], [12, 240]] },
    { id: 21, name: 'Fresher Juice 1L', sku: 'FRS-1L', barcode: '8964000101216', cat: 'bev', stock: 31, price: 320, cost: 262, unit: 'pc', hue: 'coral', kind: 'simple', tax: 18 },
    { id: 22, name: 'Rafhan Custard 300g', sku: 'RAF-300', barcode: '8964000101223', cat: 'gro', stock: 12, price: 415, cost: 339, unit: 'pc', hue: 'butter', kind: 'simple', tax: 18 },
    { id: 23, name: 'Garam Masala 100g (house)', sku: 'HSE-GRM', barcode: '8964000101230', cat: 'gro', stock: 0, price: 340, cost: 246, unit: 'pc', hue: 'coral', kind: 'composite', tax: 0, recipe: ['Coriander 40g', 'Cumin 25g', 'Black pepper 20g', 'Cardamom 15g'] },
    { id: 24, name: 'Gas Stove 2-burner', sku: 'GAS-2B', barcode: '8964000101247', cat: 'gro', stock: 5, price: 8900, cost: 7250, unit: 'pc', hue: 'plum', kind: 'serial', tax: 18 },
];

export const HUES = ['teal', 'sky', 'lime', 'coral', 'butter', 'plum'];

/* ── The cart this demo opens with ───────────────────────────────────────── */
export const OPENING_CART = [
    { pid: 12, qty: 2 }, { pid: 7, qty: 1 }, { pid: 10, qty: 1 }, { pid: 3, qty: 6 },
    { pid: 2, qty: 2 }, { pid: 4, qty: 3 }, { pid: 5, qty: 12 }, { pid: 6, qty: 4 },
    { pid: 8, qty: 2 }, { pid: 13, qty: 8 }, { pid: 20, qty: 6 }, { pid: 17, qty: 10 },
];

/* ── Parties ─────────────────────────────────────────────────────────────── */
export const PARTIES = [
    { id: 0, name: 'Walk-in customer', phone: '', balance: 0, discount: 0, walkin: true },
    { id: 1, name: 'Ahsan Traders', phone: '0300-2244881', balance: 18400, discount: 5, credit: 50000 },
    { id: 2, name: 'Bilal General Store', phone: '0321-9080711', balance: 0, discount: 3, credit: 25000 },
    { id: 3, name: 'Nadia Khan', phone: '0333-1122009', balance: -1200, discount: 0, credit: 0 },
    { id: 4, name: 'Zaheer Wholesale', phone: '0345-6677001', balance: 96500, discount: 8, credit: 200000 },
    { id: 5, name: 'Café Rumi', phone: '0301-4455332', balance: 3200, discount: 0, credit: 15000 },
];

/* ── Locations, banks, tax ───────────────────────────────────────────────── */
export const WAREHOUSES = [
    { id: 1, name: 'Main store', is_default: true },
    { id: 2, name: 'Warehouse — Ravi Road' },
    { id: 3, name: 'Branch — Gulberg' },
];

export const BANKS = [
    { id: 1, name: 'Meezan — Current', code: '0102-7781' },
    { id: 2, name: 'HBL — Business', code: '0044-9902' },
    { id: 3, name: 'JazzCash merchant', code: 'JC-88102' },
];

export const TAX_RATES = [
    { id: 0, label: 'No tax', rate: 0 },
    { id: 1, label: 'GST 18%', rate: 18 },
    { id: 2, label: 'GST 5%', rate: 5 },
    { id: 3, label: 'Services 15%', rate: 15 },
];

export const PAY_METHODS = ['Cash', 'Card', 'Bank', 'UPI', 'Credit'];

/* ── Floor plan ──────────────────────────────────────────────────────────── */
export const TABLES = [
    { id: 'T1', zone: 'Hall', seats: 2, status: 'free' },
    { id: 'T2', zone: 'Hall', seats: 2, status: 'seated', guests: 2, since: '18 min', bill: 1840 },
    { id: 'T3', zone: 'Hall', seats: 4, status: 'free' },
    { id: 'T4', zone: 'Hall', seats: 4, status: 'seated', guests: 4, since: '42 min', bill: 6120 },
    { id: 'T5', zone: 'Hall', seats: 4, status: 'billed', guests: 3, since: '1 h 04', bill: 4390 },
    { id: 'T6', zone: 'Hall', seats: 6, status: 'free' },
    { id: 'T7', zone: 'Terrace', seats: 6, status: 'seated', guests: 6, since: '9 min', bill: 980 },
    { id: 'T8', zone: 'Terrace', seats: 2, status: 'free' },
    { id: 'B1', zone: 'Bar', seats: 1, status: 'free' },
    { id: 'B2', zone: 'Bar', seats: 3, status: 'seated', guests: 3, since: '26 min', bill: 2210 },
    { id: 'P1', zone: 'Private', seats: 8, status: 'free' },
    { id: 'P2', zone: 'Private', seats: 8, status: 'reserved', guests: 0, since: '20:30', bill: 0 },
];

/* ── Sheets ──────────────────────────────────────────────────────────────── */
export const PARKED = [
    { id: 'HLD-0041', party: 'Bilal General Store', lines: 6, total: 4820, at: '14:02', by: 'Rehan' },
    { id: 'HLD-0042', party: 'Walk-in', lines: 2, total: 610, at: '14:19', by: 'Rehan' },
    { id: 'HLD-0043', party: 'Zaheer Wholesale', lines: 21, total: 88450, at: '14:44', by: 'Sana' },
];

export const RECENT = [
    { id: 'INV-10231', party: 'Ahsan Traders', total: 41230, at: '13:58', method: 'Credit', status: 'posted' },
    { id: 'INV-10230', party: 'Walk-in', total: 1245, at: '13:51', method: 'Cash', status: 'posted' },
    { id: 'INV-10229', party: 'Nadia Khan', total: 8900, at: '13:40', method: 'Card', status: 'posted' },
    { id: 'INV-10228', party: 'Walk-in', total: 385, at: '13:22', method: 'Cash', status: 'returned' },
    { id: 'INV-10227', party: 'Café Rumi', total: 15600, at: '12:55', method: 'Bank', status: 'posted' },
    { id: 'INV-10226', party: 'Walk-in', total: 2740, at: '12:31', method: 'UPI', status: 'posted' },
];

/**
 * The offline queue. `state` distinguishes a genuine network failure from a
 * server rejection — the shipped POS caught BOTH and queued them as "offline
 * sales", so a 422 validation error and a plan-limit rejection silently became
 * a pending sale that would never post.
 */
export const QUEUE = [
    { id: 'Q-7781', at: '13:12', total: 3480, lines: 4, state: 'pending', why: 'No connection when completed' },
    { id: 'Q-7782', at: '13:14', total: 920, lines: 1, state: 'syncing', why: 'Retrying now' },
    { id: 'Q-7783', at: '13:19', total: 12750, lines: 9, state: 'error', why: 'Server rejected: line 4 quantity exceeds available stock (422)' },
];

export const DISCOUNT_PRESETS = [5, 10, 15, 20];

export const NAV = [
    { id: 'home', label: 'Home', glyph: '⌂' },
    { id: 'sell', label: 'Sell', glyph: '▤' },
    { id: 'purchase', label: 'Purchase', glyph: '↻' },
    { id: 'stock', label: 'Stock', glyph: '⛁' },
    { id: 'contacts', label: 'Contacts', glyph: '☺' },
    { id: 'money', label: 'Money', glyph: '₨' },
    { id: 'insights', label: 'Insights', glyph: '◴' },
    { id: 'settings', label: 'Settings', glyph: '⚙' },
];

/* Both of these take the LIVE list. Closing over the module-level PRODUCTS is
   how a product created at the register becomes invisible to the scanner that
   is standing right next to it. */
export const productById = (id, list = PRODUCTS) => list.find((p) => p.id === id);

/** Barcode-first: an exact SKU or barcode wins before any fuzzy search. */
export function lookup(term, list = PRODUCTS) {
    const q = String(term || '').trim();
    if (!q) return { exact: null, matches: [] };
    const lower = q.toLowerCase();
    const exact = list.find((p) => p.barcode === q)
        || list.find((p) => p.sku.toLowerCase() === lower)
        || null;
    const matches = list.filter(
        (p) => p.name.toLowerCase().includes(lower) || p.sku.toLowerCase().includes(lower),
    );
    return { exact, matches };
}

/** Wholesale price banding — the biggest band whose minimum the qty meets. */
export function bandedPrice(product, qty) {
    if (!product.bands) return { price: product.price, band: null };
    let out = { price: product.price, band: null };
    for (const [min, price] of product.bands) {
        if (qty >= min) out = { price, band: min };
    }
    return out;
}

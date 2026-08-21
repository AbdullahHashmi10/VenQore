/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  NewInvoice — sample data                                                 ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * NOTHING HERE IS REAL. The editor is being judged on its shape before it is
 * wired, and every field is named the way the live payload names it so that
 * wiring is a swap of this import rather than a rewrite:
 *
 *   products   → GET /api/pos/search?q=   ·  /api/pos/featured
 *   parties    → GET /api/parties?type=customer|supplier   (type from the doc's side)
 *   terms      → Setting `payment_terms`
 *   accounts   → Inertia prop  (BankAccount + cash)
 *   locations  → Inertia prop  (Warehouse)
 *   projects   → Inertia prop  (CostCentre)
 *
 * PARTY TYPE IS DERIVED FROM THE DOCUMENT'S SIDE. Every party picker in the
 * shipped code except V3 Purchase asks for `type=all`, so a purchase order will
 * happily accept a customer. `partiesFor(side)` is the whole fix.
 */

export const PRODUCTS = [
    { id: 1, name: 'Panadol Extra 500mg', sku: 'PAN-500', hsn: '3004.90', uom: 'strip', rate: 185, cost: 141, tax: 0, stock: 240, hue: 'teal' },
    { id: 2, name: 'Surf Excel 1kg', sku: 'SRF-1K', hsn: '3402.20', uom: 'pack', rate: 640, cost: 522, tax: 18, stock: 96, hue: 'sky' },
    { id: 3, name: 'Nestle Milk Pak 1L', sku: 'NML-1L', hsn: '0401.20', uom: 'pc', rate: 285, cost: 246, tax: 0, stock: 480, hue: 'lime' },
    { id: 4, name: 'Colgate MaxFresh 150g', sku: 'CLG-150', hsn: '3306.10', uom: 'pc', rate: 410, cost: 331, tax: 18, stock: 130, hue: 'coral' },
    { id: 5, name: 'Lays Masala 62g', sku: 'LAY-62', hsn: '2005.20', uom: 'pc', rate: 120, cost: 96, tax: 18, stock: 900, hue: 'butter' },
    { id: 6, name: 'Dettol Soap 100g', sku: 'DTL-100', hsn: '3401.11', uom: 'pc', rate: 175, cost: 138, tax: 18, stock: 400, hue: 'plum' },
    { id: 7, name: 'Tapal Danedar 950g', sku: 'TPL-950', hsn: '0902.30', uom: 'pack', rate: 1650, cost: 1394, tax: 0, stock: 72, hue: 'teal' },
    { id: 8, name: 'Shan Biryani Masala', sku: 'SHN-BIR', hsn: '0910.91', uom: 'pc', rate: 190, cost: 152, tax: 18, stock: 260, hue: 'coral' },
    { id: 9, name: 'Olpers Cream 200ml', sku: 'OLP-200', hsn: '0401.30', uom: 'pc', rate: 230, cost: 191, tax: 0, stock: 150, hue: 'sky' },
    { id: 10, name: 'Head & Shoulders 360ml', sku: 'HNS-360', hsn: '3305.10', uom: 'pc', rate: 1290, cost: 1053, tax: 18, stock: 60, hue: 'butter' },
    { id: 11, name: 'Kurkure Chutney 55g', sku: 'KUR-55', hsn: '1905.90', uom: 'pc', rate: 60, cost: 47, tax: 18, stock: 1200, hue: 'lime' },
    { id: 12, name: 'Sufi Cooking Oil 5L', sku: 'SUF-5L', hsn: '1512.19', uom: 'can', rate: 4850, cost: 4180, tax: 18, stock: 40, hue: 'plum' },
    { id: 13, name: 'Knorr Noodles 66g', sku: 'KNR-66', hsn: '1902.30', uom: 'pc', rate: 95, cost: 74, tax: 18, stock: 640, hue: 'teal' },
    { id: 14, name: 'Safeguard Soap 130g', sku: 'SFG-130', hsn: '3401.11', uom: 'pc', rate: 210, cost: 168, tax: 18, stock: 320, hue: 'sky' },
    { id: 15, name: 'Nurpur Butter 200g', sku: 'NUR-200', hsn: '0405.10', uom: 'pc', rate: 620, cost: 512, tax: 0, stock: 90, hue: 'butter' },
    { id: 16, name: 'Bake Parlor Ketchup 1kg', sku: 'BKP-1K', hsn: '2103.20', uom: 'pc', rate: 780, cost: 640, tax: 18, stock: 110, hue: 'coral' },
    { id: 17, name: 'Peek Freans Sooper', sku: 'PKF-SOO', hsn: '1905.31', uom: 'pc', rate: 50, cost: 38, tax: 18, stock: 2400, hue: 'lime' },
    { id: 18, name: 'Ariel Powder 500g', sku: 'ARL-500', hsn: '3402.20', uom: 'pack', rate: 545, cost: 444, tax: 18, stock: 180, hue: 'teal' },
    { id: 19, name: 'Pepsi 1.5L', sku: 'PEP-15', hsn: '2202.10', uom: 'bottle', rate: 260, cost: 212, tax: 18, stock: 700, hue: 'sky' },
    { id: 20, name: 'Fresher Juice 1L', sku: 'FRS-1L', hsn: '2009.89', uom: 'pc', rate: 320, cost: 262, tax: 18, stock: 240, hue: 'coral' },
];

export const HUES = ['teal', 'sky', 'lime', 'coral', 'butter', 'plum'];

/** The document this editor opens with. */
export const OPENING_LINES = [
    { pid: 12, qty: 4, disc: 5 },
    { pid: 7, qty: 12, disc: 0 },
    { pid: 2, qty: 24, disc: 8 },
    { pid: 10, qty: 6, disc: 0 },
    { pid: 5, qty: 120, disc: 12 },
    { pid: 3, qty: 48, disc: 0 },
    { pid: 17, qty: 200, disc: 10 },
    { pid: 19, qty: 60, disc: 6 },
    { pid: 6, qty: 36, disc: 0 },
    { pid: 8, qty: 24, disc: 0 },
];

export const CUSTOMERS = [
    { id: 1, name: 'Ahsan Traders', side: 'sell', ref: 'CUS-0041', phone: '0300-2244881', balance: 18400, terms: 'Net 30', discount: 5 },
    { id: 2, name: 'Bilal General Store', side: 'sell', ref: 'CUS-0088', phone: '0321-9080711', balance: 0, terms: 'Net 15', discount: 3 },
    { id: 3, name: 'Nadia Khan', side: 'sell', ref: 'CUS-0132', phone: '0333-1122009', balance: -1200, terms: 'Due on receipt', discount: 0 },
    { id: 4, name: 'Zaheer Wholesale', side: 'sell', ref: 'CUS-0007', phone: '0345-6677001', balance: 96500, terms: 'Net 60', discount: 8 },
    { id: 5, name: 'Café Rumi', side: 'sell', ref: 'CUS-0210', phone: '0301-4455332', balance: 3200, terms: 'Net 7', discount: 0 },
];

export const SUPPLIERS = [
    { id: 101, name: 'Sufi Traders', side: 'buy', ref: 'SUP-0012', phone: '042-35881100', balance: 240900, terms: 'Net 30', discount: 0 },
    { id: 102, name: 'Unilever Pakistan', side: 'buy', ref: 'SUP-0003', phone: '021-38101010', balance: 1_120_400, terms: 'Net 45', discount: 0 },
    { id: 103, name: 'Tapal Tea (Pvt) Ltd', side: 'buy', ref: 'SUP-0021', phone: '021-34530000', balance: 88000, terms: 'Net 30', discount: 0 },
    { id: 104, name: 'Ravi Distributors', side: 'buy', ref: 'SUP-0044', phone: '042-37220099', balance: 0, terms: 'Due on receipt', discount: 0 },
];

/**
 * A purchase order may not be addressed to a customer. The shipped pickers all
 * asked for `type=all`, which is how that became possible.
 */
export const partiesFor = (side) => (side === 'buy' ? SUPPLIERS : CUSTOMERS);

export const TERMS = [
    { id: 'receipt', label: 'Due on receipt', days: 0 },
    { id: 'net7', label: 'Net 7', days: 7 },
    { id: 'net15', label: 'Net 15', days: 15 },
    { id: 'net30', label: 'Net 30', days: 30 },
    { id: 'net45', label: 'Net 45', days: 45 },
    { id: 'net60', label: 'Net 60', days: 60 },
];

export const METHODS = ['Cash', 'Bank', 'Card', 'UPI', 'Credit', 'Cheque'];

export const ACCOUNTS = [
    { id: 1, name: 'Cash in hand', kind: 'cash' },
    { id: 2, name: 'Meezan · Current', kind: 'bank', code: '0102-7781' },
    { id: 3, name: 'HBL · Business', kind: 'bank', code: '0044-9902' },
    { id: 4, name: 'JazzCash merchant', kind: 'wallet', code: 'JC-88102' },
];

export const LOCATIONS = [
    { id: 1, name: 'Main warehouse', is_default: true },
    { id: 2, name: 'Ravi Road store' },
    { id: 3, name: 'Gulberg branch' },
];

export const PROJECTS = [
    { id: 1, name: 'Retail · Karachi' },
    { id: 2, name: 'Wholesale · Punjab' },
    { id: 3, name: 'Online' },
];

export const CURRENCIES = [
    { code: 'PKR', name: 'Pakistan Rupee', fx: 1 },
    { code: 'USD', name: 'US Dollar', fx: 278.5 },
    { code: 'AED', name: 'UAE Dirham', fx: 75.8 },
];

/** From settings.tax_rates — read by EVERY type, not only the sales invoice. */
export const TAX_RATES = [
    { id: 0, label: 'No tax', rate: 0 },
    { id: 1, label: 'GST 18%', rate: 18 },
    { id: 2, label: 'GST 17% + 1% further', rate: 18, breakdown: 'GST 17% + further 1%' },
    { id: 3, label: 'GST 5%', rate: 5 },
    { id: 4, label: 'Services 15%', rate: 15 },
];

export const GOODS_STATUS = ['Not received', 'Partially received', 'Received in full'];
export const DOC_STATUS = ['Draft', 'Sent', 'Accepted', 'Declined', 'Expired'];
export const FREQUENCIES = ['Weekly', 'Fortnightly', 'Monthly', 'Quarterly', 'Yearly'];
export const EXPENSE_CATEGORIES = ['Rent', 'Utilities', 'Salaries', 'Freight', 'Repairs', 'Marketing', 'Other'];

/** Documents you can start this one FROM — the "against document" field. */
export const SOURCE_DOCS = [
    { id: 'INV-000142', party: 'Ahsan Traders', at: '12 Aug 2026', total: 184_320 },
    { id: 'INV-000139', party: 'Zaheer Wholesale', at: '08 Aug 2026', total: 962_100 },
    { id: 'SO-000061', party: 'Bilal General Store', at: '02 Aug 2026', total: 47_800 },
    { id: 'BILL-000210', party: 'Sufi Traders', at: '28 Jul 2026', total: 1_204_000 },
];

export const RECENT_DOCS = [
    { id: 'INV-000147', type: 'sales_invoice', party: 'Bilal General Store', at: 'today 11:04', total: 62_400, status: 'Posted' },
    { id: 'INV-000146', type: 'sales_invoice', party: 'Café Rumi', at: 'today 09:52', total: 15_600, status: 'Posted' },
    { id: 'QT-000033', type: 'quotation', party: 'Nadia Khan', at: 'yesterday', total: 8_900, status: 'Sent' },
    { id: 'BILL-000211', type: 'purchase_invoice', party: 'Ravi Distributors', at: 'yesterday', total: 412_300, status: 'Posted' },
    { id: 'INV-000145', type: 'sales_invoice', party: 'Ahsan Traders', at: '19 Aug', total: 41_230, status: 'Draft' },
];

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

export const productById = (id, list = PRODUCTS) => list.find((p) => p.id === id);

export function searchProducts(term, list = PRODUCTS) {
    const q = String(term || '').trim().toLowerCase();
    if (!q) return { exact: null, matches: [] };
    const exact = list.find((p) => p.sku.toLowerCase() === q) || null;
    const matches = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
    );
    return { exact, matches };
}

/* Dates are plain strings here so nothing in this file depends on a clock. */
export const TODAY = '20 Aug 2026';
export const addDays = (label, days) => {
    // Deliberately naive: the real editor formats from a Date. This exists only
    // so "Terms writes the due date" is demonstrably true on screen.
    const [d, m, y] = label.split(' ');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dt = new Date(Number(y), months.indexOf(m), Number(d));
    dt.setDate(dt.getDate() + days);
    return `${String(dt.getDate()).padStart(2, '0')} ${months[dt.getMonth()]} ${dt.getFullYear()}`;
};

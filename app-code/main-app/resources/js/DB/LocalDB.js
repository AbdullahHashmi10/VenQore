import Dexie from 'dexie';

export const db = new Dexie('VenQore_Offline_DB');

db.version(3).stores({
    products: 'id, name, sku, barcode, category_id, brand_id, unit_id', // Core product data
    customers: 'id, name, phone, email, balance', // Parties (Customers/Suppliers)
    suppliers: 'id, name, phone, email, balance',
    orders: 'id, date, status, [status+date], customer_id', // Sales
    invoices: 'id, invoice_number, date, customer_id, total_amount, status, [status+date]',
    inventory: 'id, product_id, godown_id, quantity', // Stock levels
    settings: 'key, value', // For config and DRM (last_online_verify)
    users: 'id, pin_hash, role', // Auth
    taxes: 'id, name, rate_percent',
    sales_queue: '++id, created_at, status', // For offline POS sync queue
    offline_invoices: '++id, invoice_number, created_at', // Offline history
    sync_queue: '++id, table, action, data, timestamp' // Generic sync queue
});

// v4 (sale reliability, Oct 2026) — ADDITIVE: sales_queue gains indexes for
// the store it belongs to and its receipt key. No table is cleared and no row
// is rewritten: rows queued by older builds keep everything they had and are
// held for review if they carry no store identity (see useOfflineSync).
db.version(4).stores({
    sales_queue: '++id, created_at, status, tenant_id, intent_key, [tenant_id+status]',
});

// Initialize Settings if empty
db.on('populate', () => {
    db.settings.add({ key: 'last_online_verify', value: Date.now() });
});

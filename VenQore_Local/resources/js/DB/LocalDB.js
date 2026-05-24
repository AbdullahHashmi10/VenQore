import Dexie from 'dexie';

export const db = new Dexie('VenQore_Offline_DB');

db.version(2).stores({
    products: 'id, name, sku, barcode, category_id, brand_id, unit_id', // Core product data
    customers: 'id, name, phone, email, balance', // Parties (Customers/Suppliers)
    suppliers: 'id, name, phone, email, balance',
    orders: 'id, date, status, [status+date], customer_id', // Sales
    invoices: 'id, invoice_number, date, customer_id, total_amount, status, [status+date]',
    inventory: 'id, product_id, godown_id, quantity', // Stock levels
    settings: 'key, value', // For config and DRM (last_online_verify)
    users: 'id, pin_hash, role', // Auth
    taxes: 'id, name, rate_percent',
    sync_queue: '++id, table, action, data, timestamp' // Generic sync queue
});

// Initialize Settings if empty
db.on('populate', () => {
    db.settings.add({ key: 'last_online_verify', value: Date.now() });
});


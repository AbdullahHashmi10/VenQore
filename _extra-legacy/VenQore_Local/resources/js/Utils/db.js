import Dexie from 'dexie';

export const db = new Dexie('venqore_db');

db.version(1).stores({
    products: 'id, sku, name, category_id, barcode', // Primary key and indexed props
    customers: 'id, name, phone, email',
    sales_queue: '++id, created_at, status', // For offline sync
    offline_invoices: '++id, invoice_number, created_at', // Local history
    settings: 'key, value'
});

// Helper to check connection
export const isOnline = () => navigator.onLine;

/**
 * What an OLD till build (Dexie schema v3, before sale reliability) leaves in
 * the browser: queue rows without a store, receipt key or payload version.
 */
import Dexie from 'dexie';

window.seedOldBuild = async (rows) => {
    const db = new Dexie('VenQore_Offline_DB');
    db.version(3).stores({
        products: 'id, name, sku, barcode, category_id, brand_id, unit_id',
        customers: 'id, name, phone, email, balance',
        suppliers: 'id, name, phone, email, balance',
        orders: 'id, date, status, [status+date], customer_id',
        invoices: 'id, invoice_number, date, customer_id, total_amount, status, [status+date]',
        inventory: 'id, product_id, godown_id, quantity',
        settings: 'key, value',
        users: 'id, pin_hash, role',
        taxes: 'id, name, rate_percent',
        sales_queue: '++id, created_at, status',
        offline_invoices: '++id, invoice_number, created_at',
        sync_queue: '++id, table, action, data, timestamp',
    });
    await db.open();
    await db.products.bulkPut([{ id: 'p1', name: 'Kept product', sku: 'K1' }]);
    for (const r of rows) await db.sales_queue.add(r);
    const n = await db.sales_queue.count();
    db.close();
    return { version: 3, rows: n };
};
window.__oldReady = true;

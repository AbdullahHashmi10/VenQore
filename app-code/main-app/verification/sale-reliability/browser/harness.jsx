/**
 * Browser harness: the REAL offline queue (useOfflineSync + Dexie LocalDB, v4
 * schema) running in Chromium against a small test server. Exposes the hook
 * on window.__queue for the Playwright tests.
 */
import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { useOfflineSync, newIntentKey } from '@/Hooks/useOfflineSync';
import { db } from '@/Utils/db';

window.route = (name, params = {}) => {
    const s = params.store_slug;
    if (name === 'store.pos.sales.store') return `/s/${s}/pos/sales`;
    if (name === 'store.pos.sales.intent') return `/s/${s}/pos/sales/intent/${params.intentKey}`;
    if (name === 'store.pos.queue-status') return `/s/${s}/pos/queue-status`;
    return `/s/${s}/pos/sales`;
};

function Harness() {
    const q = useOfflineSync();
    useEffect(() => {
        window.__queue = {
            ...q,
            newIntentKey,
            rows: () => db.sales_queue.toArray(),
            products: () => db.products.toArray(),
            dbVersion: () => db.verno,
        };
        window.__ready = true;
    });
    return null;
}

createRoot(document.getElementById('root')).render(<Harness />);

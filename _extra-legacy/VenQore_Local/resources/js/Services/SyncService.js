import { db } from '../DB/LocalDB';
import axios from 'axios';

export const SyncService = {
    /**
     * Main background sync loop. Call this periodically (e.g., every 30 mins).
     */
    async runBackgroundSync() {
        if (!navigator.onLine) return; // Silent exit if offline

        // Scoped Sync: Only sync if we are in a store context
        const storeSlug = this.getStoreSlug();
        if (!storeSlug) return;

        // Double check if we can actually reach the API
        const serverUp = await this.isServerReachable();
        if (!serverUp) {
            console.log('[Sync] Server unreachable. Skipping sync.');
            return;
        }

        console.log('[Sync] Starting background sync...');
        try {
            await this.syncOrders();
            await this.hydrate(); // Pull fresh data
            await this.pingHeartbeat(); // Update license timer
            console.log('[Sync] Background sync complete.');
        } catch (e) {
            // Suppress common network errors to avoid scaring the user
            if (e.message !== 'Network Error' && e.name !== 'ZiggyError') {
                console.error('[Sync] Background sync failed:', e);
            }
        }
    },

    getStoreSlug() {
        const parts = window.location.pathname.split('/');
        const sIndex = parts.indexOf('s');
        if (sIndex !== -1 && parts[sIndex + 1]) {
            return parts[sIndex + 1];
        }
        return null;
    },

    async isServerReachable() {
        try {
            const slug = this.getStoreSlug();
            if (!slug) return false;
            
            await axios.get(route('store.api.check-connection', { store_slug: slug }), {
                timeout: 10000,
                _skipGlobalErrorHandler: true
            });
            return true;
        } catch (e) {
            console.warn('[Sync] Connection check failed:', e.message);
            return false;
        }
    },

    /**
     * DRM / Licensing Check
     * Returns { blocked: boolean, message: string }
     */
    async checkLicensing() {
        try {
            const setting = await db.settings.get('last_online_verify');
            const lastCheck = setting ? setting.value : 0;
            const now = Date.now();
            const thirtyDays = 30 * 24 * 60 * 60 * 1000;
            const daysLeft = Math.ceil((thirtyDays - (now - lastCheck)) / (1000 * 60 * 60 * 24));

            // Hard Block Condition
            if (now - lastCheck > thirtyDays) {
                console.warn('[License] Offline limit exceeded. Attempting local verification...');

                // Try to hit the local server (regardless of internet)
                try {
                    await this.pingHeartbeat();
                    return { blocked: false, message: 'Verified locally' };
                } catch (e) {
                    // Only if LOCAL server fails do we block
                    return { blocked: true, message: 'Local Server Check Failed. Please restart the application.' };
                }
            }

            // Opportunistic Update
            if (navigator.onLine) {
                this.pingHeartbeat().catch(e => console.warn('Heartbeat failed, ignoring'));
            }

            return { blocked: false, daysLeft };
        } catch (e) {
            console.error('[License] Check failed:', e);
            return { blocked: true, message: 'System Integrity Check Failed' };
        }
    },

    /**
     * Updating the "Last Online" timestamp logic
     */
    async pingHeartbeat() {
        const slug = this.getStoreSlug();
        if (!slug) return false;

        await axios.post(route('store.api.heartbeat', { store_slug: slug }), {}, { _skipGlobalErrorHandler: true }); // Assume backend logs this
        await db.settings.put({ key: 'last_online_verify', value: Date.now() });
        console.log('[License] Heartbeat acknowledged. Timer reset.');
        return true;
    },

    /**
     * Uploads pending offline orders
     */
    async syncOrders() {
        const pendingOrders = await db.orders.where('status').equals('pending').toArray();
        if (pendingOrders.length === 0) return;

        const chunkSize = 50;
        for (let i = 0; i < pendingOrders.length; i += chunkSize) {
            const batch = pendingOrders.slice(i, i + chunkSize);
            try {
                const slug = this.getStoreSlug();
                if (!slug) break;

                // Determine API endpoint based on data type if needed, or send to generic
                await axios.post(route('store.api.sync.orders.batch', { store_slug: slug }), { orders: batch }, { _skipGlobalErrorHandler: true });

                // Mark as synced
                await db.transaction('rw', db.orders, async () => {
                    for (const order of batch) {
                        await db.orders.update(order.id, { status: 'synced' });
                    }
                });
            } catch (error) {
                console.error('[Sync] Order upload failed:', error);
                throw error;
            }
        }
    },

    /**
     * "Fetch Everything" - User Request
     * Downloads full catalog for offline supremacy.
     */
    async hydrate() {
        const resources = ['products', 'customers', 'suppliers', 'inventory', 'taxes'];
        const slug = this.getStoreSlug();
        if (!slug) return;

        for (const resource of resources) {
            try {
                // Map resource to route name
                const routeName = `store.api.sync.${resource}`;
                const response = await axios.get(route(routeName, { store_slug: slug }), { _skipGlobalErrorHandler: true });
                if (response.data && Array.isArray(response.data)) {
                    await db[resource].clear(); // Full refresh strategy for simplicity. Delta sync is complex.
                    await db[resource].bulkPut(response.data);
                    console.log(`[Sync] ${resource} hydrated: ${response.data.length} items.`);
                }
            } catch (e) {
                console.warn(`[Sync] Failed to hydrate ${resource}:`, e.message);
            }
        }

        // Users separately
        await this.downloadStaff();
    },

    async downloadStaff() {
        try {
            const slug = this.getStoreSlug();
            if (!slug) return;

            const response = await axios.get(route('store.api.sync.users', { store_slug: slug }), { _skipGlobalErrorHandler: true });
            if (response.data && Array.isArray(response.data)) {
                await db.users.clear();
                await db.users.bulkPut(response.data);
            }
        } catch (e) {
            console.error('[Sync] Staff download failed:', e);
        }
    }
};

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
     *
     * Two INDEPENDENT block conditions, checked every time this runs
     * (on load, on 'online', and on manual retry — see OfflineLockScreen):
     *
     *   1. Gift Access Link / subscription expiry — the tenant's REAL
     *      expiry date (subscription_ends_at), synced down on every
     *      successful heartbeat. Checked directly against the device's own
     *      clock so it enforces immediately, online or fully offline, the
     *      moment that date passes — per explicit requirement, this does
     *      NOT wait for the existing 30-day "haven't phoned home" window.
     *   2. The pre-existing 30-day offline DRM window (unchanged below).
     *
     * Tamper resistance for #1 comes from the same principle already
     * proven by #2: the stored expiry date can only be refreshed by a
     * SUCCESSFUL server heartbeat. Setting the device clock backward can't
     * extend access — it can only make MORE of the stored data (that expiry
     * date, last_online_verify) look like it's "not reached yet," which is
     * the safe direction to fail in. Setting the clock forward can trigger
     * an early lock, but the very next successful online heartbeat corrects
     * it — same self-healing property the 30-day check already has.
     */
    async checkLicensing() {
        try {
            // ── Check 1: Gift/subscription expiry — direct date, immediate ──
            const expirySetting = await db.settings.get('subscription_ends_at');
            if (expirySetting && expirySetting.value) {
                const expiresAt = new Date(expirySetting.value).getTime();
                if (Date.now() >= expiresAt) {
                    // Past the stored expiry — try to reach the server first;
                    // it may have already been renewed/re-gifted since the
                    // last sync, in which case a fresh heartbeat clears this.
                    if (navigator.onLine) {
                        try {
                            const stillExpired = await this.pingHeartbeat();
                            if (stillExpired === false) {
                                return { blocked: false, message: 'Verified — access renewed' };
                            }
                        } catch (e) {
                            // Server unreachable despite navigator.onLine — fall through to block.
                        }
                    }
                    return {
                        blocked: true,
                        message: 'Your access period has ended. Please subscribe or contact support for a new access link — then reconnect to restore access.',
                    };
                }
            }

            // ── Check 2: existing 30-day offline DRM window (unchanged) ─────
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
     * Updating the "Last Online" timestamp logic.
     * Also persists the tenant's current subscription/gift expiry date and
     * view-only status, so checkLicensing() can enforce Check 1 above even
     * while fully offline.
     *
     * Returns true if the server reports the tenant is currently view-only
     * (i.e. still expired as of this heartbeat), false otherwise. Throws if
     * the request itself fails (server unreachable).
     */
    async pingHeartbeat() {
        const slug = this.getStoreSlug();
        if (!slug) return false;

        // Ensure a persistent device_id exists for browser clients to pass backend validation
        let deviceId = localStorage.getItem('browser_device_id');
        if (!deviceId) {
            deviceId = 'br_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            localStorage.setItem('browser_device_id', deviceId);
        }

        const response = await axios.post(
            route('store.api.heartbeat', { store_slug: slug }),
            { device_id: deviceId },
            { _skipGlobalErrorHandler: true }
        );
        await db.settings.put({ key: 'last_online_verify', value: Date.now() });

        const data = response?.data || {};
        if (data.subscription_ends_at) {
            await db.settings.put({ key: 'subscription_ends_at', value: data.subscription_ends_at });
        } else {
            // Unlimited plan (no expiry) or tenant not resolved — clear any
            // stale stored date so Check 1 doesn't enforce an outdated value.
            await db.settings.delete('subscription_ends_at');
        }

        console.log('[License] Heartbeat acknowledged. Timer reset.');
        return !!data.is_view_only;
    },

    /**
     * Uploads pending offline orders (the generic queue).
     *
     * Only rows that name THIS store are sent, and a row becomes 'synced' only
     * when the server's per-order result says that order was committed. A
     * batch status or a count cannot say WHICH order succeeded, so neither is
     * ever used to mark rows (sale-reliability plan §4).
     */
    async syncOrders() {
        const slug = this.getStoreSlug();
        if (!slug) return;
        const pendingOrders = (await db.orders.where('status').equals('pending').toArray())
            .filter(o => o.store_slug === slug || (o.store_slug === undefined && o.tenant_slug === slug));
        if (pendingOrders.length === 0) return;

        const chunkSize = 50;
        for (let i = 0; i < pendingOrders.length; i += chunkSize) {
            const batch = pendingOrders.slice(i, i + chunkSize);
            let response;
            try {
                response = await axios.post(route('store.api.sync.orders.batch', { store_slug: slug }), { orders: batch }, { _skipGlobalErrorHandler: true, timeout: 60000 });
            } catch (error) {
                console.error('[Sync] Order upload failed:', error);
                throw error;
            }
            const results = Array.isArray(response?.data?.results) ? response.data.results : [];
            const byId = new Map(results.map(r => [String(r.client_sale_id), r]));
            for (const order of batch) {
                const r = byId.get(String(order.client_sale_id ?? order.id));
                if (r && r.outcome === 'committed' && r.sale_id) {
                    await db.orders.update(order.id, { status: 'synced', sale_id: r.sale_id, synced_at: new Date().toISOString() });
                } else if (r && r.outcome === 'rejected') {
                    await db.orders.update(order.id, { status: 'needs_attention', last_error: r.message || r.code || 'Rejected' });
                } else {
                    await db.orders.update(order.id, { last_error: r?.message || 'Not confirmed by the server; will retry with the same id.' });
                }
            }
        }
    },

    /**
     * "Fetch Everything" — downloads the catalog for offline use.
     * Each table is replaced ATOMICALLY (clear + write in one transaction), so a
     * failed download or a storage error leaves the previous usable catalog in
     * place instead of an empty one. A resource the server withholds (empty
     * because of a plan gate, or not implemented — taxes) never wipes data.
     */
    async hydrate() {
        const resources = ['products', 'customers', 'suppliers', 'inventory', 'taxes'];
        const mayBeWithheld = new Set(['inventory', 'taxes']);
        const slug = this.getStoreSlug();
        if (!slug) return;

        for (const resource of resources) {
            try {
                const routeName = `store.api.sync.${resource}`;
                const response = await axios.get(route(routeName, { store_slug: slug }), { _skipGlobalErrorHandler: true });
                if (!response.data || !Array.isArray(response.data)) continue;
                if (response.data.length === 0 && mayBeWithheld.has(resource)) continue;
                await db.transaction('rw', db[resource], async () => {
                    await db[resource].clear();
                    await db[resource].bulkPut(response.data);
                });
                try {
                    await db.settings?.put?.({ key: `catalog_${resource}_synced_at`, value: { store: slug, at: Date.now(), count: response.data.length } });
                } catch { /* metadata is best effort */ }
                console.log(`[Sync] ${resource} hydrated: ${response.data.length} items.`);
            } catch (e) {
                console.warn(`[Sync] Failed to hydrate ${resource}; kept the previous copy:`, e.message);
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
                await db.transaction('rw', db.users, async () => {
                    await db.users.clear();
                    await db.users.bulkPut(response.data);
                });
            }
        } catch (e) {
            console.error('[Sync] Staff download failed:', e);
        }
    }
};

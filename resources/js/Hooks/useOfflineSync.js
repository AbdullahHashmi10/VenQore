import { useState, useEffect } from 'react';
import { db, isOnline } from '@/Utils/db';
import axios from 'axios';
import { usePage } from '@inertiajs/react';

export const useOfflineSync = () => {
    const { store } = usePage().props;
    const [isSyncing, setIsSyncing] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);
    const [lastSyncTime, setLastSyncTime] = useState(null);
    // Map of { [sale.id]: string } — error messages from the last failed sync attempt per sale
    const [syncErrors, setSyncErrors] = useState({});

    // Check pending queue size
    const checkPending = async () => {
        const count = await db.sales_queue.where('status').equals('pending').count();
        setPendingCount(count);
    };

    // Sync function
    const syncPendingSales = async () => {
        if (!isOnline() || isSyncing) return;

        const pendingSales = await db.sales_queue.where('status').equals('pending').toArray();
        if (pendingSales.length === 0) {
            // No pending sales in DB — refresh the badge in case it's stale, then bail.
            await checkPending();
            return;
        }

        setIsSyncing(true);
        let syncedCount = 0;
        const newErrors = {};

        for (const sale of pendingSales) {
            try {
                // Attempt to send to server
                await axios.post(route("store.sales.store", {
                    store_slug: store.slug
                }), sale.data);

                // Successful — remove error and mark synced
                await db.sales_queue.update(sale.id, { status: 'synced', synced_at: new Date() });
                // Optionally delete: await db.sales_queue.delete(sale.id);
                syncedCount++;
            } catch (error) {
                console.error("Sync failed for sale:", sale.id, error);

                // Extract a human-readable error from the server response, if available
                const serverMessage =
                    error?.response?.data?.message ||
                    error?.response?.data?.error ||
                    (error?.response?.status ? `Server error ${error.response.status}` : null) ||
                    error?.message ||
                    'Unknown error';

                newErrors[sale.id] = serverMessage;

                // Increment attempt count so users can see how many retries have occurred
                const currentAttempts = sale.attempt_count || 0;
                await db.sales_queue.update(sale.id, {
                    attempt_count: currentAttempts + 1,
                    last_error: serverMessage,
                    last_attempt_at: new Date(),
                });
            }
        }

        setSyncErrors(prev => ({ ...prev, ...newErrors }));
        setIsSyncing(false);
        setLastSyncTime(new Date());
        checkPending();
        return syncedCount;
    };

    // Auto-sync when online
    useEffect(() => {
        checkPending();

        const handleOnline = () => syncPendingSales();
        window.addEventListener('online', handleOnline);

        // Periodic check
        const interval = setInterval(() => {
            if (isOnline()) syncPendingSales();
        }, 60000); // Check every minute

        return () => {
            window.removeEventListener('online', handleOnline);
            clearInterval(interval);
        };
    }, []);

    const saveOfflineSale = async (saleData) => {
        try {
            await db.sales_queue.add({
                data: saleData,
                created_at: new Date(),
                status: 'pending'
            });
            await checkPending();

            // Try to sync immediately if online
            if (isOnline()) {
                syncPendingSales();
            }
            return true;
        } catch (error) {
            console.error("Failed to save offline sale:", error);
            return false;
        }
    };

    const getPendingSales = async () => {
        return await db.sales_queue.where('status').equals('pending').toArray();
    };

    const deletePendingSale = async (id) => {
        await db.sales_queue.delete(id);
        await checkPending();
    };

    return {
        isSyncing,
        pendingCount,
        lastSyncTime,
        syncErrors,
        checkPending,
        saveOfflineSale,
        syncPendingSales,
        getPendingSales,
        deletePendingSale
    };
};

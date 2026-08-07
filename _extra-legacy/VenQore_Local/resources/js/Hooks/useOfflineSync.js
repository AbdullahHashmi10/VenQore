import { useState, useEffect } from 'react';
import { db, isOnline } from '@/Utils/db';
import axios from 'axios';

export const useOfflineSync = () => {
    const [isSyncing, setIsSyncing] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);
    const [lastSyncTime, setLastSyncTime] = useState(null);

    // Check pending queue size
    const checkPending = async () => {
        const count = await db.sales_queue.where('status').equals('pending').count();
        setPendingCount(count);
    };

    // Sync function
    const syncPendingSales = async () => {
        if (!isOnline() || isSyncing) return;

        const pendingSales = await db.sales_queue.where('status').equals('pending').toArray();
        if (pendingSales.length === 0) return;

        setIsSyncing(true);
        let syncedCount = 0;

        for (const sale of pendingSales) {
            try {
                // Attempt to send to server
                await axios.post(route("store.sales.store", {
                    store_slug: store.slug
                }), sale.data);

                // If successful, remove from queue or mark synced
                await db.sales_queue.update(sale.id, { status: 'synced', synced_at: new Date() });
                // Optionally delete: await db.sales_queue.delete(sale.id);
                syncedCount++;
            } catch (error) {
                console.error("Sync failed for sale:", sale.id, error);
                // Keep in queue, maybe add retry count
            }
        }

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
        saveOfflineSale,
        syncPendingSales,
        getPendingSales,
        deletePendingSale
    };
};

/**
 * useOccupancy.js
 *
 * Headless hook to manage position occupancy (tables, chairs, rooms) status
 * and mirror status changes into offline Dexie storage.
 */

import { useState, useCallback } from 'react';
import axios from 'axios';
import { db, isOnline } from '@/Utils/db';

export function useOccupancy(storeSlug) {
    const [occupancies, setOccupancies] = useState([]);
    const [loading, setLoading] = useState(false);

    const loadOccupancies = useCallback(async () => {
        setLoading(false);
        try {
            if (isOnline()) {
                const response = await axios.get(route('store.api.occupancies', { store_slug: storeSlug }));
                setOccupancies(response.data || []);
            } else {
                // Fetch from offline indexedDB
                if (db.restaurant_tables) {
                    const tables = await db.restaurant_tables.toArray();
                    setOccupancies(tables);
                }
            }
        } catch (error) {
            console.error("Failed to load occupancy data:", error);
        } finally {
            setLoading(false);
        }
    }, [storeSlug]);

    const occupyPosition = useCallback(async (positionId, details = {}) => {
        try {
            if (isOnline()) {
                await axios.post(route('store.api.occupancies.occupy', { store_slug: storeSlug }), {
                    position_id: positionId,
                    ...details
                });
            }
            // Update offline DB representation
            if (db.restaurant_tables) {
                await db.restaurant_tables.update(positionId, { status: 'occupied', order_total: details.order_total || 0 });
            }
            await loadOccupancies();
        } catch (error) {
            console.error("Failed to occupy position:", error);
        }
    }, [storeSlug, loadOccupancies]);

    const releasePosition = useCallback(async (positionId) => {
        try {
            if (isOnline()) {
                await axios.post(route('store.api.occupancies.release', { store_slug: storeSlug }), {
                    position_id: positionId
                });
            }
            if (db.restaurant_tables) {
                await db.restaurant_tables.update(positionId, { status: 'available', order_total: 0 });
            }
            await loadOccupancies();
        } catch (error) {
            console.error("Failed to release position:", error);
        }
    }, [storeSlug, loadOccupancies]);

    return {
        occupancies,
        loading,
        loadOccupancies,
        occupyPosition,
        releasePosition
    };
}

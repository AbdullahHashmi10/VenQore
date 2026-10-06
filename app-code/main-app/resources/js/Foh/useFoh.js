/**
 * The FOH screen's state: the floor (via the shared table service), which
 * order is open, and the URL (?order=ID) so a refresh or a shared link lands
 * on the same order. Everything about an order's lines lives in useFohOrder.
 */
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useTableService } from '@/Pos/Table/useTableService';

export const toast = (message, type = 'info') => {
    if (!message) return;
    window.dispatchEvent(new CustomEvent('amd:toast', { detail: { message, type } }));
};

export default function useFoh({ storeSlug, floorState, fohSettings, tab, orderId }) {
    const lanes = useMemo(() => ({
        takeaway: !!fohSettings?.takeaway, delivery: !!fohSettings?.delivery,
    }), [fohSettings]);

    const tables = useTableService({
        enabled: true,
        storeSlug,
        initialPositions: floorState?.positions || [],
        initialTickets: floorState?.tickets || [],
        initialZones: floorState?.zones || [],
        initialKitchen: floorState?.kitchen || 0,
        lanes,
        pollMs: tab === 'overview' ? 8000 : 15000,
        onError: (m) => toast(m, 'error'),
        onNotice: (m) => toast(m, 'success'),
    });

    /* Deep link: ?order=<occupancy id> selects that order once the floor is known. */
    const applied = useRef(false);
    useEffect(() => {
        if (applied.current || !orderId) return;
        const hit = [...tables.positions, ...tables.tickets].find((c) => c.occupancy_id === orderId);
        if (hit) { tables.select(hit.id); applied.current = true; }
    }, [orderId, tables.positions, tables.tickets]); // eslint-disable-line react-hooks/exhaustive-deps

    /* Keep ?order= in step with the selection without adding history entries. */
    const occ = tables.selected?.occupancy_id || null;
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const url = new URL(window.location.href);
        if (occ) url.searchParams.set('order', String(occ)); else url.searchParams.delete('order');
        window.history.replaceState(window.history.state, '', url.toString());
    }, [occ]);

    const openOrder = useCallback((card) => tables.select(card.id), [tables]);
    const enabledTypes = useMemo(() => ['dine_in', 'takeaway', 'delivery'].filter((t) => (
        t === 'dine_in' ? !!fohSettings?.tables : !!fohSettings?.[t]
    )), [fohSettings]);

    return { tables, openOrder, enabledTypes, lanes };
}

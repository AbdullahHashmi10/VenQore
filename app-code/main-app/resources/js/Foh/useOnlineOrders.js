/**
 * Live online-store orders for the FOH screen. They are polled from the server
 * (store.foh.online) and every action goes through the same OrderService the
 * Online Orders inbox uses, so the two screens can never disagree.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';

const beep = () => {
    try {
        const Ctx = window.AudioContext || window.webkitAudioContext; if (!Ctx) return;
        const ctx = new Ctx(); const o = ctx.createOscillator(); const g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = 880; g.gain.value = 0.06; o.connect(g); g.connect(ctx.destination);
        o.start(); o.stop(ctx.currentTime + 0.18); setTimeout(() => ctx.close(), 400);
    } catch { /* no audio on this device */ }
};

export default function useOnlineOrders({ storeSlug, enabled, pollMs = 12000, sound = true, onNew, onError }) {
    const [orders, setOrders] = useState([]);
    const [busy, setBusy] = useState(false);
    const seen = useRef(null);
    const cb = useRef({ onNew, onError, sound }); cb.current = { onNew, onError, sound };

    const load = useCallback(async () => {
        if (!enabled || (typeof document !== 'undefined' && document.hidden)) return;
        try {
            const { data } = await axios.get(route('store.foh.online', { store_slug: storeSlug }));
            const list = data?.orders || [];
            setOrders(list);
            const pending = new Set(list.filter(o => o.status === 'pending').map(o => o.id));
            if (seen.current) {
                const fresh = list.filter(o => o.status === 'pending' && !seen.current.has(o.id));
                if (fresh.length) { if (cb.current.sound) beep(); cb.current.onNew?.(fresh); }
            }
            seen.current = pending;
        } catch { /* a missed poll is not an error worth a toast */ }
    }, [enabled, storeSlug]);

    useEffect(() => {
        if (!enabled) return undefined;
        load();
        const t = setInterval(load, pollMs);
        const vis = () => { if (!document.hidden) load(); };
        document.addEventListener('visibilitychange', vis);
        return () => { clearInterval(t); document.removeEventListener('visibilitychange', vis); };
    }, [enabled, load, pollMs]);

    const act = useCallback(async (order, action, extra = {}) => {
        setBusy(true);
        try {
            await axios.post(route('store.foh.online.act', { store_slug: storeSlug, id: order.id }), { action, version: order.version, ...extra });
            await load();
            return true;
        } catch (e) {
            cb.current.onError?.(e?.response?.data?.message || 'That did not go through. Refresh and try again.');
            await load();
            return false;
        } finally { setBusy(false); }
    }, [storeSlug, load]);

    return { orders, busy, act, reload: load };
}

/** Which FOH tab an online order belongs to. */
export const onlineTab = (o) => (o.fulfilment === 'delivery' ? 'delivery' : 'takeaway');

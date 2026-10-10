import { useCallback, useEffect, useMemo, useState } from 'react';
import { cartStore } from '@/lib/commerce';
import { shopToast } from '@/Components/Commerce/PublicShell';

/**
 * The guest cart for one business, shared by every store page.
 * Lines hold only ids, quantities and display hints: prices always come from the server quote.
 * Same storage and line shape as the QR menu, so a cart survives moving between pages.
 */
const EVENT = 'vqs-cart';
const FOREIGN = 'vqs-cart-foreign';
let pendingAdd = null; // an add waiting for "replace the other business's cart?"

export const modsKey = (mods) => (mods || []).map((m) => m.id).sort((a, b) => a - b).join(',');
export const lineKey = (l) => l.key || l.item_id;
export const modsDelta = (mods) => (mods || []).reduce((n, m) => n + (Number(m.price_delta) || 0), 0);

export function useShopCart(slug, maxQty = 50) {
    const [rev, setRev] = useState(0);

    useEffect(() => {
        const bump = () => setRev((r) => r + 1);
        window.addEventListener(EVENT, bump);
        window.addEventListener('storage', bump);
        return () => { window.removeEventListener(EVENT, bump); window.removeEventListener('storage', bump); };
    }, []);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const cart = useMemo(() => { const c = cartStore.read(); return c.slug === slug ? c : { slug, lines: [] }; }, [slug, rev]);

    const persist = useCallback((lines) => {
        cartStore.write({ slug, lines });
        try { window.dispatchEvent(new Event(EVENT)); } catch { /* ignore */ }
    }, [slug]);

    const addNow = useCallback((item, mods, qty, fromEmpty, notes = '') => {
        const base = fromEmpty ? [] : [...cartStore.read().lines];
        // a different note on the same dish is a different line (the kitchen reads it per line)
        const note = String(notes || '').trim().slice(0, 200);
        const key = `${item.id}|${modsKey(mods)}${note ? `|n:${note}` : ''}`;
        const ex = base.find((l) => lineKey(l) === key);
        if (ex) ex.quantity = Math.min(maxQty, ex.quantity + qty);
        else base.push({ item_id: item.id, key, quantity: Math.min(maxQty, qty), mods, notes: note, name: item.label ? `${item.name} — ${item.label}` : item.name, image_url: item.image_url || null });
        persist(base);
        if (!item.quiet) shopToast(`${item.name} added to your bag`);
    }, [persist, maxQty]);

    /** Returns false when the bag holds another business's items and the shopper has to decide. */
    const add = useCallback((item, mods = [], qty = 1, notes = '') => {
        const cur = cartStore.read();
        if (cur.slug && cur.slug !== slug && cur.lines.length > 0) {
            pendingAdd = () => addNow(item, mods, qty, true, notes);
            try { window.dispatchEvent(new Event(FOREIGN)); } catch { /* ignore */ }
            return false;
        }
        addNow(item, mods, qty, false, notes);
        return true;
    }, [slug, addNow]);

    /** Change the note on a line ("no onions"). It becomes a different line, merged if the same already exists. */
    const setNote = useCallback((key, note) => {
        const text = String(note || '').trim().slice(0, 200);
        const next = [];
        cart.lines.forEach((l) => {
            if (lineKey(l) !== key) { next.push(l); return; }
            const nk = `${l.item_id}|${modsKey(l.mods)}${text ? `|n:${text}` : ''}`;
            const ex = next.find((x) => lineKey(x) === nk);
            if (ex) ex.quantity = Math.min(maxQty, ex.quantity + l.quantity);
            else next.push({ ...l, key: nk, notes: text });
        });
        persist(next);
    }, [cart.lines, persist, maxQty]);

    const setQty = useCallback((key, q) => {
        persist(cart.lines.map((l) => (lineKey(l) === key ? { ...l, quantity: Math.max(0, Math.min(maxQty, q)) } : l)).filter((l) => l.quantity > 0));
    }, [cart.lines, persist, maxQty]);

    const remove = useCallback((key) => persist(cart.lines.filter((l) => lineKey(l) !== key)), [cart.lines, persist]);
    const clear = useCallback(() => { cartStore.clear(); try { window.dispatchEvent(new Event(EVENT)); } catch { /* ignore */ } }, []);

    const count = cart.lines.reduce((n, l) => n + l.quantity, 0);
    const qtyOf = (itemId) => cart.lines.filter((l) => l.item_id === itemId).reduce((n, l) => n + l.quantity, 0);
    /** Lower or raise the latest line of an item that has no choices (the card stepper). */
    const nudge = (itemId, delta) => {
        const last = [...cart.lines].reverse().find((l) => l.item_id === itemId);
        if (last) setQty(lineKey(last), last.quantity + delta);
    };

    return { cart, count, add, setQty, setNote, remove, clear, qtyOf, nudge, persist };
}

/** Lets the layout show the "replace your bag?" notice that an add triggered. */
export function useForeignCartNotice() {
    const [open, setOpen] = useState(false);
    useEffect(() => {
        const on = () => setOpen(true);
        window.addEventListener(FOREIGN, on);
        return () => window.removeEventListener(FOREIGN, on);
    }, []);
    return {
        open,
        replace: () => { const f = pendingAdd; pendingAdd = null; setOpen(false); if (f) f(); },
        keep: () => { pendingAdd = null; setOpen(false); },
    };
}

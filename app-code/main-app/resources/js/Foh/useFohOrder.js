/**
 * The order in front of a FOH operator.
 *
 * FOH has no local "sale tabs": every order is a server-side occupancy (a table
 * or a TA-/DL- ticket) so two devices see the same order. This hook is the one
 * crossing between that JSON document and the live cart the screen edits:
 *
 *   load   once per occupancy (guarded by a ref, never by comparing carts, so
 *          the poll cannot throw away what is being typed)
 *   edit   add / qty / notes / course / remove, all on a local cart
 *   save   debounced through the table service (the ONLY writer of the cart)
 *   merge  guest QR lines (customer_pending) that arrive while it is open
 *
 * Money is NOT computed here: see Sell/core/cartMath.js.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { serverLineToCart } from '@/Pos/Table/useTableService';

const EMPTY_EXTRAS = { discountType: 'fixed', discountValue: 0, tipAmount: '', customer: null, walkInName: '', remarks: '' };

export const lineKey = (l) => l.lineId || l.cartItemId;

export default function useFohOrder({ tables, card }) {
    const occId = card?.occupancy_id || null;
    const [cart, setCartState] = useState([]);
    const [extras, setExtras] = useState(EMPTY_EXTRAS);
    const loaded = useRef(null);
    const cartRef = useRef(cart);
    cartRef.current = cart;

    const setCart = useCallback((next) => {
        setCartState((prev) => {
            const v = typeof next === 'function' ? next(prev) : next;
            cartRef.current = v;
            return v;
        });
    }, []);

    /* LOAD — once per occupancy. */
    useEffect(() => {
        if (!occId) {
            loaded.current = null;
            setCartState([]);
            setExtras(EMPTY_EXTRAS);
            return;
        }
        if (loaded.current === occId) return;
        loaded.current = occId;
        const lines = (card.cart || []).map(serverLineToCart);
        tables.prime(lines);
        setCartState(lines);
        cartRef.current = lines;
        setExtras({ ...EMPTY_EXTRAS, remarks: card.note || '' });
    }, [occId]); // eslint-disable-line react-hooks/exhaustive-deps

    /* MERGE — QR lines from a guest while this order is open. */
    useEffect(() => {
        if (!occId || loaded.current !== occId || Number(card?.customer_pending) < 1) return;
        const have = new Set(cartRef.current.map(lineKey));
        const arrived = (card.cart || []).filter((l) => l.customer_pending && !have.has(l.line_id)).map(serverLineToCart);
        if (!arrived.length) return;
        const merged = [...cartRef.current, ...arrived];
        tables.prime(merged);
        setCart(merged);
    }, [occId, card?.customer_pending, card?.cart]); // eslint-disable-line react-hooks/exhaustive-deps

    /* SAVE — every edit goes back, debounced. */
    useEffect(() => {
        if (!occId || loaded.current !== occId) return;
        tables.pushOrder(occId, cart, { covers: card.covers, orderType: card.order_type, note: extras.remarks || '' });
    }, [cart, extras.remarks]); // eslint-disable-line react-hooks/exhaustive-deps

    const patchExtras = useCallback((p) => setExtras((e) => ({ ...e, ...p })), []);

    /** Add a product (optionally a variant and picked add-ons) as a line; the same dish with the same options adds to qty. */
    const addProduct = useCallback((product, variant = null, mods = null, price = null) => {
        const modKey = mods && mods.length ? '-' + mods.map((m) => m.id).sort().join('.') : '';
        const cartItemId = (variant ? `${product.id}-${variant.id}` : `${product.id}`) + modKey;
        const base = price != null ? Number(price) : Number(variant ? variant.price : product.price) || 0;
        const delta = (mods || []).reduce((a, m) => a + (Number(m.price_delta) || 0), 0);
        setCart((prev) => {
            const hit = prev.find((l) => (l.cartItemId === cartItemId || l.lineId === cartItemId) && !l.paidSaleId);
            if (hit) {
                return prev.map((l) => {
                    if (l !== hit) return l;
                    const qty = (Number(l.qty) || 1) + 1;
                    const sentQty = Number(l.sent_qty) || (l.sent ? Number(l.qty) || 1 : 0);
                    return { ...l, qty, sent: sentQty > 0 ? qty <= sentQty : false, sent_qty: sentQty };
                });
            }
            return [...prev, {
                cartItemId, lineId: cartItemId, id: product.id,
                variant_id: variant ? variant.id : null,
                name: variant ? `${product.name} (${variant.name || variant.sku})` : product.name,
                type: product.type || 'standard',
                /* original_price is the full list price INCLUDING add-ons (every total and payload reads it);
                   basePrice is the item alone — the table service stores that and re-adds the deltas. */
                price: base + delta, original_price: base + delta, basePrice: base,
                mods: mods || [],
                sent: false, sent_qty: 0, discount: 0, qty: 1, freeQuantity: 0,
                stock: Number.MAX_SAFE_INTEGER, unit: product.base_unit || product.unit || 'pcs',
                tax_rate: Number(product.tax_rate) || 0,
                category: product.category_name || product.category?.name || 'General',
                course: 1, notes: '',
            }];
        });
    }, [setCart]);

    const setQty = useCallback((key, qty) => {
        setCart((prev) => prev.flatMap((l) => {
            if (lineKey(l) !== key) return [l];
            const q = Math.round(Number(qty) * 1000) / 1000;
            if (!(q > 0)) return [];
            const sentQty = Number(l.sent_qty) || (l.sent ? Number(l.qty) || 1 : 0);
            return [{ ...l, qty: q, sent: sentQty > 0 ? q <= sentQty : false, sent_qty: Math.min(sentQty, q) }];
        }));
    }, [setCart]);

    const patchLine = useCallback((key, patch) => setCart((prev) => prev.map((l) => (lineKey(l) === key ? { ...l, ...patch } : l))), [setCart]);
    const removeLine = useCallback((key) => setCart((prev) => prev.filter((l) => lineKey(l) !== key)), [setCart]);

    const unsentCount = useMemo(() => cart.reduce((n, l) => {
        const q = Number(l.qty) || 0;
        const sent = Number(l.sent_qty) || (l.sent ? q : 0);
        return n + Math.max(0, q - sent);
    }, 0), [cart]);

    /** Mark every line as fired locally (the server stamps the real thing). */
    const markFired = useCallback(() => setCart((prev) => prev.map((l) => ({ ...l, sent: true, sent_qty: Number(l.qty) || 1 }))), [setCart]);

    /** Replace the cart with a subset (a split-by-item part going to the till). */
    const replaceCart = useCallback((lines) => { tables.prime(lines); setCart(lines); }, [setCart, tables]);

    return { cart, setCart, extras, patchExtras, addProduct, setQty, patchLine, removeLine, unsentCount, markFired, replaceCart, occId, getCart: () => cartRef.current };
}

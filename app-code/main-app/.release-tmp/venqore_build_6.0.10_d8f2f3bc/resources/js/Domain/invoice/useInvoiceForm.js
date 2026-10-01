/**
 * useInvoiceForm.js
 *
 * Headless hook — ALL non-render logic for the invoice / sale form.
 *
 * Consumed by:
 *   - Pages/Sales/CreateInvoice.jsx  (classic shell — existing markup unchanged)
 *   - Next/Screens/Invoice/InvoiceForm.jsx  (new shell — new markup, same hook)
 *
 * Contract (from 04_UI_PROGRAM.md §02.1):
 *   A page component may contain NO logic.
 *   It may: read from this hook, render markup, call handlers the hook returned.
 *   It may NOT: fetch, transform, validate, calculate, or decide.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { blankLine, blankInvoice, saleToInvoiceState } from './invoiceSchema';

// ---------------------------------------------------------------------------
// Pure arithmetic helpers — no React, always safe to unit-test in isolation
// ---------------------------------------------------------------------------

/** Compute per-line discount amount (supports fixed + percent). */
export function lineDiscount(item) {
    const lineSubtotal = item.quantity * item.price;
    if (item.discountType === 'percent') {
        return lineSubtotal * ((item.discount || 0) / 100);
    }
    return parseFloat(item.discount) || 0;
}

/** Gross value of one line including free-quantity qty but before discounts. */
export function lineGross(item) {
    return (item.quantity + (item.freeQuantity || 0)) * item.price;
}

/**
 * Compute all invoice totals from the current invoice state.
 *
 * Returns:
 *   subtotal, itemDiscounts, afterItemDiscounts, invoiceDiscount,
 *   afterDiscount, taxAmount, deliveryCharge, extraCharge,
 *   rawGrandTotal, grandTotal, totalCost, balanceDue, profit
 */
export function computeTotals(invoice, settings = {}) {
    const items = invoice?.items || [];

    const subtotal = items.reduce((s, i) => s + lineGross(i), 0);
    const totalCost = items.reduce((s, i) => s + ((i.quantity + (i.freeQuantity || 0)) * (i.cost || 0)), 0);
    const itemDiscounts = items.reduce((s, i) => {
        const freeItemValue = (i.freeQuantity || 0) * i.price;
        return s + lineDiscount(i) + freeItemValue;
    }, 0);

    const afterItemDiscounts = subtotal - itemDiscounts;
    const invoiceDiscount = parseFloat(invoice?.discount) || 0;
    const afterDiscount = afterItemDiscounts - invoiceDiscount;

    const taxAmount = afterDiscount * ((parseFloat(invoice?.tax) || 0) / 100);
    const deliveryCharge = parseFloat(invoice?.delivery_charge) || 0;

    let extraCharge = 0;
    if (invoice?.extraFields?.length) {
        extraCharge = invoice.extraFields.reduce((s, f) => s + (parseFloat(f.value) || 0), 0);
    } else {
        extraCharge = parseFloat(invoice?.extra_charge_value) || 0;
    }

    const rawGrandTotal = afterDiscount + taxAmount + deliveryCharge + extraCharge;

    // Honour the `round_totals` setting using the same rounding used in the classic shell
    const roundingEnabled = settings?.round_totals === '1';
    const grandTotal = roundingEnabled ? Math.round(rawGrandTotal) : parseFloat(rawGrandTotal.toFixed(2));

    const balanceDue = grandTotal - (parseFloat(invoice?.amountPaid) || 0);
    const profit = grandTotal - totalCost;

    return {
        subtotal, itemDiscounts, afterItemDiscounts,
        invoiceDiscount, afterDiscount,
        taxAmount, deliveryCharge, extraCharge,
        rawGrandTotal, grandTotal, totalCost,
        balanceDue, profit,
    };
}

// ---------------------------------------------------------------------------
// The hook
// ---------------------------------------------------------------------------

/**
 * @param {object|null} sale  - null for new invoice, server-shaped object for edit
 */
export function useInvoiceForm({ sale = null } = {}) {
    const { settings, store, auth } = usePage().props;

    const isEditMode = !!sale;
    const [invoice, setInvoice] = useState(() =>
        sale ? saleToInvoiceState(sale) : blankInvoice(settings)
    );

    // Sync edit-mode invoice if the `sale` prop changes (e.g. Inertia reload)
    useEffect(() => {
        if (sale) setInvoice(saleToInvoiceState(sale));
    }, [sale?.id]);

    const isPosted = isEditMode && invoice?.status === 'posted';

    // ── Patch helper ──────────────────────────────────────────────────────────
    const patch = useCallback((data) => {
        if (isPosted) return;
        setInvoice(prev => ({ ...prev, ...data }));
    }, [isPosted]);

    // ── Totals (derived, recomputed on every render — cheap) ──────────────────
    const totals = computeTotals(invoice, settings);

    // ── Auto-fill paid amount for cash POS mode ───────────────────────────────
    useEffect(() => {
        if (
            settings?.pos_auto_fill_cash === '1' &&
            !isEditMode &&
            invoice?.paymentMethod === 'cash'
        ) {
            patch({ amountPaid: totals.grandTotal });
        }
    }, [totals.grandTotal, settings?.pos_auto_fill_cash, invoice?.paymentMethod]);

    // ── Line operations ───────────────────────────────────────────────────────
    const addLine = useCallback(() => {
        patch({ items: [...(invoice?.items || []), blankLine()] });
    }, [invoice?.items, patch]);

    const removeLine = useCallback((lineId) => {
        const remaining = (invoice?.items || []).filter(i => i.id !== lineId);
        patch({ items: remaining.length ? remaining : [blankLine()] });
    }, [invoice?.items, patch]);

    const updateLine = useCallback((lineId, changes) => {
        patch({
            items: (invoice?.items || []).map(i =>
                i.id === lineId ? { ...i, ...changes } : i
            )
        });
    }, [invoice?.items, patch]);

    const setProduct = useCallback((lineId, product) => {
        if (!product) {
            updateLine(lineId, { product: null, name: '', price: 0, cost: 0, available_stock: null });
            return;
        }
        updateLine(lineId, {
            product,
            name: product.name,
            price: parseFloat(product.price || product.selling_price || 0),
            cost: parseFloat(product.cost || product.cost_price || 0),
            available_stock: parseFloat(product.stock_quantity || 0),
        });
    }, [updateLine]);

    // ── Product refresh (keeps in-flight items up to date after product edits) ─
    const refreshLineProducts = useCallback(async () => {
        const ids = (invoice?.items || []).filter(i => i.product?.id).map(i => i.product.id);
        if (!ids.length) return;
        try {
            const { data } = await axios.get(
                route('store.inventory.search', { store_slug: store?.slug }),
                { params: { ids } }
            );
            const map = Object.fromEntries((data || []).map(p => [p.id, p]));
            patch({
                items: (invoice?.items || []).map(item => {
                    if (!item.product?.id) return item;
                    const latest = map[item.product.id];
                    if (!latest) return item;
                    const isFinalized = isEditMode;
                    return {
                        ...item,
                        product: latest,
                        price: !isFinalized ? parseFloat(latest.price || latest.selling_price || 0) : item.price,
                        cost: !isFinalized ? parseFloat(latest.cost || latest.cost_price || 0) : item.cost,
                        available_stock: parseFloat(latest.stock_quantity || 0),
                    };
                })
            });
        } catch { /* silent — stale data is better than a crash */ }
    }, [invoice?.items, store?.slug, isEditMode, patch]);

    // ── Validation ────────────────────────────────────────────────────────────
    const [customerError, setCustomerError] = useState(false);
    const [invalidLines, setInvalidLines] = useState([]);

    const validate = useCallback(() => {
        let valid = true;
        const bad = [];

        const cust = invoice?.customer;
        if (!cust || typeof cust === 'string' || !cust.id) {
            setCustomerError(true);
            valid = false;
        } else {
            setCustomerError(false);
        }

        (invoice?.items || []).forEach((item, idx) => {
            if (item.name && (!item.product || !item.product.id)) {
                bad.push(idx);
                valid = false;
            }
        });
        setInvalidLines(bad);
        return valid;
    }, [invoice]);

    // ── AI Prefill (hand-off from AI Scan) ────────────────────────────────────
    const { aiPrefill } = usePage().props;
    const aiPrefillApplied = useRef(false);
    const [aiPrefillNotice, setAiPrefillNotice] = useState(null);

    useEffect(() => {
        if (!aiPrefill || isEditMode || aiPrefillApplied.current) return;
        aiPrefillApplied.current = true;

        const items = (aiPrefill.items || [])
            .filter(l => l.product)
            .map((l, i) => blankLine({
                id: Date.now() + i,
                product: l.product,
                name: l.name || l.product?.name,
                quantity: parseFloat(l.quantity) || 1,
                price: parseFloat(l.price) || 0,
                cost: parseFloat(l.product?.cost_price || 0),
                aiRawName: l.ai_raw_name || null,
            }));
        items.push(blankLine({ id: Date.now() + 9999 }));

        patch({
            customer: aiPrefill.party || null,
            items,
            notes: aiPrefill.notes || '',
            paymentMethod: aiPrefill.payment_method === 'credit' ? 'credit' : (aiPrefill.payment_method || 'cash'),
            ...(aiPrefill.date ? { date: aiPrefill.date } : {}),
        });

        setAiPrefillNotice({
            count: items.length - 1,
            party: aiPrefill.party?.name || null,
            reference: aiPrefill.reference || null,
        });
    }, [aiPrefill, isEditMode]);

    // ── Submitted payload builder ─────────────────────────────────────────────
    const buildPayload = useCallback((opts = {}) => {
        const validItems = (invoice?.items || []).filter(i => i.product?.id);
        return {
            customer_id: invoice?.customer?.id,
            date: invoice?.date,
            notes: invoice?.notes,
            discount: invoice?.discount || 0,
            tax: invoice?.tax || 0,
            delivery_charge: invoice?.delivery_charge || 0,
            extra_charge_value: invoice?.extra_charge_value || 0,
            extra_fields: invoice?.extraFields || [],
            amount_paid: invoice?.amountPaid || 0,
            payment_method: invoice?.paymentMethod || 'cash',
            items: validItems.map(i => ({
                product_id: i.product.id,
                quantity: i.quantity,
                free_quantity: i.freeQuantity || 0,
                unit_price: i.price,
                cost_price: i.cost,
                discount_amount: lineDiscount(i),
                discount_type: i.discountType,
            })),
            ...opts,
        };
    }, [invoice]);

    return {
        // State
        invoice,
        patch,
        isEditMode,
        isPosted,

        // Totals
        totals,

        // Line management
        addLine,
        removeLine,
        updateLine,
        setProduct,
        refreshLineProducts,

        // Validation
        validate,
        customerError,
        invalidLines,

        // AI prefill
        aiPrefillNotice,

        // Payload
        buildPayload,
    };
}

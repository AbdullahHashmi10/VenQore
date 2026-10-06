/**
 * Sale Core — the exact body POSTed to store.pos.sales.store, as pure functions.
 *
 * Moved out of Pos.jsx processCheckout WITHOUT changing a key, a default or the
 * order of operations. The golden fixtures compare the whole body byte for byte.
 * (Manager-approval stamping — withApproval — stays with the caller.)
 */

/**
 * Cash lines never record more than is still owed (the rest is change), so a
 * walk-in cash sale cannot post a debit larger than the invoice.
 */
export function clampPayments(payments, cartTotal) {
    let remainingInvoiceTotal = cartTotal;
    return (payments || []).map(p => {
        const isCash = p.method === 'cash';
        const originalAmount = parseFloat(p.amount) || 0;

        if (isCash) {
            // Cash payment cannot record a debit larger than the remaining invoice balance
            const cashPortion = Math.min(originalAmount, remainingInvoiceTotal);
            remainingInvoiceTotal = Math.max(0, remainingInvoiceTotal - cashPortion);
            return { ...p, amount: cashPortion };
        }
        remainingInvoiceTotal = Math.max(0, remainingInvoiceTotal - originalAmount);
        return p;
    });
}

export function buildSaleItems(cart) {
    return cart.map(item => {
        const orig = Number(item.original_price ?? item.price ?? 0);
        const cur = Number(item.price ?? 0);
        const unitDiscount = Math.max(0, orig - cur) || Number(item.discount || 0);
        const lineDiscount = unitDiscount * Number(item.qty || 0);
        return {
            product_id: item.id,
            variant_id: item.variant_id,
            quantity: item.qty,
            free_quantity: item.freeQuantity || 0,
            price: orig,
            discount: lineDiscount,
            discount_type: 'fixed',
            /* Add-ons explain `price` (it already includes them); the key is
               left out when there are none so a plain line is unchanged. */
            ...(Array.isArray(item.mods) && item.mods.length ? {
                modifiers: item.mods.map(m => ({ id: m.id ?? null, name: m.name, price_delta: Number(m.price_delta) || 0 })),
            } : {}),
        };
    });
}

/**
 * @param {object} i
 * @param {object} i.sale          active sale
 * @param {object} i.totals        result of computeTotals()
 * @param {object} i.paymentData   { payments, notes }
 * @param {boolean} i.addToLedger
 * @param {object|null} i.registerShift
 * @param {object} i.settings
 * @param {*} i.warehouseId
 */
export function buildSalePayload({ sale, totals, paymentData, addToLedger = false, registerShift, settings, warehouseId }) {
    const { cartTotal, taxAmount, taxRate, taxInclusive, globalDiscount, additionalCharges, serviceCharge, tipAmount } = totals;
    return {
        items: buildSaleItems(sale.cart),
        customer_id: sale.customer?.id || null,
        walk_in_name: sale.customer?.id ? null : ((sale.walkInName || '').trim() || null),
        register_shift_id: registerShift?.id || null,
        register_id: settings?.register_id || 'REG-1',
        payment_method: 'split',
        warehouse_id: warehouseId,
        payments: clampPayments(paymentData.payments, cartTotal),
        amount_paid: cartTotal, // Always count cartTotal as net paid internally
        tax: taxAmount,
        tax_rate: taxRate,
        tax_inclusive: taxInclusive,
        discount: globalDiscount,
        delivery_charge: (sale.additionalChargesLabel?.toLowerCase().includes('delivery') ? additionalCharges : 0) || (sale.delivery_charge || 0),
        extra_charge_value: additionalCharges,
        extra_charge_label: additionalCharges > 0 ? (sale.additionalChargesLabel || 'Additional charge') : null,
        service_charge: serviceCharge,
        tip_amount: tipAmount,
        notes: sale.remarks || sale.notes || paymentData.notes || '',
        add_to_ledger: addToLedger,
        source: 'pos',
        is_dropship: sale.is_dropship || false,
    };
}

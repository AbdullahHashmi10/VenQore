/**
 * Sale Core — the exact body POSTed to store.pos.sales.store, as pure functions.
 *
 * Contract v2 (sale-reliability plan): amounts are exact paisa, each charge is
 * sent once in its own field, the money actually handed over is kept apart
 * from the money applied to the invoice, and the client's expected total rides
 * along so the server refuses to post a different number.
 * (Manager-approval stamping — withApproval — stays with the caller.)
 */
import { dec, toMinor, fromMinor, mul, sub } from './money';
import { CALCULATION_VERSION } from './saleTotals';

const n6 = (v) => { const n = Number(v); return Number.isFinite(n) ? Number(n.toFixed(6)) : 0; };
const minorOf = (v) => toMinor(dec(n6(v)));

/**
 * Applied payment lines: cash never records more than is still owed (the rest
 * is change), unless the excess is being kept as the customer's advance.
 * Pure exact arithmetic; the order of non-cash lines never changes what is owed.
 */
export function clampPayments(payments, cartTotal, { keepExcess = false } = {}) {
    let remaining = minorOf(cartTotal);
    return (payments || []).map(p => {
        const amount = minorOf(p.amount);
        if (p.method === 'cash' && !keepExcess) {
            const applied = amount < remaining ? amount : (remaining > 0n ? remaining : 0n);
            remaining -= applied;
            return { ...p, amount: fromMinor(applied) };
        }
        remaining = remaining - amount > 0n ? remaining - amount : 0n;
        return { ...p, amount: fromMinor(amount) };
    });
}

function lineDiscount(item) {
    const orig = dec(n6(item.original_price ?? item.price ?? 0));
    const cur = dec(n6(item.price ?? 0));
    const qty = dec(n6(item.qty || 0));
    let unit = sub(orig, cur);
    if (unit.n <= 0n) unit = dec(Math.max(0, n6(item.discount || 0)));
    const disc = toMinor(mul(unit, qty));
    const gross = toMinor(mul(orig, qty));
    return fromMinor(disc > gross ? gross : disc);
}

export function buildSaleItems(cart) {
    return cart.map(item => {
        const orig = Number(item.original_price ?? item.price ?? 0);
        return {
            product_id: item.id,
            variant_id: item.variant_id,
            quantity: item.qty,
            free_quantity: item.freeQuantity || 0,
            price: orig,
            discount: lineDiscount(item),
            discount_type: 'fixed',
            /* Add-ons explain `price` (it already includes them); the key is
               left out when there are none so a plain line is unchanged. */
            ...(Array.isArray(item.mods) && item.mods.length ? {
                modifiers: item.mods.map(m => ({ id: m.id ?? null, name: m.name, price_delta: Number(m.price_delta) || 0 })),
            } : {}),
        };
    });
}

/** Delivery is a typed charge: it goes in delivery_charge OR extra_charge_value, never both. */
export function splitCharges(sale, additionalCharges) {
    const isDelivery = /delivery/i.test(sale.additionalChargesLabel || '');
    return {
        delivery_charge: isDelivery ? additionalCharges : 0,
        extra_charge_value: isDelivery ? 0 : additionalCharges,
        extra_charge_label: !isDelivery && additionalCharges > 0 ? (sale.additionalChargesLabel || 'Additional charge') : null,
    };
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
    const keepExcess = !!(addToLedger && sale.customer?.id);
    const payments = clampPayments(paymentData.payments, cartTotal, { keepExcess });
    // Physically handed over: money methods only. A 'credit' leg is a promise
    // (receivable), never cash in the drawer and never a source of change.
    const tendered = (paymentData.payments || []).filter(p => p.method !== 'credit').reduce((a, p) => a + minorOf(p.amount), 0n);
    // The notes handed over for the cash part — the only basis for cash change.
    const cashTendered = (paymentData.payments || []).filter(p => p.method === 'cash').reduce((a, p) => a + minorOf(p.amount), 0n);
    const applied = payments.filter(p => p.method !== 'credit').reduce((a, p) => a + minorOf(p.amount), 0n);
    const invoice = minorOf(cartTotal);
    // Change is cash handed back: never more than the cash given, and none when
    // part of the bill is going on credit or the excess is kept as an advance.
    const hasCredit = (paymentData.payments || []).some(p => p.method === 'credit' && minorOf(p.amount) > 0n);
    const over = tendered - invoice > 0n ? tendered - invoice : 0n;
    const change = keepExcess || hasCredit ? 0n : (over < cashTendered ? over : cashTendered);
    return {
        items: buildSaleItems(sale.cart),
        customer_id: sale.customer?.id || null,
        walk_in_name: sale.customer?.id ? null : ((sale.walkInName || '').trim() || null),
        register_shift_id: registerShift?.id || null,
        register_id: settings?.register_id || 'REG-1',
        payment_method: 'split',
        warehouse_id: warehouseId,
        payments,
        // Money applied to this invoice (not the cash handed over; see tendered_amount).
        amount_paid: fromMinor(applied),
        tendered_amount: fromMinor(tendered),
        cash_tendered: fromMinor(cashTendered),
        change_return: fromMinor(change),
        tax: taxAmount,
        tax_rate: taxRate,
        tax_inclusive: taxInclusive,
        // The register's tax switch is the operator's decision; without this the
        // server would still charge a product's own rate the screen never showed.
        tax_exempt: totals.taxEnabled === false,
        discount: globalDiscount,
        ...splitCharges(sale, additionalCharges),
        service_charge: serviceCharge,
        tip_amount: tipAmount,
        bill_rounding: !!totals.billRounding,
        expected_total: cartTotal,
        calculation_version: CALCULATION_VERSION,
        notes: sale.remarks || sale.notes || paymentData.notes || '',
        add_to_ledger: addToLedger,
        source: 'pos',
        is_dropship: sale.is_dropship || false,
    };
}

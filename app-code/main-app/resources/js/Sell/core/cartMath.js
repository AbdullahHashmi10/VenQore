/**
 * Sale Core — the register's money arithmetic, as one pure function.
 *
 * Moved out of Pos.jsx WITHOUT changing a single operation or its order, so the
 * numbers stay identical to the paisa (proved by the golden fixtures in
 * resources/js/tests/fixtures/sale-core/). Do not "tidy" the maths here:
 * rounding order (service charge rounds to 2dp, tax does not, the total rounds
 * last) is behaviour the books already depend on.
 *
 * Cart-line convention (see Pos.jsx addToCart):
 *   original_price  full undiscounted unit price, INCLUDING add-ons
 *   price           what the customer pays per unit after a line discount
 *   freeQuantity    units given away (only counted while free-qty is enabled)
 */
import { roundTotal } from '@/Utils/settings';

/**
 * @param {object} i
 * @param {Array}  i.cart
 * @param {object} i.sale            the active sale (taxRate, taxInclusive, discountType, discountValue, discount, additionalCharges, tipAmount)
 * @param {object} i.settings        store settings (default_tax_rate, round_off_total, ...)
 * @param {boolean} i.enableTax
 * @param {boolean} i.enableFreeQty
 * @param {boolean} i.tableMode      service charge and tips exist only on the table terminal
 * @param {number}  i.serviceChargePct
 * @param {boolean} i.tipEnabled
 * @param {boolean} i.roundOff
 */
export function computeTotals({
    cart,
    sale,
    settings,
    enableTax,
    enableFreeQty,
    tableMode,
    serviceChargePct: serviceChargeSetting,
    tipEnabled,
    roundOff,
}) {
    const taxRate = enableTax ? (sale.taxRate !== undefined ? sale.taxRate : parseFloat(settings?.default_tax_rate || 0)) : 0;
    const taxInclusive = enableTax ? (sale.taxInclusive !== undefined ? sale.taxInclusive : false) : false;

    // Subtotal includes free items (gross sales value before line discounts)
    const subtotal = cart.reduce((acc, item) => {
        const unitGross = Number(item.original_price ?? item.price ?? 0);
        const qty = Number(item.qty || 0);
        const freeQty = enableFreeQty ? Number(item.freeQuantity || 0) : 0;
        return acc + (unitGross * (qty + freeQty));
    }, 0);

    // Calculate discounts
    const freeItemDiscounts = enableFreeQty ? cart.reduce((acc, item) => {
        const unitGross = Number(item.original_price ?? item.price ?? 0);
        return acc + (Number(item.freeQuantity || 0) * unitGross);
    }, 0) : 0;

    const itemDiscounts = cart.reduce((acc, item) => {
        const orig = Number(item.original_price ?? item.price ?? 0);
        const cur = Number(item.price ?? 0);
        const unitDiscount = Math.max(0, orig - cur) || Number(item.discount || 0);
        const qty = Number(item.qty || 0);
        return acc + (unitDiscount * qty);
    }, 0);

    // Global Discount Calculation (applied to net balance after line discounts)
    const subtotalAfterLineDiscounts = Math.max(0, subtotal - (freeItemDiscounts + itemDiscounts));
    let globalDiscount = 0;
    if (sale.discountType === 'percentage') {
        globalDiscount = (subtotalAfterLineDiscounts * (sale.discountValue || 0)) / 100;
    } else {
        globalDiscount = parseFloat(sale.discountValue !== undefined ? sale.discountValue : (sale.discount || 0)) || 0;
    }

    const totalDiscounts = freeItemDiscounts + itemDiscounts + globalDiscount;

    const taxableAmount = Math.max(0, subtotal - totalDiscounts);
    const taxAmount = enableTax
        ? (taxInclusive
            ? taxableAmount - (taxableAmount / (1 + taxRate / 100))
            : (taxableAmount * taxRate) / 100)
        : 0;
    const additionalCharges = parseFloat(sale.additionalCharges || 0);

    /* SERVICE CHARGE is the house's, a percentage of what was actually eaten
       (the discounted net). Counter tills never charge one. A TIP is the
       customer's money, typed per sale, never a percentage by default. */
    const serviceChargePct = tableMode ? (parseFloat(serviceChargeSetting) || 0) : 0;
    const serviceCharge = serviceChargePct > 0
        ? Math.round(((taxableAmount * serviceChargePct) / 100) * 100) / 100
        : 0;
    const tipAmount = tableMode && tipEnabled ? (parseFloat(sale.tipAmount || 0) || 0) : 0;

    const rawCartTotal = (taxInclusive ? taxableAmount : taxableAmount + taxAmount)
        + additionalCharges + serviceCharge + tipAmount;
    /* The drawer's switch decides WHETHER to round; `settings` decides to what
       precision. */
    const cartTotal = roundOff ? roundTotal(rawCartTotal, settings) : parseFloat(rawCartTotal || 0);

    return {
        taxRate, taxInclusive,
        subtotal, freeItemDiscounts, itemDiscounts, subtotalAfterLineDiscounts,
        globalDiscount, totalDiscounts, taxableAmount, taxAmount,
        additionalCharges, serviceChargePct, serviceCharge, tipAmount,
        rawCartTotal, cartTotal,
    };
}

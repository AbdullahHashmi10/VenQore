/**
 * Sale Core — the register's money arithmetic, as one pure function.
 *
 * Since calculation contract v2 (sale-reliability plan, Oct 2026) this is an
 * ADAPTER over Sell/core/saleTotals.js: it turns cart lines into the shared
 * calculation input and returns the same names the screens already read. The
 * server runs the identical calculation (app/Services/Sales/SaleTotals.php)
 * against the same fixtures, so the total shown is the total posted.
 *
 * What changed from v1 (deliberately; see docs/SALE_RELIABILITY_IMPLEMENTATION.md):
 *  - every amount is exact paisa — no float drift, no fractional paisa;
 *  - tax is charged per line (half-up), like the server always did;
 *  - a product with its own tax rate uses it (server rule), else the sale rate;
 *  - a bill discount is rounded once and spread over lines by largest remainder.
 *
 * Cart-line convention (see Pos.jsx addToCart):
 *   original_price    full undiscounted unit price, INCLUDING add-ons
 *   price             what the customer pays per unit after a line discount
 *   freeQuantity      units given away (only counted while free-qty is enabled)
 *   product_tax_rate  the product's own rate, when it has one (null → sale rate)
 */
import { calculateSale, CALCULATION_VERSION } from './saleTotals';
import { dec, sub, mul, toMinor, fromMinor, MoneyError } from './money';

/* Cart fields are JS numbers (a recalled line's unit discount is row/qty, e.g.
   3.3333333333333335). Six decimals is the input precision of the contract. */
const num = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? Number(n.toFixed(6)) : 0;
};

/** Per-line discount in minor units, never more than the line's gross. */
function lineDiscountMinor(item) {
    const orig = dec(num(item.original_price ?? item.price ?? 0));
    const cur = dec(num(item.price ?? 0));
    const qty = dec(num(item.qty || 0));
    let unitDisc = sub(orig, cur);
    if (unitDisc.n <= 0n) unitDisc = dec(Math.max(0, num(item.discount || 0)));
    const disc = toMinor(mul(unitDisc, qty));
    const gross = toMinor(mul(orig, qty));
    return disc > gross ? gross : (disc < 0n ? 0n : disc);
}

/** The shared calculation input for a cart (also used to build the payload). */
export function cartToCalculationInput({ cart, sale, settings, enableTax, enableFreeQty, tableMode, serviceChargePct, tipEnabled, roundOff }) {
    const taxRate = enableTax ? (sale.taxRate !== undefined ? sale.taxRate : parseFloat(settings?.default_tax_rate || 0)) : 0;
    const taxInclusive = enableTax ? (sale.taxInclusive !== undefined ? !!sale.taxInclusive : false) : false;
    const lines = cart.map((item) => ({
        unit_price: num(item.original_price ?? item.price ?? 0),
        qty: num(item.qty || 0),
        free_qty: enableFreeQty ? num(item.freeQuantity || 0) : 0,
        discount: fromMinor(lineDiscountMinor(item)),
        tax_rate: item.product_tax_rate ?? null,
    }));
    const discountValue = sale.discountType === 'percentage'
        ? num(sale.discountValue || 0)
        : num(parseFloat(sale.discountValue !== undefined ? sale.discountValue : (sale.discount || 0)) || 0);
    const servicePct = tableMode ? (parseFloat(serviceChargePct) || 0) : 0;
    const tip = tableMode && tipEnabled ? (parseFloat(sale.tipAmount || 0) || 0) : 0;
    return {
        input: {
            lines,
            bill_discount: { type: sale.discountType === 'percentage' ? 'percentage' : 'fixed', value: Math.max(0, discountValue) },
            tax: { enabled: !!enableTax, inclusive: taxInclusive, default_rate: num(taxRate) },
            charges: { extra: Math.max(0, parseFloat(sale.additionalCharges || 0) || 0), service_pct: servicePct, tip: Math.max(0, tip) },
            bill_rounding: { apply: !!roundOff, setting: settings?.round_off_total },
        },
        taxRate, taxInclusive, servicePct,
    };
}

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
export function computeTotals(args) {
    const { input, taxRate, taxInclusive, servicePct } = cartToCalculationInput(args);
    let r;
    let calcError = null;
    try {
        r = calculateSale(input);
    } catch (e) {
        if (!(e instanceof MoneyError)) throw e;
        // An over-large bill discount is capped for DISPLAY only; the payload
        // carries the capped figure and the server re-checks it.
        if (e.code === 'excessive_discount') {
            const capped = calculateSale({ ...input, bill_discount: { type: 'fixed', value: 0 } });
            r = calculateSale({ ...input, bill_discount: { type: 'fixed', value: fromMinor(capped.sum_net) } });
        } else {
            calcError = e;
            r = calculateSale({ ...input, lines: [], bill_discount: { type: 'fixed', value: 0 }, charges: {} });
        }
    }

    const m = fromMinor;
    return {
        taxRate, taxInclusive, taxEnabled: !!args.enableTax,
        subtotal: m(r.subtotal_gross),
        freeItemDiscounts: m(r.free_value),
        itemDiscounts: m(r.item_discounts),
        subtotalAfterLineDiscounts: m(r.sum_net),
        globalDiscount: m(r.bill_discount),
        totalDiscounts: m(r.free_value + r.item_discounts + r.bill_discount),
        taxableAmount: m(r.taxable),
        taxAmount: m(r.tax),
        additionalCharges: m(r.extra),
        serviceChargePct: servicePct,
        serviceCharge: m(r.service),
        tipAmount: m(r.tip),
        rawCartTotal: m(r.components),
        cartTotal: m(r.invoice),
        roundOffAmount: m(r.round_off),
        billRounding: !!args.roundOff,
        lineDiscounts: r.lines.map((l) => m(l.discount)),
        calculationVersion: CALCULATION_VERSION,
        calcError: calcError ? { code: calcError.code, message: calcError.message } : null,
    };
}

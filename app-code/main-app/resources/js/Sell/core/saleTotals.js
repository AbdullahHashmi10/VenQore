/**
 * Sale Core — the one sale calculation (contract v2).
 *
 * The till (cartMath.computeTotals), FOH and the server (app/Services/Sales/
 * SaleTotals.php) all implement exactly this sequence. Shared fixtures in
 * resources/js/tests/fixtures/sale-totals/ are run by BOTH runtimes, so the
 * receipt the cashier reads is the invoice the books post.
 *
 *  1. line gross     = q(unit price × billed qty)            q = quantize to paisa, half-up
 *     free value     = q(unit price × free qty)               (gross and discount both include it)
 *  2. line discount  = q(line discount amount)               (never more than the line's gross)
 *     line net       = gross − discount
 *  3. bill discount  = q(Σnet × pct / 100) or q(fixed), ONCE; allocated to lines by
 *                      largest remainder (ties → earlier line); never more than Σnet
 *  4. line tax       = q(base × rate / 100)  exclusive
 *                      q(base × rate / (100 + rate))  inclusive
 *                      min(base, q(fixed)) for a fixed per-line tax
 *     line revenue   = base − tax (inclusive) or base (exclusive)
 *  5. charges        = delivery, extra, service, tip — typed, each counted once
 *  6. components     = Σrevenue + Σtax + charges;  invoice = bill-round(components)
 *     round_off      = invoice − components  (0 when bill rounding is off)
 *
 * Every amount returned is integer minor units (BigInt) — callers convert at
 * the edge. Invalid input throws MoneyError with a code; it is never clamped.
 */
import { dec, mul, toMinor, allocate, divRound, billIncrementMinor, roundToIncrement, MoneyError, minorToString } from './money';

export const CALCULATION_VERSION = 2;

const rateDec = (r, label) => {
    const d = dec(r ?? 0, label);
    if (d.n < 0n) throw new MoneyError(`${label} cannot be negative`, 'invalid_rate');
    return d;
};

const nonNegMinor = (v, label) => {
    const m = toMinor(dec(v ?? 0, label));
    if (m < 0n) throw new MoneyError(`${label} cannot be negative`, 'negative_amount');
    return m;
};

/**
 * @param {object} input
 * @param {Array<{unit_price, qty, free_qty?, discount?, tax_rate?, tax_type?}>} input.lines
 * @param {{type:'fixed'|'percentage', value}} [input.bill_discount]
 * @param {{enabled:boolean, inclusive:boolean, default_rate}} [input.tax]
 * @param {{delivery?, extra?, service?, service_pct?, tip?}} [input.charges]
 * @param {{apply:boolean, setting}} [input.bill_rounding]
 */
export function calculateSale(input) {
    const tax = input.tax || {};
    const taxOn = !!tax.enabled;
    const inclusive = taxOn && !!tax.inclusive;
    const defaultRate = taxOn ? rateDec(tax.default_rate, 'tax rate') : dec(0);

    const lines = (input.lines || []).map((l, i) => {
        const unit = dec(l.unit_price, `line ${i + 1} price`);
        const qty = dec(l.qty, `line ${i + 1} quantity`);
        const freeQty = dec(l.free_qty ?? 0, `line ${i + 1} free quantity`);
        if (unit.n < 0n) throw new MoneyError(`line ${i + 1} price cannot be negative`, 'negative_amount');
        if (qty.n < 0n || freeQty.n < 0n) throw new MoneyError(`line ${i + 1} quantity cannot be negative`, 'invalid_quantity');
        const gross = toMinor(mul(unit, qty));
        const free = toMinor(mul(unit, freeQty));
        // A line discount is an amount, or a percentage of the line's gross
        // (quantized once, half-up). Never both.
        let discount;
        if (l.discount_percent !== undefined && l.discount_percent !== null && l.discount_percent !== '') {
            if (l.discount !== undefined && Number(l.discount) !== 0) throw new MoneyError(`line ${i + 1} has both a discount amount and a percentage`, 'invalid_discount');
            const pct = rateDec(l.discount_percent, `line ${i + 1} discount %`);
            if (pct.n > 100n * 10n ** BigInt(pct.s)) throw new MoneyError(`line ${i + 1} discount is more than 100%`, 'excessive_discount');
            discount = divRound(gross * pct.n, 100n * 10n ** BigInt(pct.s));
        } else {
            discount = nonNegMinor(l.discount, `line ${i + 1} discount`);
        }
        if (discount > gross) throw new MoneyError(`line ${i + 1} discount is more than the line`, 'excessive_discount');
        const type = l.tax_type === 'fixed' ? 'fixed' : 'percentage';
        const hasOwn = l.tax_rate !== null && l.tax_rate !== undefined && l.tax_rate !== '';
        const rate = taxOn ? (hasOwn ? rateDec(l.tax_rate, `line ${i + 1} tax rate`) : defaultRate) : dec(0);
        return { index: i, gross, free, discount, net: gross - discount, rate, type };
    });

    const sumNet = lines.reduce((a, l) => a + l.net, 0n);

    // 3. Bill discount, quantized once, then allocated.
    const bd = input.bill_discount || {};
    let billDiscount = 0n;
    if (bd.type === 'percentage') {
        const pct = rateDec(bd.value, 'discount percentage');
        // q(Σnet × pct / 100) with Σnet already in minor units.
        billDiscount = divRound(sumNet * pct.n, 100n * 10n ** BigInt(pct.s));
    } else {
        billDiscount = nonNegMinor(bd.value, 'discount');
    }
    if (billDiscount > sumNet) throw new MoneyError('the discount is more than the sale', 'excessive_discount');
    const shares = allocate(billDiscount, lines.map((l) => l.net));

    // 4. Tax per line on its allocated base.
    let sumBase = 0n, sumTax = 0n, sumRevenue = 0n;
    for (const l of lines) {
        l.billShare = shares[l.index];
        l.base = l.net - l.billShare;
        let t = 0n;
        if (taxOn && l.rate.n > 0n) {
            if (l.type === 'fixed') {
                t = toMinor(l.rate);
                if (t > l.base) t = l.base;
            } else if (inclusive) {
                const scale = 10n ** BigInt(l.rate.s);
                t = divRound(l.base * l.rate.n, 100n * scale + l.rate.n);
            } else {
                t = divRound(l.base * l.rate.n, 100n * 10n ** BigInt(l.rate.s));
            }
        }
        l.tax = t;
        l.revenue = inclusive ? l.base - t : l.base;
        sumBase += l.base; sumTax += t; sumRevenue += l.revenue;
    }

    // 5. Typed charges.
    const c = input.charges || {};
    const delivery = nonNegMinor(c.delivery, 'delivery charge');
    const extra = nonNegMinor(c.extra, 'extra charge');
    let service;
    if (c.service_pct !== undefined && c.service_pct !== null && c.service_pct !== '' && Number(c.service_pct) > 0) {
        const pct = rateDec(c.service_pct, 'service charge %');
        service = divRound(sumBase * pct.n, 100n * 10n ** BigInt(pct.s));
    } else {
        service = nonNegMinor(c.service, 'service charge');
    }
    const tip = nonNegMinor(c.tip, 'tip');
    const charges = delivery + extra + service + tip;

    // 6. Invoice and explicit bill rounding.
    const components = sumRevenue + sumTax + charges;
    const br = input.bill_rounding || {};
    const invoice = br.apply ? roundToIncrement(components, billIncrementMinor(br.setting)) : components;

    return {
        version: CALCULATION_VERSION,
        lines: lines.map((l) => ({
            index: l.index, gross: l.gross, free: l.free, discount: l.discount, net: l.net,
            bill_share: l.billShare, base: l.base, tax: l.tax, revenue: l.revenue,
        })),
        subtotal_gross: lines.reduce((a, l) => a + l.gross + l.free, 0n),
        free_value: lines.reduce((a, l) => a + l.free, 0n),
        item_discounts: lines.reduce((a, l) => a + l.discount, 0n),
        sum_net: sumNet,
        bill_discount: billDiscount,
        taxable: sumBase,
        tax: sumTax,
        revenue: sumRevenue,
        delivery, extra, service, tip, charges,
        components,
        invoice,
        round_off: invoice - components,
    };
}

/** BigInt-free view of a result (for fixtures, logs, JSON). */
export function serializeResult(r) {
    const conv = (v) => (typeof v === 'bigint' ? minorToString(v) : v);
    const out = {};
    for (const [k, v] of Object.entries(r)) {
        out[k] = k === 'lines' ? v.map((l) => Object.fromEntries(Object.entries(l).map(([a, b]) => [a, conv(b)]))) : conv(v);
    }
    return out;
}

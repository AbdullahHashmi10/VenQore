/**
 * documentMoney.js — one arithmetic, for every document that has money on it.
 *
 * The same six-stage cascade was written out by hand on the sales invoice,
 * the quotation, the sales order, the recurring invoice, the return, the
 * purchase order and the debit note. Seven copies, and they had already
 * drifted: only one of them rounded the total, and ALL of them rendered
 * "extra charges" rows that were left out of the sum, so a document could
 * show four charges and bill for one.
 *
 * More importantly, the server does not take the browser's word for any of
 * this. It recomputes, line by line, at each product's own tax rate. So this
 * file does not compute "a reasonable total" — it computes the SAME total,
 * in the same order, with the same clamps, as SaleController does. Anything
 * else means the customer is shown one figure and charged another.
 *
 * The order, which is the part that matters:
 *
 *   gross_i        = qty × price                     (free goods excluded)
 *   net_i          = max(0, gross_i − line discount)
 *   pool           = max(0, Σ(gross_i − discount_i)) (clamped once, at the end)
 *   share_i        = document discount × net_i / pool
 *   taxable_i      = max(0, net_i − share_i)
 *   tax            = Σ round(taxable_i × rate_i, 2)
 *   net sales      = max(0, Σgross + Σfree − Σdiscounts − Σfree − doc discount)
 *   total          = round(net sales + tax + carriage, 2), then shop rounding
 *
 * Tax comes LAST on the discounted base, not first on the gross — charging
 * tax on money the customer never paid is the most common way a till gets
 * this wrong, and it is wrong in the customer's disfavour.
 */

import { hasMoney, settles } from '@/Documents/documentTypes';

const num = (v) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
};

/* To the paisa, then whatever rounding the shop asked for — the order the
   server uses. Handing a raw float to the shop's rounding meant that with
   round-off switched off the screen showed an unrounded number while the
   server stored one rounded to two places. */
const paisa = (n) => Math.round(n * 100) / 100;

/** What one line is worth before any document-level discount. */
export function lineTotal(item, { freeOn = true } = {}) {
    const gross = num(item.quantity) * num(item.price);
    const disc = item.discountType === 'percent'
        ? gross * (num(item.discount) / 100)
        : num(item.discount);
    return Math.max(0, gross - disc);
}

/** The money on one line of a document whose lines are amounts, not goods. */
const amountOf = (item) => num(item.amount ?? item.value);

export default function computeTotals({
    doc,
    items = [],
    document: d = {},
    settings,
    fields = {},
    roundTotal,
}) {
    /* A document with no money on it (a transfer, an audit, a receipt) gets a
       shape with zeroes in it rather than a special case at every call site. */
    if (!hasMoney(doc)) {
        const units = items.reduce((s, i) => s + num(i.quantity ?? i.counted_quantity), 0);
        return {
            none: true, lines: items.length, units,
            subtotal: 0, itemDiscounts: 0, afterDiscount: 0,
            taxAmount: 0, taxRate: 0, taxExempt: true, charges: 0,
            grandTotal: 0, settled: 0, balance: 0,
            balanceTone: 'clear', balanceLabel: '', settleLabel: '',
            totalCost: 0, profit: 0, marginPct: 0, lineNets: [],
        };
    }

    const byAmount = doc.money.lines === 'amount';
    /* "Free quantity is off" has to mean the goods are not given away — not
       merely that the column is hidden. The old switch hid the column and left
       lines carrying free units nobody could see. */
    const freeOn = doc.fields.includes('free') && fields.free !== false;
    const freeQtyOf = (i) => (freeOn ? num(i.freeQuantity) : 0);

    /* ── stage 1: what the goods come to ────────────────────────────────── */

    const subtotal = byAmount
        ? items.reduce((s, i) => s + amountOf(i), 0)
        : items.reduce((s, i) => s + (num(i.quantity) + freeQtyOf(i)) * num(i.price), 0);

    const totalCost = byAmount ? 0 : items.reduce(
        (s, i) => s + (num(i.quantity) + freeQtyOf(i)) * num(i.cost), 0,
    );

    /* ── stage 2: what comes off the lines ──────────────────────────────── */

    const itemDiscounts = byAmount ? 0 : items.reduce((s, i) => {
        const gross = num(i.quantity) * num(i.price);
        const disc = i.discountType === 'percent' ? gross * (num(i.discount) / 100) : num(i.discount);
        /* Free goods are a discount by another name: they are in the subtotal
           at full price so the document shows what was given away, and taken
           straight back out here so nobody is billed for them. */
        return s + disc + freeQtyOf(i) * num(i.price);
    }, 0);

    const afterItemDiscounts = subtotal - itemDiscounts;

    /* ── stage 3: the discount on the whole document ────────────────────── */

    const invoiceDiscount = num(d.discount);
    /* The server clamps net sales at zero, so a discount bigger than the goods
       makes a nil document, never a negative one. */
    const afterDiscount = Math.max(0, afterItemDiscounts - invoiceDiscount);

    /* ── stage 4: tax, per line, at each product's own rate ─────────────── */

    const taxOn = doc.money.tax && doc.fields.includes('tax') && fields.tax !== false;
    const taxExempt = !taxOn;
    const taxRate = taxExempt ? 0 : num(d.tax);

    const lineNets = byAmount
        ? items.map((i) => ({ net: amountOf(i), raw: amountOf(i), rate: taxExempt ? 0 : num(i.tax_rate ?? taxRate) }))
        : items.map((i) => {
            const gross = num(i.quantity) * num(i.price);
            const disc = i.discountType === 'percent' ? gross * (num(i.discount) / 100) : num(i.discount);
            return {
                /* Clamped for this line's own tax, unclamped for the pool the
                   document discount is shared out of — exactly how the server
                   does it, and the only way an over-discounted line lands on
                   the same number at both ends. */
                net: Math.max(0, gross - disc),
                raw: gross - disc,
                /* A rate typed on the line wins over the product's own, which
                   wins over the document's. Reading only the product's meant a
                   typed override changed what was SENT and not what was shown,
                   so the screen and the saved bill disagreed by the difference. */
                rate: taxExempt
                    ? 0
                    : (i.tax_rate !== undefined && i.tax_rate !== null
                        ? num(i.tax_rate)
                        : (i.product?.tax_rate !== undefined && i.product?.tax_rate !== null
                            ? num(i.product.tax_rate)
                            : taxRate)),
            };
        });

    const pool = Math.max(0, lineNets.reduce((s, l) => s + l.raw, 0));
    /* Where a document's discount is taken off BEFORE tax, the discount is
       spread across the lines and each is taxed on what is left — that is what
       a sale does, and what its server does. A purchase does not: the supplier
       charged tax on their line amounts and the discount comes off the bill
       afterwards, which is how `PurchaseService` posts it. Taxing the
       discounted base here made the screen quote a total the server would never
       store, and the difference came back as a phantom part-payment on the
       supplier's ledger. */
    const taxOnDiscounted = doc.money.taxAfterDocDiscount !== false;

    const taxAmount = lineNets.reduce((s, l) => {
        const share = taxOnDiscounted && pool > 0 ? invoiceDiscount * (l.net / pool) : 0;
        const taxable = Math.max(0, l.net - share);
        return s + paisa(taxable * (l.rate / 100));
    }, 0);

    /* With one rate across the document the tax row can name it; with products
       carrying their own it is a blend, and saying "18%" would be a lie. */
    const ratesInPlay = Array.from(new Set(lineNets.filter((l) => l.net > 0).map((l) => l.rate)));
    const taxRateLabel = ratesInPlay.length === 1 ? `${ratesInPlay[0]}%` : 'mixed rates';

    /* ── stage 5: carriage and anything else on top ─────────────────────── */

    const chargesOn = doc.money.charges;
    const deliveryCharge = chargesOn ? num(d.delivery_charge) : 0;
    /* Every one of the old screens rendered these rows and left them out of
       the sum. A charge you can see and are not billed for is not a feature. */
    const extraFields = Array.isArray(d.extraFields) ? d.extraFields : [];
    const extraCharge = !chargesOn ? 0
        : (extraFields.length ? extraFields.reduce((s, f) => s + num(f.value), 0) : num(d.extra_charge_value));
    const charges = deliveryCharge + extraCharge;

    /* ── stage 6: the total, and what is left to pay ────────────────────── */

    const rawGrandTotal = afterDiscount + taxAmount + charges;
    const rounded = paisa(rawGrandTotal);
    const grandTotal = doc.money.rounding && roundTotal ? roundTotal(rounded, settings) : rounded;

    const settled = settles(doc) ? num(d.amountPaid) : 0;
    const balance = grandTotal - settled;
    const balanceTone = !settles(doc) ? 'clear'
        : balance > 0.005 ? 'due' : balance < -0.005 ? 'over' : 'clear';

    const [dueWord, overWord, clearWord] = doc.money.balanceLabels
        || ['Balance due', 'Change owed', 'Settled in full'];
    const balanceLabel = balanceTone === 'due' ? dueWord : balanceTone === 'over' ? overWord : clearWord;

    /* Margin only means something where the shop is selling. On a purchase the
       price IS the cost, so a margin figure there would be about nothing. */
    const profit = doc.money.margin ? afterDiscount - totalCost : 0;
    const marginPct = doc.money.margin && afterDiscount > 0 ? (profit / afterDiscount) * 100 : 0;

    return {
        none: false,
        lines: items.length,
        units: items.reduce((s, i) => s + num(i.quantity) + freeQtyOf(i), 0),
        subtotal, totalCost, itemDiscounts, afterItemDiscounts,
        invoiceDiscount, afterDiscount,
        taxOn, taxExempt, taxRate, taxAmount, taxRateLabel, lineNets,
        deliveryCharge, extraCharge, charges,
        rawGrandTotal, grandTotal,
        settled, balance, balanceTone, balanceLabel,
        settleLabel: doc.money.settleLabel || 'Amount paid',
        profit, marginPct,
        freeOn,
    };
}

/**
 * The money half of the payload, spelled the way every controller in this app
 * expects it. Written once so that a fix like "send tax_rate, not just the tax
 * amount" lands on all fourteen documents at the same time instead of being
 * rediscovered on each.
 */
export function moneyPayload({ doc, totals, document: d = {} }) {
    if (!hasMoney(doc)) return {};
    const out = {
        /* Only where the document actually takes one — see `docDiscount`. */
        ...(doc.money.docDiscount === false ? {} : { discount: totals.invoiceDiscount }),
        tax: totals.taxAmount,
        /* The server recomputes tax from the RATE and ignores the amount. Until
           this line existed it was recomputing from the shop default, so a
           document shown at 18% could be saved at 0%. */
        tax_rate: totals.taxRate,
        tax_inclusive: false,
        tax_exempt: totals.taxExempt,
    };
    if (doc.money.charges) {
        const extras = Array.isArray(d.extraFields) ? d.extraFields : [];
        out.delivery_charge = totals.deliveryCharge;
        out.extra_charge_value = totals.extraCharge;
        out.extra_charge_label = extras.length ? JSON.stringify(extras) : (d.extra_charge_label || '');
    }
    if (settles(doc)) out.amount_paid = totals.settled;
    return out;
}

/**
 * The line half. `qty`/`price`/`discount` are normalised to the shape the
 * controllers validate, and the discount is converted to money here rather
 * than in seven different places.
 */
export function linePayload({ doc, items, totals }) {
    const freeQtyOf = (i) => (totals.freeOn ? num(i.freeQuantity) : 0);

    if (doc.money.lines === 'amount') {
        /* `category_id` as well as `category`: the line table writes the id,
           so filtering on the object alone dropped every line that had been
           filled in from the dropdown — which is all of them. */
        return items.filter((i) => i.category || i.category_id || i.desc).map((i) => ({
            category_id: i.category?.id ?? i.category_id ?? null,
            description: i.desc || '',
            amount: amountOf(i),
        }));
    }

    if (doc.money.lines === 'count') {
        return items.filter((i) => i.product).map((i) => ({
            product_id: i.product.id,
            variant_id: i.variant?.id || null,
            quantity: num(i.quantity),
            ...(i.counted_quantity !== undefined ? { counted_quantity: num(i.counted_quantity) } : {}),
            ...(i.batch ? { batch: i.batch } : {}),
            ...(i.expiry ? { expiry: i.expiry } : {}),
        }));
    }

    /* Most controllers in this app want quantity/price/discount; the purchase
       side wants qty/unit_cost/discount_amount. A document says which it
       speaks, and the difference stops here rather than turning into a special
       case at every call site. */
    const K = doc.lineKeys || {};
    return items.filter((i) => i.product).map((i) => {
        const gross = num(i.quantity) * num(i.price);
        const disc = i.discountType === 'percent' ? gross * (num(i.discount) / 100) : num(i.discount);
        const line = {
            product_id: i.product.id,
            variant_id: i.variant?.id || null,
            [K.qty || 'quantity']: num(i.quantity),
            [K.price || 'price']: num(i.price),
            [K.discount || 'discount']: disc,
        };
        /* Free goods, under whichever name this document's controller reads.
           It used to be sent only when the document spelled its quantity the
           ordinary way, so the two that do not — the purchase side and the
           recurring template — silently dropped every free unit. */
        line[K.free || 'free_quantity'] = freeQtyOf(i);
        /* The discount above has already been resolved from a percentage into
           money, so what is stored alongside it must say `fixed`. Sending
           'percent' with a resolved figure is what turned a 10% discount on a
           1,000 line into a 1,000 discount and a line total of nothing. */
        line[K.discountType || 'discount_type'] = 'fixed';
        /* Belt and braces for the controllers that read the other spelling. */
        if (!K.price) line.unit_price = num(i.price);
        if (K.qty && K.qty !== 'quantity') line.quantity = num(i.quantity);
        /* The rate this line was actually charged at — never the shop default,
           which is what the server fell back to when nothing was sent. Only
           sent when the line or the product actually has one, so a document
           with no tax on it does not acquire some. */
        /* Not while the document's tax is switched off. The server recomputes
           tax from these on some documents, so sending them anyway made the
           screen show an ex-tax total, auto-fill that as the refund, and the
           server value the same document higher — the difference becoming
           store credit nobody granted. */
        const rate = totals?.taxExempt ? null : (i.tax_rate ?? i.product?.tax_rate);
        if (rate !== undefined && rate !== null) line[K.taxRate || 'tax_rate'] = num(rate);
        /* Which line of which document this one answers to. The server caps
           the quantity against it; a cap enforced only here is not a cap. */
        if (i.source_line_id) line[K.source || 'source_line_id'] = i.source_line_id;
        if (i.batch) line.batch_number = i.batch;
        if (i.expiry) line.expiry_date = i.expiry;
        return line;
    });
}

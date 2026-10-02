/**
 * Claimed assistant prefill (server, version 1) -> the object the invoice
 * workspace turns into a NEW tab.
 *
 * Pure: the editor's own helpers (blankLine, uid, today, availableOf) are
 * passed in, so this is testable without the editor and cannot drift from it.
 *
 * Rules that matter:
 *  - A prefill this build does not understand is refused, never guessed at.
 *  - The amount received is whatever the operator STATED, otherwise 0; a
 *    payment method alone never settles the bill.
 *  - Invoice-level tax is the store default; a line carries its own rate only
 *    when the product has one (the server sends null otherwise).
 *  - Every line the server resolved is kept; nothing is added.
 */

export const SUPPORTED_PREFILL_VERSION = 1;

const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };

export function isAssistantPrefill(p) {
    return !!p && p.source === 'invoice_assistant' && p.version === SUPPORTED_PREFILL_VERSION && Array.isArray(p.items);
}

export function buildInvoiceFromPrefill(prefill, { blankLine, uid, today, availableOf, defaultTax = 0 }) {
    if (!isAssistantPrefill(prefill)) {
        const err = new Error('unsupported_prefill');
        err.code = 'unsupported_prefill';
        throw err;
    }

    const lines = prefill.items
        .filter((l) => l && l.product && num(l.quantity) > 0)
        .map((l) => ({
            ...blankLine(),
            id: uid(),
            product: l.product,
            variant: l.variant || undefined,
            quantity: num(l.quantity),
            price: num(l.price),
            cost: num(l.product?.cost ?? l.product?.cost_price),
            discount: num(l.discount),
            discountType: l.discountType === 'percent' ? 'percent' : 'fixed',
            tax_rate: l.tax_rate === null || l.tax_rate === undefined ? null : num(l.tax_rate),
            available_stock: availableOf ? availableOf(l.product, l.available_stock) : l.available_stock,
        }));

    const credit = prefill.payment_method === 'credit';
    const stated = prefill.amount_source === 'explicit' ? num(prefill.amount_paid) : 0;

    return {
        invoice: {
            customer: prefill.party || null,   // the workspace calls the party `customer`
            items: [...lines, blankLine()],
            notes: prefill.notes || '',
            paymentMethod: credit ? 'credit' : 'cash',
            amountPaid: stated,
            date: prefill.date || today(),
            ...(prefill.due_date ? { dueDate: prefill.due_date } : {}),
            tax: num(defaultTax),
            assistantDraftId: prefill.draft_id,
            assistantStatedPaid: stated,
            assistantRevision: prefill.revision,
        },
        lineCount: lines.length,
        notices: [
            ...(prefill.notices || []),
            ...((prefill.warnings || []).map((w) => w.message).filter(Boolean)),
        ],
        statedPayment: stated > 0,
    };
}

/** The line of source text the editor banner shows. */
export function describeHandoff({ lineCount, statedPayment, notices }) {
    const base = `Drafted by the assistant: ${lineCount} line${lineCount === 1 ? '' : 's'}. Nothing is saved yet — check every line, price and payment, then save as usual.`;
    return { text: base, statedPayment, notices };
}

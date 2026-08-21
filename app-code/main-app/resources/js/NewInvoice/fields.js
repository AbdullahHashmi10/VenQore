/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  NewInvoice — a type is a CONFIGURATION, never a screen                   ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Eight of the thirteen document screens in the codebase are the same file
 * copy-pasted, with the labels swapped and a handful of fields silently dropped
 * from the payload. This module is the alternative: one editor, and a type is a
 * set of switches plus a set of label overrides.
 *
 * Three rules, and every one of them answers a defect the inventory found:
 *
 *   A FIELD THAT RENDERS IS A FIELD THAT POSTS. `buildPayload()` below is the
 *   only payload builder. Quotation collected tax, delivery, extra charges,
 *   amount paid, free quantity, date and reference in the UI and dropped all
 *   seven; sales order sent five keys its controller ignored. One builder makes
 *   both impossible.
 *
 *   A CAPABILITY IS ON OR OFF, NEVER HALF. Free quantity reached the database
 *   from 2 of 7 sell-side types; on the other five it inflated the on-screen
 *   subtotal and was then dropped.
 *
 *   PARTY TYPE IS DERIVED FROM THE DOCUMENT'S SIDE. See `partiesFor` in mock.js.
 */

import { LAW } from '@/LayoutLaw/law';
import { TERMS, addDays } from './mock';

export const TYPES = LAW.document.types;
export const CAPS = LAW.document.capabilities;

export const typeById = (id) => TYPES.find((t) => t.id === id) || TYPES[0];
export const label = (type, key, fallback) => (type.labels && type.labels[key]) || fallback;
export const has = (type, cap) => type.on.includes(cap);
export const off = (type, cap) => type.off.includes(cap);

/**
 * The header fields the density asks for, minus anything this type switches off.
 * A density decides HOW MANY fields; the type decides WHICH ONES EXIST.
 */
export const HEADER_FIELDS = {
    party: (t) => ({ label: label(t, 'party', 'Party'), kind: 'party', required: true }),
    docno: (t) => ({ label: label(t, 'docno', 'Document #'), kind: 'text', required: false }),
    partyref: (t) => ({ label: label(t, 'partyref', 'Their reference'), kind: 'text', required: false }),
    date: () => ({ label: 'Document date', kind: 'date', required: true }),
    due: () => ({ label: 'Due date', kind: 'date', required: false }),
    terms: () => ({
        label: 'Payment terms',
        kind: 'select',
        required: false,
        // FIX · the Net 7/15/30/60 select was never submitted on any screen, and
        // due_date was sent from a `dueDate` key that no input wrote. Terms
        // WRITES the due date — one control, not two — and the date stays
        // editable, because a term is a default and not a cage.
        hint: 'writes the due date — one control, not two',
    }),
    method: () => ({ label: 'Settlement method', kind: 'select', required: false }),
    account: () => ({ label: 'Money account', kind: 'select', required: false }),
    location: () => ({ label: 'Location', kind: 'select', required: false }),
    project: () => ({ label: 'Project / cost centre', kind: 'select', required: false }),
    currency: () => ({ label: 'Currency', kind: 'select', required: false }),
    fx: () => ({ label: 'Exchange rate', kind: 'num', required: false }),
};

/**
 * Fields that belong to a CAPABILITY rather than to a density. They appear
 * wherever their capability is on, at every density and every width — because a
 * width may veto a density and may never veto a capability.
 */
export const CAP_FIELDS = {
    valid_until: { label: 'Valid until', kind: 'date', required: true, hint: 'the defining field of a quote — it had no input at all before' },
    expected_date: { label: 'Expected delivery', kind: 'date', required: false, hint: 'accepted by the server, never rendered before' },
    frequency: { label: 'Billing frequency', kind: 'select', required: false },
    next_run: { label: 'Next run date', kind: 'date', required: false },
    active_paused: { label: 'Status', kind: 'select', required: false },
    goods_status: { label: 'Goods status', kind: 'select', required: false },
    reason: { label: 'Reason', kind: 'text', required: true },
    category: { label: 'Expense category', kind: 'select', required: true },
    attachment: { label: 'Attachment', kind: 'file', required: false },
    location_pair: { label: 'From → To location', kind: 'select', required: true },
    source_doc: { label: 'Against document', kind: 'doc', required: true },
    doc_status: { label: 'Status', kind: 'select', required: false },
    tax_inclusive_flag: { label: 'Prices include tax', kind: 'toggle', required: false },
    description: { label: 'Description', kind: 'text', required: true },
    tax_amount: { label: 'Tax amount', kind: 'num', required: false },
    business_pct: { label: 'Business use %', kind: 'num', required: false },
    refund_account: { label: 'Refund to', kind: 'select', required: true },
    landed_costs: { label: 'Landed costs', kind: 'num', required: false },
};

/** Which header keys this type actually renders at this density. */
export function headerKeysFor(type, densityHeader) {
    return densityHeader.filter((k) => {
        if (off(type, k)) return false;
        if (k === 'party' && off(type, 'party')) return false;
        if (k === 'location' && !has(type, 'location') && !has(type, 'location_pair')) return false;
        if (k === 'docno' && off(type, 'docno_manual')) return false;
        return true;
    });
}

/** Capability fields this type switches on, in a stable order. */
export function capKeysFor(type) {
    return Object.keys(CAP_FIELDS).filter((k) => has(type, k));
}

/** The line columns this type allows, out of the ones the density offers. */
export function columnsFor(type, densityCols) {
    return densityCols.filter((c) => {
        if (c === 'free' && (off(type, 'free_qty') || !has(type, 'free_qty'))) return false;
        if (c === 'disc' && off(type, 'disc')) return false;
        if (c === 'tax' && !has(type, 'per_line_tax') && !has(type, 'tax_dropdown')) return false;
        if (c === 'rate' && has(type, 'qty_only')) return false;
        if (c === 'total' && has(type, 'qty_only')) return false;
        return true;
    });
}

/** Actions this type offers beside its primary. Rank 2 — they yield to room. */
export function secondaryActions(type) {
    const out = [];
    if (has(type, 'print')) out.push('Print');
    if (has(type, 'convert')) out.push('Convert');
    if (has(type, 'receive')) out.push('Receive');
    return out;
}

/**
 * FIX · no email, WhatsApp, PDF, duplicate or record-payment action exists on
 * any editor in the shipped code; email and WhatsApp live only on Sales/Show.
 * They are document actions, so they belong to the document editor.
 */
export function overflowActions(type) {
    const out = ['Save as draft', 'Duplicate', 'Download PDF'];
    if (type.side === 'sell') out.push('Email', 'WhatsApp');
    if (has(type, 'print')) out.push('Print');
    if (has(type, 'convert')) out.push('Convert to invoice');
    if (type.side !== 'stock') out.push('Record a payment');
    out.push('Delete');
    return out;
}

export const termDays = (id) => (TERMS.find((t) => t.id === id) || TERMS[0]).days;
export const dueFromTerms = (date, termId) => addDays(date, termDays(termId));

/**
 * THE ONE PAYLOAD BUILDER.
 *
 * It takes the whole document and emits exactly what the V3 endpoints accept —
 * and, critically, it emits every field this type RENDERS. There is no second
 * path, so there is nowhere for a field to be collected and then quietly
 * dropped, which is what happened to seven of quotation's fields and to five of
 * sales order's.
 *
 * Nothing calls this against a server yet. It exists now, and is shown in the
 * payload preview sheet, so that the contract is settled before the wiring is.
 */
export function buildPayload(doc, type, computed) {
    const lines = doc.lines.map((l, i) => ({
        line_no: i + 1,
        product_id: l.pid,
        description: l.name,
        qty: l.qty,
        free_qty: has(type, 'free_qty') ? l.free : undefined,
        sale_uom: l.uom,
        hsn: l.hsn || undefined,
        unit_price: l.rate,
        discount_percent: l.disc,
        tax_percent: has(type, 'per_line_tax') ? l.tax : undefined,
        batch: l.batch || undefined,
        note: l.note || undefined,
        line_total: computed.lineNet(l),
    }));

    return {
        type: type.id,
        document_no: doc.docno,
        party_id: off(type, 'party') ? undefined : doc.party?.id,
        party_reference: doc.partyref || undefined,
        document_date: doc.date,
        due_date: doc.due || undefined,
        payment_terms: doc.terms || undefined,
        settlement_method: doc.method || undefined,
        account_id: doc.account || undefined,
        warehouse_id: doc.location || undefined,
        to_warehouse_id: has(type, 'location_pair') ? doc.locationTo : undefined,
        project_id: doc.project || undefined,
        currency: doc.currency,
        exchange_rate: doc.fx,
        // FIX · notes was in six payloads with no input anywhere. It is resident
        // on every type now, and it travels on the one path.
        notes: doc.notes,
        valid_until: has(type, 'valid_until') ? doc.validUntil : undefined,
        expected_date: has(type, 'expected_date') ? doc.expectedDate : undefined,
        goods_status: has(type, 'goods_status') ? doc.goodsStatus : undefined,
        status: has(type, 'doc_status') ? doc.status : undefined,
        category: has(type, 'category') ? doc.category : undefined,
        reason: has(type, 'reason') ? doc.reason : undefined,
        source_document: has(type, 'source_doc') ? doc.sourceDoc : undefined,
        tax_inclusive: has(type, 'tax_inclusive_flag') ? doc.taxInclusive : undefined,
        business_use_percent: has(type, 'business_pct') ? doc.businessPct : undefined,
        // FIX · only sales invoice and recurring invoice applied roundTotal(), so
        // the same cart totalled differently per type. Round-off is a document
        // property, applied once, by this builder.
        round_off: computed.round,
        tax_rate: doc.taxRate,
        header_discount: doc.discount,
        shipping: doc.shipping,
        other_charges: doc.extra,
        subtotal: computed.sub,
        tax_amount: computed.tax,
        total: computed.total,
        amount_settled: has(type, 'overpayment') || type.side !== 'stock' ? doc.settled : undefined,
        items: lines,
        idempotency_key: doc.idem,
    };
}

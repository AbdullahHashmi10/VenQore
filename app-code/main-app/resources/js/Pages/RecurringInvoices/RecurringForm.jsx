import React, { useCallback } from 'react';
import { usePage } from '@inertiajs/react';
import { CalendarClock } from 'lucide-react';

import { Field } from '@/Documents/DocumentShell';
import VqSelect from '@/Documents/VqSelect';
import MoneyDocument, { uid, blankLine, today } from '@/Documents/MoneyDocument';
import { documentType } from '@/Documents/documentTypes';
import { linePayload } from '@/Documents/documentMoney';

const DOC = documentType('recurring-invoice');
const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
const inDays = (n) => new Date(Date.now() + n * 86400000).toISOString().split('T')[0];
const round4 = (n) => Math.round(n * 10000) / 10000;

/* When the next one after this is due, said the way the schedule says it. */
const nextAfter = (dateStr, frequency) => {
    const base = dateStr ? new Date(dateStr) : new Date();
    if (frequency === 'daily') base.setDate(base.getDate() + 1);
    else if (frequency === 'weekly') base.setDate(base.getDate() + 7);
    else base.setMonth(base.getMonth() + 1);
    return base.toISOString().split('T')[0];
};

/**
 * The recurring invoice — a template, not an invoice.
 *
 * Nothing here is ever paid: the invoices this raises are. So there is no
 * settlement row, no payment account and no balance. Everything that shapes
 * the invoices it WILL raise — the lines, the discounts, the tax, the
 * carriage — is here and, unlike before, is saved. The old pair of screens
 * rendered all of it, totalled all of it, and sent none of it: a template
 * showing 46,000 raised invoices for the bare line sum, and re-opening one in
 * the editor zeroed its discount and tax on the way in.
 */
export default function RecurringForm({ invoice, customers = [], warehouses = [], products = [] }) {
    const { store, settings } = usePage().props;
    const isEdit = !!invoice?.id;

    const seed = useCallback(() => ({
        id: uid(),
        party: null,
        name: '',
        reference: '',
        date: today(),
        warehouse_id: warehouses?.find((w) => w.is_default)?.id || warehouses?.[0]?.id || '',
        frequency: 'monthly',
        next_run_date: inDays(30),
        status: 'active',
        terms: 'net30',
        notes: '',
        discount: 0,
        tax: num(settings?.default_tax_rate),
        delivery_charge: 0,
        extra_charge_value: 0,
        extra_charge_label: '',
        items: [blankLine()],
    }), [warehouses, settings]);

    const editSeed = useCallback(() => {
        const stored = Array.isArray(invoice?.items) ? invoice.items : [];
        return {
            ...seed(),
            id: invoice.id,
            party: invoice.customer_id
                ? (customers.find((c) => c.id === invoice.customer_id) || { id: invoice.customer_id, name: invoice.customer_name || 'Customer' })
                : null,
            name: invoice.name || '',
            warehouse_id: invoice.warehouse_id || '',
            frequency: invoice.frequency || 'monthly',
            next_run_date: (invoice.next_run_date || '').slice(0, 10) || inDays(30),
            status: invoice.status || 'active',
            terms: invoice.payment_terms || 'net30',
            notes: invoice.notes || '',
            /* Hydrated, not hardcoded. The old editor set all five of these to
               zero on the way in and then never sent them, so the money on a
               template could only ever go down. */
            discount: num(invoice.discount),
            tax: num(invoice.tax_rate),
            delivery_charge: num(invoice.delivery_charge),
            extra_charge_value: num(invoice.extra_charge_value),
            extra_charge_label: invoice.extra_charge_label || '',
            items: stored.length
                ? stored.map((i) => {
                    const p = products.find((x) => x.id === i.product_id);
                    return {
                        id: uid(),
                        product: p || { id: i.product_id, name: i.name || 'Item' },
                        quantity: num(i.qty ?? i.quantity),
                        freeQuantity: num(i.free_qty ?? i.freeQuantity),
                        price: num(i.unit_price ?? i.price),
                        discount: num(i.discount),
                        discountType: 'fixed',
                        tax_rate: i.tax_rate ?? null,
                        cost: num(p?.cost_price),
                    };
                })
                : [blankLine()],
        };
    }, [seed, invoice, customers, products]);

    return (
        <MoneyDocument
            doc={DOC}
            seed={seed}
            editSeed={editSeed}
            isEdit={isEdit}
            products={products}
            parties={customers}
            transport="axios"
            saveLabel={isEdit ? 'Update template' : 'Save template'}
            url={({ d }) => (isEdit
                ? route('store.recurring-invoices.update', { store_slug: store?.slug, id: d.id })
                : route('store.recurring-invoices.store', { store_slug: store?.slug }))}
            validate={({ d }) => {
                if (!d.warehouse_id) return { warehouse: 'Choose which warehouse these invoices come out of.' };
                if (!d.next_run_date) return { next_run_date: 'Say when the next invoice should be raised.' };
                return null;
            }}
            header={({ d, patch, chrome, errors }) => (
                <>
                    <Field label="Template name" span={4} hint="What this schedule is called in the list.">
                        <input type="text" className="vqdoc-in" value={d.name}
                            placeholder="Monthly service charge"
                            onChange={(e) => patch({ name: e.target.value })} />
                    </Field>

                    {chrome.field('frequency') && (
                        <Field label="Repeats" span={4}>
                            <VqSelect
                                ariaLabel="How often an invoice is raised"
                                value={d.frequency}
                                onChange={(v) => patch({ frequency: v, next_run_date: d.next_run_date || nextAfter(today(), v) })}
                                options={[
                                    { value: 'daily', label: 'Every day' },
                                    { value: 'weekly', label: 'Every week' },
                                    { value: 'monthly', label: 'Every month' },
                                ]}
                            />
                        </Field>
                    )}

                    {chrome.field('nextRun') && (
                        <Field label="Next one on" span={4} required error={errors.next_run_date}
                            hint={`After that: ${nextAfter(d.next_run_date, d.frequency)}`}>
                            <input type="date" className="vqdoc-in" value={d.next_run_date}
                                onChange={(e) => patch({ next_run_date: e.target.value })} />
                        </Field>
                    )}

                    {chrome.field('status') && (
                        <Field label="Status" span={4}>
                            <div className="vqdoc-seg">
                                <button type="button" data-tone="cash" aria-pressed={d.status === 'active'}
                                    onClick={() => patch({ status: 'active' })}>Running</button>
                                <button type="button" data-tone="credit" aria-pressed={d.status !== 'active'}
                                    onClick={() => patch({ status: 'paused' })}>Paused</button>
                            </div>
                        </Field>
                    )}

                    {chrome.field('warehouse') && (
                        <Field label="Stock comes from" span={4} required error={errors.warehouse}>
                            <VqSelect
                                ariaLabel="Which warehouse these invoices come out of"
                                value={d.warehouse_id}
                                onChange={(v) => patch({ warehouse_id: v })}
                                options={(warehouses || []).map((w) => ({ value: w.id, label: w.name }))}
                            />
                        </Field>
                    )}

                    {chrome.field('terms') && (
                        <Field label="Payment terms" span={4}>
                            <VqSelect
                                ariaLabel="Payment terms on the invoices this raises"
                                value={d.terms}
                                onChange={(v) => patch({ terms: v })}
                                options={[
                                    { value: 'immediate', label: 'Due immediately' },
                                    { value: 'net7', label: 'Within 7 days' },
                                    { value: 'net15', label: 'Within 15 days' },
                                    { value: 'net30', label: 'Within 30 days' },
                                    { value: 'net60', label: 'Within 60 days' },
                                ]}
                            />
                        </Field>
                    )}

                    {chrome.field('notes') && (
                        <Field label="Note that prints on every invoice" span={12}>
                            <textarea className="vqdoc-in" rows={2} value={d.notes}
                                placeholder="Service period, contract reference…"
                                onChange={(e) => patch({ notes: e.target.value })} />
                        </Field>
                    )}
                </>
            )}
            buildPayload={({ d, items, totals }) => ({
                customer_id: d.party?.id || null,
                warehouse_id: d.warehouse_id || null,
                frequency: d.frequency,
                next_run_date: d.next_run_date,
                status: d.status,
                name: d.name || null,
                payment_terms: d.terms || null,
                notes: d.notes || null,
                /* What each raised invoice will come to. Stored so the list can
                   show it without re-deriving it from a blob. */
                total_amount: totals.grandTotal,
                /* The stored lines are a JSON blob validated key by key, so a
                   key without a rule is dropped from the template silently.
                   `name` is one of those, and it is what the invoice prints
                   when a product is later renamed. */
                items: linePayload({ doc: DOC, items, totals }).map((line, i) => {
                    const src = items.filter((x) => x.product)[i];
                    const gross = num(src?.quantity) * num(src?.price);
                    return {
                        ...line,
                        /* The generator builds each invoice with
                           `discount_percent`, and falls back to `discount` —
                           which is MONEY here — if it is missing. A 500 line
                           discount then became 500% off. Sending the equivalent
                           percentage makes the raised invoice come to exactly
                           what the template shows. */
                        discount_percent: gross > 0 ? round4((num(line.discount) / gross) * 100) : 0,
                        name: src?.product?.name || null,
                    };
                }),
            })}
            extraTools={(
                <span className="vqdoc-icon" title={`Raises an invoice ${DOC.name.toLowerCase()} on schedule`} aria-hidden>
                    <CalendarClock size={17} />
                </span>
            )}
        />
    );
}

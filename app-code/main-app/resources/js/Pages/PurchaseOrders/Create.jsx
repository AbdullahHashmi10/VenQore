import React, { useCallback } from 'react';
import { usePage } from '@inertiajs/react';
import { Printer, PackageCheck } from 'lucide-react';

import { Field } from '@/Documents/DocumentShell';
import VqSelect from '@/Documents/VqSelect';
import MoneyDocument, { uid, blankLine, today } from '@/Documents/MoneyDocument';
import { documentType } from '@/Documents/documentTypes';

const DOC = documentType('purchase-order');
/* Same as the sales order: `update()` takes no advance, so an edit does not
   offer one. */
const DOC_EDIT = { ...DOC, money: { ...DOC.money, settle: 'none' } };
const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };

/**
 * The purchase order.
 *
 * Goods are on their way, not on the shelf: nothing is received and nothing
 * posts to the ledger until they arrive — unless the operator says they
 * already have, which is the "arrived with the order" case and does the
 * receipt there and then.
 *
 * Two fields the old screen sent on every save and gave nobody a way to
 * enter: the expected delivery date, which is the one thing that makes an
 * order an order rather than an invoice, and the warehouse, which silently
 * fell back to the first one in the list — so a multi-warehouse shop ordered
 * everything into warehouse number one for as long as the screen existed.
 */
export default function CreatePurchaseOrder({ purchaseOrder, suppliers = [], warehouses = [], products = [] }) {
    const { store, settings } = usePage().props;
    const isEdit = !!purchaseOrder?.id;
    /* A received order has already made stock and journal entries; correcting
       one means raising another. 'partial' counts: an edit rebuilds the item
       rows and destroys how much of each has already come in, so the server
       refuses those too — and a screen that let the operator type for five
       minutes and then showed them a 403 would be worse than one that says so
       up front. */
    const locked = isEdit && ['received', 'partial'].includes(purchaseOrder?.status);

    const seed = useCallback(() => ({
        id: uid(),
        party: null,
        reference: '',
        supplier_invoice: '',
        date: today(),
        expected_delivery_date: '',
        terms: 'net30',
        warehouse_id: warehouses?.find((w) => w.is_default)?.id || warehouses?.[0]?.id || '',
        notes: '',
        is_tax_inclusive: false,
        received: false,
        discount: 0,
        tax: num(settings?.default_tax_rate),
        delivery_charge: 0,
        extra_charge_value: 0,
        extra_charge_label: '',
        paymentMethod: 'credit',
        amountPaid: 0,
        paymentAccountId: null,
        paymentAccountKey: null,
        items: [blankLine()],
    }), [warehouses, settings]);

    const editSeed = useCallback(() => {
        /* The order stores a `suppliers` row; every other document in the app
           works in parties. Follow the link back so the ledger balance in the
           totals column is the one the rest of the app would show. */
        const sup = (suppliers || []).find((s) => s.id === purchaseOrder.supplier_id);
        return {
            ...seed(),
            id: purchaseOrder.id,
            party: sup ? { id: sup.party_id || sup.id, name: sup.name } : null,
            reference: purchaseOrder.reference || '',
            date: (purchaseOrder.order_date || '').slice(0, 10) || today(),
            expected_delivery_date: (purchaseOrder.expected_delivery_date || '').slice(0, 10) || '',
            terms: purchaseOrder.payment_terms || 'net30',
            warehouse_id: purchaseOrder.warehouse_id || '',
            notes: purchaseOrder.notes || '',
            is_tax_inclusive: !!purchaseOrder.is_tax_inclusive,
            received: purchaseOrder.status === 'received',
            discount: num(purchaseOrder.discount),
            tax: num(purchaseOrder.tax_rate),
            delivery_charge: num(purchaseOrder.delivery_charge),
            extra_charge_value: num(purchaseOrder.extra_charge_value),
            extra_charge_label: purchaseOrder.extra_charge_label || '',
            amountPaid: num(purchaseOrder.amount_paid),
            paymentMethod: num(purchaseOrder.amount_paid) > 0 ? 'cash' : 'credit',
            items: (purchaseOrder.items || []).length
                ? purchaseOrder.items.map((i) => ({
                    id: uid(),
                    product: i.product || { id: i.product_id, name: i.product_name },
                    quantity: num(i.quantity),
                    freeQuantity: num(i.free_quantity),
                    price: num(i.unit_cost),
                    /* Read back as the money it was stored as. The old screen
                       hardcoded `discount: 0` here, so editing an order to
                       change one line's quantity wiped every line discount. */
                    discount: num(i.discount),
                    discountType: 'fixed',
                    tax_rate: i.tax_rate ?? null,
                    cost: num(i.unit_cost),
                }))
                : [blankLine()],
        };
    }, [seed, purchaseOrder, suppliers]);

    return (
        <MoneyDocument
            doc={isEdit ? DOC_EDIT : DOC}
            seed={seed}
            editSeed={editSeed}
            isEdit={isEdit}
            locked={locked}
            lockNote={purchaseOrder?.status === 'partial'
                ? 'Some of these goods have already arrived. Receive the rest, or raise a purchase return — an order cannot be changed once any of it is in.'
                : 'These goods have been received. Raise a purchase return or a debit note rather than changing the order.'}
            products={products}
            transport="axios"
            saveLabel={isEdit ? 'Update order' : 'Place the order'}
            priceOf={(pr) => num(pr.cost_price ?? pr.cost ?? pr.price)}
            settleDefault={(d, totals) => (d.paymentMethod === 'cash' ? totals.grandTotal : 0)}
            url={({ d }) => (isEdit
                ? route('store.purchase-orders.update', { store_slug: store?.slug, purchase_order: d.id })
                : route('store.purchase-orders.store', { store_slug: store?.slug }))}
            validate={({ d }) => (d.warehouse_id ? null : { warehouse: 'Choose which warehouse these goods are going into.' })}
            header={({ d, patch, chrome, acct, errors, setSettleMode }) => (
                <>
                    <Field label="Goods" span={4}>
                        <VqSelect
                            ariaLabel="Whether the goods have arrived"
                            value={d.received ? 'received' : 'ordered'}
                            onChange={(v) => patch({ received: v === 'received' })}
                            options={[
                                { value: 'ordered', label: 'On order', hint: 'Nothing on the shelf and nothing in the books yet' },
                                { value: 'received', label: 'Arrived with it', hint: 'Receives the whole order now, at these costs' },
                            ]}
                        />
                    </Field>

                    {!isEdit && (
                    <Field label="Advance" span={4} hint="Money paid to the supplier up front.">
                        <div className="vqdoc-seg">
                            <button type="button" data-tone="cash" aria-pressed={d.paymentMethod === 'cash'}
                                onClick={() => setSettleMode('cash')}>Paying now</button>
                            <button type="button" data-tone="credit" aria-pressed={d.paymentMethod === 'credit'}
                                onClick={() => setSettleMode('credit')}>Nothing yet</button>
                        </div>
                    </Field>

                    )}
                    {!isEdit && chrome.field('accountOut') && d.paymentMethod === 'cash' && (
                        <Field label="Money comes from" span={4}>
                            <VqSelect
                                ariaLabel="Which account the advance is paid out of"
                                value={d.paymentAccountKey ?? acct.defaultKey ?? ''}
                                onChange={(v) => { const p = acct.resolve(v); if (p) patch(p); }}
                                options={acct.options}
                            />
                        </Field>
                    )}

                    {chrome.field('docno') && (
                        <Field label="Order no." span={3}>
                            <input type="text" className="vqdoc-in" value={d.reference}
                                placeholder="Auto" onChange={(e) => patch({ reference: e.target.value })} />
                        </Field>
                    )}
                    {chrome.field('date') && (
                        <Field label="Order date" span={3}>
                            <input type="date" className="vqdoc-in" value={d.date}
                                onChange={(e) => patch({ date: e.target.value })} />
                        </Field>
                    )}
                    {chrome.field('expected') && (
                        <Field label="Expected on" span={3} hint="When the supplier says it will arrive.">
                            <input type="date" className="vqdoc-in" value={d.expected_delivery_date}
                                min={d.date}
                                onChange={(e) => patch({ expected_delivery_date: e.target.value })} />
                        </Field>
                    )}
                    {chrome.field('terms') && (
                        <Field label="Payment terms" span={3}>
                            <VqSelect
                                ariaLabel="Payment terms"
                                value={d.terms}
                                onChange={(v) => patch({ terms: v })}
                                options={[
                                    { value: 'immediate', label: 'On delivery' },
                                    { value: 'net7', label: 'Within 7 days' },
                                    { value: 'net15', label: 'Within 15 days' },
                                    { value: 'net30', label: 'Within 30 days' },
                                    { value: 'net60', label: 'Within 60 days' },
                                ]}
                            />
                        </Field>
                    )}

                    {chrome.field('warehouse') && (
                        <Field label="Goods land in" span={4} required error={errors.warehouse}>
                            <VqSelect
                                ariaLabel="Which warehouse the goods land in"
                                value={d.warehouse_id}
                                onChange={(v) => patch({ warehouse_id: v })}
                                options={(warehouses || []).map((w) => ({ value: w.id, label: w.name }))}
                            />
                        </Field>
                    )}

                    <Field label="Costs include tax" span={4}
                        hint="On means the rates typed on each line already have tax in them.">
                        <div className="vqdoc-seg">
                            <button type="button" aria-pressed={!d.is_tax_inclusive}
                                onClick={() => patch({ is_tax_inclusive: false })}>Tax on top</button>
                            <button type="button" aria-pressed={!!d.is_tax_inclusive}
                                onClick={() => patch({ is_tax_inclusive: true })}>Tax included</button>
                        </div>
                    </Field>

                    {chrome.field('notes') && (
                        <Field label="Note on the order" span={12}>
                            <textarea className="vqdoc-in" rows={2} value={d.notes}
                                placeholder="Delivery window, gate instructions, packing requirements…"
                                onChange={(e) => patch({ notes: e.target.value })} />
                        </Field>
                    )}
                </>
            )}
            buildPayload={({ d, totals }) => ({
                supplier_id: d.party?.id,
                warehouse_id: d.warehouse_id,
                order_date: d.date,
                /* Both of these are read without a fallback on the server, so
                   the key has to be present even when it is empty. */
                expected_delivery_date: d.expected_delivery_date || null,
                notes: d.notes || null,
                reference: d.reference || null,
                payment_terms: d.terms || null,
                is_tax_inclusive: !!d.is_tax_inclusive,
                status: d.received ? 'received' : 'ordered',
                ...(isEdit ? {} : {
                    amount_paid: totals.settled,
                    payment_account_id: d.paymentAccountId || null,
                }),
            })}
            extraTools={isEdit ? (
                <>
                    <button type="button" className="vqdoc-icon" title="Print this order"
                        onClick={() => window.open(route(DOC.api.print, { store_slug: store?.slug, purchaseOrder: purchaseOrder.id }), '_blank')}>
                        <Printer size={17} />
                    </button>
                    {!locked && (
                        <span className="vqdoc-icon" title="Set Goods to 'Arrived with it' and save to receive" aria-hidden>
                            <PackageCheck size={17} />
                        </span>
                    )}
                </>
            ) : null}
        />
    );
}

import React, { useCallback, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { PackageCheck } from 'lucide-react';

import { Field } from '@/Documents/DocumentShell';
import VqSelect from '@/Documents/VqSelect';
import MoneyDocument, { uid, blankLine, today } from '@/Documents/MoneyDocument';
import { documentType } from '@/Documents/documentTypes';
import { useAlert } from '@/Contexts/AlertContext';

const DOC = documentType('sales-order');
/* Money already received is not re-decided by editing the paperwork, and the
   update route takes no deposit — so on an edit the whole settlement row comes
   off rather than accepting a figure it would then drop. */
const DOC_EDIT = { ...DOC, money: { ...DOC.money, settle: 'none' } };
const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };

/**
 * The sales order.
 *
 * Goods are spoken for, not gone: the stock is reserved and the ledger is not
 * touched until the order becomes a sale. What IS real is the deposit — money
 * over the counter today against goods next week — and on the old screen it
 * had a box, a running balance and a place in the total, and was then left out
 * of the payload entirely. It now reaches the ledger as a customer advance.
 */
export default function CreatePreSale({ sale, customers = [], products = [] }) {
    const { store, settings } = usePage().props;
    const { showAlert } = useAlert();
    const isEdit = !!sale?.id;
    const [converting, setConverting] = useState(false);

    /* Once it has become a sale it is history. Editing it would rewrite what
       the books say happened. */
    const locked = isEdit && ['completed', 'converted', 'cancelled'].includes(sale?.status);

    const seed = useCallback(() => ({
        id: uid(),
        party: null,
        reference: '',
        date: today(),
        delivery_date: '',
        terms: 'net30',
        notes: '',
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
    }), [settings]);

    const editSeed = useCallback(() => ({
        ...seed(),
        id: sale.id,
        party: sale.customer
            ? { id: sale.customer.id, name: sale.customer.name, current_balance: sale.customer.current_balance }
            : null,
        reference: sale.reference || '',
        date: (sale.order_date || '').slice(0, 10) || today(),
        delivery_date: (sale.delivery_date || '').slice(0, 10) || '',
        terms: sale.payment_terms || 'net30',
        notes: sale.notes || '',
        discount: num(sale.discount),
        tax: num(sale.tax_rate),
        delivery_charge: num(sale.delivery_charge),
        extra_charge_value: num(sale.extra_charge_value),
        extra_charge_label: sale.extra_charge_label || '',
        amountPaid: num(sale.amount_paid),
        paymentMethod: num(sale.amount_paid) > 0 ? 'cash' : 'credit',
        items: (sale.items || []).length
            ? sale.items.map((i) => ({
                id: uid(),
                product: i.product || { id: i.product_id, name: i.product_name },
                quantity: num(i.quantity_requested ?? i.qty ?? i.quantity),
                freeQuantity: num(i.free_quantity),
                price: num(i.unit_price),
                discount: num(i.discount),
                discountType: 'fixed',
                tax_rate: i.tax_rate ?? null,
                cost: num(i.product?.cost_price),
            }))
            : [blankLine()],
    }), [seed, sale]);

    const convert = async () => {
        if (!isEdit) {
            showAlert({ title: 'Save it first', message: 'An order has to be saved before it can become a sale.', type: 'warning' });
            return;
        }
        setConverting(true);
        try {
            const res = await window.axios.post(route(DOC.api.convert, { store_slug: store?.slug, salesOrder: sale.id }));
            showAlert({ title: 'Converted', message: 'The order is now a sale and the reserved stock has left the shelf.', type: 'success' });
            /* Print the SALE, with the sale's own id. The old screen printed
               the sales-invoice route with an order id on it. */
            const madeId = res?.data?.sale_id;
            if (madeId) window.open(route('store.sales.print', { store_slug: store?.slug, sale: madeId }), '_blank');
            router.visit(route('store.sales.index', { store_slug: store?.slug }));
        } catch (err) {
            showAlert({ title: 'Could not convert', message: err?.response?.data?.message || 'Something went wrong.', type: 'error' });
        } finally {
            setConverting(false);
        }
    };

    return (
        <MoneyDocument
            doc={isEdit ? DOC_EDIT : DOC}
            seed={seed}
            editSeed={editSeed}
            isEdit={isEdit}
            locked={locked}
            lockNote="This order has been converted to a sale and can no longer be changed."
            products={products}
            parties={customers}
            transport="axios"
            saveLabel={isEdit ? 'Update order' : 'Take the order'}
            /* A deposit is optional on an order — nothing down is the normal
               case — so "paid now" fills the whole thing in and "on account"
               leaves it at nothing, rather than assuming either. */
            settleDefault={(d, totals) => (d.paymentMethod === 'cash' ? totals.grandTotal : 0)}
            url={({ d }) => (isEdit
                ? route('store.sales.orders.update', { store_slug: store?.slug, order: d.id })
                : route('store.pre-sales.store', { store_slug: store?.slug }))}
            header={({ d, patch, chrome, acct, setSettleMode }) => (
                <>
                    {!isEdit && (
                    <Field label="Deposit" span={4} hint="Money taken now against goods later.">
                        <div className="vqdoc-seg">
                            <button type="button" data-tone="cash" aria-pressed={d.paymentMethod === 'cash'}
                                onClick={() => setSettleMode('cash')}>Taking money now</button>
                            <button type="button" data-tone="credit" aria-pressed={d.paymentMethod === 'credit'}
                                onClick={() => setSettleMode('credit')}>Nothing down</button>
                        </div>
                    </Field>
                    )}
                    {!isEdit && chrome.field('account') && d.paymentMethod === 'cash' && (
                        <Field label="Money goes to" span={4}>
                            <VqSelect
                                ariaLabel="Which account the deposit is banked into"
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
                    {chrome.field('delivery') && (
                        <Field label="Wanted by" span={3} hint="When the customer expects the goods.">
                            <input type="date" className="vqdoc-in" value={d.delivery_date}
                                min={d.date}
                                onChange={(e) => patch({ delivery_date: e.target.value })} />
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
                    {chrome.field('notes') && (
                        <Field label="Note on the order" span={12}>
                            <textarea className="vqdoc-in" rows={2} value={d.notes}
                                placeholder="Delivery instructions, who to call on arrival…"
                                onChange={(e) => patch({ notes: e.target.value })} />
                        </Field>
                    )}
                </>
            )}
            buildPayload={({ d, totals }) => ({
                customer_id: d.party?.id || null,
                order_date: d.date,
                delivery_date: d.delivery_date || null,
                reference: d.reference || null,
                payment_terms: d.terms || null,
                notes: d.notes || null,
                /* Only on the way in: the update route does not take a deposit,
                   because money already received is not re-decided by editing
                   the paperwork. */
                ...(isEdit ? {} : {
                    amount_paid: totals.settled,
                    payment_method: d.paymentMethod === 'cash' ? 'cash' : 'credit',
                    payment_account_id: d.paymentAccountId || null,
                }),
            })}
            extraActions={isEdit && !locked ? (
                <button type="button" className="vqdoc-btn" disabled={converting} onClick={convert}>
                    <PackageCheck size={16} /> Deliver &amp; invoice
                </button>
            ) : null}
        />
    );
}

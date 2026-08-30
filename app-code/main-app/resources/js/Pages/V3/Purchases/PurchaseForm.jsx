import React, { useCallback, useRef, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { Plus, Trash2, Truck, AlertTriangle } from 'lucide-react';

import { roundTotal } from '@/Utils/settings';
import { Field, Scrim, Sheet } from '@/Documents/DocumentShell';
import VqSelect from '@/Documents/VqSelect';
import MoneyDocument, { uid, blankLine, today } from '@/Documents/MoneyDocument';
import { documentType } from '@/Documents/documentTypes';
import { linePayload } from '@/Documents/documentMoney';

const DOC = documentType('purchase-invoice');
const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
const round2 = (n) => Math.round(n * 100) / 100;

/**
 * The purchase invoice.
 *
 * Everything that is true of every document — the bar, the tabs, the layout
 * law, the text scale, the settings, the money arithmetic, the line table, the
 * settlement rule, the ledger view of the supplier — comes from the shared
 * scaffold. What is left in this file is only what makes a purchase a
 * purchase: it has a supplier rather than a customer, money leaves rather than
 * arrives, goods land on the shelf rather than leaving it, there is no margin
 * on it because the price IS the cost, the tax is whatever the supplier
 * charged line by line rather than something the shop chooses, and it can
 * carry landed costs, which nothing else can.
 *
 * It was the last screen still holding its own copy of the scaffold's work —
 * its own save, its own line-table context, its own tab handlers, its own
 * settlement rule — and that copy cost real money: the part-payment bug (type
 * 500 against a 2,000 bill, look at another tab, come back to find 2,000 and
 * save it as settled in full) had to be found and fixed here a second time
 * after it was already fixed for the other twelve.
 */
export default function PurchaseForm({
    mode = 'create',
    purchase,
    items: existingItems,
    landedCosts,
    suppliers,
    products,
    warehouses,
    expenseCategories,
}) {
    const { store, settings } = usePage().props;
    const isEdit = mode === 'edit';

    const [showLanded, setShowLanded] = useState(false);
    const [zeroCostAsk, setZeroCostAsk] = useState(null);
    /* The scaffold hands its save back through this, so the zero-cost question
       can finish the save it interrupted. */
    const saveAgain = useRef(null);

    /* A tab is a whole purchase — supplier, lines and landed costs together.
       Holding the lines outside the draft is what made the old screens' tabs
       show one document's header over another's items. */
    const seed = useCallback(() => ({
        id: uid(),
        party: null,
        purchase_date: today(),
        due_date: '',
        supplier_invoice: '',
        reference: '',
        warehouse_id: warehouses?.find((w) => w.is_default)?.id || warehouses?.[0]?.id || '',
        notes: '',
        discount: 0,
        tax: 0,
        delivery_charge: 0,
        extra_charge_value: 0,
        extra_charge_label: '',
        paymentMethod: 'cash',
        amountPaid: 0,
        paymentAccountId: null,
        paymentAccountKey: null,
        terms: 'net30',
        workflow_status: 'received',
        items: [blankLine({ business_pct: 100 })],
        extras: [],
    }), [warehouses]);

    /* An edit is one document, not a queue: the tab strip is for purchases
       being entered, and the one on the screen already exists. */
    const editSeed = useCallback(() => ({
        ...seed(),
        id: purchase?.id || uid(),
        party: purchase
            ? { id: purchase.party_id, name: purchase.supplier_name || '', current_balance: purchase.supplier_balance }
            : null,
        purchase_date: purchase?.purchase_date?.slice(0, 10) || today(),
        due_date: purchase?.due_date?.slice(0, 10) || '',
        supplier_invoice: purchase?.invoice_number || '',
        reference: purchase?.reference || '',
        warehouse_id: purchase?.warehouse_id || '',
        notes: purchase?.notes || '',
        discount: num(purchase?.discount),
        paymentMethod: purchase?.payment_method || 'cash',
        /* Hydrated from what the purchase actually settled. Starting at 0 meant
           re-saving a paid cash purchase with no changes posted the whole bill
           to the supplier's payable and marked it unpaid. */
        /* A purchase whose goods have not arrived has no journal, so the
           server has nothing to derive a counter payment from and hands back
           the whole bill. Reading that as "settled in full" meant receiving it
           later credited Cash for money that never left the drawer. */
        amountPaid: purchase?.workflow_status === 'pending'
            ? 0
            : (purchase?.payment_status === 'paid'
                ? num(purchase?.total)
                : num(purchase?.amount_paid ?? 0)),
        workflow_status: purchase?.workflow_status || 'received',
        extras: (landedCosts || []).map((x) => ({
            id: uid(), category_id: x.category_id || '', amount: num(x.amount),
            method: x.method || 'value', description: x.description || '',
        })),
        items: existingItems?.length
            ? existingItems.map((i) => ({
                id: uid(),
                product: { id: i.product_id, name: i.product_name, tax_rate: i.tax_rate, unit: i.base_unit },
                variant: i.variant_id ? { id: i.variant_id } : null,
                quantity: num(i.qty),
                price: num(i.unit_cost),
                discount: num(i.discount_amount),
                discountType: 'fixed',
                /* Carried through an edit rather than silently reset to 100,
                   which turned non-reclaimable tax into claimable input tax. */
                business_pct: i.business_pct === undefined || i.business_pct === null ? 100 : num(i.business_pct),
                tax_rate: i.tax_rate === undefined || i.tax_rate === null ? null : num(i.tax_rate),
                cost: num(i.unit_cost),
            }))
            : [blankLine({ business_pct: 100 })],
    }), [seed, purchase, existingItems, landedCosts]);

    return (
        <MoneyDocument
            doc={DOC}
            seed={seed}
            editSeed={editSeed}
            isEdit={isEdit}
            products={products}
            parties={suppliers}
            transport="axios"
            saveLabel={isEdit ? 'Update purchase' : 'Record purchase'}
            /* A purchase line starts at what this product last cost, not at its
               selling price — the commonest keying error on the old screen. */
            priceOf={(pr) => num(pr.cost ?? pr.cost_price ?? pr.price)}
            afterUrl={route('store.v3.purchases.index', { store_slug: store?.slug })}
            url={({ d }) => (isEdit
                ? route('store.v3.purchases.update', { store_slug: store?.slug, purchase: d.id })
                : route('store.v3.purchases.store', { store_slug: store?.slug }))}

            validate={({ d, totals }) => {
                /* On an edit the account is not hydrated — which account a
                   purchase was paid from lives in its journal, not on the
                   purchase — so rather than let the shop's default till stand
                   in for whatever was really used, the box starts empty and
                   the question gets asked. */
                if (isEdit && totals.settled > 0.005 && !d.paymentAccountKey) {
                    return { party: 'Say which account this purchase was paid from.' };
                }
                return null;
            }}

            notice={isEdit ? (
                <div className="vqdoc-note" data-tone="warn">
                    <span className="eyebrow">Editing a posted purchase</span>
                    <span>
                        Saving reverses this purchase&rsquo;s journal entries and posts them again from
                        what is on the screen now. Stock movements and costs are recalculated with it.
                    </span>
                </div>
            ) : null}

            /* A line at nil cost is nearly always a slip, and it silently
               poisons stock valuation for as long as those units are on the
               shelf. The server refuses it unless it is acknowledged, so the
               question gets asked here rather than coming back as an error. */
            beforeSave={({ items, opts }) => {
                if (opts.zeroCostAcknowledged) return true;
                const free = items.filter((i) => i.product && num(i.price) === 0);
                if (!free.length) return true;
                setZeroCostAsk({ count: free.length, opts });
                return false;
            }}

            buildPayload={({ d, items, totals, acct, opts }) => {
                const priced = items.filter((i) => i.product);
                return {
                    supplier_id: d.party?.id,
                    warehouse_id: d.warehouse_id || null,
                    purchase_date: d.purchase_date,
                    due_date: d.due_date || null,
                    supplier_invoice: d.supplier_invoice || null,
                    reference: d.reference || null,
                    notes: d.notes || null,
                    payment_method: d.paymentMethod,
                    workflow_status: d.workflow_status,
                    /* The shop's rounding is applied by the SERVER, from this
                       figure. Rounding on the screen and not sending the
                       difference is how the bill came to show one total and the
                       ledger another. */
                    /* Measured from the same base the screen totalled: the
                       shared arithmetic rounds to the paisa first and THEN
                       applies the shop's rounding, so measuring against the
                       unrounded raw put the two a rupee apart on any bill whose
                       total landed on a half-paisa. */
                    round_off: round2(totals.grandTotal - round2(totals.rawGrandTotal)),
                    items: linePayload({ doc: DOC, items, totals }).map((line, i) => {
                        const src = priced[i];
                        return {
                            ...line,
                            variant_id: src?.variant?.id || null,
                            business_pct: src?.business_pct === undefined ? 100 : num(src.business_pct),
                            /* The rate the supplier actually billed. Falls back
                               to the product's own, which is what it was
                               before, and is always sent — the server treats an
                               absent rate as its own default. */
                            tax_rate: src?.tax_rate === null || src?.tax_rate === undefined
                                ? num(src?.product?.tax_rate)
                                : num(src.tax_rate),
                        };
                    }),
                    extras: (d.extras || []).filter((x) => num(x.amount) > 0).map((x) => ({
                        amount: num(x.amount), method: x.method || 'value',
                        category_id: x.category_id || null, description: x.description || null,
                    })),
                    /* Only ever true because the operator was asked and said
                       yes. Sending `|| !zeroCost` made it true on every ordinary
                       save, which permanently disarmed the server's guard. */
                    zero_cost_acknowledged: !!opts.zeroCostAcknowledged,
                    payment_account_id: d.paymentAccountId || acct.fallbackAccountId,
                    bank_account_id: d.bankReferenceId || null,
                    /* The server owns the tax on a purchase — it reads each
                       line's own rate — so the document-level keys the shared
                       payload adds would only be noise. Undefined is not
                       serialised, so they are simply not sent. */
                    tax: undefined,
                    tax_rate: undefined,
                    tax_inclusive: undefined,
                    tax_exempt: undefined,
                };
            }}

            header={({ d, patch, chrome, acct, setSettleMode }) => (
                <>
                    <Field label="Settlement" span={4}>
                        <div className="vqdoc-seg">
                            <button type="button" data-tone="cash" aria-pressed={d.paymentMethod === 'cash'}
                                onClick={() => setSettleMode('cash')}>Paid now</button>
                            <button type="button" data-tone="credit" aria-pressed={d.paymentMethod === 'credit'}
                                onClick={() => setSettleMode('credit')}>On account</button>
                        </div>
                    </Field>

                    {chrome.field('accountOut') && (
                        <Field label="Money comes from" span={4}>
                            <VqSelect
                                ariaLabel="Which account this is paid out of"
                                value={d.paymentAccountKey ?? acct.defaultKey ?? ''}
                                onChange={(v) => { const p = acct.resolve(v); if (p) patch(p); }}
                                options={acct.options}
                            />
                        </Field>
                    )}

                    {chrome.field('supplierRef') && (
                        <Field label="Supplier's bill no." span={3}
                            hint="The number on THEIR document, so you can find it when they call.">
                            <input type="text" className="vqdoc-in" value={d.supplier_invoice}
                                placeholder="The number on their document"
                                onChange={(e) => patch({ supplier_invoice: e.target.value })} />
                        </Field>
                    )}

                    {chrome.field('docno') && (
                        <Field label="Our reference" span={3}>
                            <input type="text" className="vqdoc-in" value={d.reference}
                                placeholder="Auto" onChange={(e) => patch({ reference: e.target.value })} />
                        </Field>
                    )}

                    {chrome.field('date') && (
                        <Field label="Bill date" span={3}>
                            <input type="date" className="vqdoc-in" value={d.purchase_date}
                                max={isEdit ? undefined : today()}
                                onChange={(e) => patch({ purchase_date: e.target.value })} />
                        </Field>
                    )}

                    {chrome.field('terms') && (
                        <Field label="Payment terms" span={3}>
                            <VqSelect
                                ariaLabel="Payment terms"
                                value={d.terms}
                                onChange={(v) => {
                                    const days = { immediate: 0, net7: 7, net15: 15, net30: 30, net60: 60 }[v] ?? 30;
                                    const base = d.purchase_date ? new Date(d.purchase_date) : new Date();
                                    base.setDate(base.getDate() + days);
                                    patch({ terms: v, due_date: base.toISOString().split('T')[0] });
                                }}
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

                    {chrome.field('due') && (
                        <Field label="Due date" span={4}>
                            <input type="date" className="vqdoc-in" value={d.due_date}
                                onChange={(e) => patch({ due_date: e.target.value })} />
                        </Field>
                    )}

                    <Field label="Goods" span={4}>
                        <VqSelect
                            ariaLabel="Whether the goods have arrived"
                            value={d.workflow_status}
                            onChange={(v) => patch({ workflow_status: v })}
                            options={[
                                { value: 'received', label: 'Received now', hint: 'Goes on the shelf and into the books today' },
                                { value: 'pending', label: 'Not yet arrived', hint: 'Recorded, but no stock and no ledger entry until it lands' },
                            ]}
                        />
                    </Field>

                    {chrome.field('warehouse') && (
                        <Field label="Goods land in" span={4}>
                            <VqSelect
                                ariaLabel="Which warehouse the goods land in"
                                value={d.warehouse_id}
                                onChange={(v) => patch({ warehouse_id: v })}
                                options={(warehouses || []).map((w) => ({ value: w.id, label: w.name }))}
                            />
                        </Field>
                    )}

                    {chrome.field('notes') && (
                        <Field label="Note on the purchase" span={12}>
                            <textarea className="vqdoc-in" rows={2} value={d.notes}
                                placeholder="Anything worth remembering about this delivery"
                                onChange={(e) => patch({ notes: e.target.value })} />
                        </Field>
                    )}
                </>
            )}

            extraTools={({ d }) => {
                const landed = (d.extras || []).reduce((s, x) => s + num(x.amount), 0);
                return (
                    <button type="button" className="vqdoc-icon"
                        title="Freight, duty and clearing"
                        aria-pressed={landed > 0}
                        onClick={() => setShowLanded(true)}>
                        <Truck size={17} />
                        {landed > 0 && <span className="dot" />}
                    </button>
                );
            }}

            extraRows={({ d, money }) => {
                const landed = (d.extras || []).reduce((s, x) => s + num(x.amount), 0);
                return landed > 0 ? (
                    <div className="vqdoc-sum-row">
                        <span className="k">Landed costs</span>
                        <span className="v">{money(landed)}</span>
                    </div>
                ) : null;
            }}

            extraSheets={({ d, patch, items, money }) => {
                const extras = d.extras || [];
                const setExtras = (next) => patch({ extras: typeof next === 'function' ? next(extras) : next });
                const landed = extras.reduce((s, x) => s + num(x.amount), 0);
                const lines = items.filter((i) => i.product).length;
                return (
                    <>
                        {/* Landed costs are costs of the WHOLE consignment — the
                            server spreads them across the goods — and they are
                            occasional. Inline they grew until the items and the
                            totals were pushed off the bottom of a container that
                            does not scroll. */}
                        {showLanded && (
                            <Sheet
                                title="Landed costs"
                                hint="Freight, duty and clearing. These are added to what the stock is worth, not to the supplier's bill."
                                icon={<Truck size={18} />}
                                width={760}
                                onClose={() => setShowLanded(false)}
                                footer={(
                                    <>
                                        <span style={{ marginRight: 'auto', color: 'var(--vq-text-2)', fontSize: 'var(--d-t-sm)' }}>
                                            {landed > 0 ? `${money(landed)} across ${lines} line${lines === 1 ? '' : 's'}` : 'Nothing added yet'}
                                        </span>
                                        <button type="button" className="vqdoc-btn"
                                            onClick={() => setExtras((p) => [...p, { id: uid(), category_id: '', amount: 0, method: 'value', description: '' }])}>
                                            <Plus size={15} /> Add another
                                        </button>
                                        <button type="button" className="vqdoc-btn pri" onClick={() => setShowLanded(false)}>Done</button>
                                    </>
                                )}
                            >
                                <div className="vqdoc-hdr" style={{ padding: 0 }}>
                                    {!extras.length && (
                                        <div className="vqdoc-f" data-span="12">
                                            <span style={{ color: 'var(--vq-text-3)' }}>Nothing added yet.</span>
                                        </div>
                                    )}
                                    {extras.map((x) => (
                                        <React.Fragment key={x.id}>
                                            <Field label="Cost" span={3}>
                                                <VqSelect
                                                    ariaLabel="Landed cost category"
                                                    value={x.category_id || ''}
                                                    placeholder="Freight, duty, clearing…"
                                                    onChange={(v) => setExtras((p) => p.map((e) => (e.id === x.id ? { ...e, category_id: v } : e)))}
                                                    options={(expenseCategories || []).map((c) => ({ value: c.id, label: c.name }))}
                                                />
                                            </Field>
                                            <Field label="Amount" span={2}>
                                                <input type="number" className="vqdoc-in n" value={x.amount}
                                                    onFocus={(e) => e.target.select()}
                                                    onChange={(e) => setExtras((p) => p.map((el) => (el.id === x.id ? { ...el, amount: num(e.target.value) } : el)))} />
                                            </Field>
                                            <Field label="What for" span={3}>
                                                <input type="text" className="vqdoc-in" value={x.description}
                                                    placeholder="Clearing agent, port charges…"
                                                    onChange={(e) => setExtras((p) => p.map((el) => (el.id === x.id ? { ...el, description: e.target.value } : el)))} />
                                            </Field>
                                            <Field label="Spread by" span={3}>
                                                <VqSelect
                                                    ariaLabel="How the cost is spread"
                                                    value={x.method}
                                                    onChange={(v) => setExtras((p) => p.map((e) => (e.id === x.id ? { ...e, method: v } : e)))}
                                                    options={[
                                                        { value: 'value', label: 'By value', hint: 'Dearer goods take more of it' },
                                                        { value: 'quantity', label: 'By quantity', hint: 'Every unit takes the same' },
                                                        { value: 'manual', label: 'Leave it out', hint: 'Recorded but not spread onto stock' },
                                                    ]}
                                                />
                                            </Field>
                                            <div className="vqdoc-f" data-span="1" data-nolabel="true">
                                                <button type="button" className="vqdoc-icon sm quiet danger" title="Remove this cost"
                                                    onClick={() => setExtras((p) => p.filter((e) => e.id !== x.id))}>
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </React.Fragment>
                                    ))}
                                </div>
                            </Sheet>
                        )}

                        {zeroCostAsk && (
                            <Scrim onClose={() => setZeroCostAsk(null)}>
                                <div className="vqdoc-modal" style={{ width: 'min(460px, 100%)' }}>
                                    <header>
                                        <span className="ico"><AlertTriangle size={18} /></span>
                                        <span className="t"><h3>An item costs nothing</h3></span>
                                    </header>
                                    <div className="body" style={{ display: 'grid', gap: 'var(--d-s4)' }}>
                                        <p style={{ margin: 0, color: 'var(--vq-text-2)' }}>
                                            {zeroCostAsk.count} line{zeroCostAsk.count === 1 ? ' has' : 's have'} a
                                            unit cost of nothing. Those units will be valued at zero for as long as they are in
                                            stock, and every sale of them will look like pure profit.
                                        </p>
                                        <div className="vqdoc-actions">
                                            <button type="button" className="vqdoc-btn pri"
                                                onClick={() => {
                                                    const o = zeroCostAsk.opts;
                                                    setZeroCostAsk(null);
                                                    saveAgain.current?.({ ...o, zeroCostAcknowledged: true });
                                                }}>
                                                They really were free
                                            </button>
                                            <button type="button" className="vqdoc-btn" onClick={() => setZeroCostAsk(null)}>
                                                Let me fix the cost
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </Scrim>
                        )}
                    </>
                );
            }}

            saveRef={saveAgain}
        />
    );
}

import React, { useCallback, useRef, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Paperclip, Plus, Receipt } from 'lucide-react';

import { Field, Sheet } from '@/Documents/DocumentShell';
import VqSelect from '@/Documents/VqSelect';
import MoneyDocument, { uid, today } from '@/Documents/MoneyDocument';
import { documentType } from '@/Documents/documentTypes';
import { useAlert } from '@/Contexts/AlertContext';

const DOC = documentType('expense');
const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };

/**
 * The expense voucher.
 *
 * No products on it: a line is a category and an amount, because one bill
 * covering rent and two utilities is an ordinary thing and the old modal —
 * a single category and a single amount — made it three separate records that
 * nothing tied together.
 *
 * It is also the one document that is not always paid on the spot. What was
 * actually handed over goes to cash or bank; anything still owing goes to the
 * payee's account, which is why the payee is a party here and not a line of
 * free text.
 */
export default function CreateExpense({ categories = [] }) {
    const { store } = usePage().props;
    const { showAlert } = useAlert();
    const fileRef = useRef(null);
    const [file, setFile] = useState(null);
    const [newCat, setNewCat] = useState(null);
    /* `beforeSave` runs before the shared scaffold disables its own button, so
       a voucher with an attachment needs its own guard or a double click
       records the expense twice. */
    const posting = useRef(false);
    const [cats, setCats] = useState(categories);

    const blankCost = () => ({ id: uid(), category_id: '', desc: '', amount: 0 });

    const seed = useCallback(() => ({
        id: uid(),
        party: null,
        reference: '',
        date: today(),
        notes: '',
        discount: 0,
        tax: 0,
        paymentMethod: 'cash',
        amountPaid: 0,
        paymentAccountId: null,
        paymentAccountKey: null,
        items: [blankCost()],
    }), []);

    /* Adding a category without leaving the voucher — the one genuinely good
       idea in the modal this replaces. */
    const createCategory = async (name) => {
        try {
            const res = await window.axios.post(route('store.expenses.category.store', { store_slug: store?.slug }), { name });
            const made = res.data?.category;
            if (made) {
                setCats((p) => [...p, made]);
                setNewCat(null);
                return made.id;
            }
        } catch (err) {
            showAlert({ title: 'Could not add that', message: err?.response?.data?.message || 'Try a different name.', type: 'error' });
        }
        return null;
    };

    return (
        <MoneyDocument
            doc={DOC}
            seed={seed}
            categories={cats}
            transport="axios"
            saveLabel="Record the expense"
            settleDefault={(d, totals) => (d.paymentMethod === 'cash' ? totals.grandTotal : 0)}
            url={() => route('store.expenses.store', { store_slug: store?.slug })}
            validate={({ d, items }) => {
                /* A cheque has to be drawn on something, and the expense
                   endpoint records a bank account or the till — nothing in
                   between. */
                if (d.paymentAccountKind === 'cheque') {
                    return { party: 'Choose the bank account the cheque is drawn on.' };
                }
                const priced = items.filter((i) => i.category_id || i.desc);
                if (!priced.length) return { items: 'Say what the money was for.' };
                if (priced.some((i) => !i.category_id)) return { items: 'Every line needs a category.' };
                if (!priced.some((i) => num(i.amount) > 0)) return { items: 'Put an amount on at least one line.' };
                return null;
            }}
            header={({ d, patch, chrome, acct, setSettleMode }) => (
                <>
                    <Field label="Settlement" span={4}>
                        <div className="vqdoc-seg">
                            <button type="button" data-tone="cash" aria-pressed={d.paymentMethod === 'cash'}
                                onClick={() => setSettleMode('cash')}>Paid now</button>
                            <button type="button" data-tone="credit" aria-pressed={d.paymentMethod === 'credit'}
                                onClick={() => setSettleMode('credit')}>Still owing</button>
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

                    {chrome.field('docno') && (
                        <Field label="Voucher no." span={3}>
                            <input type="text" className="vqdoc-in" value={d.reference}
                                placeholder="Their bill number, or your own"
                                onChange={(e) => patch({ reference: e.target.value })} />
                        </Field>
                    )}
                    {chrome.field('date') && (
                        <Field label="Date" span={3}>
                            <input type="date" className="vqdoc-in" value={d.date} max={today()}
                                onChange={(e) => patch({ date: e.target.value })} />
                        </Field>
                    )}

                    {chrome.field('attachment') && (
                        <Field label="Attachment" span={4} hint="A photograph of the bill, kept with the record.">
                            <div style={{ display: 'flex', gap: 'var(--d-s2)', alignItems: 'center' }}>
                                <button type="button" className="vqdoc-btn" onClick={() => fileRef.current?.click()}>
                                    <Paperclip size={15} /> {file ? 'Change' : 'Attach'}
                                </button>
                                <span style={{ color: 'var(--vq-text-3)', fontSize: 'var(--d-t-sm)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {file ? file.name : 'Nothing attached'}
                                </span>
                                <input ref={fileRef} type="file" accept="image/*,.pdf" hidden
                                    onChange={(e) => setFile(e.target.files?.[0] || null)} />
                            </div>
                        </Field>
                    )}

                    <Field label="New category" span={4} hint="Add one without leaving this voucher.">
                        <button type="button" className="vqdoc-btn" onClick={() => setNewCat('')}>
                            <Plus size={15} /> Add a category
                        </button>
                    </Field>

                    {chrome.field('notes') && (
                        <Field label="Note" span={12}>
                            <textarea className="vqdoc-in" rows={2} value={d.notes}
                                placeholder="Who was paid, what period it covers…"
                                onChange={(e) => patch({ notes: e.target.value })} />
                        </Field>
                    )}
                </>
            )}
            buildPayload={({ d, items, totals }) => {
                const lines = items
                    .filter((i) => i.category_id && (num(i.amount) > 0 || i.desc))
                    .map((i) => ({
                        expense_category_id: i.category_id,
                        description: i.desc || null,
                        amount: num(i.amount),
                    }));
                return {
                    date: d.date,
                    /* The row still carries one category, one amount and one
                       tax figure so every existing list, filter and report
                       keeps working; the lines sit underneath it. */
                    expense_category_id: lines[0]?.expense_category_id,
                    amount: lines.reduce((s, l) => s + l.amount, 0),
                    /* Tax is asked for once, on the voucher, not line by line:
                       there is no column for it on an expense and a figure
                       that cannot be typed is a figure that is always zero. */
                    tax_amount: totals.taxAmount,
                    payment_method: acctIsBank(d) ? 'bank' : 'cash',
                    bank_account_id: acctIsBank(d) ? d.bankReferenceId || d.paymentAccountId : null,
                    payee: d.party?.name || null,
                    party_id: d.party?.id || null,
                    amount_paid: totals.settled,
                    reference: d.reference || null,
                    description: lines[0]?.description || d.notes || null,
                    notes: d.notes || null,
                    items: lines,
                };
            }}
            /* An attachment cannot ride in a JSON body, so a voucher that has
               one is posted as a form instead. Everything else is identical. */
            beforeSave={({ d, items, totals, showAlert: alert }) => {
                if (!file) return true;
                if (posting.current) return false;
                posting.current = true;
                postWithFile({ d, items, totals, file, store, alert, router })
                    .finally(() => { posting.current = false; });
                return false;
            }}
            extraTools={(
                <span className="vqdoc-icon" title="Money leaving the business" aria-hidden>
                    <Receipt size={17} />
                </span>
            )}
            extraSheets={newCat !== null ? (
                <Sheet
                    title="New expense category"
                    hint="It will be available on every voucher from now on."
                    icon={<Plus size={18} />}
                    width={460}
                    onClose={() => setNewCat(null)}
                    footer={(
                        <>
                            <button type="button" className="vqdoc-btn" onClick={() => setNewCat(null)}>Cancel</button>
                            <button type="button" className="vqdoc-btn pri"
                                disabled={!newCat.trim()}
                                onClick={() => createCategory(newCat.trim())}>Add it</button>
                        </>
                    )}
                >
                    <div className="vqdoc-hdr" style={{ padding: 0 }}>
                        <Field label="Name" span={12}>
                            <input type="text" className="vqdoc-in" value={newCat} autoFocus
                                placeholder="Shop rent, electricity, staff tea…"
                                onChange={(e) => setNewCat(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && newCat.trim()) createCategory(newCat.trim()); }} />
                        </Field>
                    </div>
                </Sheet>
            ) : null}
        />
    );
}

/* The account picker already knows whether what was chosen is a till or a
   bank; the expense endpoint only wants to know which of the two. */
/* The picker says which kind of account was chosen. Guessing from the shape
   of its key — which is `BANK_<uuid>`, `CASH` or `CHEQUE`, never lowercase —
   meant this was false for every account, so a bank-paid expense posted out of
   the till and `bank_account_id` was never stored. */
const acctIsBank = (d) => d.paymentAccountKind === 'bank' || d.paymentAccountKind === 'wallet';

async function postWithFile({ d, items, totals, file, store, alert, router: nav }) {
    const form = new FormData();
    const lines = items
        .filter((i) => i.category_id && (parseFloat(i.amount) > 0 || i.desc))
        .map((i) => ({
            expense_category_id: i.category_id,
            description: i.desc || '',
            amount: parseFloat(i.amount) || 0,
        }));

    form.append('date', d.date);
    form.append('expense_category_id', lines[0]?.expense_category_id || '');
    form.append('amount', String(lines.reduce((s, l) => s + l.amount, 0)));
    form.append('tax_amount', String(totals.taxAmount || 0));
    form.append('payment_method', acctIsBank(d) ? 'bank' : 'cash');
    if (acctIsBank(d) && (d.bankReferenceId || d.paymentAccountId)) {
        form.append('bank_account_id', d.bankReferenceId || d.paymentAccountId);
    }
    if (d.party?.name) form.append('payee', d.party.name);
    if (d.party?.id) form.append('party_id', d.party.id);
    form.append('amount_paid', String(totals.settled));
    if (d.reference) form.append('reference', d.reference);
    if (d.notes) form.append('notes', d.notes);
    form.append('description', lines[0]?.description || d.notes || '');
    lines.forEach((l, i) => {
        form.append(`items[${i}][expense_category_id]`, l.expense_category_id);
        form.append(`items[${i}][description]`, l.description);
        form.append(`items[${i}][amount]`, String(l.amount));
    });
    form.append('attachment', file);

    try {
        await window.axios.post(route('store.expenses.store', { store_slug: store?.slug }), form, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        alert({ title: 'Saved', message: 'Expense recorded.', type: 'success' });
        nav.visit(route('store.expenses.index', { store_slug: store?.slug }));
    } catch (err) {
        const errs = err?.response?.data?.errors;
        alert({
            title: 'Could not save',
            message: (errs ? Object.values(errs)[0]?.[0] : null) || err?.response?.data?.message || 'Something went wrong.',
            type: 'error',
        });
    }
}

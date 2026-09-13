import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Printer, Trash2, TrendingUp, CheckCircle2, Wallet, Coins, Plus, X } from 'lucide-react';

import { shouldStopNegativeStock } from '@/Utils/settings';
import { formatCurrency } from '@/Utils/format';
import { useAlert } from '@/Contexts/AlertContext';
import { useWorkspace } from '@/Contexts/WorkspaceContext';
import PrintService from '@/Utils/PrintService';
import InvoiceTourGuide from '@/Components/InvoiceTourGuide';

import { Field, Scrim, Sheet } from '@/Documents/DocumentShell';
import { availableOf } from '@/Documents/DocumentLines';
import VqSelect from '@/Documents/VqSelect';
import MoneyDocument, { uid, blankLine, today } from '@/Documents/MoneyDocument';
import { documentType } from '@/Documents/documentTypes';

const DOC = documentType('sales-invoice');
const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };

/* The standing charges. These belong to the shop rather than to one bill, so
   they live where the shop set them and are applied to a bill that has not
   been touched yet. */
const LS = {
    delivery: 'amd_default_delivery',
    extraLabel: 'amd_default_extra_label',
    extraValue: 'amd_default_extra_value',
    multi: 'amd_enable_multiple_extras',
    showDelivery: 'amd_show_delivery',
    showExtra: 'amd_show_extra',
};
/* These six keys are the shop's, not this screen's: they are written raw —
   '1'/'0', a number, a plain label — and other screens read them the same way.
   Storing them as JSON here would have made "Packing" become "Extra" on first
   load, and turned an off switch ('0') into the number 0, which is not `false`
   and so read as on. */
const lsRaw = (k) => { try { return localStorage.getItem(k); } catch (_) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, String(v)); } catch (_) { /* private mode */ } };
const lsBool = (k, f) => { const v = lsRaw(k); return v === null ? f : (v === '1' || v === 'true'); };
const lsNum = (k, f) => { const n = parseFloat(lsRaw(k)); return Number.isFinite(n) ? n : f; };
const lsText = (k, f) => { const v = lsRaw(k); return v === null || v === '' ? f : v; };
/* The kit's own preferences ARE JSON, and one of them is read here too. */
const lsJson = (k, f) => { try { const v = localStorage.getItem(k); return v === null ? f : JSON.parse(v); } catch (_) { return f; } };

/**
 * The sales invoice.
 *
 * The last of the fourteen to come onto the shared kit, and the only one that
 * could not simply take the kit's defaults: its tabs are the application's
 * workspace — the same list the navigation rail shows and two other screens
 * write to — and it carries the onboarding tour, the receipt printer and the
 * shop's standing delivery and extra charges.
 *
 * Everything else it used to own alone, and had drifted on, now comes from
 * @/Documents: the layout law, the line table, the arithmetic that matches the
 * server, the settlement rule, the account picker, the ledger view of the
 * customer. What is left here is what makes a sale a sale.
 */
export default function CreateInvoice({ sale, aiPrefill }) {
    const { store, settings } = usePage().props;
    const { showAlert } = useAlert();
    const isEdit = !!sale?.id;

    const ws = useWorkspace();
    const money = (n) => formatCurrency(n, store || settings);

    const saveRef = useRef(null);
    const idemRef = useRef({});
    /* Which sale each tab turned into. One `done` for a screen that now keeps
       finished bills open meant pressing Print on the first tab printed the
       second one's invoice. */
    const savedIds = useRef({});
    const aiApplied = useRef(false);

    const [overpayment, setOverpayment] = useState(null);   /* { amount, name, print } */
    const [done, setDone] = useState(null);                 /* { id, total } */
    const [printing, setPrinting] = useState(false);
    const [marginOpen, setMarginOpen] = useState(false);
    const [aiNotice, setAiNotice] = useState(null);

    /* Standing charges, and whether their rows are offered at all. */
    /* "Put these on every new bill" — the kit's own switch, under the kit's
       own key. Seeding a delivery charge onto every invoice whether or not the
       shop asked for it is how a customer gets charged 200 nobody added. */
    /* Read when a tab is actually made rather than once at render: the switch
       is owned by the settings sheet inside the document, so a value captured
       up here is always one toggle behind. */
    const applyDefaults = () => lsJson('vqdoc_sales-invoice_defaults', false);
    const [showDelivery, setShowDelivery] = useState(() => lsBool(LS.showDelivery, true));
    const [showExtra, setShowExtra] = useState(() => lsBool(LS.showExtra, true));
    const [multiExtras, setMultiExtras] = useState(() => lsBool(LS.multi, false));
    const [defDelivery, setDefDelivery] = useState(() => lsNum(LS.delivery, 0));
    const [defExtraLabel, setDefExtraLabel] = useState(() => lsText(LS.extraLabel, 'Extra'));
    const [defExtraValue, setDefExtraValue] = useState(() => lsNum(LS.extraValue, 0));
    useEffect(() => { lsSet(LS.showDelivery, showDelivery ? '1' : '0'); }, [showDelivery]);
    useEffect(() => { lsSet(LS.showExtra, showExtra ? '1' : '0'); }, [showExtra]);
    useEffect(() => { lsSet(LS.multi, multiExtras ? '1' : '0'); }, [multiExtras]);
    useEffect(() => { lsSet(LS.delivery, defDelivery); }, [defDelivery]);
    useEffect(() => { lsSet(LS.extraLabel, defExtraLabel); }, [defExtraLabel]);
    useEffect(() => { lsSet(LS.extraValue, defExtraValue); }, [defExtraValue]);

    /* ── the tabs ────────────────────────────────────────────────────────
       Not the kit's own drafts: this list is the application's workspace,
       shown as chips in the navigation rail and written to by the pre-sale
       and master-sales screens. A private queue here would leave all of those
       looking at a list nothing updates. The only translation needed is the
       name of the party — the workspace has always called it `customer`. */
    const out = (inv) => (inv ? { ...inv, party: inv.customer || null } : inv);
    const into = (p) => {
        if (!p || !('party' in p)) return p;
        const { party, ...rest } = p;
        return { ...rest, customer: party };
    };

    const list = useMemo(() => (ws.activeInvoices || []).map(out), [ws.activeInvoices]);
    const activeId = ws.currentInvoiceId;
    const drafts = useMemo(() => ({
        list,
        current: list.find((x) => x.id === activeId) || list[0],
        activeId: activeId || list[0]?.id,
        setActiveId: ws.setCurrentInvoiceId,
        patch: (p) => ws.updateInvoice(activeId || list[0]?.id, into(p)),
        add: (initial) => ws.addInvoice({
            ...into(initial || {}),
            delivery_charge: applyDefaults() && showDelivery ? num(defDelivery) : 0,
            extra_charge_value: applyDefaults() && showExtra ? num(defExtraValue) : 0,
            extra_charge_label: defExtraLabel,
        }),
        close: (id) => ws.removeInvoice(id),
        replace: () => {},
        live: true,
    }), [list, activeId, ws, showDelivery, showExtra, defDelivery, defExtraValue, defExtraLabel]);

    const current = drafts.current;

    /* A screen with no document on it is a screen with nothing to do. */
    useEffect(() => {
        if (isEdit || current) return;
        ws.addInvoice({
            tax: num(settings?.default_tax_rate),
            paymentMethod: settings?.cash_sale_default === '1' ? 'cash' : 'credit',
            delivery_charge: applyDefaults() && showDelivery ? num(defDelivery) : 0,
            extra_charge_value: applyDefaults() && showExtra ? num(defExtraValue) : 0,
            extra_charge_label: defExtraLabel,
        });
    }, [isEdit, current]);

    /* Turning the several-charges switch off must not leave the money behind:
       the editor disappears but the arithmetic reads the array, so the total
       would have gone on including a figure with nothing on screen to explain
       it. Folded into the single charge instead, and unfolded again when the
       switch goes back on. */
    /* Every open bill, and once on arrival — a tab restored from a previous
       session can be carrying several charges while the switch is off, and the
       arithmetic reads the array whether or not a row is drawn for it. Starting
       at null makes the first run a sweep rather than a no-op. */
    const wasMulti = useRef(null);
    useEffect(() => {
        if (wasMulti.current === multiExtras) return;
        wasMulti.current = multiExtras;
        (ws.activeInvoices || []).forEach((inv) => {
            const fields = inv.extraFields || [];
            if (multiExtras) {
                if (!fields.length && num(inv.extra_charge_value) > 0) {
                    ws.updateInvoice(inv.id, {
                        extraFields: [{ id: uid(), label: inv.extra_charge_label || 'Extra', value: num(inv.extra_charge_value) }],
                    });
                }
            } else if (fields.length) {
                ws.updateInvoice(inv.id, {
                    extraFields: [],
                    extra_charge_value: fields.reduce((s, f) => s + num(f.value), 0),
                    extra_charge_label: fields[0]?.label || inv.extra_charge_label || 'Extra',
                });
            }
        });
    }, [multiExtras, ws.activeInvoices?.length]);

    /* ── the sale being edited ──────────────────────────────────────────── */
    const editSeed = useCallback(() => ({
        id: sale.id,
        party: sale.customer || null,
        reference: sale.reference_number || '',
        /* `posted_at`, not `date` — there is no `date` column on a sale, so
           reading one always came back empty and every re-saved invoice was
           silently re-dated to today. */
        date: (sale.posted_at || sale.created_at || '').slice(0, 10) || today(),
        dueDate: (sale.due_date || '').slice(0, 10) || '',
        terms: 'net30',
        notes: sale.notes || '',
        /* The RATE, worked back from what was charged: `sales` stores the tax
           AMOUNT and the revenue it was charged on, not the percentage. Reading
           `sale.tax` here meant an invoice with Rs 180 of tax reopened showing
           a rate of 180%; reading `sale.tax_rate` meant every invoice reopened
           at 0% and asked to be re-saved without its tax. */
        tax: (() => {
            const net = num(sale.net_sales);
            const charged = num(sale.total_tax ?? sale.tax);
            return net > 0 ? Math.round((charged / net) * 10000) / 100 : 0;
        })(),
        discount: num(sale.global_discount ?? sale.discount),
        delivery_charge: num(sale.delivery_charge),
        extra_charge_value: num(sale.extra_charge_value),
        /* Several charges are stored as a JSON array in the label column, so
           reading it as a name put `[{"label":"Packing"…}]` on the screen where
           the charge's name should be. */
        ...(() => {
            const raw = sale.extra_charge_label || '';
            if (raw.trim().startsWith('[')) {
                try {
                    const arr = JSON.parse(raw);
                    if (Array.isArray(arr)) {
                        return {
                            extraFields: arr.map((f) => ({ id: uid(), label: f.label || 'Charge', value: num(f.value) })),
                            extra_charge_label: '',
                        };
                    }
                } catch (_) { /* not an array after all */ }
            }
            return { extra_charge_label: raw };
        })(),
        /* The column exists and is what the sale was actually settled by. */
        paymentMethod: sale.payment_method || 'cash',
        amountPaid: (sale.payments || []).reduce((s, p) => s + num(p.amount), 0),
        originalPaid: (sale.payments || []).reduce((s, p) => s + num(p.amount), 0),
        originalTotal: num(sale.total),
        overpaymentAction: sale.overpayment_action || null,
        status: sale.status,
        items: (sale.items || []).map((i) => ({
            id: uid(),
            product: i.product || { id: i.product_id, name: i.name || 'Item' },
            variant: i.variant_id ? { id: i.variant_id } : null,
            quantity: num(i.quantity),
            /* Carried, so the stock check knows the units this invoice already
               owns and does not refuse a change that frees some of them. */
            originalQuantity: num(i.quantity),
            freeQuantity: num(i.free_quantity),
            price: num(i.unit_price ?? i.price),
            cost: num(i.product?.cost ?? i.product?.cost_price),
            discount: num(i.discount_amount ?? i.discount),
            discountType: 'fixed',
            /* The rate this LINE was charged at, which on a bill of mixed rates
               is not the bill's average. Without it a two-line invoice — one
               product taxed, one not — reopened with the average applied to
               both and showed a total that had never been charged. */
            tax_rate: i.tax_rate === null || i.tax_rate === undefined ? null : num(i.tax_rate),
            available_stock: availableOf(i.product),
        })),
    }), [sale]);

    /* ── the AI hand-off ─────────────────────────────────────────────────
       A scanned bill arrives as a prefill and is applied once, onto the tab
       that is open. */
    useEffect(() => {
        if (isEdit || aiApplied.current || !aiPrefill || !current) return;
        aiApplied.current = true;
        const lines = (aiPrefill.items || []).filter((l) => l.product).map((l) => ({
            ...blankLine(),
            product: l.product,
            quantity: num(l.quantity) || 1,
            price: num(l.price),
            cost: num(l.product?.cost ?? l.product?.cost_price),
            available_stock: availableOf(l.product),
        }));
        drafts.patch({
            party: aiPrefill.party || null,
            notes: aiPrefill.notes || '',
            paymentMethod: aiPrefill.payment_method === 'credit' ? 'credit' : 'cash',
            ...(aiPrefill.date ? { date: aiPrefill.date } : {}),
            items: lines.length ? [...lines, blankLine()] : [blankLine()],
        });
        setAiNotice(`${lines.length} line${lines.length === 1 ? '' : 's'} read from the scan. Check every one before you save.`);
    }, [isEdit, aiPrefill, current]);

    /* ── printing ────────────────────────────────────────────────────────
       Always the server's copy of the sale: it is the one that carries the
       reference number the customer will quote, the running balance and the
       payments. The draft on screen has none of those. */
    const printSale = async (saleId) => {
        setPrinting(true);
        try {
            const res = await window.axios.get(route('store.sales.show', { store_slug: store?.slug, sale: saleId }), {
                headers: { Accept: 'application/json' },
            });
            PrintService.quickPrint(res.data?.sale || res.data, null, settings);
        } catch (_) {
            showAlert({ title: 'Could not fetch the invoice', message: 'The sale is saved — open it from the list to print it.', type: 'warning' });
        } finally {
            setPrinting(false);
        }
    };

    if (!isEdit && !current) {
        return <div style={{ padding: 'var(--d-s6, 24px)', color: 'var(--vq-text-3)' }}>Opening a new sale…</div>;
    }

    /* A posted sale is history: the accounting lock on the model refuses to
       update one, so offering the fields at all would let somebody type for
       five minutes and then be told 403. The status the server writes is
       'posted' — the old screen checked for it and this one was checking a
       word the server never uses. */
    const posted = isEdit
        ? sale?.status === 'posted'
        : current?.status === 'completed';

    return (
        <>
            <MoneyDocument
                doc={DOC}
                drafts={isEdit ? undefined : drafts}
                seed={() => ({ id: uid(), party: null, items: [blankLine()], date: today() })}
                editSeed={editSeed}
                isEdit={isEdit}
                locked={posted}
                lockNote={isEdit
                    ? 'This sale is posted. Its stock and its ledger entries are made, so it cannot be changed — raise a sale return or a credit note instead.'
                    : 'This sale is saved. Print it, or start another one.'}
                saveRef={saveRef}
                /* The finished bill stays on screen so it can be printed; it
                   leaves the drawer when the operator starts the next one. */
                closeOnSave={false}
                transport="axios"
                saveLabel={isEdit ? 'Update the sale' : 'Complete the sale'}
                /* The counter setting decides. A shop that turned auto-fill off
                   did so because their operators take part payments, and
                   pre-filling the whole bill is how one gets recorded as
                   settled. */
                settleDefault={(d, totals) => (
                    settings?.pos_auto_fill_cash === '1' && d.paymentMethod === 'cash'
                        ? totals.grandTotal
                        : 0
                )}
                /* Two switches in the settings sheet that otherwise changed
                   nothing on the screen. */
                chargeVisible={{ delivery: showDelivery, extra: showExtra && !multiExtras }}
                notice={aiNotice ? (
                    <div className="vqdoc-note" data-tone="warn">
                        <span className="eyebrow">Read from a scan</span>
                        <span>{aiNotice}</span>
                    </div>
                ) : null}
                url={({ d }) => (isEdit
                    ? route('store.sales.update', { store_slug: store?.slug, sale: d.id })
                    : route('store.sales.store', { store_slug: store?.slug }))}

                /* ── what a sale will not let you do ─────────────────────── */
                validate={({ d, items }) => {
                    if (shouldStopNegativeStock(settings)) {
                        for (const i of items.filter((x) => x.product)) {
                            /* Free goods leave the shelf too — the server
                               deducts quantity PLUS free, and checking only the
                               quantity let a line of 1 + 50 free walk out. */
                            const going = num(i.quantity) + num(i.freeQuantity);
                            /* Units this invoice already owns are not somebody
                               else's; an edit that lowers a quantity must not be
                               refused for stock it is about to give back. */
                            const have = availableOf(i.product, i.available_stock) + num(i.originalQuantity);
                            if (going > have) {
                                return { items: `Only ${have} of ${i.product.name} can be sold — this line needs ${going}. Turn on "Allow overselling" in settings to go past it.` };
                            }
                        }
                    }
                    if (d.paymentMethod === 'credit' && !d.party?.id) {
                        return { party: 'A sale on account has to be on somebody’s account — choose a customer.' };
                    }
                    return null;
                }}

                /* ── the overpayment question ────────────────────────────── */
                beforeSave={({ d, totals, opts }) => {
                    if (opts.addToLedger !== undefined) return true;   /* answered */
                    const excess = num(d.amountPaid) - totals.grandTotal;
                    if (excess <= 0.005) return true;
                    if (isEdit && d.overpaymentAction) {
                        saveRef.current?.({ ...opts, addToLedger: d.overpaymentAction === 'ledger' });
                        return false;
                    }
                    /* An invoice that was already overpaid when it was opened
                       has had that decision made once; re-asking on every save
                       invites a second credit entry nobody intended. */
                    if (isEdit && num(d.originalPaid) > num(d.originalTotal) + 1) {
                        saveRef.current?.({ ...opts, addToLedger: false });
                        return false;
                    }
                    setOverpayment({ amount: excess, name: d.party?.name || 'the customer', print: !!opts.print });
                    return false;
                }}

                buildPayload={({ d, opts }) => {
                    /* One key per tab, replaced after a save. A double-click or
                       a retried request cannot post the same sale twice. */
                    if (!idemRef.current[d.id]) idemRef.current[d.id] = uid();
                    return {
                        customer_id: d.party?.id || null,
                        payment_method: d.paymentMethod,
                        notes: d.notes || null,
                        reference: d.reference || null,
                        date: d.date,
                        due_date: d.dueDate || null,
                        add_to_ledger: !!opts.addToLedger,
                        payment_account_id: d.paymentAccountId || null,
                        bank_account_id: d.bankReferenceId || null,
                        cheque_date: d.isCheque ? (d.chequeDate || null) : null,
                        payment_reference: d.paymentReference || null,
                        source: 'manual',
                        ...(isEdit ? {} : { idempotency_key: idemRef.current[d.id] }),
                    };
                }}

                onSaved={(res, d, opts) => {
                    localStorage.setItem('amd_product_latest_change', String(Date.now()));
                    const savedId = isEdit ? d.id : res?.data?.sale_id;
                    if (savedId) savedIds.current[d.id] = savedId;
                    delete idemRef.current[d.id];

                    if (isEdit) {
                        if (opts?.print && savedId) printSale(savedId);
                        else router.visit(route('store.sales.index', { store_slug: store?.slug }));
                        return;
                    }
                    drafts.patch({ status: 'completed' });
                    /* Asked for, so done first — the onboarding branch below
                       returns, and printing after it never happened. */
                    if (opts?.print && savedId) printSale(savedId);
                    /* Mid-onboarding the tour takes over from here. */
                    if (store?.onboarding_step === 'invoice_tour') {
                        router.post(
                            route('store.onboarding.step', { store_slug: store?.slug }),
                            { step: 'invoice_congratulations' },
                            { preserveScroll: true },
                        );
                        return;
                    }
                    setDone({ id: savedId, total: res?.data?.total });
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

                        {chrome.field('account') && (
                            <Field label="Money goes to" span={4}>
                                <VqSelect
                                    ariaLabel="Which account this is banked into"
                                    value={d.paymentAccountKey ?? acct.defaultKey ?? ''}
                                    onChange={(v) => {
                                        const p = acct.resolve(v);
                                        if (!p) return;
                                        /* Shown as today and never stored meant
                                           every cheque was saved without one. */
                                        patch(p.isCheque && !d.chequeDate ? { ...p, chequeDate: today() } : p);
                                    }}
                                    options={acct.options}
                                />
                            </Field>
                        )}

                        {d.isCheque && (
                            <>
                                <Field label="Cheque no." span={2}>
                                    <input type="text" className="vqdoc-in" value={d.paymentReference || ''}
                                        onChange={(e) => patch({ paymentReference: e.target.value })} />
                                </Field>
                                <Field label="Cheque date" span={2}>
                                    <input type="date" className="vqdoc-in" value={d.chequeDate || today()}
                                        onChange={(e) => patch({ chequeDate: e.target.value })} />
                                </Field>
                            </>
                        )}

                        {chrome.field('date') && (
                            <Field label="Date" span={3}>
                                <input type="date" className="vqdoc-in" value={d.date || today()}
                                    max={isEdit ? undefined : today()}
                                    onChange={(e) => patch({ date: e.target.value })} />
                            </Field>
                        )}

                        {chrome.field('terms') && (
                            <Field label="Payment terms" span={3}>
                                <VqSelect
                                    ariaLabel="Payment terms"
                                    value={d.terms || 'net30'}
                                    onChange={(v) => {
                                        const days = { immediate: 0, net7: 7, net15: 15, net30: 30, net60: 60 }[v] ?? 30;
                                        const base = d.date ? new Date(d.date) : new Date();
                                        base.setDate(base.getDate() + days);
                                        patch({ terms: v, dueDate: base.toISOString().split('T')[0] });
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
                            <Field label="Due date" span={3}>
                                <input type="date" className="vqdoc-in" value={d.dueDate || ''}
                                    onChange={(e) => patch({ dueDate: e.target.value })} />
                            </Field>
                        )}

                        {chrome.field('notes') && (
                            <Field label="Note on the invoice" span={12}>
                                <textarea className="vqdoc-in" rows={2} value={d.notes || ''}
                                    placeholder="Anything that should print on the customer's copy"
                                    onChange={(e) => patch({ notes: e.target.value })} />
                            </Field>
                        )}
                    </>
                )}

                /* Several charges on one bill — delivery, packing, unloading —
                   each with its own label, all of them saved. */
                extraRows={({ d, patch }) => (multiExtras ? (
                    <>
                        {(d.extraFields || []).map((f) => (
                            <div className="vqdoc-sum-row edit" key={f.id}>
                                <span className="k">
                                    <input type="text" className="vqdoc-in xs" value={f.label}
                                        onChange={(e) => patch({
                                            extraFields: d.extraFields.map((x) => (x.id === f.id ? { ...x, label: e.target.value } : x)),
                                        })} />
                                </span>
                                <span className="v">
                                    <input type="number" className="vqdoc-cell" value={f.value}
                                        onFocus={(e) => e.target.select()}
                                        onChange={(e) => patch({
                                            extraFields: d.extraFields.map((x) => (x.id === f.id ? { ...x, value: num(e.target.value) } : x)),
                                        })} />
                                    <button type="button" className="vqdoc-icon sm quiet danger"
                                        onClick={() => patch({ extraFields: d.extraFields.filter((x) => x.id !== f.id) })}>
                                        <X size={13} />
                                    </button>
                                </span>
                            </div>
                        )) }
                        {(d.extraFields || []).length < 10 && (
                            <div className="vqdoc-sum-row">
                                <span className="k">
                                    <button type="button" className="vqdoc-btn xs"
                                        onClick={() => patch({
                                            extraFields: [...(d.extraFields || []), { id: uid(), label: 'Charge', value: 0 }],
                                        })}>
                                        <Plus size={13} /> Add a charge
                                    </button>
                                </span>
                                <span className="v" />
                            </div>
                        )}
                    </>
                ) : null)}

                extraTools={(
                    <button type="button" className="vqdoc-icon" title="What this sale is making"
                        onClick={() => setMarginOpen(true)}>
                        <TrendingUp size={17} />
                    </button>
                )}

                extraActions={({ d, totals }) => (
                    <>
                        <button type="button" className="vqdoc-btn" disabled={printing}
                            title="Save and print the customer's copy"
                            onClick={() => {
                                const already = isEdit ? d.id : savedIds.current[d.id];
                                if (already) printSale(already);
                                else saveRef.current?.({ print: true });
                            }}>
                            <Printer size={16} /> {printing ? 'Printing' : (posted ? 'Print' : 'Save & print')}
                        </button>
                        {!isEdit && !posted && (
                            <button type="button" className="vqdoc-btn danger" title="Throw this bill away"
                                onClick={() => drafts.close(d.id)}>
                                <Trash2 size={16} />
                            </button>
                        )}
                    </>
                )}

                settingsExtras={{
                    showDeliveryCharges: showDelivery, setShowDeliveryCharges: setShowDelivery,
                    showExtraField: showExtra, setShowExtraField: setShowExtra,
                    enableMultipleExtras: multiExtras, setEnableMultipleExtras: setMultiExtras,
                    defaultDelivery: defDelivery, setDefaultDelivery: setDefDelivery,
                    defaultExtraLabel: defExtraLabel, setDefaultExtraLabel: setDefExtraLabel,
                    defaultExtraValue: defExtraValue, setDefaultExtraValue: setDefExtraValue,
                }}

                extraSheets={({ d, totals, items }) => (
                    <>
                        {/* What the shop is making on this bill. Held behind a
                            button because it is not the customer's business. */}
                        {marginOpen && (
                            <Sheet
                                title="What this sale is making"
                                hint="Cost is what the units actually came in at, batch by batch."
                                icon={<Coins size={18} />}
                                width={720}
                                onClose={() => setMarginOpen(false)}
                            >
                                <table className="vqdoc-dtable">
                                    <thead>
                                        <tr>
                                            <th>Item</th>
                                            <th className="n">Qty</th>
                                            <th className="n">Cost</th>
                                            <th className="n">Price</th>
                                            <th className="n">Profit</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.filter((i) => i.product).map((i) => {
                                            const qty = num(i.quantity) + num(i.freeQuantity);
                                            const rev = qty * num(i.price) - (i.discountType === 'percent'
                                                ? num(i.quantity) * num(i.price) * (num(i.discount) / 100)
                                                : num(i.discount));
                                            const cost = qty * num(i.cost);
                                            return (
                                                <tr key={i.id}>
                                                    <td>{i.product.name}</td>
                                                    <td className="n">{qty}</td>
                                                    <td className="n">{money(cost)}</td>
                                                    <td className="n">{money(rev)}</td>
                                                    <td className="n">{money(rev - cost)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                <div className="vqdoc-sum" style={{ marginTop: 'var(--d-s4)' }}>
                                    <div className="vqdoc-sum-row"><span className="k">Cost of goods</span><span className="v">{money(totals.totalCost)}</span></div>
                                    <div className="vqdoc-sum-row"><span className="k">Invoice total</span><span className="v">{money(totals.grandTotal)}</span></div>
                                    <div className="vqdoc-total"><span className="k">Gross profit</span><span className="v">{money(totals.profit)} · {totals.marginPct.toFixed(1)}%</span></div>
                                </div>
                            </Sheet>
                        )}

                        {/* Money over the total is a decision, not a rounding
                            error: it either goes back across the counter or it
                            stays on their account. */}
                        {overpayment && (
                            <Scrim onClose={() => setOverpayment(null)}>
                                <div className="vqdoc-modal" style={{ width: 'min(480px, 100%)' }}>
                                    <header>
                                        <span className="ico"><Wallet size={18} /></span>
                                        <span className="t"><h3>{money(overpayment.amount)} more than the bill</h3></span>
                                    </header>
                                    <div className="body" style={{ display: 'grid', gap: 'var(--d-s4)' }}>
                                        <p style={{ margin: 0, color: 'var(--vq-text-2)' }}>
                                            {overpayment.name} has handed over more than this invoice comes to.
                                        </p>
                                        <button type="button" className="vqdoc-opt"
                                            onClick={() => { const o = overpayment; setOverpayment(null); saveRef.current?.({ print: o.print, addToLedger: false }); }}>
                                            <strong>Give the change back</strong>
                                            <span>{money(overpayment.amount)} out of the drawer now.</span>
                                        </button>
                                        <button type="button" className="vqdoc-opt"
                                            onClick={() => { const o = overpayment; setOverpayment(null); saveRef.current?.({ print: o.print, addToLedger: true }); }}>
                                            <strong>Keep it on their account</strong>
                                            <span>Held as credit against what they buy next.</span>
                                        </button>
                                        <div className="vqdoc-actions">
                                            <button type="button" className="vqdoc-btn" onClick={() => setOverpayment(null)}>Go back</button>
                                        </div>
                                    </div>
                                </div>
                            </Scrim>
                        )}

                        {/* Saved. */}
                        {done && (
                            <Scrim onClose={() => setDone(null)}>
                                <div className="vqdoc-modal" style={{ width: 'min(440px, 100%)' }}>
                                    <header>
                                        <span className="ico"><CheckCircle2 size={18} /></span>
                                        <span className="t"><h3>Sale completed</h3></span>
                                    </header>
                                    <div className="body" style={{ display: 'grid', gap: 'var(--d-s4)' }}>
                                        <p style={{ margin: 0, color: 'var(--vq-text-2)' }}>
                                            The stock is out and the invoice is in the books.
                                        </p>
                                        <div className="vqdoc-actions">
                                            <button type="button" className="vqdoc-btn" disabled={printing}
                                                onClick={() => printSale(done.id)}>
                                                <Printer size={16} /> {printing ? 'Printing' : 'Print receipt'}
                                            </button>
                                            <button type="button" id="tour-new-transaction" className="vqdoc-btn pri"
                                                onClick={() => {
                                                    const closing = d.id;
                                                    setDone(null);
                                                    drafts.close(closing);
                                                    if (store?.onboarding_step) router.reload({ only: ['store'] });
                                                }}>
                                                Start another sale
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </Scrim>
                        )}
                    </>
                )}
            />

            <InvoiceTourGuide store={store} />
        </>
    );
}

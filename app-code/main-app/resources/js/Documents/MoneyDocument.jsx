import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Plus, CheckCircle2, Zap, ScanBarcode, TrendingUp } from 'lucide-react';

import { formatCurrency, getCurrencySymbol } from '@/Utils/format';
import { roundTotal } from '@/Utils/settings';
import { useAlert } from '@/Contexts/AlertContext';
import AsyncPartyCombobox from '@/Components/AsyncPartyCombobox';
import ProductModal from '@/Components/ProductModal';
import QuickPartyModal from '@/Components/QuickPartyModal';

import DocumentShell, { Zone, Field } from '@/Documents/DocumentShell';
import DocumentLines, { availableOf } from '@/Documents/DocumentLines';
import DocumentTotals, { DocumentCounts } from '@/Documents/DocumentTotals';
import DocumentSettings from '@/Documents/DocumentSettings';
import DocumentScan from '@/Documents/DocumentScan';
import useDocumentChrome from '@/Documents/useDocumentChrome';
import useDocumentDrafts from '@/Documents/useDocumentDrafts';
import useDocumentAccounts from '@/Documents/useDocumentAccounts';
import usePartyBalance from '@/Documents/usePartyBalance';
import computeTotals, { moneyPayload, linePayload } from '@/Documents/documentMoney';

/**
 * MoneyDocument — everything a document with prices on it does.
 *
 * Seven of these screens differ only in who is on the other side, what the
 * header asks for and where it posts. Written out one at a time they drift
 * apart within a month — which is exactly what happened to the seven this
 * replaces, all forks of one invoice screen and by then 800 lines apart, each
 * with its own copy of the same three bugs.
 *
 * A screen built on this supplies five things: the document spec, a seed for a
 * blank one, the header fields that are its own, how to turn the whole thing
 * into a payload, and where to post it. Everything else — the tabs, the lines,
 * the totals, the keyboard, the scanner, the settings, the ledger view of the
 * party, the error mapping — is here, once.
 */

const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
export const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
export const blankLine = (extra) => ({
    id: uid(), product: null, quantity: 1, freeQuantity: 0,
    price: 0, discount: 0, discountType: 'fixed', ...(extra || {}),
});
export const today = () => new Date().toISOString().split('T')[0];

/* Which way money moves on this document, and therefore which accounts the
   picker should offer. Read from the field the document carries rather than
   from its name: a refund on a SALE return leaves the till, the same word on a
   PURCHASE return means money coming back in. Getting this from the document
   itself is what stops the two being confused again. */
const flowOf = (doc) => {
    if (doc.fields.includes('account')) return 'in';
    if (doc.fields.includes('accountOut')) return 'out';
    if (doc.fields.includes('refund')) return doc.party.role === 'customer' ? 'out' : 'in';
    return doc.party.role === 'supplier' ? 'out' : 'in';
};

export default function MoneyDocument({
    doc,
    seed,                 /* () => a blank document                           */
    editSeed,             /* () => the one being edited                       */
    isEdit = false,
    locked = false,
    lockNote,
    notice,               /* a banner above the document                      */
    header,               /* (bag) => the header fields that are its own      */
    extra,                /* a block between the header and the lines         */
    buildPayload,         /* (bag) => the rest of the payload                 */
    beforeSave,           /* (bag) => false to stop and ask something first   */
    validate,             /* (bag) => { field: message } | null               */
    onSaved,              /* (response, d) => void                            */
    products = [],
    parties = [],
    categories = [],
    saveLabel,
    strip,                /* override the folded one-line summary             */
    extraTools,
    extraActions,
    extraRows,            /* extra rows in the totals column                  */
    extraSheets,
    priceOf,              /* which price a picked product opens at            */
    lockItems = false,    /* lines come from a source document, not a search  */
    partyLocked = false,  /* the other side is settled by that source document */
    readOnlyCells,        /* { rate, disc, total } — columns that report only  */
    qtyFloor = 1,         /* the lowest a quantity may be wheeled to           */
    canAddLines = true,
    dockTotal,            /* (bag) => the figure on the phone dock            */
    dockLabel,
    settleDefault,        /* (d, totals) => the settlement to fill in         */
    drafts: externalDrafts, /* a tab source of the screen's own              */
    saveRef: outerSaveRef,  /* so a screen can finish a save it interrupted  */
    closeOnSave = true,     /* whether a saved tab leaves the drawer          */
    settingsExtras,         /* extra switches for the settings sheet         */
    chargeVisible,          /* which of the charge rows are offered at all   */
    transport = 'axios',  /* 'axios' | 'inertia'                              */
    method,               /* 'post' | 'put' — defaults from isEdit            */
    url,                  /* ({ d }) => string                                */
    afterUrl,             /* where to go once it is saved                     */
}) {
    const { settings, auth, store } = usePage().props;
    const { showAlert, showConfirm } = useAlert();
    const isAdmin = ['admin', 'owner', 'platform_admin'].includes(auth?.user?.role);

    const currency = getCurrencySymbol(store || settings);
    const money = (n) => formatCurrency(n, store || settings);

    /* The hook runs either way — hooks must — but it keeps to itself when
       the screen brought its own tabs. The sales invoice's tabs are the
       application's workspace: the same list the nav rail shows and two other
       screens write to, so it cannot be replaced by a private one without
       those going quiet. */
    const ownDrafts = useDocumentDrafts({
        doc,
        seed: isEdit && editSeed ? editSeed : seed,
        enabled: !isEdit && !externalDrafts,
    });
    const drafts = externalDrafts || ownDrafts;
    const d = drafts.current;
    /* One guard, at the source. A posted document is history: its header, its
       party, its settlement and its charges are all as much a part of what the
       books say happened as its lines are. Disabling the line cells and leaving
       the header live let an operator change the customer on a posted invoice
       and watch the balance beside it re-query the ledger for somebody who has
       nothing to do with that sale. */
    const patch = useCallback((p) => {
        if (locked) return;
        drafts.patch(p);
    }, [locked, drafts]);
    const items = d.items || [];

    const setItems = useCallback((next) => {
        patch({ items: typeof next === 'function' ? next(d.items || []) : next });
    }, [patch, d.items]);

    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [invalid, setInvalid] = useState([]);
    const [scanning, setScanning] = useState(false);
    const [productModal, setProductModal] = useState(null);
    const [partyModal, setPartyModal] = useState(null);
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [totalModes, setTotalModes] = useState({});
    const [peek, setPeek] = useState(false);
    const saveRef = useRef(null);

    const partyRole = doc.party.role;
    const settles = doc.money.settle !== 'none';

    const acct = useDocumentAccounts({
        storeSlug: store?.slug,
        direction: flowOf(doc),
        withCheque: settles,
    });
    /* Read from the ledger, never from the cached column on the party row. */
    const partyBal = usePartyBalance({ storeSlug: store?.slug, partyId: d.party?.id });

    const chrome = useDocumentChrome({
        doc,
        activeId: d.id,
        seniorMode: settings?.senior_mode === '1',
        marginDefault: settings?.show_margin_percentage === '1',
        onSave: () => saveRef.current?.(),
        /* The header may not fold itself away until the one field the document
           cannot be saved without is answered. */
        canFold: partyRole === 'none' || doc.party.required === false || !!d.party?.id,
        locked,
    });

    const totals = useMemo(() => computeTotals({
        doc, items, document: d, settings, fields: chrome.fields, roundTotal,
    }), [doc, items, d, settings, chrome.fields]);

    /* Land on the shop's till as soon as the account list arrives, rather than
       leaving the box reading "Choose" for a question with an obvious answer. */
    useEffect(() => {
        /* Not on an edit. A document being corrected was paid from whatever it
           was paid from, and quietly filling in the shop's default till states
           that as a fact — then re-posts the journal against it. */
        if (!settles || locked || isEdit) return;
        if (d.paymentAccountKey || !acct.defaultKey) return;
        const picked = acct.resolve(acct.defaultKey);
        if (picked) patch(picked);
    }, [settles, locked, acct.defaultKey, d.paymentAccountKey, acct.resolve, patch]);

    /* ── the settlement ──────────────────────────────────────────────────
       Paid now means paid in full until somebody types otherwise. Once a
       figure has been typed it belongs to the operator and re-keying a
       quantity must not quietly reset it — that is what `patchSettle` is for.
       Each tab keeps its own answer to this. */
    /* Keyed by document, not by screen. A single flag reset on every tab
       change meant a part refund typed on one tab was silently replaced by the
       full amount as soon as the operator looked at another tab and came
       back — and then handed over in cash. */
    const settleTouched = useRef({});

    /* Held in a ref because screens pass this inline: as a dependency it has a
       new identity every render, so the effect below would re-run forever. */
    const settleDefaultRef = useRef(settleDefault);
    settleDefaultRef.current = settleDefault;

    useEffect(() => {
        if (!settles || isEdit || locked || settleTouched.current[d.id]) return;
        const fn = settleDefaultRef.current;
        const fill = fn ? fn(d, totals) : (d.paymentMethod === 'cash' ? totals.grandTotal : 0);
        if (Math.abs(num(d.amountPaid) - num(fill)) > 0.004) patch({ amountPaid: fill });
    }, [settles, isEdit, locked, d.id, d.paymentMethod, totals.grandTotal]);

    const patchSettle = useCallback((p) => {
        if ('amountPaid' in p) settleTouched.current[d.id] = true;
        patch(p);
    }, [patch, d.id]);

    /* Switching between paid-now and on-account is a fresh answer to the
       question, so the rule above is allowed to run again. */
    const setSettleMode = useCallback((mode) => {
        /* CHANGING it is a fresh answer, so the rule may fill it in again.
           Pressing the button that is already lit is not, and clearing the flag
           there would drop a figure the operator had typed. */
        if (mode === d.paymentMethod) return;
        delete settleTouched.current[d.id];
        patch({ paymentMethod: mode });
    }, [patch, d.id, d.paymentMethod]);

    /* ── lines ──────────────────────────────────────────────────────────── */

    const update = useCallback((id, key, value) => {
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [key]: value } : i)));
    }, [setItems]);
    const remove = useCallback((id) => {
        setItems((prev) => (prev.length > 1 ? prev.filter((i) => i.id !== id) : [blankLine()]));
    }, [setItems]);
    const addLine = useCallback(() => setItems((prev) => [...prev, blankLine()]), [setItems]);

    const onPickProduct = useCallback((product, id) => {
        if (!product) return;
        setItems((prev) => prev.map((i) => (i.id === id ? {
            ...i,
            product,
            price: num(priceOf ? priceOf(product) : (product.price ?? product.selling_price)),
            cost: num(product.cost ?? product.cost_price),
            available_stock: availableOf(product),
        } : i)));
        setInvalid([]);
    }, [setItems, priceOf]);

    const onTotalChange = useCallback((item, value) => {
        const target = num(value);
        const mode = totalModes[item.id] || 'price';
        if (mode === 'price') {
            const qty = num(item.quantity) || 1;
            update(item.id, 'price', Math.max(0, (target + num(item.discount)) / qty));
        } else {
            const price = num(item.price) || 1;
            update(item.id, 'quantity', Math.max(0, (target + num(item.discount)) / price));
        }
    }, [totalModes, update]);

    const validLines = items.filter((i) => (doc.money.lines === 'amount' ? (i.category_id || i.desc) : i.product));

    /* ── saving ─────────────────────────────────────────────────────────── */

    const bag = { d, patch, patchSettle, setSettleMode, items, setItems, totals, acct,
                  chrome, errors, money, currency, isEdit, locked, partyBal, validLines,
                  settings, store, showAlert };

    const save = async (opts = {}) => {
        if (locked || saving) return;

        const found = {};
        if (partyRole !== 'none' && doc.party.required !== false && !d.party?.id) {
            found.party = `Choose a saved ${doc.party.label.toLowerCase()} — typing a name is not enough.`;
        }
        Object.assign(found, validate?.({ ...bag, opts }) || {});
        setErrors(found);
        if (Object.keys(found).length) {
            showAlert({ title: 'Not ready to save', message: Object.values(found)[0], type: 'warning' });
            return;
        }
        if (!validLines.length) {
            showAlert({ title: 'Nothing on it', message: 'Add at least one line first.', type: 'warning' });
            return;
        }
        /* A discount larger than the goods drives the ledger negative and the
           server refuses it. Saying so here saves a round trip and names the
           number the operator has to change. */
        if (doc.money.lines === 'priced' && num(d.discount) > totals.subtotal - totals.itemDiscounts + 0.004) {
            showAlert({
                title: 'Discount is too big',
                message: `${money(num(d.discount))} is more than the ${money(totals.subtotal - totals.itemDiscounts)} of goods on this document.`,
                type: 'warning',
            });
            return;
        }
        if (beforeSave && beforeSave({ ...bag, opts }) === false) return;

        setSaving(true);
        try {
            const payload = {
                ...moneyPayload({ doc, totals, document: d }),
                items: linePayload({ doc, items, totals }),
                ...buildPayload({ ...bag, opts }),
            };
            const target = url({ d, opts });
            const verb = method || (isEdit ? 'put' : 'post');

            if (transport === 'inertia') {
                router[verb](target, payload, {
                    onError: (e) => {
                        setErrors(e);
                        setInvalid(rowsFrom(e));
                        setSaving(false);
                        showAlert({ title: 'Could not save', message: Object.values(e)[0] || 'Check the highlighted lines.', type: 'error' });
                    },
                    onSuccess: () => onSaved?.(null, d, opts),
                    onFinish: () => setSaving(false),
                });
                return;
            }

            const res = await window.axios[verb](target, payload);
            showAlert({
                title: 'Saved',
                message: `${doc.name} ${isEdit ? 'updated' : 'saved'}.`,
                type: 'success',
            });
            /* The tab has become a real document; it should not still be
               sitting in the drawer waiting to be entered again. */
            /* Usually a tab that has become a real document should not
               still be sitting in the drawer waiting to be entered again. The
               sales invoice is the exception: it keeps the finished bill on
               screen so it can be printed, and closes it when the operator
               starts the next one. */
            if (!isEdit && closeOnSave && drafts.live) drafts.close(d.id);
            if (onSaved) onSaved(res, d, opts);
            else if (afterUrl) router.visit(afterUrl);
            else router.visit(route(doc.api.index, { store_slug: store?.slug }));
        } catch (err) {
            const errs = err?.response?.data?.errors;
            const first = errs ? Object.values(errs)[0]?.[0] : null;
            showAlert({
                title: 'Could not save',
                message: first || err?.response?.data?.message || 'Something went wrong.',
                type: 'error',
            });
            if (errs) { setErrors(errs); setInvalid(rowsFrom(errs)); }
        } finally {
            if (transport !== 'inertia') setSaving(false);
        }
    };
    saveRef.current = save;
    /* A screen that has to ask something before saving — "give the change or
       keep it on their account?" — stops the save, asks, and finishes it
       through this. */
    if (outerSaveRef) outerSaveRef.current = save;

    /* ── what the line table needs ──────────────────────────────────────── */

    const ctx = {
        locked, isAdmin, currency, money, categories,
        showStock: chrome.showStock,
        stockMode: doc.stock.badge,
        stockBadge: doc.stock.badge,
        stockWord: doc.stock.badge === 'onhand' ? 'in stock' : 'available',
        freeOn: totals.freeOn,
        canDiscount: settings?.billing_type !== 'lite',
        itemPlaceholder: doc.itemPlaceholder || 'Search for an item',
        defaultProducts: products,
        showTaxDetail: chrome.showAllFields,
        lockItems,
        readOnly: readOnlyCells || {},
        qtyFloor,
        update, remove, addLine, onPickProduct, onTotalChange, priceOf,
        onCreateProduct: (name) => setProductModal({ mode: 'create', product: { name } }),
        onEditProduct: (product) => setProductModal({ mode: 'edit', product }),
        totalMode: (id) => totalModes[id] || 'price',
        toggleTotalMode: (id) => setTotalModes((p) => ({ ...p, [id]: (p[id] || 'price') === 'price' ? 'qty' : 'price' })),
        draggedIndex, invalid,
        onCellFocus: () => {},
        onDragStart: (e, idx) => { setDraggedIndex(idx); e.dataTransfer.effectAllowed = 'move'; },
        onDragOver: (e, idx) => {
            e.preventDefault();
            if (draggedIndex === null || draggedIndex === idx) return;
            setItems((prev) => { const n = [...prev]; const [m] = n.splice(draggedIndex, 1); n.splice(idx, 0, m); return n; });
            setDraggedIndex(idx);
        },
        onDragEnd: () => setDraggedIndex(null),
    };

    /* Slots may be given as a value or as a function of the same bag the
       header gets. A sheet that has to reach `patch` — a source-document
       picker, say — needs the second, and passing it a global was the
       alternative. */
    const slot = (v) => (typeof v === 'function' ? v(bag) : v);

    /* A transfer, an audit or a receipt has no money on it at all; showing a
       grand total of zero on the phone dock reads as "this is worth nothing"
       rather than "money is not what this document is about". */
    const countsOnly = doc.money.lines === 'count';

    const canMargin = doc.money.margin && isAdmin && chrome.showMargin;
    const partyName = d.party?.name || `No ${doc.party.label ? doc.party.label.toLowerCase() : 'party'} chosen`;

    return (
        <DocumentShell
            doc={doc}
            chrome={chrome}
            isEdit={isEdit}
            locked={locked}
            lockNote={lockNote}
            notice={slot(notice)}
            subtitle={`${d.reference || 'Not numbered'}${validLines.length ? ` · ${validLines.length} line${validLines.length === 1 ? '' : 's'}` : ''}`}
            tabs={drafts.list.map((x, i) => ({
                id: x.id,
                label: x.party?.name || `${doc.title.tab} ${i + 1}`,
                count: (x.items || []).filter((l) => l.product || l.category_id).length,
            }))}
            activeTab={drafts.activeId}
            onTab={drafts.setActiveId}
            onCloseTab={(t) => {
                const doomed = drafts.list.find((x) => x.id === t.id);
                const lines = (doomed?.items || []).filter((l) => l.product || l.category_id).length;
                if (!lines) { drafts.close(t.id); return; }
                showConfirm({
                    title: `Discard this ${doc.name.toLowerCase()}?`,
                    message: `It has ${lines} line${lines === 1 ? '' : 's'} on it and nothing has been saved.`,
                    type: 'warning',
                    confirmLabel: 'Yes, discard',
                    onConfirm: () => drafts.close(t.id),
                });
            }}
            onNewTab={() => drafts.add()}
            tools={(
                <>
                    {!locked && !lockItems && (
                        <button type="button" className="vqdoc-icon" aria-pressed={chrome.showQuickEntry}
                            title="Quick add row — Alt+Q, then just type"
                            onClick={() => chrome.setShowQuickEntry(!chrome.showQuickEntry)}>
                            <Zap size={17} />
                        </button>
                    )}
                    {!locked && !lockItems && doc.money.lines !== 'amount' && (
                        <button type="button" className="vqdoc-icon" title="Scan barcodes" onClick={() => setScanning(true)}>
                            <ScanBarcode size={17} />
                        </button>
                    )}
                    {canMargin && (
                        /* Held, not toggled: a number this sensitive should not
                           stay on the screen by accident. */
                        <button type="button" className="vqdoc-icon" aria-pressed={peek}
                            title="Hold to see the margin"
                            onPointerDown={() => setPeek(true)}
                            onPointerUp={() => setPeek(false)}
                            onPointerLeave={() => setPeek(false)}>
                            <TrendingUp size={17} />
                        </button>
                    )}
                    {slot(extraTools)}
                </>
            )}
            header={(
                <Zone
                    title={doc.zone}
                    actions={(
                        <>
                            {chrome.hasHiddenFields && (
                                <button type="button" className="togg" onClick={() => chrome.setShowAllFields((p) => !p)}>
                                    {chrome.showAllFields ? 'Fewer fields' : 'All fields'}
                                </button>
                            )}
                            <button type="button" className="togg" onClick={() => chrome.setFold('collapsed')}>Fold away</button>
                        </>
                    )}
                >
                    <div className="vqdoc-hdr">
                        {partyRole !== 'none' && partyLocked && (
                            /* Settled by the document this one answers to.
                               Offering a picker here would suggest it could be
                               changed, and the server would ignore it. */
                            <Field label={doc.party.label} span={4}>
                                <div className="vqdoc-in" style={{ display: 'flex', alignItems: 'center' }}>
                                    {d.party?.name || '—'}
                                </div>
                            </Field>
                        )}
                        {partyRole !== 'none' && !partyLocked && (
                            <Field
                                label={doc.party.label}
                                span={4}
                                required={doc.party.required !== false}
                                error={errors.party}
                            >
                                <div id="tour-invoice-customer" className="vqdoc-combo" data-bad={errors.party ? 'true' : undefined}>
                                    <AsyncPartyCombobox
                                        type={doc.party.search || partyRole}
                                        selectedItem={d.party}
                                        onSelect={(p) => { patch({ party: p }); setErrors((e) => ({ ...e, party: null })); }}
                                        onCreateNew={(name) => setPartyModal({ name })}
                                        defaultOptions={parties}
                                        placeholder={doc.party.placeholder || `Search ${doc.party.label.toLowerCase()}s`}
                                        addNewLabel="Add a new one"
                                        portal
                                    />
                                </div>
                            </Field>
                        )}
                        {header?.(bag)}
                    </div>
                </Zone>
            )}
            extra={slot(extra)}
            strip={strip !== undefined ? slot(strip) : (
                <button type="button" className="vqdoc-strip" onClick={() => chrome.setFold('open')} title="Open the details">
                    <span className="chev">▾</span>
                    <span className="who">{partyRole === 'none' ? doc.name : partyName}</span>
                    <span className="meta">{d.reference || 'Not numbered'} · {d[doc.dateKey || 'date'] || ''}</span>
                    <span className="amt">{countsOnly ? `${totals.units} units` : money(totals.grandTotal)}</span>
                </button>
            )}
            lines={(
                <Zone
                    title={doc.money.lines === 'amount' ? 'What it was for' : 'Items'}
                    count={validLines.length || 'none yet'}
                    onFocusCapture={chrome.onLinesFocus}
                >
                    <DocumentLines
                        doc={doc} chrome={chrome} items={items} ctx={ctx}
                        onQuickAdd={(line) => setItems((prev) => {
                            const next = { ...blankLine(), ...line, id: uid() };
                            /* Replace the starter blank rather than sitting
                               under it, or every document keeps an empty row. */
                            const only = prev.length === 1 && !prev[0].product;
                            return only ? [next] : [...prev, next];
                        })}
                    />
                    {!locked && canAddLines && (
                        <button type="button" className="vqdoc-addline" onClick={addLine}>
                            <Plus size={16} /> {doc.money.lines === 'amount' ? 'Add another line' : 'Add an item'}
                        </button>
                    )}
                </Zone>
            )}
            totals={countsOnly ? (
                /* A receipt, a transfer or an audit has no money on it. The
                   money column would show a subtotal of nothing, an editable
                   discount bound to a key no endpoint accepts, and a total of
                   zero beside a line saying what the delivery is worth. */
                <DocumentCounts
                    doc={doc} chrome={chrome} totals={totals}
                    ctx={{
                        unitLabel: doc.countLabel || 'Units',
                        extraRows: slot(extraRows),
                        actions: (
                            <div className="vqdoc-actions">
                                {!locked && (
                                    <button type="button" className="vqdoc-btn pri" disabled={saving} onClick={() => save()}>
                                        <CheckCircle2 size={17} />
                                        {saving ? 'Saving' : (saveLabel || `Save ${doc.name.toLowerCase()}`)}
                                    </button>
                                )}
                                {slot(extraActions)}
                                <button type="button" className="vqdoc-btn"
                                    onClick={() => router.visit(afterUrl || route(doc.api.index, { store_slug: store?.slug }))}>
                                    {locked ? 'Back' : 'Cancel'}
                                </button>
                            </div>
                        ),
                    }}
                />
            ) : (
                <DocumentTotals
                    doc={doc} chrome={chrome} totals={totals} document={d}
                    ctx={{
                        money, currency, locked, patch, patchSettle,
                        taxRates: parseTaxRates(settings),
                        chargeVisible,
                        party: d.party,
                        prevBalance: partyBal.net,
                        balanceKnown: partyBal.known,
                        extraRows: slot(extraRows),
                        actions: (
                            <div className="vqdoc-actions">
                                {!locked && (
                                    <button type="button" id="tour-invoice-complete" className="vqdoc-btn pri" disabled={saving} onClick={() => save()}>
                                        <CheckCircle2 size={17} />
                                        {saving ? 'Saving' : (saveLabel || (isEdit ? `Update ${doc.name.toLowerCase()}` : `Save ${doc.name.toLowerCase()}`))}
                                    </button>
                                )}
                                {slot(extraActions)}
                                <button type="button" className="vqdoc-btn"
                                    onClick={() => router.visit(afterUrl || route(doc.api.index, { store_slug: store?.slug }))}>
                                    {locked ? 'Back' : 'Cancel'}
                                </button>
                            </div>
                        ),
                    }}
                />
            )}
            dock={{
                total: dockTotal
                    ? dockTotal(bag)
                    : (countsOnly ? `${totals.units}` : money(totals.grandTotal)),
                totalLabel: dockLabel || (countsOnly ? 'Units' : `${doc.name} total`),
                ...(settles ? { balance: money(Math.abs(totals.balance)), balanceLabel: totals.balanceLabel } : {}),
                actions: !locked && (
                    <button type="button" className="vqdoc-btn" disabled={saving} onClick={() => save()}>
                        <CheckCircle2 size={17} /> {saving ? 'Saving' : 'Save'}
                    </button>
                ),
            }}
        >
            {/* The margin, only while the button is held. */}
            {peek && (
                <div className="vqdoc-scope vqdoc-peek" data-scale={chrome.textSize}>
                    <div className="vqdoc-dock on">
                        <div><div className="k">Cost of goods</div><div className="v">{money(totals.totalCost)}</div></div>
                        <div><div className="k">Gross profit</div><div className="v">{money(totals.profit)}</div></div>
                        <div><div className="k">Margin</div><div className="v">{totals.marginPct.toFixed(1)}%</div></div>
                        <span style={{ color: 'var(--vq-text-3)', fontSize: 'var(--d-t-micro)' }}>Let go to hide</span>
                    </div>
                </div>
            )}

            {chrome.settingsOpen && (
                <DocumentSettings
                    doc={doc} open onClose={() => chrome.setSettingsOpen(false)}
                    comp={chrome.comp} setComp={chrome.setComp} applyLayout={chrome.applyLayout}
                    textSize={chrome.textSize} setTextSize={chrome.setTextSize}
                    fields={chrome.fields} setField={chrome.setField}
                    showRail={chrome.showRail} setShowRail={chrome.setShowRail}
                    showQuickEntry={chrome.showQuickEntry} setShowQuickEntry={chrome.setShowQuickEntry}
                    showStock={chrome.showStock} setShowStock={chrome.setShowStock}
                    showMargin={chrome.showMargin} setShowMargin={chrome.setShowMargin}
                    canSeeMargin={!!doc.money.margin && isAdmin}
                    applyDefaults={chrome.applyDefaults} setApplyDefaults={chrome.setApplyDefaults}
                    currency={currency}
                    {...(settingsExtras || {})}
                />
            )}

            {!lockItems && doc.money.lines !== 'amount' && (
                <DocumentScan
                    doc={doc} open={scanning} onClose={() => setScanning(false)}
                    priceOf={priceOf}
                    onConfirm={(rows) => setItems((prev) => {
                        const made = rows.map((r) => ({
                            ...blankLine(), id: uid(), product: r.product,
                            quantity: num(r.quantity), price: num(r.price),
                            cost: num(r.product.cost ?? r.product.cost_price),
                            available_stock: availableOf(r.product),
                        }));
                        const only = prev.length === 1 && !prev[0].product;
                        return only ? made : [...prev, ...made];
                    })}
                />
            )}

            {slot(extraSheets)}

            {productModal && (
                <ProductModal isOpen mode={productModal.mode} product={productModal.product}
                    onClose={() => setProductModal(null)} onSuccess={() => setProductModal(null)} />
            )}
            {partyModal && (
                <QuickPartyModal isOpen initialName={partyModal.name} type={partyRole}
                    onClose={() => setPartyModal(null)}
                    onCreated={(p) => { patch({ party: p }); setPartyModal(null); }} />
            )}
        </DocumentShell>
    );
}

/* 422 keys come back as `items.3.quantity`; the table wants the row numbers. */
function rowsFrom(errs) {
    return Object.keys(errs || {})
        .map((k) => k.match(/^items\.(\d+)\./)?.[1])
        .filter((x) => x !== undefined && x !== null)
        .map(Number);
}

function parseTaxRates(settings) {
    try {
        const raw = settings?.tax_rates;
        if (!raw) return [{ id: 1, name: 'GST 18%', rate: 18 }, { id: 2, name: 'VAT 5%', rate: 5 }];
        return typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch (_) { return []; }
}

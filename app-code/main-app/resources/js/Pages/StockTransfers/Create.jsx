import React, { useCallback, useMemo, useRef, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Plus, CheckCircle2, Zap, ScanBarcode, ArrowLeftRight } from 'lucide-react';

import { useAlert } from '@/Contexts/AlertContext';
import DocumentShell, { Zone, Field } from '@/Documents/DocumentShell';
import DocumentLines, { availableOf } from '@/Documents/DocumentLines';
import { DocumentCounts } from '@/Documents/DocumentTotals';
import DocumentSettings from '@/Documents/DocumentSettings';
import DocumentScan from '@/Documents/DocumentScan';
import VqSelect from '@/Documents/VqSelect';
import useDocumentChrome from '@/Documents/useDocumentChrome';
import computeTotals, { linePayload } from '@/Documents/documentMoney';
import { documentType } from '@/Documents/documentTypes';

const DOC = documentType('stock-transfer');
const today = () => new Date().toISOString().split('T')[0];
const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const blankLine = () => ({ id: uid(), product: null, quantity: 1 });

/**
 * Stock transfer.
 *
 * The shop is on both ends of this one, so there is no party and not one figure
 * of money anywhere: the same goods are worth the same after the van ride, and
 * a total would be a number with no meaning. What it needs instead is two
 * warehouses and an honest answer to "has this actually moved yet".
 */
export default function StockTransferCreate({ warehouses = [], products = [] }) {
    const { settings, store } = usePage().props;
    const { showAlert } = useAlert();

    const [d, setD] = useState(() => ({
        id: 'transfer',
        from_warehouse_id: warehouses.find((w) => w.is_default)?.id || warehouses[0]?.id || '',
        to_warehouse_id: '',
        transfer_date: today(),
        status: 'completed',
        notes: '',
        reference: '',
    }));
    const patch = useCallback((p) => setD((prev) => ({ ...prev, ...p })), []);

    const [items, setItems] = useState(() => [blankLine()]);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [scanning, setScanning] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState(null);
    const saveRef = useRef(null);

    const chrome = useDocumentChrome({
        doc: DOC,
        activeId: d.id,
        seniorMode: settings?.senior_mode === '1',
        onSave: () => saveRef.current?.(),
        canFold: !!(d.from_warehouse_id && d.to_warehouse_id),
    });

    const totals = useMemo(
        () => computeTotals({ doc: DOC, items, document: d, settings, fields: chrome.fields }),
        [items, d, settings, chrome.fields],
    );

    const update = useCallback((id, key, value) => {
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [key]: value } : i)));
    }, []);
    const remove = useCallback((id) => {
        setItems((prev) => (prev.length > 1 ? prev.filter((i) => i.id !== id) : [blankLine()]));
    }, []);
    const addLine = useCallback(() => setItems((prev) => [...prev, blankLine()]), []);
    const onPickProduct = useCallback((product, id) => {
        if (!product) return;
        setItems((prev) => prev.map((i) => (i.id === id
            ? { ...i, product, available_stock: availableOf(product) } : i)));
    }, []);

    const validLines = items.filter((i) => i.product);

    const save = () => {
        const next = {};
        if (!d.from_warehouse_id) next.from = 'Say where the goods are now.';
        if (!d.to_warehouse_id) next.to = 'Say where they are going.';
        if (d.from_warehouse_id && d.from_warehouse_id === d.to_warehouse_id) {
            next.to = 'A transfer has to go somewhere else.';
        }
        if (!validLines.length) {
            showAlert({ title: 'Nothing to move', message: 'Add at least one item.', type: 'warning' });
            return;
        }
        /* Only a completed transfer moves stock, so only a completed transfer
           is checked against what is on the shelf. */
        if (d.status === 'completed') {
            const short = validLines.find((i) => num(i.quantity) > availableOf(i.product, i.available_stock));
            if (short) {
                showAlert({
                    title: 'Not enough on the shelf',
                    message: `There are ${availableOf(short.product, short.available_stock)} of ${short.product.name} in the warehouse it is leaving.`,
                    type: 'error',
                });
                return;
            }
        }
        setErrors(next);
        if (Object.keys(next).length) return;

        setSaving(true);
        router.post(
            route('store.stock-transfers.store', { store_slug: store?.slug }),
            {
                from_warehouse_id: d.from_warehouse_id,
                to_warehouse_id: d.to_warehouse_id,
                transfer_date: d.transfer_date,
                status: d.status,
                notes: d.notes || null,
                items: linePayload({ doc: DOC, items, totals }),
            },
            {
                onError: (e) => { setErrors(e); setSaving(false); },
                onFinish: () => setSaving(false),
            },
        );
    };
    saveRef.current = save;

    const whOptions = warehouses.map((w) => ({ value: w.id, label: w.name }));
    const from = warehouses.find((w) => String(w.id) === String(d.from_warehouse_id));
    const to = warehouses.find((w) => String(w.id) === String(d.to_warehouse_id));

    const ctx = {
        locked: false, showStock: chrome.showStock,
        stockMode: DOC.stock.badge, stockWord: 'in that warehouse',
        freeOn: false, canDiscount: false,
        itemPlaceholder: 'Search for what is moving',
        defaultProducts: products,
        update, remove, addLine, onPickProduct,
        money: () => '', currency: '',
        draggedIndex,
        onDragStart: (e, idx) => { setDraggedIndex(idx); e.dataTransfer.effectAllowed = 'move'; },
        onDragOver: (e, idx) => {
            e.preventDefault();
            if (draggedIndex === null || draggedIndex === idx) return;
            setItems((prev) => { const n = [...prev]; const [m] = n.splice(draggedIndex, 1); n.splice(idx, 0, m); return n; });
            setDraggedIndex(idx);
        },
        onDragEnd: () => setDraggedIndex(null),
    };

    return (
        <DocumentShell
            doc={DOC}
            chrome={chrome}
            subtitle={from && to ? `${from.name} → ${to.name}` : 'Choose where it moves from and to'}
            tools={(
                <>
                    <button type="button" className="vqdoc-icon" aria-pressed={chrome.showQuickEntry}
                        title="Quick add row — Alt+Q, then just type"
                        onClick={() => chrome.setShowQuickEntry(!chrome.showQuickEntry)}>
                        <Zap size={17} />
                    </button>
                    <button type="button" className="vqdoc-icon" title="Scan barcodes" onClick={() => setScanning(true)}>
                        <ScanBarcode size={17} />
                    </button>
                </>
            )}
            header={(
                <Zone
                    title={DOC.zone}
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
                        <Field label="From warehouse" span={5} required error={errors.from || errors.from_warehouse_id}>
                            <VqSelect
                                ariaLabel="Where the goods are now"
                                value={d.from_warehouse_id}
                                placeholder="Where they are now"
                                onChange={(v) => patch({ from_warehouse_id: v })}
                                options={whOptions}
                            />
                        </Field>

                        <div className="vqdoc-f" data-span="2" data-nolabel="true">
                            <button
                                type="button" className="vqdoc-icon"
                                title="Swap the two warehouses round"
                                onClick={() => patch({ from_warehouse_id: d.to_warehouse_id, to_warehouse_id: d.from_warehouse_id })}
                            >
                                <ArrowLeftRight size={17} />
                            </button>
                        </div>

                        <Field label="To warehouse" span={5} required error={errors.to || errors.to_warehouse_id}>
                            <VqSelect
                                ariaLabel="Where they are going"
                                value={d.to_warehouse_id}
                                placeholder="Where they are going"
                                onChange={(v) => patch({ to_warehouse_id: v })}
                                options={whOptions.filter((o) => String(o.value) !== String(d.from_warehouse_id))}
                            />
                        </Field>

                        {chrome.field('date') && (
                            <Field label="Transfer date" span={4} error={errors.transfer_date}>
                                <input type="date" className="vqdoc-in" value={d.transfer_date}
                                    onChange={(e) => patch({ transfer_date: e.target.value })} />
                            </Field>
                        )}

                        {chrome.field('status') && (
                            <Field label="Stock" span={4}>
                                <VqSelect
                                    ariaLabel="Whether the stock has moved yet"
                                    value={d.status}
                                    onChange={(v) => patch({ status: v })}
                                    options={[
                                        { value: 'completed', label: 'Moved now', hint: 'Stock leaves one shelf and lands on the other today' },
                                        { value: 'in_progress', label: 'On its way', hint: 'Written down, but nothing moves until it is completed' },
                                        { value: 'pending', label: 'Planned', hint: 'A note of intent — no stock moves' },
                                    ]}
                                />
                            </Field>
                        )}

                        {chrome.field('notes') && (
                            <Field label="Note" span={12}>
                                <textarea className="vqdoc-in" rows={2} value={d.notes}
                                    placeholder="Who is carrying it, which van, anything worth remembering"
                                    onChange={(e) => patch({ notes: e.target.value })} />
                            </Field>
                        )}
                    </div>
                </Zone>
            )}
            strip={(
                <button type="button" className="vqdoc-strip" onClick={() => chrome.setFold('open')} title="Open the details">
                    <span className="chev">▾</span>
                    <span className="who">{from?.name || 'From?'} → {to?.name || 'To?'}</span>
                    <span className="meta">{d.transfer_date} · {d.status === 'completed' ? 'Moved now' : d.status === 'in_progress' ? 'On its way' : 'Planned'}</span>
                    <span className="amt"><span className="tag">Units</span>{totals.units}</span>
                </button>
            )}
            lines={(
                <Zone title="Items" count={validLines.length || 'none yet'} onFocusCapture={chrome.onLinesFocus}>
                    <DocumentLines
                        doc={DOC} chrome={chrome} items={items} ctx={ctx}
                        onQuickAdd={(line) => setItems((prev) => {
                            const next = { ...blankLine(), product: line.product, quantity: num(line.quantity) };
                            const only = prev.length === 1 && !prev[0].product;
                            return only ? [next] : [...prev, next];
                        })}
                    />
                    <button type="button" className="vqdoc-addline" onClick={addLine}>
                        <Plus size={16} /> Add an item
                    </button>
                </Zone>
            )}
            totals={(
                <DocumentCounts
                    doc={DOC} chrome={chrome} totals={totals}
                    ctx={{
                        unitLabel: 'Units moving',
                        actions: (
                            <div className="vqdoc-actions">
                                <button type="button" className="vqdoc-btn pri" disabled={saving} onClick={save}>
                                    <CheckCircle2 size={17} /> {saving ? 'Saving' : 'Record transfer'}
                                </button>
                                <button type="button" className="vqdoc-btn"
                                    onClick={() => router.visit(route('store.stock-transfers.index', { store_slug: store?.slug }))}>
                                    Cancel
                                </button>
                            </div>
                        ),
                    }}
                />
            )}
            dock={{
                total: String(totals.units),
                totalLabel: 'Units moving',
                actions: (
                    <button type="button" className="vqdoc-btn" disabled={saving} onClick={save}>
                        <CheckCircle2 size={17} /> {saving ? 'Saving' : 'Record transfer'}
                    </button>
                ),
            }}
        >
            {chrome.settingsOpen && (
                <DocumentSettings
                    doc={DOC} open onClose={() => chrome.setSettingsOpen(false)}
                    comp={chrome.comp} setComp={chrome.setComp} applyLayout={chrome.applyLayout}
                    textSize={chrome.textSize} setTextSize={chrome.setTextSize}
                    fields={chrome.fields} setField={chrome.setField}
                    showRail={chrome.showRail} setShowRail={chrome.setShowRail}
                    showQuickEntry={chrome.showQuickEntry} setShowQuickEntry={chrome.setShowQuickEntry}
                    showStock={chrome.showStock} setShowStock={chrome.setShowStock}
                    canSeeMargin={false}
                />
            )}

            <DocumentScan
                doc={DOC}
                open={scanning}
                onClose={() => setScanning(false)}
                onConfirm={(rows) => setItems((prev) => {
                    const made = rows.map((r) => ({
                        id: uid(), product: r.product, quantity: num(r.quantity),
                        available_stock: availableOf(r.product),
                    }));
                    const only = prev.length === 1 && !prev[0].product;
                    return only ? made : [...prev, ...made];
                })}
            />
        </DocumentShell>
    );
}

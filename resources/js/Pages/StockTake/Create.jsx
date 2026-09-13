import React, { useCallback, useMemo, useRef, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Plus, CheckCircle2, Zap, ScanBarcode, AlertTriangle } from 'lucide-react';

import { formatCurrency } from '@/Utils/format';
import { useAlert } from '@/Contexts/AlertContext';
import DocumentShell, { Zone, Field } from '@/Documents/DocumentShell';
import DocumentLines from '@/Documents/DocumentLines';
import { DocumentCounts } from '@/Documents/DocumentTotals';
import DocumentSettings from '@/Documents/DocumentSettings';
import DocumentScan from '@/Documents/DocumentScan';
import VqSelect from '@/Documents/VqSelect';
import useDocumentChrome from '@/Documents/useDocumentChrome';
import computeTotals from '@/Documents/documentMoney';
import { documentType } from '@/Documents/documentTypes';

const DOC = documentType('stock-audit');
const today = () => new Date().toISOString().split('T')[0];
const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const blankLine = () => ({ id: uid(), product: null, counted_quantity: 0 });

/**
 * Stock audit.
 *
 * The counted figure is not a quantity being moved: it is a correction, and
 * whatever is written here becomes the truth. So the interesting number is the
 * DIFFERENCE, and the interesting question is what that difference is worth —
 * shrinkage costs money even though nothing on this document is priced.
 *
 * The expected figure comes from the stock records for the warehouse being
 * counted, not from the product's overall total: counting one shelf against
 * every shelf in the business would flag a discrepancy on every line.
 */
export default function StockTakeCreate({ warehouses = [], products = [], stocks = {} }) {
    const { settings, store } = usePage().props;
    const { showAlert, showConfirm } = useAlert();
    const money = (n) => formatCurrency(n, store || settings);

    const [d, setD] = useState(() => ({
        id: 'audit',
        warehouse_id: warehouses.find((w) => w.is_default)?.id || warehouses[0]?.id || '',
        date: today(),
        status: 'draft',
        notes: '',
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
        canFold: !!d.warehouse_id,
    });

    /* What the records say is on THIS warehouse's shelves. */
    const onHand = useCallback((productId) => {
        const rows = stocks?.[d.warehouse_id] || [];
        const row = rows.find?.((r) => String(r.product_id) === String(productId));
        return num(row?.quantity);
    }, [stocks, d.warehouse_id]);

    const totals = useMemo(
        () => computeTotals({ doc: DOC, items, document: d, settings, fields: chrome.fields }),
        [items, d, settings, chrome.fields],
    );

    /* What the count is about to change, and what that is worth. A short shelf
       is money that has already gone; saying so before the corrections are
       written is the whole point of counting. */
    const drift = useMemo(() => {
        let short = 0; let over = 0; let value = 0; let lines = 0;
        items.forEach((i) => {
            if (!i.product) return;
            const diff = num(i.counted_quantity) - onHand(i.product.id);
            if (Math.abs(diff) < 0.0001) return;
            lines += 1;
            if (diff < 0) short += -diff; else over += diff;
            value += diff * num(i.product.cost_price ?? i.product.cost);
        });
        return { short, over, value, lines };
    }, [items, onHand]);

    const update = useCallback((id, key, value) => {
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [key]: value } : i)));
    }, []);
    const remove = useCallback((id) => {
        setItems((prev) => (prev.length > 1 ? prev.filter((i) => i.id !== id) : [blankLine()]));
    }, []);
    const addLine = useCallback(() => setItems((prev) => [...prev, blankLine()]), []);
    const onPickProduct = useCallback((product, id) => {
        if (!product) return;
        setItems((prev) => prev.map((i) => (i.id === id ? {
            ...i, product,
            /* Seeded with what the records say, so a shelf that agrees needs no
               typing at all — the operator only touches the ones that differ. */
            counted_quantity: onHand(product.id),
            available_stock: onHand(product.id),
        } : i)));
    }, [onHand]);

    const validLines = items.filter((i) => i.product);

    const post = () => {
        setSaving(true);
        router.post(
            route('store.stock-takes.store', { store_slug: store?.slug }),
            {
                warehouse_id: d.warehouse_id,
                date: d.date,
                status: d.status,
                notes: d.notes || null,
                items: validLines.map((i) => ({
                    product_id: i.product.id,
                    counted_quantity: num(i.counted_quantity),
                })),
            },
            { onError: (e) => { setErrors(e); setSaving(false); }, onFinish: () => setSaving(false) },
        );
    };

    const save = () => {
        if (!d.warehouse_id) {
            setErrors({ warehouse_id: 'Say which warehouse is being counted.' });
            return;
        }
        if (!validLines.length) {
            showAlert({ title: 'Nothing counted', message: 'Add at least one item.', type: 'warning' });
            return;
        }
        setErrors({});

        /* Completing an audit rewrites stock. It is worth saying out loud what
           it is about to change, because the corrections cannot be un-made
           without another count. */
        if (d.status === 'completed' && drift.lines > 0) {
            showConfirm({
                title: 'Write these corrections to stock?',
                message: `${drift.lines} line${drift.lines === 1 ? '' : 's'} differ from the records`
                    + `${drift.short ? ` — ${drift.short} short` : ''}${drift.over ? `${drift.short ? ',' : ' —'} ${drift.over} over` : ''}.`
                    + ` Stock will be adjusted to match what you counted.`,
                type: 'warning',
                confirmLabel: 'Yes, correct the stock',
                onConfirm: post,
            });
            return;
        }
        post();
    };
    saveRef.current = save;

    const wh = warehouses.find((w) => String(w.id) === String(d.warehouse_id));

    const ctx = {
        locked: false, showStock: false,
        freeOn: false, canDiscount: false,
        itemPlaceholder: 'Search for what you are counting',
        defaultProducts: products,
        update, remove, addLine, onPickProduct,
        money, currency: '',
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
            subtitle={wh ? `${wh.name} · ${d.date}` : 'Choose a warehouse'}
            tools={(
                <>
                    <button type="button" className="vqdoc-icon" aria-pressed={chrome.showQuickEntry}
                        title="Quick add row — Alt+Q, then just type"
                        onClick={() => chrome.setShowQuickEntry(!chrome.showQuickEntry)}>
                        <Zap size={17} />
                    </button>
                    {/* Counting a shelf with a scanner IS a stock audit. */}
                    <button type="button" className="vqdoc-icon" title="Scan the shelf" onClick={() => setScanning(true)}>
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
                        <Field label="Warehouse" span={4} required error={errors.warehouse_id}>
                            <VqSelect
                                ariaLabel="Which warehouse is being counted"
                                value={d.warehouse_id}
                                placeholder="Which shelves are being counted"
                                onChange={(v) => {
                                    /* Counts belong to a warehouse; changing it
                                       would silently re-point every line. */
                                    if (validLines.length) {
                                        showConfirm({
                                            title: 'Start again in another warehouse?',
                                            message: 'The lines already counted belong to this warehouse and will be cleared.',
                                            type: 'warning',
                                            confirmLabel: 'Yes, start again',
                                            onConfirm: () => { patch({ warehouse_id: v }); setItems([blankLine()]); },
                                        });
                                        return;
                                    }
                                    patch({ warehouse_id: v });
                                }}
                                options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
                            />
                        </Field>

                        {chrome.field('date') && (
                            <Field label="Count date" span={4} error={errors.date}>
                                <input type="date" className="vqdoc-in" value={d.date}
                                    onChange={(e) => patch({ date: e.target.value })} />
                            </Field>
                        )}

                        {chrome.field('status') && (
                            <Field label="Count" span={4}>
                                <VqSelect
                                    ariaLabel="Whether the count is finished"
                                    value={d.status}
                                    onChange={(v) => patch({ status: v })}
                                    options={[
                                        { value: 'draft', label: 'Still counting', hint: 'Saved as you go — stock is not touched' },
                                        { value: 'completed', label: 'Finished', hint: 'Stock is corrected to match what you counted' },
                                    ]}
                                />
                            </Field>
                        )}

                        {chrome.field('notes') && (
                            <Field label="Note" span={12}>
                                <textarea className="vqdoc-in" rows={2} value={d.notes}
                                    placeholder="Who counted, which aisles, anything that explains a difference"
                                    onChange={(e) => patch({ notes: e.target.value })} />
                            </Field>
                        )}
                    </div>
                </Zone>
            )}
            strip={(
                <button type="button" className="vqdoc-strip" onClick={() => chrome.setFold('open')} title="Open the details">
                    <span className="chev">▾</span>
                    <span className="who">{wh?.name || 'No warehouse chosen'}</span>
                    <span className="meta">{d.date} · {d.status === 'completed' ? 'Finished' : 'Still counting'}</span>
                    <span className="amt" data-owed={drift.value < -0.005 ? 'true' : undefined}>
                        <span className="tag">{drift.lines ? 'Differences' : 'All agree'}</span>
                        {drift.lines || '0'}
                    </span>
                </button>
            )}
            lines={(
                <Zone title="Counted" count={validLines.length || 'none yet'} onFocusCapture={chrome.onLinesFocus}>
                    <DocumentLines
                        doc={DOC} chrome={chrome} items={items} ctx={ctx}
                        onQuickAdd={(line) => setItems((prev) => {
                            const next = {
                                id: uid(), product: line.product,
                                counted_quantity: num(line.quantity),
                                available_stock: onHand(line.product?.id),
                            };
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
                        unitLabel: 'Units counted',
                        extraRows: (
                            <div className="vqdoc-ledger">
                                <div className="vqdoc-sum-row">
                                    <span className="k">Lines that differ</span>
                                    <span className="v" data-owed={drift.lines ? 'true' : undefined}>{drift.lines}</span>
                                </div>
                                {drift.short > 0 && (
                                    <div className="vqdoc-sum-row">
                                        <span className="k">Short on the shelf</span>
                                        <span className="v" data-owed="true">{drift.short}</span>
                                    </div>
                                )}
                                {drift.over > 0 && (
                                    <div className="vqdoc-sum-row">
                                        <span className="k">More than recorded</span>
                                        <span className="v">{drift.over}</span>
                                    </div>
                                )}
                                {Math.abs(drift.value) > 0.005 && (
                                    <div className="vqdoc-sum-row strong">
                                        <span className="k">{drift.value < 0 ? 'Value written off' : 'Value found'}</span>
                                        <span className="v" data-owed={drift.value < 0 ? 'true' : undefined}>
                                            {money(Math.abs(drift.value))}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ),
                        actions: (
                            <div className="vqdoc-actions">
                                <button type="button" className="vqdoc-btn pri" disabled={saving} onClick={save}>
                                    <CheckCircle2 size={17} /> {saving ? 'Saving' : (d.status === 'completed' ? 'Finish the count' : 'Save the count')}
                                </button>
                                <button type="button" className="vqdoc-btn"
                                    onClick={() => router.visit(route('store.stock-takes.index', { store_slug: store?.slug }))}>
                                    Cancel
                                </button>
                            </div>
                        ),
                    }}
                />
            )}
            dock={{
                total: String(totals.units),
                totalLabel: 'Units counted',
                balance: String(drift.lines),
                balanceLabel: drift.lines ? 'Lines that differ' : 'All agree',
                actions: (
                    <button type="button" className="vqdoc-btn" disabled={saving} onClick={save}>
                        <CheckCircle2 size={17} /> {saving ? 'Saving' : (d.status === 'completed' ? 'Finish' : 'Save')}
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
                    canSeeMargin={false}
                />
            )}

            <DocumentScan
                doc={DOC}
                open={scanning}
                onClose={() => setScanning(false)}
                onConfirm={(rows) => setItems((prev) => {
                    const made = rows.map((r) => ({
                        id: uid(), product: r.product,
                        counted_quantity: num(r.counted_quantity),
                        available_stock: onHand(r.product.id),
                    }));
                    /* A product scanned twice on one shelf is one line with a
                       bigger count, not two lines that disagree. */
                    const base = (prev.length === 1 && !prev[0].product) ? [] : prev;
                    const out = [...base];
                    made.forEach((m) => {
                        const at = out.findIndex((x) => x.product?.id === m.product.id);
                        if (at >= 0) {
                            out[at] = { ...out[at], counted_quantity: num(out[at].counted_quantity) + m.counted_quantity };
                        } else out.push(m);
                    });
                    return out.length ? out : [blankLine()];
                })}
            />
        </DocumentShell>
    );
}

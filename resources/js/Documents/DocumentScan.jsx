import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScanBarcode, Trash2 } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import { Sheet } from '@/Documents/DocumentShell';

/**
 * DocumentScan — a scanner pointed at a document.
 *
 * Selling is only one of the jobs this does. Counting a shelf with a scanner
 * IS a stock audit, and checking a delivery in against a purchase order is a
 * goods receipt; the difference between them is only which field the scanned
 * line lands in and which price it opens at, so the document says that and the
 * rest is shared.
 *
 * Two behaviours carry the whole thing, and they depend on each other:
 *
 *   1. A short number is a QUANTITY, not a barcode. Type "12" and Enter after
 *      scanning something and you have counted twelve of it. Without this,
 *      products with short barcodes get scanned by accident every time somebody
 *      tries to type a count.
 *
 *   2. Re-scanning something already in the list moves it to the END with one
 *      more on it. That is what keeps "the last thing I scanned" and "the row
 *      the quantity shortcut will hit" the same row.
 *
 * Nothing touches the real document until the operator says so, so a mis-scan
 * is a line to delete in here rather than a correction on the invoice.
 */

const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };

export default function DocumentScan({ doc, open, onClose, onConfirm, priceOf }) {
    const { store } = usePage().props;
    const [buffer, setBuffer] = useState('');
    const [rows, setRows] = useState([]);
    const [busy, setBusy] = useState(false);
    const [miss, setMiss] = useState(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 60);
        if (!open) { setBuffer(''); setRows([]); setMiss(null); }
    }, [open]);

    const qtyField = doc.columns.includes('counted') ? 'counted_quantity' : 'quantity';

    const onKey = useCallback(async (e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const code = buffer.trim();
        if (!code) return;

        /* A small number means "that many of the last one". Checked BEFORE the
           lookup, because a product whose barcode is "11" would otherwise be
           scanned every time somebody meant to count eleven. */
        if (/^\d+$/.test(code) && code.length <= 3 && rows.length) {
            const qty = num(code);
            setRows((prev) => {
                const next = [...prev];
                next[next.length - 1] = { ...next[next.length - 1], [qtyField]: qty };
                return next;
            });
            setBuffer('');
            return;
        }

        setBusy(true);
        setMiss(null);
        try {
            const res = await window.axios.get(
                route('store.inventory.search', { store_slug: store?.slug }),
                { params: { query: code } },
            );
            const found = (res.data || [])[0];
            if (!found) { setMiss(code); setBuffer(''); return; }

            setRows((prev) => {
                const at = prev.findIndex((r) => r.product.id === found.id);
                if (at >= 0) {
                    /* Bubble it to the end with one more, so the most recent
                       scan is always the row the quantity shortcut will hit. */
                    const next = [...prev];
                    const [row] = next.splice(at, 1);
                    next.push({ ...row, [qtyField]: num(row[qtyField]) + 1 });
                    return next;
                }
                return [...prev, {
                    id: `${found.id}-${Date.now()}`,
                    product: found,
                    [qtyField]: 1,
                    price: num(priceOf ? priceOf(found) : found.price),
                }];
            });
            setBuffer('');
        } catch (_) {
            setMiss(code);
            setBuffer('');
        } finally {
            setBusy(false);
            setTimeout(() => inputRef.current?.focus(), 20);
        }
    }, [buffer, rows.length, qtyField, store?.slug, priceOf]);

    if (!open) return null;

    const units = rows.reduce((s, r) => s + num(r[qtyField]), 0);

    return (
        <Sheet
            title={`Scan into this ${doc.name.toLowerCase()}`}
            hint="Scan one after another. Type a number and press Enter to set how many of the last one."
            icon={<ScanBarcode size={18} />}
            width={620}
            onClose={onClose}
            footer={(
                <>
                    <span style={{ marginRight: 'auto', color: 'var(--vq-text-2)', fontSize: 'var(--d-t-sm)' }}>
                        {rows.length ? `${rows.length} line${rows.length === 1 ? '' : 's'} · ${units} unit${units === 1 ? '' : 's'}` : 'Nothing scanned yet'}
                    </span>
                    <button type="button" className="vqdoc-btn" disabled={!rows.length} onClick={() => setRows([])}>Clear</button>
                    <button type="button" className="vqdoc-btn pri" disabled={!rows.length}
                        onClick={() => { onConfirm(rows); onClose(); }}>
                        Add {rows.length ? `${rows.length} line${rows.length === 1 ? '' : 's'}` : ''}
                    </button>
                </>
            )}
        >
            <input
                ref={inputRef}
                className="vqdoc-scanfield"
                value={buffer}
                disabled={busy}
                placeholder="Scan a barcode…"
                onChange={(e) => setBuffer(e.target.value)}
                onKeyDown={onKey}
                onBlur={() => setTimeout(() => inputRef.current?.focus(), 30)}
            />

            {miss && (
                <p className="vqdoc-note" data-tone="warn" style={{ marginTop: 'var(--d-s3)' }}>
                    Nothing matches <strong>{miss}</strong>. Check the code, or add the product first.
                </p>
            )}

            <div className="vqdoc-list" style={{ marginTop: 'var(--d-s4)' }}>
                {!rows.length && (
                    <div className="vqdoc-empty">
                        <span className="ico"><ScanBarcode size={22} /></span>
                        <p>Nothing scanned yet</p>
                        <small>The list builds as you scan. Nothing reaches the document until you add it.</small>
                    </div>
                )}
                {rows.map((r, i) => (
                    <div className="vqdoc-list-row" key={r.id}>
                        <span className="vqdoc-idx">{i + 1}</span>
                        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {r.product.name}
                        </span>
                        <input
                            type="number" className="vqdoc-cell c w-qty"
                            value={r[qtyField]}
                            onChange={(e) => setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, [qtyField]: num(e.target.value) } : x)))}
                            onFocus={(e) => e.target.select()}
                        />
                        <button type="button" className="vqdoc-icon sm quiet danger" title="Remove"
                            onClick={() => setRows((prev) => prev.filter((x) => x.id !== r.id))}>
                            <Trash2 size={15} />
                        </button>
                    </div>
                ))}
            </div>
        </Sheet>
    );
}

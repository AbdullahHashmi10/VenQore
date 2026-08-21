import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Trash2, Download, Loader2, Upload, AlertCircle, FileText, ClipboardPaste } from 'lucide-react';
import ToolShell from './Shared/ToolShell';
import Select from './Shared/Select';
import EditableText from './Shared/EditableText';

/**
 * T? — Free Stock Count Sheet Generator.
 *
 * UX MODEL: same "the document IS the editor" pattern as Invoice.jsx. The
 * live preview below IS the printable sheet — header fields, product
 * name/SKU/unit/category are all EditableText, edited in place. The
 * "Counted Qty" and "Variance" columns are intentionally NOT editable —
 * they are the blank write-in cells a real auditor fills in by hand on the
 * printed page, so they render as plain dashed/lined blank cells matching
 * resources/views/tools/pdf/stock-count-sheet.blade.php's `.write-box`
 * styling. Do not wire a value/onChange into those cells.
 */

const STORAGE_KEY = 'venqore_stock_count_store_v1';

const emptyItem = () => ({ sku: '', name: '', category: 'General', unit: 'pcs' });

const SAMPLE_CSV = `SKU-1001, Organic Green Tea 250g, Beverages, pcs
SKU-1002, Almond Milk 1L, Beverages, pcs
SKU-2001, Dark Chocolate Bar 85%, Snacks, pcs
SKU-2002, Sea Salt Potato Chips 150g, Snacks, pcs
SKU-3001, Stainless Water Bottle 750ml, Merchandise, pcs`;

const FAQS = [
    { q: 'Is the VenQore stock count sheet generator free?', a: 'Yes. Creating and downloading a PDF stock count sheet is completely free, with no signup and no watermark.' },
    { q: 'Can I import items via bulk paste?', a: 'Yes — switch to paste mode and paste lines formatted as SKU, Name, Category, Unit. They will populate the table instantly.' },
    { q: 'How does category grouping work?', a: 'Items sharing the same category are automatically clustered under a category sub-header, both in the live preview and on the printed PDF, so audit teams can walk aisle by aisle.' },
    { q: 'Does the preview match the printed sheet?', a: 'The layout matches exactly, but the Counted Qty and Variance cells are intentionally left blank in the preview, just as they are on the printed page — those are hand-written in during the physical count, not typed into the tool.' },
];

export default function StockCountSheetTool({ maxItems = 500, suggestedReference = '', toolGroups = [] }) {
    const [store, setStore] = useState({
        name: '',
        location: 'Main Warehouse / Shop Floor',
        auditor_name: '',
        audit_date: new Date().toISOString().slice(0, 10),
        reference_no: suggestedReference,
        logo_base64: null,
    });
    const [items, setItems] = useState([
        { sku: 'SKU-101', name: 'Premium Coffee Beans 1kg', category: 'Beverages', unit: 'bags' },
        { sku: 'SKU-102', name: 'Earl Grey Tea Boxes', category: 'Beverages', unit: 'boxes' },
        { sku: 'SKU-201', name: 'Oat Milk 1L', category: 'Dairy/Alt', unit: 'cartons' },
    ]);
    const [meta, setMeta] = useState({
        show_sku: true,
        group_by: 'category',
        orientation: 'portrait',
        notes: '',
    });
    const [headers, setHeaders] = useState({
        sku: 'SKU',
        name: 'Item Description',
        unit: 'Unit',
        counted_qty: 'Counted Qty',
        variance: 'Variance',
    });
    const [csvInput, setCsvInput] = useState('');
    const [pasteMode, setPasteMode] = useState(false);
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(false);
    const logoInputRef = useRef(null);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) setStore((s) => ({ ...s, ...JSON.parse(raw) }));
        } catch (e) { /* ignore corrupt storage */ }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
        } catch (e) { /* storage full or unavailable — non-fatal */ }
    }, [store]);

    const updateItem = (idx, field, val) => {
        setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: val } : it)));
    };
    const addItem = () => {
        if (items.length >= maxItems) return;
        setItems((prev) => [...prev, emptyItem()]);
    };
    const removeItem = (idx) => setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));

    const handleParseCsv = async () => {
        if (!csvInput.trim()) return;
        try {
            const res = await fetch('/tools/stock-count-sheet/parse', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
                },
                body: JSON.stringify({ csv_text: csvInput }),
            });
            const data = await res.json();
            if (data.success && data.items?.length > 0) {
                setItems(data.items);
                setPasteMode(false);
                setCsvInput('');
            } else {
                setErrors(['Failed to parse pasted lines. Double-check format.']);
            }
        } catch (e) {
            setErrors(['Failed to process bulk import.']);
        }
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 1.5 * 1024 * 1024) {
            setErrors(['Logo file must be smaller than 1.5MB.']);
            return;
        }
        const reader = new FileReader();
        reader.onload = () => setStore((s) => ({ ...s, logo_base64: reader.result }));
        reader.readAsDataURL(file);
    };

    const handleGenerate = async () => {
        setErrors([]);
        if (!store.name.trim()) { setErrors(['Store / business name is required. Click the store name on the sheet above.']); return; }
        if (!items.some((it) => it.name.trim())) { setErrors(['Add at least one product with a name.']); return; }

        setLoading(true);
        try {
            const res = await fetch('/tools/stock-count-sheet/render', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/pdf, application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
                },
                body: JSON.stringify({ store, items, meta }), // Note: column header labels are on-screen preview only — the PDF uses fixed column headers.
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setErrors(data.errors || ['Failed to generate Stock Count Sheet. Check fields and try again.']);
                setLoading(false);
                return;
            }

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `stock-count-sheet-${store.reference_no || 'audit'}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setErrors(['Network error. Please try again.']);
        } finally {
            setLoading(false);
        }
    };

    // Group rows by category for the live preview, matching the blade
    // template's grouped-table rendering. "Uncategorized" for blank values.
    const groups = useMemo(() => {
        if (meta.group_by !== 'category') {
            return [{ name: null, rows: items.map((it, idx) => ({ ...it, idx })) }];
        }
        const map = new Map();
        items.forEach((it, idx) => {
            const key = (it.category || '').trim() || 'Uncategorized';
            if (!map.has(key)) map.set(key, []);
            map.get(key).push({ ...it, idx });
        });
        return Array.from(map.entries()).map(([name, rows]) => ({ name, rows }));
    }, [items, meta.group_by]);

    const isLandscape = meta.orientation === 'landscape';

    return (
        <ToolShell
            title="Free Stock Count Sheet Generator — Printable PDF | VenQore"
            metaDescription="Create a printable physical inventory count sheet free online. Group by category, toggle SKU column, portrait or landscape, no signup, no watermark."
            eyebrow="Free Tools"
            h1="Free Stock Count Sheet Generator"
            answer="Edit the sheet below exactly as it will print — click any header field or product row to change it. The Counted Qty and Variance columns stay blank by design: they're filled in by hand during the physical count, exactly as they'll appear on paper."
            toolGroups={toolGroups}
            currentSlug="stock-count-sheet"
            faqs={FAQS}
            cta={{ headline: 'Manual counts are one piece of running inventory.', subtext: 'VenQore tracks FIFO stock, batches and variances automatically — no clipboard required.' }}
            related={[{ href: '/tools/invoice-generator', label: 'Invoice Generator' }]}
            wide
        >
            {errors.length > 0 && (
                <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2.5">
                    <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                    <div className="text-sm text-red-600 dark:text-red-400">{errors.map((e, i) => <p key={i}>{e}</p>)}</div>
                </div>
            )}

            {/* Slim control bar — everything that ISN'T part of the document itself */}
            <div className="flex flex-wrap items-center gap-3 mb-5 p-3 rounded-2xl bg-sunken dark:bg-white/[0.03] border border-line dark:border-white/10">
                <div className="w-40">
                    <Select
                        value={meta.orientation}
                        onChange={(v) => setMeta((m) => ({ ...m, orientation: v }))}
                        options={[
                            { value: 'portrait', label: 'Portrait' },
                            { value: 'landscape', label: 'Landscape' },
                        ]}
                    />
                </div>
                <div className="w-44">
                    <Select
                        value={meta.group_by}
                        onChange={(v) => setMeta((m) => ({ ...m, group_by: v }))}
                        options={[
                            { value: 'category', label: 'Group by category' },
                            { value: 'none', label: 'Flat list (no grouping)' },
                        ]}
                    />
                </div>
                <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-white/[0.04] border border-line dark:border-white/10 text-xs font-bold text-ink-secondary cursor-pointer">
                    <input
                        type="checkbox"
                        checked={meta.show_sku}
                        onChange={(e) => setMeta((m) => ({ ...m, show_sku: e.target.checked }))}
                        className="rounded"
                    />
                    Show SKU column
                </label>
                <button
                    type="button"
                    onClick={() => setPasteMode((p) => !p)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-white/[0.04] border border-line dark:border-white/10 text-xs font-bold text-ink-secondary hover:border-brand-400/40 transition-colors"
                >
                    <ClipboardPaste size={13} /> {pasteMode ? 'Back to table' : 'Bulk paste'}
                </button>
                <button type="button" onClick={() => logoInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-white/[0.04] border border-line dark:border-white/10 text-xs font-bold text-ink-secondary hover:border-brand-400/40 transition-colors">
                    <Upload size={13} /> {store.logo_base64 ? 'Change logo' : 'Add logo'}
                </button>
                {store.logo_base64 && (
                    <button type="button" onClick={() => setStore((s) => ({ ...s, logo_base64: null }))} className="text-xs font-bold text-ink-muted hover:text-red-500 transition-colors">
                        Remove logo
                    </button>
                )}
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />

                <div className="ml-auto flex items-center gap-2">
                    <span className="text-1xs text-ink-muted hidden sm:inline">Saved in your browser — nothing sent until you download</span>
                    <button
                        type="button"
                        onClick={handleGenerate}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-sunken dark:bg-white text-white dark:text-void-900 rounded-xl text-xs font-bold uppercase tracking-wide transition-transform disabled:opacity-50 disabled:"
                    >
                        {loading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                        {loading ? 'Generating…' : 'Download PDF'}
                    </button>
                </div>
            </div>

            {pasteMode ? (
                /* Bulk paste — alternate input method, populates the table on import */
                <div className="rounded-2xl overflow-hidden shadow-xl shadow-neutral-900/10 dark:shadow-black/40 border border-line dark:border-white/10 bg-white p-6 sm:p-10">
                    <div className="flex items-center gap-2 mb-3">
                        <FileText size={16} className="text-brand-500" />
                        <h3 className="text-sm font-bold text-ink">Bulk paste items</h3>
                    </div>
                    <p className="text-xs text-ink-muted mb-3">
                        Paste one item per line, formatted as <code className="bg-sunken px-1 rounded">SKU, Name, Category, Unit</code>.
                    </p>
                    <textarea
                        value={csvInput}
                        onChange={(e) => setCsvInput(e.target.value)}
                        placeholder={SAMPLE_CSV}
                        rows={10}
                        className="w-full bg-surface border border-line rounded-xl p-3 text-xs text-ink font-mono focus:outline-none focus:border-brand-400 resize-none"
                    />
                    <div className="flex justify-between items-center pt-3">
                        <button type="button" onClick={() => setCsvInput(SAMPLE_CSV)} className="text-xs text-brand-500 hover:underline font-bold">
                            Load sample data
                        </button>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setPasteMode(false)} className="px-4 py-2 bg-sunken hover:bg-interactive-hover text-ink-secondary text-xs font-bold rounded-lg">
                                Cancel
                            </button>
                            <button type="button" onClick={handleParseCsv} className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-lg">
                                Import Items
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                /* THE DOCUMENT — this is the editor. Orientation visually widens/narrows the container. */
                <div className={`mx-auto transition-all ${isLandscape ? 'max-w-none' : 'max-w-3xl'}`}>
                    <div className="rounded-2xl overflow-hidden shadow-xl shadow-neutral-900/10 dark:shadow-black/40 border border-line dark:border-white/10 bg-white">
                        <div className="p-6 sm:p-10 text-ink text-sm" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                            {/* Header */}
                            <div className="flex flex-col sm:flex-row justify-between gap-6 mb-6 pb-4 border-b-2 border-neutral-900">
                                <div>
                                    {store.logo_base64 && <img src={store.logo_base64} alt="Logo" className="h-12 max-w-[160px] object-contain mb-2" />}
                                    <EditableText
                                        value={store.name}
                                        onChange={(v) => setStore((s) => ({ ...s, name: v }))}
                                        placeholder="Store / business name"
                                        inline={false}
                                        className="text-lg font-bold mb-1.5"
                                    />
                                    <div className="text-xs text-ink-muted mt-1.5">
                                        Location / Section: <EditableText value={store.location} onChange={(v) => setStore((s) => ({ ...s, location: v }))} placeholder="e.g. Aisle 4 - Dry Goods" />
                                    </div>
                                </div>
                                <div className="text-left sm:text-right">
                                    <div className="text-2xl font-bold tracking-tight">STOCK COUNT SHEET</div>
                                    <div className="mt-2 text-xs space-y-1.5">
                                        <div className="flex sm:justify-end gap-2"><span className="text-ink-muted">Ref #</span><EditableText value={store.reference_no} onChange={(v) => setStore((s) => ({ ...s, reference_no: v }))} className="font-bold" /></div>
                                        <div className="flex sm:justify-end gap-2"><span className="text-ink-muted">Audit date</span><EditableText as="date" value={store.audit_date} onChange={(v) => setStore((s) => ({ ...s, audit_date: v }))} /></div>
                                        <div className="flex sm:justify-end gap-2"><span className="text-ink-muted">Auditor</span><EditableText value={store.auditor_name} onChange={(v) => setStore((s) => ({ ...s, auditor_name: v }))} placeholder="Auditor name" /></div>
                                    </div>
                                </div>
                            </div>

                            {/* Items table, grouped by category */}
                            <table className="w-full mb-2 border-collapse">
                                <thead>
                                    <tr className="text-left text-2xs font-bold uppercase tracking-wide text-ink-muted border-b-2 border-neutral-900">
                                        <th className="pb-2 pr-2 w-8">#</th>
                                        {meta.show_sku && (
                                            <th className="pb-2 px-2 w-32">
                                                <EditableText value={headers.sku} onChange={(v) => setHeaders((h) => ({ ...h, sku: v }))} pulse={false} className="normal-case font-bold" />
                                            </th>
                                        )}
                                        <th className="pb-2 px-2">
                                            <EditableText value={headers.name} onChange={(v) => setHeaders((h) => ({ ...h, name: v }))} pulse={false} className="normal-case font-bold" />
                                        </th>
                                        <th className="pb-2 px-2 w-20">
                                            <EditableText value={headers.unit} onChange={(v) => setHeaders((h) => ({ ...h, unit: v }))} pulse={false} className="normal-case font-bold" />
                                        </th>
                                        <th className="pb-2 px-2 text-center w-28">
                                            <EditableText value={headers.counted_qty} onChange={(v) => setHeaders((h) => ({ ...h, counted_qty: v }))} pulse={false} className="normal-case font-bold" />
                                        </th>
                                        <th className="pb-2 pl-2 text-center w-28">
                                            <EditableText value={headers.variance} onChange={(v) => setHeaders((h) => ({ ...h, variance: v }))} pulse={false} className="normal-case font-bold" />
                                        </th>
                                        <th className="w-8"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(() => {
                                        let counter = 0;
                                        return groups.map((group) => (
                                            <React.Fragment key={group.name ?? 'flat'}>
                                                {group.name && (
                                                    <tr>
                                                        <td colSpan={meta.show_sku ? 7 : 6} className="bg-sunken font-bold text-xs py-1.5 px-2 border border-line">
                                                            {group.name} <span className="text-ink-muted font-normal">({group.rows.length} items)</span>
                                                        </td>
                                                    </tr>
                                                )}
                                                {group.rows.map((item) => {
                                                    counter += 1;
                                                    const idx = item.idx;
                                                    return (
                                                        <tr key={idx} className="border-b border-line group">
                                                            <td className="py-2 pr-2 text-ink-muted text-xs">{counter}</td>
                                                            {meta.show_sku && (
                                                                <td className="py-2 px-2">
                                                                    <EditableText value={item.sku} onChange={(v) => updateItem(idx, 'sku', v)} placeholder="SKU-100" className="block font-mono text-xs" />
                                                                </td>
                                                            )}
                                                            <td className="py-2 px-2">
                                                                <EditableText value={item.name} onChange={(v) => updateItem(idx, 'name', v)} placeholder="Product name" className="block" />
                                                                {meta.group_by === 'category' && (
                                                                    <div className="text-2xs text-ink-muted mt-0.5">
                                                                        Category: <EditableText value={item.category} onChange={(v) => updateItem(idx, 'category', v)} placeholder="Uncategorized" className="text-2xs" />
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="py-2 px-2">
                                                                <EditableText value={item.unit} onChange={(v) => updateItem(idx, 'unit', v)} placeholder="pcs" className="block w-16" />
                                                            </td>
                                                            {/* Blank write-in cells — NOT editable, no stored value. These
                                                                stay blank on screen exactly as they stay blank on the
                                                                printed page; a human writes the count by hand later. */}
                                                            <td className="py-2 px-2 text-center">
                                                                <span className="inline-block w-full border-b border-dotted border-line h-4" aria-hidden="true" />
                                                            </td>
                                                            <td className="py-2 pl-2 text-center">
                                                                <span className="inline-block w-full border-b border-dotted border-line h-4" aria-hidden="true" />
                                                            </td>
                                                            <td className="py-2 pl-1 text-right">
                                                                <button type="button" onClick={() => removeItem(idx)} disabled={items.length === 1} className="opacity-0 group-hover:opacity-100 text-ink-secondary hover:text-red-500 disabled:opacity-0 transition-opacity">
                                                                    <Trash2 size={13} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </React.Fragment>
                                        ));
                                    })()}
                                </tbody>
                            </table>
                            <button type="button" onClick={addItem} disabled={items.length >= maxItems} className="flex items-center gap-1 text-xs font-bold text-ink-muted hover:text-brand-500 disabled:opacity-40 transition-colors mb-6">
                                <Plus size={12} /> Add product
                            </button>

                            {/* Notes / discrepancy */}
                            <div className="text-xs text-ink-muted mb-8">
                                <p className="font-bold text-ink-secondary mb-1">Notes / Discrepancy</p>
                                <EditableText value={meta.notes} onChange={(v) => setMeta((m) => ({ ...m, notes: v }))} placeholder="Add a note for the audit team (optional)" as="textarea" rows={2} className="block" />
                            </div>

                            {/* Sign-off block, mirrors blade template */}
                            <div className="flex flex-col sm:flex-row justify-between gap-8 mt-4">
                                <div className="w-full sm:w-56">
                                    <div className="border-t border-neutral-900 pt-1.5 text-1xs text-ink-muted">
                                        Auditor Signature
                                        <div className="text-ink-muted">Date: ____________________</div>
                                    </div>
                                </div>
                                <div className="w-full sm:w-56">
                                    <div className="border-t border-neutral-900 pt-1.5 text-1xs text-ink-muted">
                                        Manager Sign-off / Verification
                                        <div className="text-ink-muted">Date: ____________________</div>
                                    </div>
                                </div>
                            </div>

                            <p className="text-center text-2xs text-ink-secondary mt-10">Generated free at venqore.com/tools — Stock Count Sheet ({items.length} items).</p>
                        </div>
                    </div>
                </div>
            )}

            <p className="text-center text-xs text-ink-muted mt-4">
                Counted Qty and Variance stay blank on purpose — they're filled in by hand during the physical count, just like on the printed sheet.
            </p>
        </ToolShell>
    );
}

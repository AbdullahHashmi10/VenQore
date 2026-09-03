import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Download, AlertCircle, Upload, Loader2 } from 'lucide-react';
import ToolShell from './Shared/ToolShell';
import Select from './Shared/Select';
import EditableText from './Shared/EditableText';

/**
 * Barcode Label Sheet Generator — Free Tool.
 *
 * UNGATED: prints a batch of DIFFERENT products, each with its own real
 * scannable barcode, on Avery-compatible or thermal label sheets. This is
 * the inventory-labelling sibling of the shelf-price-focused Price Tag
 * Generator — the barcode is the primary content here, price is optional.
 *
 * UX MODEL: same "the preview IS the editor" pattern as Invoice/Price
 * Tag/Label Sheet — the live grid of label cards below IS the document,
 * each name/price is edited in place via EditableText. The one thing that
 * can't be a click-to-edit text field is the barcode value's FORMAT
 * (Code128/EAN-13/etc) since it's a constrained choice, so that stays a
 * small Select shown as an unobtrusive pill on the card.
 *
 * BARCODE PREVIEW CAVEAT: there is no client-side barcode rendering
 * library in this codebase — real barcodes are generated server-side via
 * picqer/php-barcode-generator. Firing a debounced render request per row
 * on every keystroke does not scale to a 200-row batch, so the on-screen
 * card shows a decorative bar pattern (random-width vertical bars) that
 * communicates "a barcode will render here" without claiming to be a real
 * or scannable code. The actual scannable barcode is only produced in the
 * downloaded PDF. See the FAQ entry below — it is honest about this.
 */

const FAQS = [
    { q: 'Is the barcode label sheet generator really free?', a: 'Yes. Building and downloading a print-ready PDF of barcode inventory labels is completely free, with no signup and no watermark, for any number of products within the rate limit.' },
    { q: 'How is this different from the barcode print-sheet on the Barcode Generator page?', a: 'That tool repeats ONE barcode value N times — useful when you need many copies of the same code. This tool prints a batch of DIFFERENT products at once, each getting its own barcode, name and optional price — useful for labelling a whole shipment or shelf of new inventory in one pass.' },
    { q: 'What barcode formats are supported?', a: 'Any format supported by the main Barcode Generator — Code128, Code39, Code93, EAN-13, EAN-8, UPC-A, UPC-E, ITF-14 and Codabar — chosen per row, or left at the Code128 default which accepts any text or number.' },
    { q: 'Does the preview show a real barcode?', a: 'No — the striped pattern on each card is a visual placeholder showing where the barcode will sit, not an actual scannable code. Rendering 200 real barcodes live in the browser on every keystroke isn’t practical, so the real, scannable barcode for each row is generated server-side the moment you click Download, and is what appears in your PDF.' },
    { q: 'What is the fastest way to enter a lot of products?', a: 'Use the bulk paste box. Paste one product per line as name,value,format,price — the tool parses it straight into the label grid below.' },
    { q: 'What label sizes are supported?', a: 'Small thermal inventory-label sizes (40×20 mm, 50×25 mm, 50×30 mm) for direct label printers, plus Avery-compatible A4 and Letter sheet grids (21, 24 or 65 labels per sheet) for a standard printer.' },
    { q: 'Can I print multiple copies of the same batch?', a: 'Yes — set the copies multiplier to print the whole batch of labels more than once.' },
];

/** Deterministic-ish decorative bar pattern per row — purely visual, not a real barcode encoding. */
function BarcodePlaceholder({ seed = '' }) {
    const bars = useMemo(() => {
        let h = 0;
        for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
        const rand = () => { h = (h * 1103515245 + 12345) >>> 0; return (h % 1000) / 1000; };
        const count = 22;
        return Array.from({ length: count }, () => (rand() > 0.55 ? 2.5 : 1));
    }, [seed]);

    return (
        <div className="flex items-end justify-center gap-[1.5px] h-8 px-2">
            {bars.map((w, i) => (
                <div key={i} style={{ width: `${w}px` }} className="bg-neutral-800 dark:bg-raised h-full" />
            ))}
        </div>
    );
}

const emptyRow = () => ({ id: Date.now() + Math.random(), name: '', value: '', format: 'code128', price: '' });

export default function BarcodeLabelSheetTool({
    sheetPresets = [],
    maxRows = 200,
    maxCopies = 20,
    currencies = {},
    barcodeFormats = [],
    toolGroups = [],
}) {
    const [mode, setMode] = useState('manual');
    const [rows, setRows] = useState([
        { id: 1, name: 'Cotton Crew T-Shirt', value: 'TSH-001', format: 'code128', price: '19.99' },
        { id: 2, name: 'Slim Fit Denim Jeans', value: 'JNS-002', format: 'code128', price: '' },
    ]);
    const [bulkText, setBulkText] = useState(
        'Cotton Crew T-Shirt,TSH-001,code128,19.99\nSlim Fit Denim Jeans,JNS-002,code128,'
    );

    const [preset, setPreset] = useState(sheetPresets[0]?.key || 'thermal-50x25');
    const [copies, setCopies] = useState(1);
    const [currency, setCurrency] = useState('');
    const [loading, setLoading] = useState(false);
    const [parsing, setParsing] = useState(false);
    const [errors, setErrors] = useState([]);

    const csrf = () => document.querySelector('meta[name="csrf-token"]')?.content || '';
    const symbol = currency ? (currencies[currency] || currency) : '';

    const addRow = () => {
        if (rows.length >= maxRows) return;
        setRows((prev) => [...prev, emptyRow()]);
    };
    const updateRow = (id, field, val) => setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: val } : r)));
    const removeRow = (id) => setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));

    const parseBulk = () => {
        if (!bulkText.trim()) return;
        setParsing(true);
        fetch(route('tools.barcode-label.parse'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': csrf() },
            body: JSON.stringify({ csv_text: bulkText }),
        })
            .then(async (res) => {
                const json = await res.json();
                if (!res.ok) {
                    setErrors(json.errors || ['Could not parse the pasted text.']);
                    return;
                }
                if (json.items?.length > 0) {
                    setRows(json.items.map((item, idx) => ({ ...item, id: Date.now() + idx })));
                    setMode('manual');
                    setErrors([]);
                }
            })
            .catch(() => setErrors(['Could not parse the pasted text.']))
            .finally(() => setParsing(false));
    };

    const generate = () => {
        setErrors([]);
        const items = rows
            .filter((r) => r.name.trim() && r.value.trim())
            .map(({ name, value, format, price }) => ({ name, value, format, price: price || null }));

        if (items.length === 0) {
            setErrors(['Add at least one label with a product name and a barcode value.']);
            return;
        }

        setLoading(true);
        fetch(route('tools.barcode-label.sheet'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': csrf() },
            body: JSON.stringify({ items, preset, copies, currency: currency || null }),
        })
            .then(async (res) => {
                if (!res.ok) {
                    const json = await res.json().catch(() => ({}));
                    setErrors(json.errors || ['Could not generate that label sheet.']);
                    return;
                }
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `barcode-labels-${preset}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
            })
            .catch(() => setErrors(['Could not generate that label sheet.']))
            .finally(() => setLoading(false));
    };

    const presetOptions = sheetPresets.map((p) => ({ value: p.key, label: `${p.label}`, group: p.group, badge: `${p.per_sheet}/sheet` }));
    const currencyOptions = [{ value: '', label: 'No price shown' }, ...Object.entries(currencies).map(([code, sym]) => ({ value: code, label: `${code} (${sym})` }))];
    const formatOptions = barcodeFormats.map((f) => ({ value: f.slug, label: f.name }));
    const formatLabel = (slug) => barcodeFormats.find((f) => f.slug === slug)?.name || slug || 'Code128';

    const inputCls = 'w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-white/[0.04] border border-neutral-900/10 dark:border-white/10 text-ink text-sm placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-brand-400/60 transition-colors';
    const labelCls = 'block text-xs font-bold text-ink-muted mb-1.5';

    return (
        <ToolShell
            title="Free Barcode Label Sheet Generator | VenQore"
            metaDescription="Print Avery-compatible barcode inventory labels for a whole batch of different products at once, each with a real scannable barcode. Free, no signup."
            eyebrow="Free Tools"
            h1="Barcode Label Sheet Generator"
            answer="Label a whole batch of different products at once — each card below becomes a label with its own real, scannable barcode, name and optional price on Avery-compatible or thermal label sheets. Click any name or price to edit it directly. Free, unlimited, no signup."
            toolGroups={toolGroups}
            currentSlug="barcode-label-generator"
            faqs={FAQS}
            cta={{ headline: 'Every product in VenQore already has a barcode.', subtext: 'Stop generating labels by hand — VenQore prints them straight from your live inventory.' }}
            related={[{ href: '/tools/barcode-generator', label: 'Barcode Generator' }, { href: '/tools/price-tag-generator', label: 'Price Tag Generator' }]}
            wide
        >
            {errors.length > 0 && (
                <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2.5">
                    <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                    <div className="text-sm text-red-600 dark:text-red-400">{errors.map((e, i) => <p key={i}>{e}</p>)}</div>
                </div>
            )}

            {/* Slim control bar — everything that ISN'T part of the label grid itself */}
            <div className="flex flex-wrap items-center gap-3 mb-5 p-3 rounded-2xl bg-sunken dark:bg-white/[0.03] border border-line dark:border-white/10">
                <div className="flex gap-2">
                    <button type="button" onClick={() => setMode('manual')} className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-colors ${mode === 'manual' ? 'bg-neutral-900 dark:bg-white text-white dark:text-ink' : 'bg-white dark:bg-white/[0.04] text-ink-muted border border-line dark:border-white/10'}`}>Label grid</button>
                    <button type="button" onClick={() => setMode('bulk')} className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-colors ${mode === 'bulk' ? 'bg-neutral-900 dark:bg-white text-white dark:text-ink' : 'bg-white dark:bg-white/[0.04] text-ink-muted border border-line dark:border-white/10'}`}>Bulk paste</button>
                </div>

                <div className="w-44">
                    <Select value={preset} onChange={setPreset} options={presetOptions} />
                    <p className="text-2xs text-ink-muted mt-1 leading-snug">Prints portrait, sized to the label grid you choose above.</p>
                </div>
                <div className="w-40">
                    <Select value={currency} onChange={setCurrency} options={currencyOptions} />
                </div>
                <div className="flex items-center gap-1.5">
                    <label className="text-xs font-bold text-ink-muted">Copies</label>
                    <input type="number" min="1" max={maxCopies} className={`${inputCls} w-16 py-2`} value={copies} onChange={(e) => setCopies(Math.max(1, Math.min(maxCopies, parseInt(e.target.value) || 1)))} />
                </div>

                <div className="ml-auto flex items-center gap-2">
                    <span className="text-1xs text-ink-muted hidden lg:inline">{rows.length} label{rows.length === 1 ? '' : 's'} · real barcodes generated in your PDF</span>
                    <button
                        type="button"
                        onClick={generate}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-accent-fill text-accent-on hover:bg-accent-fill-hover rounded-xl text-xs font-bold uppercase tracking-wide transition-transform disabled:opacity-50"
                    >
                        {loading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                        {loading ? 'Generating…' : 'Download PDF'}
                    </button>
                </div>
            </div>

            {mode === 'bulk' ? (
                <div className="mb-8">
                    <label className={labelCls}>Paste one product per line: name,value,format,price</label>
                    <textarea className={`${inputCls} font-mono text-xs`} rows={8} value={bulkText} onChange={(e) => setBulkText(e.target.value)} />
                    <button type="button" onClick={parseBulk} disabled={parsing} className="mt-3 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent-fill text-accent-on hover:bg-accent-fill-hover text-xs font-bold uppercase tracking-wide disabled:opacity-50">
                        {parsing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Parse into label grid
                    </button>
                </div>
            ) : (
                <>
                    {/* THE LABEL GRID — this is the editor */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-2">
                        {rows.map((row) => (
                            <div key={row.id} className="group relative rounded-2xl overflow-hidden shadow-lg shadow-neutral-900/5 dark:shadow-black/30 border border-line dark:border-white/10 bg-white p-3.5 text-center">
                                <button
                                    type="button"
                                    onClick={() => removeRow(row.id)}
                                    disabled={rows.length === 1}
                                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-lg flex items-center justify-center bg-white/90 text-ink-secondary hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 disabled:opacity-0 transition-opacity z-10"
                                >
                                    <Trash2 size={13} />
                                </button>

                                <div className="absolute top-1.5 left-1.5 z-10">
                                    <FormatPill value={row.format} options={formatOptions} onChange={(v) => updateRow(row.id, 'format', v)} label={formatLabel(row.format)} />
                                </div>

                                <div className="pt-6">
                                    <EditableText
                                        inline={false}
                                        value={row.name}
                                        onChange={(v) => updateRow(row.id, 'name', v)}
                                        placeholder="Product name"
                                        className="block text-[13px] font-bold text-ink leading-tight mb-0.5"
                                    />

                                    <div className="mt-2 mb-1.5">
                                        <BarcodePlaceholder seed={row.value || row.name || String(row.id)} />
                                        <EditableText
                                            inline={false}
                                            value={row.value}
                                            onChange={(v) => updateRow(row.id, 'value', v)}
                                            placeholder="Barcode value / SKU"
                                            className="block text-2xs font-mono text-ink-muted mt-1"
                                        />
                                    </div>

                                    <div className="mt-2 text-sm font-bold text-ink">
                                        {symbol}
                                        <EditableText
                                            as="number"
                                            min="0"
                                            value={row.price}
                                            onChange={(v) => updateRow(row.id, 'price', v)}
                                            placeholder="Price"
                                            emptyLabel="no price"
                                            formatDisplay={(v) => parseFloat(v).toFixed(2)}
                                            className="inline-block text-sm font-bold"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={addRow}
                            disabled={rows.length >= maxRows}
                            className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-line dark:border-white/15 text-ink-muted hover:border-brand-400/50 hover:text-brand-500 disabled:opacity-40 transition-colors min-h-[150px]"
                        >
                            <Plus size={20} />
                            <span className="text-xs font-bold">Add label</span>
                        </button>
                    </div>

                    <p className="text-center text-1xs text-ink-muted mt-2 mb-8">
                        The striped bars are a visual placeholder for where each barcode sits — the real, scannable barcode is generated in your downloaded PDF.
                    </p>
                </>
            )}
        </ToolShell>
    );
}

/** Small pill on the card that opens the format Select — keeps a constrained-choice field out of free-text editing. */
function FormatPill({ value, options, onChange, label }) {
    const [open, setOpen] = useState(false);
    if (open) {
        return (
            <div className="w-36" onBlur={() => setOpen(false)}>
                <Select value={value} onChange={(v) => { onChange(v); setOpen(false); }} options={options} />
            </div>
        );
    }
    return (
        <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-3xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-sunken text-ink-muted hover:bg-brand-500/10 hover:text-brand-600 transition-colors"
        >
            {label}
        </button>
    );
}

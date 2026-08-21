import React, { useState, useMemo } from 'react';
import {
    Plus, Trash2, Printer, AlertCircle, Upload, Loader2, AlignLeft, AlignCenter, Bold, Download, ClipboardPaste,
} from 'lucide-react';
import ToolShell from './Shared/ToolShell';
import Select from './Shared/Select';
import EditableText from './Shared/EditableText';

/**
 * Label Sheet Generator — Free Tool.
 *
 * General-purpose Avery-compatible TEXT label sheets: mailing/return
 * addresses, warning labels ("Fragile"), folder/binder tabs, name badges,
 * jar/container labels — pure text, no barcode, no price. NOT the same
 * tool as the Barcode Generator print-sheet (repeats one barcode value) or
 * the Price Tag Generator (name + price schema).
 *
 * UX MODEL: same principle as Invoice.jsx and the Price Tag Generator
 * rebuild — the rendered preview IS the editor. Here the "document" is a
 * CSS grid of small label cards mirroring resources/views/tools/pdf/
 * label-sheet.blade.php exactly (up to 3 free-text lines per card, line 1
 * larger/optionally bold, line 3 smaller/muted, per-card left/center
 * alignment). Each card is edited in place via EditableText; alignment,
 * bold-first-line and per-row quantity are small inline controls on the
 * card itself. Bulk-paste remains available as an alternate input method
 * that populates the same grid — manual editing never happens in a
 * separate list of <input> rows.
 *
 * Two independent repeat controls: per-card "qty" (repeat this card's
 * content N times) and a whole-sheet "copies" multiplier (repeat the
 * entire batch) — both preserved from the previous version.
 *
 * UNGATED: no email required, standard throttle:tools limiter only.
 */

const FAQS = [
    { q: 'Is the VenQore label sheet generator really free?', a: 'Yes. Building and downloading a print-ready PDF of text labels is completely free, with no signup and no watermark, for any number of labels within the rate limit.' },
    { q: 'What kind of labels can I make with this tool?', a: 'Any plain-text label: mailing and return-address labels, "Fragile" or "This Side Up" warning labels, folder and binder tabs, name badges, and jar or container labels. It is general-purpose — not tied to a barcode or a price.' },
    { q: 'Can I print the same label multiple times?', a: 'Yes, two ways. Set a quantity on a single card to repeat just that label — handy for a return-address label you need fifty of — or use the whole-sheet copies multiplier to repeat the entire batch.' },
    { q: 'Does every label have to say the same thing?', a: 'No — the default model is the opposite. Each card you add or paste is its own distinct label with up to three lines of text, so a batch of completely different folder tabs or name badges prints in one PDF, or you can repeat one label many times using the per-card quantity, or mix both.' },
    { q: 'What is the bulk-paste format?', a: 'Separate each label with a blank line. Within a block, the first line becomes line 1, the second becomes line 2, and the third becomes line 3. Add a line like "x10" at the end of a block to repeat that label 10 times.' },
    { q: 'What label sizes are supported?', a: 'Thermal label sizes (40×30 mm up to 100×50 mm shipping labels) for direct label printers, plus Avery-compatible A4 and Letter sheet grids, including a 5160-equivalent address label size (66.7 × 25.4 mm, 30 per sheet).' },
    { q: 'How do I avoid label misalignment when printing?', a: 'Always print at 100% / "Actual size" in your PDF viewer — never "Fit to page", which rescales the PDF and throws off alignment with pre-cut label sheets. Confirm your printer\'s paper size matches the preset you picked (A4 vs Letter) too.' },
    { q: 'Does the preview match the printed sheet?', a: 'Yes. The grid of cards on screen mirrors the same layout, line sizing, bold and alignment rules used to build the downloaded PDF, so what you see before you click Download is what prints.' },
];

const BULK_PLACEHOLDER = `Jane Doe
123 Main St
Springfield, IL 62704

FRAGILE
This Side Up
x10

Return To:
Acme Co, 45 Elm St
x50`;

let nextId = 4;

export default function LabelSheetTool({
    sheetPresets = [],
    maxRows = 200,
    maxCopies = 20,
    maxRowQty = 200,
    toolGroups = [],
}) {
    const [mode, setMode] = useState('grid'); // 'grid' | 'bulk'
    const [rows, setRows] = useState([
        { id: 1, line1: 'Jane Doe', line2: '123 Main St', line3: 'Springfield, IL 62704', align: 'left', bold_first: true, qty: 1 },
        { id: 2, line1: 'FRAGILE', line2: 'This Side Up', line3: '', align: 'center', bold_first: true, qty: 5 },
        { id: 3, line1: 'Warehouse — Bin A3', line2: '', line3: '', align: 'left', bold_first: false, qty: 1 },
    ]);
    const [bulkText, setBulkText] = useState(BULK_PLACEHOLDER);

    // Layout options
    const [preset, setPreset] = useState(sheetPresets[0]?.key || 'letter-3x10-address');
    const [copies, setCopies] = useState(1);

    const [loading, setLoading] = useState(false);
    const [parsing, setParsing] = useState(false);
    const [errors, setErrors] = useState([]);

    const csrf = () => document.querySelector('meta[name="csrf-token"]')?.content || '';

    // Card management
    const addRow = () => {
        if (rows.length >= maxRows) return;
        setRows((prev) => [...prev, { id: nextId++, line1: '', line2: '', line3: '', align: 'left', bold_first: false, qty: 1 }]);
    };

    const updateRow = (id, field, value) => {
        setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
    };

    const removeRow = (id) => {
        setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
    };

    // Bulk parse — exact fetch/validation preserved from the previous version
    const parseBulk = () => {
        if (!bulkText.trim()) return;
        setParsing(true);
        fetch(route('tools.label-sheet.parse'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': csrf() },
            body: JSON.stringify({ bulk_text: bulkText }),
        })
            .then(async (res) => {
                const json = await res.json();
                if (!res.ok) {
                    setErrors(json.errors || ['Could not parse the pasted text.']);
                    return;
                }
                if (json.items && json.items.length > 0) {
                    setRows(json.items.map((item) => ({
                        id: nextId++,
                        line1: item.line1 || '',
                        line2: item.line2 || '',
                        line3: item.line3 || '',
                        align: 'left',
                        bold_first: false,
                        qty: item.qty || 1,
                    })));
                    setMode('grid');
                    setErrors([]);
                } else {
                    setErrors(['No valid label blocks found in the pasted text.']);
                }
            })
            .catch(() => setErrors(['Network error while parsing.']))
            .finally(() => setParsing(false));
    };

    // Build PDF — exact fetch/validation preserved from the previous version
    const buildPdf = () => {
        const validItems = rows.filter((r) => r.line1.trim() !== '' || r.line2.trim() !== '' || r.line3.trim() !== '');
        if (validItems.length === 0) {
            setErrors(['Please fill in at least one line of text for at least one label.']);
            return;
        }

        setLoading(true);
        setErrors([]);

        fetch(route('tools.label-sheet.sheet'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/pdf', 'X-CSRF-TOKEN': csrf() },
            body: JSON.stringify({
                items: validItems.map((item) => ({
                    line1: item.line1.trim(),
                    line2: item.line2.trim(),
                    line3: item.line3.trim(),
                    align: item.align,
                    bold_first: item.bold_first,
                    qty: Number(item.qty) || 1,
                })),
                preset,
                copies: Number(copies) || 1,
            }),
        })
            .then(async (res) => {
                if (!res.ok) {
                    const json = await res.json().catch(() => ({}));
                    setErrors(json.errors || ['Could not build the label sheet PDF.']);
                    return;
                }
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `label-sheet-${preset}.pdf`;
                a.click();
                URL.revokeObjectURL(url);
            })
            .catch(() => setErrors(['Network error — please try again.']))
            .finally(() => setLoading(false));
    };

    const presetOptions = sheetPresets.map((p) => ({
        value: p.key,
        label: p.label,
        group: p.group,
        badge: p.per_sheet > 1 ? `${p.per_sheet}/sheet` : 'Roll',
    }));

    const totalLabelsPreview = useMemo(
        () => rows.reduce((sum, r) => sum + (Number(r.qty) || 1), 0) * (Number(copies) || 1),
        [rows, copies],
    );

    return (
        <ToolShell
            title="Free Label Sheet Generator — Printable Text Labels PDF | VenQore"
            metaDescription="Generate printable text labels free — addresses, warning labels, folder tabs, name badges. Avery-compatible A4/Letter sheets and thermal sizes. No signup."
            eyebrow="Free Tool"
            h1="Free Label Sheet Generator"
            answer="The VenQore Label Sheet Generator creates print-ready PDF sheets of general-purpose text labels — mailing addresses, warning labels, folder tabs, name badges, jar labels, and more. Edit labels directly on the grid below exactly as they will print, with up to three lines of text each, repeat any label as many times as you need, choose a thermal or Avery-compatible A4/Letter size, and download a ready-to-print PDF. Free, no signup, no watermark."
            faqs={FAQS}
            toolGroups={toolGroups}
            currentSlug="label-sheet-generator"
            cta={{
                headline: 'Managing labels product-by-product gets old fast.',
                subtext: 'VenQore POS automatically manages your inventory, prints shelf tags and shipping labels in bulk, and writes balanced double-entry accounting records.',
            }}
            related={[
                { label: 'Price Tag Generator', href: '/tools/price-tag-generator' },
                { label: 'Barcode Generator', href: '/tools/barcode-generator' },
            ]}
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
                <div className="w-56">
                    <Select value={preset} onChange={setPreset} options={presetOptions} />
                    <p className="text-2xs text-ink-muted mt-1 leading-snug">Prints portrait, sized to the label grid you choose above.</p>
                </div>
                <div className="flex items-center gap-1.5">
                    <label className="text-xs font-bold text-ink-muted" htmlFor="ls-copies">Copies</label>
                    <input
                        id="ls-copies"
                        type="number"
                        min="1"
                        max={maxCopies}
                        value={copies}
                        onChange={(e) => setCopies(Math.max(1, Math.min(maxCopies, Number(e.target.value) || 1)))}
                        className="w-16 px-2 py-1.5 rounded-lg bg-white dark:bg-white/[0.04] border border-line dark:border-white/10 text-sm text-ink font-mono focus:outline-none focus:border-brand-400/60 transition-colors"
                    />
                </div>

                <div className="flex bg-sunken dark:bg-white/[0.06] p-1 rounded-xl shrink-0">
                    <button
                        type="button"
                        onClick={() => setMode('grid')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                            mode === 'grid'
                                ? 'bg-surface text-ink shadow-sm'
                                : 'text-ink-secondary hover:text-ink dark:hover:text-white'
                        }`}
                    >
                        Grid ({rows.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('bulk')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 ${
                            mode === 'bulk'
                                ? 'bg-surface text-ink shadow-sm'
                                : 'text-ink-secondary hover:text-ink dark:hover:text-white'
                        }`}
                    >
                        <ClipboardPaste size={12} /> Bulk Paste
                    </button>
                </div>

                <div className="ml-auto flex items-center gap-3">
                    <span className="text-1xs text-ink-muted hidden sm:inline">{totalLabelsPreview} labels total</span>
                    <button
                        type="button"
                        onClick={buildPdf}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-sunken dark:bg-white text-white dark:text-void-900 rounded-xl text-xs font-bold uppercase tracking-wide transition-transform disabled:opacity-50 disabled:"
                    >
                        {loading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                        {loading ? 'Generating…' : 'Download PDF'}
                    </button>
                </div>
            </div>

            {mode === 'bulk' ? (
                <div className="rounded-2xl bg-sunken dark:bg-white/[0.03] border border-line dark:border-white/10 p-5 sm:p-7 mb-4">
                    <label className="block text-xs font-bold uppercase tracking-widest text-ink-muted mb-2">
                        Paste Labels — separate each label with a <span className="text-brand-500">blank line</span>
                    </label>
                    <textarea
                        rows={10}
                        value={bulkText}
                        onChange={(e) => setBulkText(e.target.value)}
                        placeholder={BULK_PLACEHOLDER}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-white/[0.04] border border-line dark:border-white/10 text-ink placeholder-slate-400 dark:placeholder-slate-500 text-xs font-mono leading-relaxed focus:outline-none focus:border-brand-400/60 transition-colors"
                    />
                    <p className="text-1xs text-ink-muted mt-2">
                        Within a block: line 1, line 2, line 3 (up to 3 lines become one label). Add a trailing <code className="font-mono text-brand-500">x10</code> line to repeat that label 10 times.
                    </p>
                    <div className="flex items-center justify-end mt-3">
                        <button
                            type="button"
                            onClick={parseBulk}
                            disabled={parsing || !bulkText.trim()}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-sunken dark:bg-white text-white dark:text-void-900 rounded-xl text-xs font-bold uppercase tracking-wide transition-transform disabled:opacity-40"
                        >
                            {parsing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                            Parse & Load Into Grid
                        </button>
                    </div>
                </div>
            ) : (
                /* THE LABEL SHEET GRID — this is the editor, styled to mirror
                   resources/views/tools/pdf/label-sheet.blade.php exactly */
                <div className="rounded-2xl overflow-hidden shadow-xl shadow-neutral-900/10 dark:shadow-black/40 border border-line dark:border-white/10 bg-white p-4 sm:p-6 mb-2">
                    <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
                        {rows.map((row) => (
                            <div
                                key={row.id}
                                className="group relative rounded-lg border border-dashed border-line bg-white p-2.5 min-h-[92px] flex flex-col"
                            >
                                {/* Remove */}
                                <button
                                    type="button"
                                    onClick={() => removeRow(row.id)}
                                    disabled={rows.length <= 1}
                                    title="Remove label"
                                    className="absolute top-1 right-1 p-1 rounded-md bg-white/90 text-ink-secondary hover:text-red-500 opacity-0 group-hover:opacity-100 disabled:opacity-0 transition-opacity shadow-sm"
                                >
                                    <Trash2 size={12} />
                                </button>

                                {/* Card content — mirrors .label-card / .label-line styling */}
                                <div className={`flex-1 flex flex-col justify-center ${row.align === 'center' ? 'items-center text-center' : 'items-start text-left'}`}>
                                    <EditableText
                                        inline={false}
                                        value={row.line1}
                                        onChange={(v) => updateRow(row.id, 'line1', v)}
                                        placeholder="Line 1"
                                        className={`block w-full text-[13px] leading-tight ${row.bold_first ? 'font-bold' : 'font-semibold'} text-ink mb-1`}
                                    />
                                    <EditableText
                                        inline={false}
                                        value={row.line2}
                                        onChange={(v) => updateRow(row.id, 'line2', v)}
                                        placeholder="Line 2 (optional)"
                                        className="block w-full text-1xs leading-tight text-ink-secondary mt-1 mb-1"
                                    />
                                    <EditableText
                                        inline={false}
                                        value={row.line3}
                                        onChange={(v) => updateRow(row.id, 'line3', v)}
                                        placeholder="Line 3 (optional)"
                                        className="block w-full text-2xs leading-tight text-ink-muted mt-1"
                                    />
                                </div>

                                {/* Per-card inline controls: align, bold-first-line, qty */}
                                <div className="flex items-center justify-between gap-1 mt-2 pt-1.5 border-t border-line">
                                    <div className="flex items-center gap-0.5">
                                        <button
                                            type="button"
                                            onClick={() => updateRow(row.id, 'align', 'left')}
                                            title="Left align"
                                            className={`p-1 rounded transition-colors ${row.align === 'left' ? 'bg-brand-500 text-white' : 'text-neutral-300 hover:text-ink-muted'}`}
                                        >
                                            <AlignLeft size={11} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => updateRow(row.id, 'align', 'center')}
                                            title="Center align"
                                            className={`p-1 rounded transition-colors ${row.align === 'center' ? 'bg-brand-500 text-white' : 'text-neutral-300 hover:text-ink-muted'}`}
                                        >
                                            <AlignCenter size={11} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => updateRow(row.id, 'bold_first', !row.bold_first)}
                                            title="Bold first line"
                                            className={`p-1 rounded transition-colors ${row.bold_first ? 'bg-brand-500 text-white' : 'text-neutral-300 hover:text-ink-muted'}`}
                                        >
                                            <Bold size={11} />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-1" title="Repeat this label N times">
                                        <span className="text-3xs font-bold uppercase text-ink-secondary">Qty</span>
                                        <EditableText
                                            as="number"
                                            min="1"
                                            max={maxRowQty}
                                            value={row.qty}
                                            onChange={(v) => updateRow(row.id, 'qty', Math.max(1, Math.min(maxRowQty, Number(v) || 1)))}
                                            className="text-2xs font-mono w-7 text-right text-ink-muted"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Add-label card */}
                        <button
                            type="button"
                            onClick={addRow}
                            disabled={rows.length >= maxRows}
                            className="min-h-[92px] rounded-lg border-2 border-dashed border-line hover:border-brand-300 hover:bg-brand-50/40 flex flex-col items-center justify-center gap-1 text-ink-muted hover:text-brand-500 transition-colors disabled:opacity-40 disabled:hover:border-line disabled:hover:bg-transparent"
                        >
                            <Plus size={16} />
                            <span className="text-1xs font-bold">Add label</span>
                        </button>
                    </div>

                    <p className="text-1xs text-ink-muted text-center mt-4">
                        {rows.length} / {maxRows} labels &middot; {totalLabelsPreview} total with quantity &amp; copies &middot; click any line to edit
                    </p>
                </div>
            )}

            <p className="text-center text-xs text-ink-muted mt-4">
                This preview matches your downloaded PDF layout — click any label above to edit it. Print at 100% / "Actual size".
            </p>
        </ToolShell>
    );
}

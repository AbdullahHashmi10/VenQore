import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link } from '@inertiajs/react';
import {
    Download, AlertCircle, CheckCircle2, XCircle, Image as ImageIcon,
    Type, X, Printer, ArrowRight, Loader2,
} from 'lucide-react';
import ToolShell from './Shared/ToolShell';
import Select from './Shared/Select';
import EmailGate from './Shared/EmailGate';

/**
 * T1 — Free Barcode Generator.
 *
 * Free & ungated: single barcode in PNG/SVG/JPG, with human-readable text.
 * Email-gated: multi-copy print-ready PDF sheets (thermal + A4 label sizes)
 *   — a genuine volume/portability upgrade, which is where plan §6.1 says
 *   a gate belongs. The core output is never gated because bounce rate is
 *   a ranking input.
 *
 * GTIN values are validated automatically as the user types — no button.
 */

const FORMAT_META = {
    code128: { name: 'Code128', text: true, hint: 'Best default for product names and SKUs' },
    code39: { name: 'Code39', text: true, hint: 'Uppercase, digits and a few symbols' },
    code93: { name: 'Code93', text: true, hint: 'Denser Code39 successor' },
    'ean-13': { name: 'EAN-13', text: false, hint: 'Retail products, worldwide' },
    'ean-8': { name: 'EAN-8', text: false, hint: 'Small retail packaging' },
    'upc-a': { name: 'UPC-A', text: false, hint: 'Retail products, US & Canada' },
    'upc-e': { name: 'UPC-E', text: false, hint: 'Compressed UPC for small items' },
    'itf-14': { name: 'ITF-14', text: false, hint: 'Shipping cartons and cases' },
    codabar: { name: 'Codabar', text: true, hint: 'Libraries, blood banks, legacy systems' },
};

const GTIN_LENGTHS = [8, 12, 13, 14];

const FORMAT_TABLE = [
    ['Code128', 'Full ASCII — letters, numbers, symbols', 'Variable length', 'Product names, SKUs, internal inventory codes'],
    ['Code39', 'Uppercase letters, digits, - . $ / + % space', 'Variable length', 'Inventory tracking, asset tags'],
    ['Code93', 'Full ASCII, more compact than Code39', 'Variable length', 'Package identification, postal services'],
    ['EAN-13', 'Digits only', '12 + 1 check digit = 13', 'Retail point-of-sale worldwide'],
    ['EAN-8', 'Digits only', '7 + 1 check digit = 8', 'Small packaging (cosmetics, cigarettes)'],
    ['UPC-A', 'Digits only', '11 + 1 check digit = 12', 'Retail point-of-sale in the US and Canada'],
    ['UPC-E', 'Digits only', '6 digits (zero-suppressed)', 'Small retail packaging in North America'],
    ['ITF-14', 'Digits only', '13 + 1 check digit = 14', 'Shipping cartons and case-level packaging'],
    ['Codabar', 'Digits and - $ : / . +', 'Variable length', 'Blood banks, libraries, older parcel systems'],
];

const FAQS = [
    { q: 'What is a barcode generator?', a: 'A barcode generator converts a number or text value into a scannable barcode image (like Code128 or EAN-13) that a barcode scanner or point-of-sale system can read back into that original value.' },
    { q: 'Is the VenQore barcode generator really free?', a: 'Yes. Generating and downloading a single barcode in any supported format is completely free, with no signup and no watermark. We only ask for an email if you want a multi-copy print-ready PDF sheet.' },
    { q: 'I only have a product name, not a number — can I still make a barcode?', a: 'Yes. Choose Code128, Code39 or Code93 — these accept any text, not just digits. Code128 is the best default for arbitrary product names, descriptions or internal codes.' },
    { q: 'Which barcode format should I use for retail products?', a: 'Use EAN-13 if you sell internationally or outside North America, and UPC-A if you sell primarily in the United States or Canada. Use Code128 for internal inventory codes, asset tags, or plain text.' },
    { q: 'Does the generator calculate the check digit for me?', a: 'Yes. For EAN-8, EAN-13, UPC-A and ITF-14, you can enter the value without a check digit and the tool computes and displays it automatically. If you paste a complete code, it is validated instantly.' },
    { q: 'Can I print a whole sheet of the same barcode?', a: 'Yes. Use the print sheet section to choose a label size — thermal roll sizes like 50×25 mm (2"×1") or A4 sheets with 21, 24, 30 or 65 labels per page — set a quantity, and download a print-ready PDF.' },
    { q: 'Why does my barcode show a number underneath?', a: 'That is the standard human-readable line. It lets a cashier key the code in manually if a scanner fails or the label is damaged. You can switch it off, but for retail labels we strongly recommend leaving it on.' },
];

export default function BarcodeTool({
    formats = [],
    selectedFormat = null,
    supportsRaster = true,
    sheetPresets = [],
    maxQuantity = 1000,
    toolGroups = [],
}) {
    const [format, setFormat] = useState(selectedFormat || 'code128');
    const [value, setValue] = useState('');
    const [output, setOutput] = useState(supportsRaster ? 'png' : 'svg');
    const [widthFactor, setWidthFactor] = useState(2);
    const [height, setHeight] = useState(80);
    const [showValue, setShowValue] = useState(true);
    const [caption, setCaption] = useState('');
    const [showCaption, setShowCaption] = useState(false);
    const [logo, setLogo] = useState(null);
    const [result, setResult] = useState(null);
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(false);

    // Print sheet
    const [preset, setPreset] = useState(sheetPresets[0]?.key || 'thermal-50x25');
    const [quantity, setQuantity] = useState(30);
    const [gateOpen, setGateOpen] = useState(false);
    const [sheetLoading, setSheetLoading] = useState(false);
    const [sheetUnlocked, setSheetUnlocked] = useState(false);

    // Auto-validation
    const [checkResult, setCheckResult] = useState(null);

    const debounceRef = useRef(null);
    const checkRef = useRef(null);
    const logoInputRef = useRef(null);

    useEffect(() => { if (selectedFormat) setFormat(selectedFormat); }, [selectedFormat]);

    const meta = FORMAT_META[format] || {};
    const isTextCapable = !!meta.text;

    const csrf = () => document.querySelector('meta[name="csrf-token"]')?.content || '';

    /* ── Generate ─────────────────────────────────────────────────────── */
    const generate = useCallback(() => {
        if (!value.trim()) { setResult(null); setErrors([]); return; }
        setLoading(true);
        fetch(route('tools.barcode.render'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': csrf() },
            body: JSON.stringify({
                format, value: value.trim(), output,
                width_factor: widthFactor, height,
                show_value: showValue,
                caption: showCaption && caption.trim() ? caption.trim() : null,
                logo: logo || null,
            }),
        })
            .then(async (res) => {
                const json = await res.json();
                if (!res.ok) { setErrors(json.errors || ['Something went wrong.']); setResult(null); return; }
                setErrors([]); setResult(json);
            })
            .catch(() => setErrors(['Network error — please try again.']))
            .finally(() => setLoading(false));
    }, [format, value, output, widthFactor, height, showValue, caption, showCaption, logo]);

    useEffect(() => {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(generate, 300);
        return () => clearTimeout(debounceRef.current);
    }, [generate]);

    /* ── Auto-validate GTIN as they type ──────────────────────────────── */
    const digitsOnly = useMemo(() => value.replace(/[\s-]/g, ''), [value]);
    const looksLikeGtin = /^\d+$/.test(digitsOnly) && GTIN_LENGTHS.includes(digitsOnly.length);

    useEffect(() => {
        clearTimeout(checkRef.current);
        if (!looksLikeGtin) { setCheckResult(null); return; }

        checkRef.current = setTimeout(() => {
            fetch(route('tools.barcode.validate'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': csrf() },
                body: JSON.stringify({ value: digitsOnly }),
            })
                .then(async (res) => {
                    const json = await res.json();
                    setCheckResult(res.ok ? json : null);
                })
                .catch(() => setCheckResult(null));
        }, 400);

        return () => clearTimeout(checkRef.current);
    }, [digitsOnly, looksLikeGtin]);

    /* ── Download single ──────────────────────────────────────────────── */
    const download = () => {
        if (!result) return;
        const a = document.createElement('a');
        a.href = `data:${result.mime_type};base64,${result.image_base64}`;
        a.download = `barcode-${format}-${result.encoded_value}.${result.file_extension}`;
        a.click();
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setLogo(reader.result);
        reader.readAsDataURL(file);
    };

    /* ── Print sheet (email-gated) ────────────────────────────────────── */
    const buildSheet = () => {
        setSheetLoading(true);
        fetch(route('tools.barcode.sheet'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/pdf', 'X-CSRF-TOKEN': csrf() },
            body: JSON.stringify({
                format, value: value.trim(), preset, quantity,
                show_value: showValue,
                caption: showCaption && caption.trim() ? caption.trim() : null,
            }),
        })
            .then(async (res) => {
                if (!res.ok) {
                    const json = await res.json().catch(() => ({}));
                    setErrors(json.errors || ['Could not build the print sheet.']);
                    return;
                }
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `barcode-labels-${value.trim()}-${preset}.pdf`;
                a.click();
                URL.revokeObjectURL(url);
            })
            .catch(() => setErrors(['Network error — please try again.']))
            .finally(() => setSheetLoading(false));
    };

    const onSheetClick = () => {
        if (!value.trim()) { setErrors(['Enter a value first.']); return; }
        if (sheetUnlocked) { buildSheet(); return; }
        setGateOpen(true);
    };

    const formatOptions = Object.entries(FORMAT_META).map(([slug, m]) => ({
        value: slug,
        label: m.name,
        hint: m.hint,
        badge: m.text ? 'Text OK' : 'Digits',
    }));

    const presetOptions = sheetPresets.map((p) => ({
        value: p.key,
        label: p.label,
        group: p.group,
        badge: p.per_sheet > 1 ? `${p.per_sheet}/sheet` : 'Roll',
    }));

    const inputBase = 'w-full px-4 py-3 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-400/60 transition-colors';

    return (
        <ToolShell
            title="Free Barcode Generator — Code128, EAN-13, UPC-A | VenQore"
            metaDescription="Generate free barcodes in Code128, EAN-13, UPC-A and more. Human-readable text, logo, and print-ready label sheets for thermal and A4. No signup."
            eyebrow="Free Tool"
            h1="Free Barcode Generator"
            answer="The VenQore Barcode Generator creates print-ready barcodes in 9 formats — Code128, Code39, Code93, EAN-13, EAN-8, UPC-A, UPC-E, ITF-14 and Codabar. It shows the human-readable number, computes check digits automatically, and exports single images or full label sheets. Free, no signup, no watermark."
            faqs={FAQS}
            toolGroups={toolGroups}
            currentSlug="barcode-generator"
            cta={{
                headline: 'Stop doing this one product at a time.',
                subtext: 'VenQore generates and prints barcodes for your whole catalogue — and writes a balanced double-entry journal on every sale.',
            }}
            related={[{ label: 'Barcode Validator', href: '/tools/barcode-validator' }]}
        >
            {/* ── Generator ─────────────────────────────────────────────── */}
            <div className="rounded-3xl bg-slate-900/[0.02] dark:bg-white/[0.03] border border-slate-900/[0.06] dark:border-white/10 p-5 sm:p-7">
                <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
                    {/* Controls */}
                    <div className="space-y-5 min-w-0">
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Format</label>
                            <Select value={format} onChange={(v) => { setValue(''); setFormat(v); }} options={formatOptions} />
                            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1.5">
                                {isTextCapable
                                    ? 'Accepts any text — a product name, SKU or description works fine.'
                                    : 'Digits only. Pick Code128 if you want to encode text.'}
                            </p>
                        </div>

                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                                {isTextCapable ? 'Value or text to encode' : 'Value to encode'}
                            </label>
                            <input
                                type="text"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                placeholder={isTextCapable ? 'e.g. Blue Cotton T-Shirt, size M' : 'e.g. 012345678905'}
                                className={`${inputBase} font-mono`}
                            />

                            {/* Auto-validation bar */}
                            {checkResult && (
                                <div className={`mt-2 flex items-center gap-2.5 px-3 py-2 rounded-lg border text-xs ${
                                    checkResult.valid
                                        ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-300'
                                        : 'bg-amber-500/10 border-amber-500/25 text-amber-700 dark:text-amber-300'
                                }`}>
                                    {checkResult.valid
                                        ? <CheckCircle2 size={14} className="shrink-0" />
                                        : <XCircle size={14} className="shrink-0" />}
                                    <span className="flex-1 leading-snug">
                                        {checkResult.valid
                                            ? `Valid ${checkResult.format_name} — check digit checks out.`
                                            : `Check digit should be ${checkResult.computed_check_digit}, not ${checkResult.supplied_check_digit}.`}
                                    </span>
                                    <Link
                                        href={`/tools/barcode-validator?value=${encodeURIComponent(digitsOnly)}`}
                                        className="font-bold underline whitespace-nowrap hover:opacity-70 shrink-0"
                                    >
                                        Details
                                    </Link>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Bar width</label>
                                <input type="range" min="1" max="6" value={widthFactor} onChange={(e) => setWidthFactor(Number(e.target.value))} className="w-full accent-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Height</label>
                                <input type="range" min="40" max="200" value={height} onChange={(e) => setHeight(Number(e.target.value))} className="w-full accent-indigo-500" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Image format</label>
                            <div className="flex gap-2 flex-wrap">
                                {['png', 'svg', 'jpg'].map((fmt) => {
                                    const disabled = !supportsRaster && fmt !== 'svg';
                                    return (
                                        <button
                                            key={fmt}
                                            onClick={() => !disabled && setOutput(fmt)}
                                            disabled={disabled}
                                            title={disabled ? 'Enable the GD extension in PHP to export PNG/JPG' : ''}
                                            className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wide transition-colors disabled:opacity-35 disabled:cursor-not-allowed ${
                                                output === fmt
                                                    ? 'bg-slate-900 dark:bg-white text-white dark:text-[#05030f]'
                                                    : 'bg-white dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                            }`}
                                        >
                                            {fmt}
                                        </button>
                                    );
                                })}
                            </div>
                            {!supportsRaster && (
                                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 leading-relaxed">
                                    PNG and JPG are unavailable because PHP's <code className="font-mono">gd</code> extension isn't enabled on this server. SVG works everywhere and prints at any size without going blurry.
                                </p>
                            )}
                        </div>

                        {/* Toggles */}
                        <div className="space-y-2.5 pt-1">
                            <label className="flex items-center gap-2.5 cursor-pointer">
                                <input type="checkbox" checked={showValue} onChange={(e) => setShowValue(e.target.checked)} className="w-4 h-4 rounded accent-indigo-500" />
                                <span className="text-sm text-slate-700 dark:text-slate-300">Show the number under the barcode</span>
                            </label>

                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCaption((v) => !v)}
                                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-colors ${showCaption ? 'bg-indigo-500/15 border border-indigo-400/40 text-indigo-600 dark:text-indigo-300' : 'bg-white dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/10 text-slate-500 dark:text-slate-400'}`}
                                >
                                    <Type size={13} /> Add label text
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { if (!logo) logoInputRef.current?.click(); else setLogo(null); }}
                                    disabled={!supportsRaster}
                                    title={!supportsRaster ? 'Logo overlay needs the GD extension' : ''}
                                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-colors disabled:opacity-35 ${logo ? 'bg-indigo-500/15 border border-indigo-400/40 text-indigo-600 dark:text-indigo-300' : 'bg-white dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/10 text-slate-500 dark:text-slate-400'}`}
                                >
                                    <ImageIcon size={13} /> {logo ? 'Remove logo' : 'Add logo'}
                                </button>
                                <input ref={logoInputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleLogoUpload} />
                            </div>

                            {showCaption && (
                                <input
                                    type="text"
                                    value={caption}
                                    onChange={(e) => setCaption(e.target.value)}
                                    placeholder="Extra line under the barcode, e.g. product name"
                                    maxLength={40}
                                    className={inputBase}
                                />
                            )}

                            {logo && (
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/10">
                                    <img src={logo} alt="" className="w-9 h-9 object-contain rounded bg-white" />
                                    <span className="text-xs text-slate-500 dark:text-slate-400 flex-1 leading-snug">Keep it small — a large logo over the bars can stop the code scanning.</span>
                                    <button onClick={() => setLogo(null)} className="text-slate-500 dark:text-slate-400 hover:text-red-500 transition-colors"><X size={16} /></button>
                                </div>
                            )}
                        </div>

                        {errors.length > 0 && (
                            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                                <AlertCircle size={16} className="text-red-500 dark:text-red-400 mt-0.5 shrink-0" />
                                <div className="text-sm text-red-600 dark:text-red-300">
                                    {errors.map((err) => <p key={err}>{err}</p>)}
                                </div>
                            </div>
                        )}

                        {result?.was_computed && (
                            <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                <CheckCircle2 size={16} className="text-emerald-500 dark:text-emerald-400 mt-0.5 shrink-0" />
                                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                                    Check digit <strong>{result.check_digit}</strong> added &rarr; <span className="font-mono">{result.encoded_value}</span>
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Preview */}
                    <div className="flex flex-col min-w-0">
                        <div className="w-full aspect-[3/2] rounded-2xl bg-white border border-slate-900/[0.08] flex items-center justify-center p-6 mb-3">
                            {loading && <Loader2 size={20} className="text-slate-500 dark:text-slate-400 animate-spin" />}
                            {!loading && result && (
                                <img
                                    src={`data:${result.mime_type};base64,${result.image_base64}`}
                                    alt={`${meta.name} barcode for ${result.encoded_value}`}
                                    className="max-w-full max-h-full"
                                />
                            )}
                            {!loading && !result && <span className="text-slate-500 dark:text-slate-400 text-sm text-center px-4">Enter a value to see your barcode</span>}
                        </div>

                        <button
                            onClick={download}
                            disabled={!result}
                            className="w-full py-3.5 bg-slate-900 dark:bg-white text-white dark:text-[#05030f] rounded-xl text-sm font-black uppercase tracking-wide hover:scale-[1.01] transition-transform disabled:opacity-40 disabled:hover:scale-100 flex items-center justify-center gap-2"
                        >
                            <Download size={16} /> Download {result ? result.file_extension.toUpperCase() : output.toUpperCase()}
                        </button>
                        <p className="text-[11px] text-slate-500 dark:text-slate-600 text-center mt-2">Free — no email, no watermark.</p>
                    </div>
                </div>
            </div>

            {/* ── Print sheet ───────────────────────────────────────────── */}
            <div className="mt-6 rounded-3xl bg-slate-900/[0.02] dark:bg-white/[0.03] border border-slate-900/[0.06] dark:border-white/10 p-5 sm:p-7">
                <div className="flex items-start gap-3 mb-5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center shrink-0">
                        <Printer size={17} className="text-indigo-500 dark:text-indigo-300" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-slate-900 dark:text-white">Print a sheet of labels</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Same barcode repeated at an exact label size — thermal rolls or A4 sheets, as a print-ready PDF.</p>
                    </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mb-5">
                    <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Label size</label>
                        <Select value={preset} onChange={setPreset} options={presetOptions} />
                    </div>
                    <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                            How many labels
                        </label>
                        <input
                            type="number"
                            min="1"
                            max={maxQuantity}
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(1, Math.min(maxQuantity, Number(e.target.value) || 1)))}
                            className={inputBase}
                        />
                    </div>
                </div>

                <button
                    onClick={onSheetClick}
                    disabled={sheetLoading}
                    className="w-full sm:w-auto px-7 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-black uppercase tracking-wide transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
                >
                    {sheetLoading ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
                    {sheetLoading ? 'Building PDF…' : 'Download print sheet (PDF)'}
                </button>
                <p className="text-[11px] text-slate-500 dark:text-slate-600 mt-2.5 leading-relaxed">
                    Print at 100% / "Actual size" — never "Fit to page", or the labels won't line up with your stock.
                </p>
            </div>

            {/* Format table */}
            <section className="mt-12">
                <h2 className="text-2xl font-black mb-6 text-slate-900 dark:text-white">Supported formats</h2>
                <div className="overflow-x-auto rounded-2xl border border-slate-900/10 dark:border-white/10">
                    <table className="w-full text-sm min-w-[560px]">
                        <thead>
                            <tr className="bg-slate-900/[0.03] dark:bg-white/[0.04] text-left">
                                {['Format', 'Character set', 'Length', 'Typical retail use'].map((h) => (
                                    <th key={h} className="px-4 py-3 font-black text-slate-700 dark:text-slate-300">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {FORMAT_TABLE.map((row) => (
                                <tr key={row[0]} className="border-t border-slate-900/[0.06] dark:border-white/[0.06]">
                                    {row.map((cell, i) => <td key={i} className="px-4 py-3 text-slate-600 dark:text-slate-400">{cell}</td>)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="mt-10">
                <h2 className="text-lg font-black text-slate-600 dark:text-slate-300 mb-4">Generate a specific format</h2>
                <div className="flex flex-wrap gap-2.5">
                    {Object.entries(FORMAT_META).map(([slug, m]) => (
                        <Link
                            key={slug}
                            href={`/tools/barcode-generator/${slug}`}
                            className="px-4 py-2 rounded-full bg-slate-900/[0.03] dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/10 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-indigo-400/40 transition-colors"
                        >
                            {m.name}
                        </Link>
                    ))}
                </div>
            </section>

            <EmailGate
                open={gateOpen}
                onClose={() => setGateOpen(false)}
                toolSlug="barcode"
                toolName="Barcode Generator"
                deliverable="print-sheet"
                context={{ format, preset, quantity }}
                onSuccess={() => { setSheetUnlocked(true); setGateOpen(false); buildSheet(); }}
            />
        </ToolShell>
    );
}

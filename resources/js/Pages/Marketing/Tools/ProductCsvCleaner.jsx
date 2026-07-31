import React, { useState, useRef } from 'react';
import { Upload, Download, Loader2, AlertCircle, FileText, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import ToolShell from './Shared/ToolShell';
import Select from './Shared/Select';

const SAMPLE_CSV = `Product Name,Item Code,Regular Price,UPC,Stock,Product Type,Body (HTML)
 Organic  Green Tea 250g ,SKU-1001,$19.99,012345678905,24,Beverages,Premium loose leaf green tea
Almond Milk 1L,SKU-1002,"1,200.00",,12,Beverages,Unsweetened almond milk
Almond Milk 1L,SKU-1002,3.49,614141000012,12,Beverages,Duplicate SKU example
Dark Chocolate Bar 85%,,4.25,890123456787,50,Snacks,70% cacao dark chocolate
Sea Salt Chips,SKU-2002,-1.00,,30,Snacks,Negative price example
,SKU-9999,9.99,,10,Snacks,Row with no product name`;

const FIELD_LABELS = {
    name: 'Product Name',
    sku: 'SKU',
    price: 'Price',
    barcode: 'Barcode',
    quantity: 'Quantity',
    category: 'Category',
    description: 'Description',
};

const ISSUE_LABELS = {
    missing_sku: 'Missing SKU',
    duplicate_sku: 'Duplicate SKU',
    malformed_price: 'Malformed price',
    negative_or_zero_price: 'Negative/zero price',
    invalid_barcode: 'Invalid barcode',
    duplicate_name_category: 'Duplicate name + category',
    whitespace_cleaned: 'Whitespace cleaned',
};

const FAQS = [
    { q: "Why won't Shopify or WooCommerce accept my product CSV?", a: 'The most common reasons are a missing required column, a price field with a currency symbol or thousands separator like "$19.99", duplicate SKUs, or an invalid barcode check digit. This tool detects and reports every one of these before you re-upload.' },
    { q: 'How do I fix duplicate SKUs before importing?', a: 'Run your file through the cleaner — it flags every row sharing a SKU value. From there you can rename them manually, or opt in to auto-generate a unique SKU from the product name for rows missing one.' },
    { q: 'What format should product prices be in for CSV import?', a: 'A plain decimal number with no currency symbol and a period as the decimal point — e.g. 19.99, not "$19.99" or "1,200.00". The cleaner strips symbols and normalizes both US and European number formats automatically.' },
];

const csrf = () => document.querySelector('meta[name="csrf-token"]')?.content || '';

export default function ProductCsvCleanerTool({ maxRows = 5000, fields = [], toolGroups = [] }) {
    const [mode, setMode] = useState('paste'); // 'paste' | 'file'
    const [csvText, setCsvText] = useState('');
    const [file, setFile] = useState(null);
    const [generateMissingSkus, setGenerateMissingSkus] = useState(true);
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [errors, setErrors] = useState([]);
    const [result, setResult] = useState(null); // { header, detected_columns, column_map, summary, preview, fields }
    const [columnMap, setColumnMap] = useState(null);
    const fileInputRef = useRef(null);

    const buildFormData = (extra = {}) => {
        const fd = new FormData();
        if (mode === 'file' && file) {
            fd.append('file', file);
        } else {
            fd.append('csv_text', csvText);
        }
        fd.append('generate_missing_skus', generateMissingSkus ? '1' : '0');
        if (columnMap) {
            Object.entries(columnMap).forEach(([field, idx]) => {
                fd.append(`column_map[${field}]`, idx === null || idx === undefined ? '' : String(idx));
            });
        }
        Object.entries(extra).forEach(([k, v]) => fd.append(k, v));
        return fd;
    };

    const handleParse = async () => {
        setErrors([]);
        if (mode === 'paste' && !csvText.trim()) {
            setErrors(['Paste some CSV text first, or switch to file upload.']);
            return;
        }
        if (mode === 'file' && !file) {
            setErrors(['Choose a CSV file to upload.']);
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/tools/product-csv-cleaner/parse', {
                method: 'POST',
                headers: { 'Accept': 'application/json', 'X-CSRF-TOKEN': csrf() },
                body: buildFormData(),
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                setErrors(data.errors || ['Could not parse that CSV.']);
                setResult(null);
                setLoading(false);
                return;
            }
            setResult(data);
            setColumnMap(data.column_map);
        } catch (e) {
            setErrors(['Network error while parsing the file.']);
        } finally {
            setLoading(false);
        }
    };

    const handleRemap = async (field, value) => {
        const idx = value === '' ? null : parseInt(value, 10);
        const nextMap = { ...(columnMap || {}), [field]: idx };
        setColumnMap(nextMap);

        // Re-parse with the updated mapping so the preview/report reflect it.
        setLoading(true);
        try {
            const fd = new FormData();
            if (mode === 'file' && file) fd.append('file', file);
            else fd.append('csv_text', csvText);
            fd.append('generate_missing_skus', generateMissingSkus ? '1' : '0');
            Object.entries(nextMap).forEach(([f, i]) => fd.append(`column_map[${f}]`, i === null ? '' : String(i)));

            const res = await fetch('/tools/product-csv-cleaner/parse', {
                method: 'POST',
                headers: { 'Accept': 'application/json', 'X-CSRF-TOKEN': csrf() },
                body: fd,
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setResult(data);
                setColumnMap(data.column_map);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleToggleGenerateSkus = async (checked) => {
        setGenerateMissingSkus(checked);
        if (!result) return;
        setLoading(true);
        try {
            const fd = new FormData();
            if (mode === 'file' && file) fd.append('file', file);
            else fd.append('csv_text', csvText);
            fd.append('generate_missing_skus', checked ? '1' : '0');
            Object.entries(columnMap || {}).forEach(([f, i]) => fd.append(`column_map[${f}]`, i === null ? '' : String(i)));

            const res = await fetch('/tools/product-csv-cleaner/parse', {
                method: 'POST',
                headers: { 'Accept': 'application/json', 'X-CSRF-TOKEN': csrf() },
                body: fd,
            });
            const data = await res.json();
            if (res.ok && data.success) setResult(data);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        setErrors([]);
        setDownloading(true);
        try {
            const res = await fetch('/tools/product-csv-cleaner/download', {
                method: 'POST',
                headers: { 'Accept': 'text/csv, application/json', 'X-CSRF-TOKEN': csrf() },
                body: buildFormData(),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setErrors(data.errors || ['Could not build the cleaned CSV.']);
                setDownloading(false);
                return;
            }
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'cleaned-products.csv';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (e) {
            setErrors(['Network error while downloading.']);
        } finally {
            setDownloading(false);
        }
    };

    const summary = result?.summary;

    return (
        <ToolShell
            eyebrow="Inventory & Data"
            h1="Free Product CSV Cleaner"
            answer="Upload or paste a messy product CSV export from Shopify, WooCommerce, or a spreadsheet, and get back a cleaned, validated version with a clear report of what was found and fixed — missing SKUs, duplicate SKUs, malformed prices, invalid barcodes and more. Review before you download. Free, no signup."
            currentSlug="product-csv-cleaner"
            toolGroups={toolGroups}
            faqs={FAQS}
        >
            <div className="space-y-8">
                {errors.length > 0 && (
                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-sm space-y-1">
                        {errors.map((err, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                                <span>{err}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Step 1: Input */}
                <div className="p-5 rounded-2xl bg-slate-900/[0.02] dark:bg-white/[0.03] border border-slate-900/[0.06] dark:border-white/10 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-200">1. Upload or paste your CSV</h3>
                        <span className="text-[10px] text-slate-500 dark:text-zinc-500">Up to {maxRows.toLocaleString()} rows, 5MB file max</span>
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setMode('paste')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${mode === 'paste' ? 'bg-indigo-600 text-white' : 'bg-slate-900/[0.05] dark:bg-white/[0.06] text-slate-600 dark:text-zinc-300'}`}
                        >
                            Paste CSV text
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('file')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${mode === 'file' ? 'bg-indigo-600 text-white' : 'bg-slate-900/[0.05] dark:bg-white/[0.06] text-slate-600 dark:text-zinc-300'}`}
                        >
                            Upload file
                        </button>
                    </div>

                    {mode === 'paste' ? (
                        <div className="space-y-2">
                            <textarea
                                value={csvText}
                                onChange={(e) => setCsvText(e.target.value)}
                                placeholder={SAMPLE_CSV}
                                rows={8}
                                className="w-full bg-white dark:bg-zinc-950 border border-slate-900/10 dark:border-zinc-800 rounded-xl p-3 text-xs text-slate-900 dark:text-zinc-100 font-mono focus:outline-none focus:border-indigo-500 resize-none"
                            />
                            <button type="button" onClick={() => setCsvText(SAMPLE_CSV)} className="text-xs text-indigo-500 hover:underline">
                                Load a messy sample file
                            </button>
                        </div>
                    ) : (
                        <div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv,text/csv"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full border border-dashed border-slate-900/15 dark:border-zinc-800 hover:border-indigo-400/50 bg-white/50 dark:bg-zinc-950/50 py-6 rounded-xl text-sm text-slate-500 dark:text-zinc-400 flex flex-col items-center justify-center gap-2"
                            >
                                <Upload className="w-5 h-5" />
                                {file ? file.name : 'Click to choose a .csv file'}
                            </button>
                        </div>
                    )}

                    <label className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-zinc-300 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={generateMissingSkus}
                            onChange={(e) => handleToggleGenerateSkus(e.target.checked)}
                            className="rounded border-slate-300 dark:border-zinc-800 text-indigo-600 focus:ring-indigo-500"
                        />
                        Auto-generate a SKU (from product name) for rows missing one
                    </label>

                    <button
                        type="button"
                        onClick={handleParse}
                        disabled={loading}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                        Analyze & Preview
                    </button>
                </div>

                {/* Step 2: Column mapping */}
                {result && (
                    <div className="p-5 rounded-2xl bg-slate-900/[0.02] dark:bg-white/[0.03] border border-slate-900/[0.06] dark:border-white/10 space-y-4">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-200">2. Confirm column mapping</h3>
                        <p className="text-xs text-slate-500 dark:text-zinc-500">We auto-detected which column is which. Fix any that guessed wrong.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {fields.map((field) => (
                                <div key={field}>
                                    <label className="block text-xs text-slate-500 dark:text-zinc-400 mb-1">{FIELD_LABELS[field] || field}</label>
                                    <Select
                                        value={columnMap?.[field] === null || columnMap?.[field] === undefined ? '' : String(columnMap[field])}
                                        onChange={(val) => handleRemap(field, val)}
                                        options={[
                                            { value: '', label: '— Not in file —' },
                                            ...result.header.map((h, idx) => ({ value: String(idx), label: h || `Column ${idx + 1}` })),
                                        ]}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 3: Report */}
                {summary && (
                    <div className="p-5 rounded-2xl bg-slate-900/[0.02] dark:bg-white/[0.03] border border-slate-900/[0.06] dark:border-white/10 space-y-4">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-200">3. Cleanup report</h3>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="p-3 rounded-xl bg-white dark:bg-zinc-950 border border-slate-900/10 dark:border-zinc-800">
                                <p className="text-2xl font-black text-slate-900 dark:text-white">{summary.rows_processed}</p>
                                <p className="text-[10px] text-slate-500 dark:text-zinc-500 uppercase tracking-wide">Rows processed</p>
                            </div>
                            <div className="p-3 rounded-xl bg-white dark:bg-zinc-950 border border-slate-900/10 dark:border-zinc-800">
                                <p className="text-2xl font-black text-amber-500">{summary.issues_found}</p>
                                <p className="text-[10px] text-slate-500 dark:text-zinc-500 uppercase tracking-wide">Issues found</p>
                            </div>
                            <div className="p-3 rounded-xl bg-white dark:bg-zinc-950 border border-slate-900/10 dark:border-zinc-800">
                                <p className="text-2xl font-black text-emerald-500">{summary.rows_auto_fixed}</p>
                                <p className="text-[10px] text-slate-500 dark:text-zinc-500 uppercase tracking-wide">Rows auto-fixed</p>
                            </div>
                            <div className="p-3 rounded-xl bg-white dark:bg-zinc-950 border border-slate-900/10 dark:border-zinc-800">
                                <p className="text-2xl font-black text-slate-400">{summary.rows_skipped_empty}</p>
                                <p className="text-[10px] text-slate-500 dark:text-zinc-500 uppercase tracking-wide">Empty rows skipped</p>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            {Object.entries(summary.issues_by_type).filter(([, count]) => count > 0).map(([type, count]) => (
                                <div key={type} className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-white dark:bg-zinc-950 border border-slate-900/10 dark:border-zinc-800">
                                    <span className="flex items-center gap-2 text-slate-600 dark:text-zinc-300">
                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                                        {ISSUE_LABELS[type] || type}
                                    </span>
                                    <span className="font-bold text-slate-900 dark:text-white">{count}</span>
                                </div>
                            ))}
                            {summary.issues_found === 0 && (
                                <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-300">
                                    <CheckCircle2 className="w-4 h-4" /> No issues found — your file looks clean.
                                </div>
                            )}
                        </div>

                        {/* Preview table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[700px] text-xs">
                                <thead>
                                    <tr className="border-b border-slate-900/10 dark:border-zinc-800 text-[10px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                                        <th className="pb-2 pr-2">#</th>
                                        <th className="pb-2 pr-2">Name</th>
                                        <th className="pb-2 pr-2">SKU</th>
                                        <th className="pb-2 pr-2">Price</th>
                                        <th className="pb-2 pr-2">Barcode</th>
                                        <th className="pb-2">Issues</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-900/5 dark:divide-zinc-800/60">
                                    {result.preview.map((row) => (
                                        <tr key={row.row_number}>
                                            <td className="py-2 pr-2 text-slate-400">{row.row_number}</td>
                                            <td className="py-2 pr-2 text-slate-800 dark:text-zinc-200">{row.name || '—'}</td>
                                            <td className="py-2 pr-2 font-mono text-slate-800 dark:text-zinc-200">
                                                {row.sku || '—'}
                                                {row.sku_generated && <span className="ml-1 text-[9px] text-indigo-500">(generated)</span>}
                                            </td>
                                            <td className="py-2 pr-2 text-slate-800 dark:text-zinc-200">
                                                {row.price_clean !== null && row.price_clean !== undefined ? Number(row.price_clean).toFixed(2) : (row.price || '—')}
                                            </td>
                                            <td className="py-2 pr-2 font-mono text-slate-800 dark:text-zinc-200">{row.barcode || '—'}</td>
                                            <td className="py-2">
                                                {row.issues.length === 0 ? (
                                                    <span className="inline-flex items-center gap-1 text-emerald-500"><CheckCircle2 className="w-3.5 h-3.5" /> OK</span>
                                                ) : (
                                                    <span className="inline-flex flex-wrap gap-1">
                                                        {row.issues.map((issue) => (
                                                            <span key={issue} className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-300 text-[10px]">
                                                                {ISSUE_LABELS[issue] || issue}
                                                            </span>
                                                        ))}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {summary.rows_kept > result.preview.length && (
                            <p className="text-[11px] text-slate-500 dark:text-zinc-500">
                                Showing first {result.preview.length} of {summary.rows_kept} rows. The full cleaned file will include all of them.
                            </p>
                        )}

                        <div className="flex justify-end pt-2">
                            <button
                                type="button"
                                onClick={handleDownload}
                                disabled={downloading}
                                className="flex items-center gap-2 py-3 px-8 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/20"
                            >
                                {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                Download Cleaned CSV
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </ToolShell>
    );
}

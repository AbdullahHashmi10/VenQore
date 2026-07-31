import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import ToolShell from './Shared/ToolShell';

/**
 * T10 — UPC/EAN/GTIN Barcode Check Digit Validator.
 * Entirely free, no gate (plan §7 T10) — exists to earn links.
 * Also duplicated inline on the generator page (Barcode.jsx) per product
 * decision — this standalone page stays for its own SEO/GEO value.
 */

const FAQS = [
    { q: 'What is a barcode check digit?', a: 'A check digit is the final digit of a barcode, calculated from the preceding digits using a modulo-10 algorithm. Scanners use it to detect misreads — if the check digit does not match, the scan is rejected.' },
    { q: 'How is the UPC/EAN check digit calculated?', a: 'Starting from the rightmost digit, alternating digits are multiplied by 3 and 1, the results are summed, and the check digit is the number that brings that sum to the next multiple of 10.' },
    { q: 'What is a GTIN?', a: 'GTIN (Global Trade Item Number) is the umbrella standard covering UPC-A (GTIN-12), EAN-13 (GTIN-13) and ITF-14 (GTIN-14) — this validator normalizes any of them to their 14-digit GTIN form.' },
    { q: 'My barcode says invalid — what do I do now?', a: 'Double-check the number against the original label or product packaging for a typo or transposed digit. If it still comes back invalid, the barcode itself may have been generated incorrectly and should be regenerated with our Barcode Generator.' },
];

export default function BarcodeValidatorTool({ prefill = '', toolGroups = [] }) {
    const [value, setValue] = useState(prefill);
    const [result, setResult] = useState(null);
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(false);

    const runCheck = (raw) => {
        if (!raw.trim()) return;
        setLoading(true);
        fetch(route('tools.barcode-validator.check'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
            },
            body: JSON.stringify({ value: raw.trim() }),
        })
            .then(async (res) => {
                const json = await res.json();
                if (!res.ok) {
                    setErrors(json.errors || ['Something went wrong.']);
                    setResult(null);
                    return;
                }
                setErrors([]);
                setResult(json);
            })
            .catch(() => setErrors(['Network error — please try again.']))
            .finally(() => setLoading(false));
    };

    // Auto-run when arriving from the generator's "Details" link.
    useEffect(() => {
        if (prefill) runCheck(prefill);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const check = (e) => {
        e.preventDefault();
        runCheck(value);
    };

    return (
        <ToolShell
            title="UPC/EAN Barcode Check Digit Validator — Free | VenQore"
            metaDescription="Validate any UPC, EAN or GTIN barcode number free. See the computed check digit, a plain-English explanation, and the full modulo-10 arithmetic breakdown. No signup."
            eyebrow="Free Tool"
            h1="UPC / EAN / GTIN Barcode Check Digit Validator"
            answer="Paste any GTIN-8, GTIN-12 (UPC-A), GTIN-13 (EAN-13) or GTIN-14 (ITF-14) number to check whether its check digit is valid. The tool explains in plain English what that means, plus shows the computed check digit and the full modulo-10 arithmetic — free, with no signup."
            faqs={FAQS}
            toolGroups={toolGroups}
            currentSlug="barcode-validator"
            cta={{
                headline: 'Stop doing this manually.',
                subtext: 'VenQore validates and generates barcodes automatically on every product you add.',
            }}
            related={[{ label: 'Barcode Generator', href: '/tools/barcode-generator' }]}
        >
            <div className="rounded-3xl bg-slate-900/[0.02] dark:bg-white/[0.03] border border-slate-900/[0.06] dark:border-white/10 p-5 sm:p-8">
                <form onSubmit={check} className="flex gap-3 mb-6 flex-col sm:flex-row">
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder="e.g. 012345678905"
                        className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm font-mono focus:outline-none focus:border-indigo-400/60"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-7 py-3 bg-slate-900 dark:bg-white text-white dark:text-[#05030f] rounded-xl text-sm font-black uppercase tracking-wide hover:scale-[1.02] transition-transform disabled:opacity-50 shrink-0"
                    >
                        {loading ? 'Checking…' : 'Validate'}
                    </button>
                </form>

                {errors.length > 0 && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-600 dark:text-red-300 mb-4">
                        {errors.map((err) => <p key={err}>{err}</p>)}
                    </div>
                )}

                {result && (
                    <div className={`p-5 rounded-2xl border ${result.valid ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                        <div className="flex items-center gap-3 mb-3">
                            {result.valid ? (
                                <CheckCircle2 size={22} className="text-emerald-500 dark:text-emerald-400 shrink-0" />
                            ) : (
                                <XCircle size={22} className="text-red-500 dark:text-red-400 shrink-0" />
                            )}
                            <p className={`font-black ${result.valid ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
                                {result.valid ? `Valid ${result.format_name}` : `Invalid ${result.format_name}`}
                            </p>
                        </div>

                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">{result.explanation}</p>

                        <div className="grid sm:grid-cols-2 gap-3 mb-4 text-sm">
                            <p className="text-slate-500 dark:text-slate-400">
                                Supplied check digit: <span className="font-mono text-slate-900 dark:text-white">{result.supplied_check_digit}</span>
                            </p>
                            <p className="text-slate-500 dark:text-slate-400">
                                Computed check digit: <span className="font-mono text-slate-900 dark:text-white">{result.computed_check_digit}</span>
                            </p>
                            <p className="text-slate-500 dark:text-slate-400 sm:col-span-2">
                                GTIN-14 form: <span className="font-mono text-slate-900 dark:text-white">{result.gtin14}</span>
                            </p>
                        </div>

                        <details className="text-sm">
                            <summary className="cursor-pointer font-bold text-slate-600 dark:text-slate-300 mb-2">Show the arithmetic</summary>
                            <div className="mt-2 font-mono text-xs text-slate-500 dark:text-slate-400 space-y-1">
                                {result.breakdown.map((row, i) => (
                                    <p key={i}>digit {row.digit} &times; weight {row.weight} = {row.product}</p>
                                ))}
                                <p className="pt-2 border-t border-slate-900/10 dark:border-white/10 text-slate-700 dark:text-slate-300">sum = {result.sum} &rarr; check digit = (10 &minus; ({result.sum} mod 10)) mod 10 = {result.computed_check_digit}</p>
                            </div>
                        </details>

                        {!result.valid && (
                            <div className="mt-4 pt-4 border-t border-slate-900/10 dark:border-white/10">
                                <a href="/tools/barcode-generator" className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                                    Regenerate this as a new, valid barcode &rarr;
                                </a>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </ToolShell>
    );
}

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Trash2, Download, Loader2, Upload, AlertCircle } from 'lucide-react';
import ToolShell from './Shared/ToolShell';
import Select from './Shared/Select';
import EditableText from './Shared/EditableText';
import SmartCaptureNudge from './Shared/SmartCaptureNudge';

/**
 * Free Quotation / Estimate Generator.
 *
 * Free & ungated, always: no email required to generate or download a PDF
 * quotation, no watermark, no limit on count. Company profile is persisted
 * to its OWN localStorage key (separate from the invoice tool) so the two
 * tools' saved profiles never collide.
 *
 * UX MODEL: the document IN THE MIDDLE OF THE PAGE *is* the editor, same
 * pattern as Invoice.jsx — every field is edited by clicking directly on
 * the rendered quotation (see Shared/EditableText). Secondary controls
 * (document type, template, currency, accent color, logo, validity days)
 * live in a slim bar above the document. The Acceptance/signature block at
 * the bottom is static print styling, matching the PDF — not editable.
 */

const STORAGE_KEY = 'venqore_quote_business_profile_v1';

const ACCENT_PRESETS = ['#4f46e5', '#0ea5e9', '#059669', '#d97706', '#dc2626', '#7c3aed'];

const emptyItem = () => ({ description: '', quantity: 1, unit_price: 0, tax_rate: 0, discount_pct: 0 });

const addDays = (dateStr, days) => {
    const d = dateStr ? new Date(dateStr) : new Date();
    d.setDate(d.getDate() + (parseInt(days, 10) || 0));
    return d.toISOString().slice(0, 10);
};

const FAQS = [
    { q: 'Is the VenQore quotation generator really free?', a: 'Yes. Creating and downloading a PDF quotation or estimate is completely free, with no signup, no watermark and no limit on how many you generate.' },
    { q: 'Is a quote legally binding?', a: 'Generally no, not on its own — a quotation is an offer, not a contract. It typically only becomes binding once the client formally accepts it (signature, purchase order, or written confirmation) and, in many jurisdictions, work begins or a deposit is paid. That is exactly why this tool includes a "Valid Until" date and an acceptance/signature section — it makes clear when the offer expires and gives the client a place to confirm.' },
    { q: 'How long should a quote be valid?', a: 'Most small businesses use 14–30 days. Material and labor costs can shift, so an open-ended quote exposes you to honoring old pricing indefinitely. This tool defaults to 30 days from the issue date but you can set any validity period per quote.' },
    { q: 'What is the difference between a quote, an estimate, and an invoice?', a: 'A quote is a fixed, firm price offered before work starts. An estimate is a rough, non-binding approximation that may change once the full scope is known. An invoice is issued after (or during) the work to request payment for what was actually delivered. This tool lets you label the same document as either QUOTATION or ESTIMATE depending on how firm your pricing is.' },
    { q: 'Can I show a discount to help win the deal?', a: 'Yes — each line item has its own discount percentage in addition to quantity, unit price and tax rate, so you can show a client exactly how much you knocked off to win their business.' },
    { q: 'Can I list what is included and excluded?', a: 'Yes — optional Scope of Work / Inclusions and Exclusions sections let you set expectations up front, which is especially useful for service businesses (contractors, agencies, consultants) where scope creep is a real risk.' },
    { q: 'Is my quotation data stored anywhere?', a: 'No. The PDF is generated on request and streamed back to you immediately. Nothing about the quotation — company, client, or line items — is saved on our servers.' },
    { q: 'Does the preview match the downloaded PDF?', a: 'Yes. What you see on screen is built to match the downloaded PDF layout, font and spacing exactly — including the valid-until date, scope/exclusions sections and the acceptance block — so there are no surprises after download.' },
];

export default function QuotationTool({ templates = {}, currencies = {}, maxItems = 100, defaultValidityDays = 30, suggestedNumber = '', toolGroups = [] }) {
    const [company, setCompany] = useState({ name: '', address: '', email: '', phone: '', tax_id: '', logo_base64: null });
    const [client, setClient] = useState({ name: '', address: '', email: '' });
    const [items, setItems] = useState([
        { description: 'Design & consultation', quantity: 1, unit_price: 450, tax_rate: 0, discount_pct: 0 },
        { description: 'Installation (per unit)', quantity: 4, unit_price: 120, tax_rate: 8, discount_pct: 0 },
    ]);
    const todayStr = new Date().toISOString().slice(0, 10);
    const [meta, setMeta] = useState({
        quote_number: suggestedNumber,
        document_label: 'QUOTATION',
        issue_date: todayStr,
        validity_days: defaultValidityDays,
        valid_until: addDays(todayStr, defaultValidityDays),
        currency: 'USD',
        notes: '',
        scope_of_work: '',
        exclusions: '',
        template: 'clean',
        accent_color: '#4f46e5',
    });
    const [validUntilTouched, setValidUntilTouched] = useState(false);
    const [headers, setHeaders] = useState({
        description: 'Description',
        qty: 'Qty',
        unit_price: 'Unit Price',
        discount: 'Disc.',
        tax: 'Tax',
        amount: 'Amount',
    });
    const [orientation, setOrientation] = useState('portrait');
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(false);
    const logoInputRef = useRef(null);

    // Load saved company profile once on mount.
    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) setCompany((c) => ({ ...c, ...JSON.parse(raw) }));
        } catch (e) { /* ignore corrupt storage */ }
    }, []);

    // Persist company profile whenever it changes.
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(company));
        } catch (e) { /* storage full or unavailable — non-fatal */ }
    }, [company]);

    // Auto-recompute valid_until from issue_date + validity_days unless the
    // user has manually edited the valid-until field directly (override).
    useEffect(() => {
        if (validUntilTouched) return;
        setMeta((m) => ({ ...m, valid_until: addDays(m.issue_date, m.validity_days) }));
    }, [meta.issue_date, meta.validity_days, validUntilTouched]);

    const symbol = currencies[meta.currency] || meta.currency;
    const fmtMoney = (n) => `${symbol}${(parseFloat(n) || 0).toFixed(2)}`;

    const lineTotals = useMemo(() => items.map((it) => {
        const qty = parseFloat(it.quantity) || 0;
        const price = parseFloat(it.unit_price) || 0;
        const discPct = Math.min(100, Math.max(0, parseFloat(it.discount_pct) || 0));
        const taxPct = Math.max(0, parseFloat(it.tax_rate) || 0);
        const gross = qty * price;
        const discAmt = gross * (discPct / 100);
        const net = gross - discAmt;
        const taxAmt = net * (taxPct / 100);
        return { net, taxAmt, discAmt, lineTotal: net + taxAmt };
    }), [items]);

    const totals = useMemo(() => lineTotals.reduce((acc, l) => ({
        subtotal: acc.subtotal + l.net,
        tax: acc.tax + l.taxAmt,
        discount: acc.discount + l.discAmt,
    }), { subtotal: 0, tax: 0, discount: 0 }), [lineTotals]);
    const grandTotal = totals.subtotal + totals.tax;

    const updateItem = (idx, field, val) => {
        setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: val } : it)));
    };
    const addItem = () => {
        if (items.length >= maxItems) return;
        setItems((prev) => [...prev, emptyItem()]);
    };
    const removeItem = (idx) => setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));

    const onLogoChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 1_500_000) {
            setErrors(['Logo image is too large — please use a file under 1.5MB.']);
            return;
        }
        const reader = new FileReader();
        reader.onload = () => setCompany((c) => ({ ...c, logo_base64: reader.result }));
        reader.readAsDataURL(file);
    };

    const generate = async () => {
        setErrors([]);
        if (!company.name.trim()) { setErrors(['Your company name is required. Click "Your business name" on the quote above.']); return; }
        if (!client.name.trim()) { setErrors(['A client name is required. Click "Client name" on the quote above.']); return; }
        if (!items.some((it) => it.description.trim())) { setErrors(['Add at least one line item with a description.']); return; }

        setLoading(true);
        try {
            const res = await fetch(route('tools.quote.render'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
                    Accept: 'application/json',
                },
                body: JSON.stringify({ company, client, items, meta, headers, orientation }),
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                setErrors(body.errors || ['Could not generate that quotation. Please check your entries and try again.']);
                setLoading(false);
                return;
            }

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `quotation-${(meta.quote_number || 'draft').replace(/[^A-Za-z0-9-]/g, '')}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch (e) {
            setErrors(['Something went wrong generating the PDF. Please try again.']);
        } finally {
            setLoading(false);
        }
    };

    const templateOptions = Object.entries(templates).map(([key, t]) => ({
        value: key, label: t.name, hint: t.description,
    }));
    const currencyOptions = Object.entries(currencies).map(([code, sym]) => ({
        value: code, label: `${code} (${sym})`,
    }));

    const isEstimate = meta.document_label === 'ESTIMATE';
    const docWord = isEstimate ? 'Estimate' : 'Quote';

    const accent = meta.template === 'modern' ? meta.accent_color : '#0f172a';
    const isModern = meta.template === 'modern';
    const isClassic = meta.template === 'classic';
    const isCompact = meta.template === 'compact';

    return (
        <ToolShell
            title="Free Quotation Generator — PDF Quotes & Estimates, No Watermark | VenQore"
            metaDescription="Create a professional PDF quotation or estimate free online. Valid-until expiry dates, scope of work, exclusions, per-line tax and discounts. No signup, no watermark."
            eyebrow="Free Tools"
            h1="Free Quotation Generator"
            answer="Edit the quote below exactly as it will look in your PDF — click any field to change it. Automatic valid-until expiry, optional scope-of-work and exclusions sections, and a client acceptance/signature block. No signup, no limit on how many you generate."
            toolGroups={toolGroups}
            currentSlug="quote-generator"
            faqs={FAQS}
            cta={{ headline: 'Winning the quote is only step one.', subtext: 'VenQore turns an accepted quote straight into a sale, with inventory and double-entry accounting handled automatically.' }}
            related={[{ href: '/tools/invoice-generator', label: 'Invoice Generator' }, { href: '/tools/purchase-order-generator', label: 'Purchase Order Generator' }]}
            wide
        >
            <SmartCaptureNudge documentType="quotation" />

            {errors.length > 0 && (
                <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2.5">
                    <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                    <div className="text-sm text-red-600 dark:text-red-400">
                        {errors.map((e, i) => <p key={i}>{e}</p>)}
                    </div>
                </div>
            )}

            {/* Slim control bar — everything that ISN'T part of the document itself */}
            <div className="flex flex-wrap items-center gap-3 mb-5 p-3 rounded-2xl bg-slate-900/[0.02] dark:bg-white/[0.03] border border-slate-900/[0.06] dark:border-white/10">
                <div className="flex items-center rounded-xl bg-white dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/10 p-0.5 text-xs font-bold">
                    <button
                        type="button"
                        onClick={() => setMeta((m) => ({ ...m, document_label: 'QUOTATION' }))}
                        className={`px-3 py-1.5 rounded-lg transition-colors ${!isEstimate ? 'bg-slate-900 dark:bg-white text-white dark:text-[#05030f]' : 'text-slate-500 dark:text-slate-400'}`}
                    >
                        Quotation
                    </button>
                    <button
                        type="button"
                        onClick={() => setMeta((m) => ({ ...m, document_label: 'ESTIMATE' }))}
                        className={`px-3 py-1.5 rounded-lg transition-colors ${isEstimate ? 'bg-slate-900 dark:bg-white text-white dark:text-[#05030f]' : 'text-slate-500 dark:text-slate-400'}`}
                    >
                        Estimate
                    </button>
                </div>
                <div className="w-40">
                    <Select value={meta.template} onChange={(v) => setMeta((m) => ({ ...m, template: v }))} options={templateOptions} />
                </div>
                <div className="w-36">
                    <Select value={meta.currency} onChange={(v) => setMeta((m) => ({ ...m, currency: v }))} options={currencyOptions} />
                </div>
                <div className="flex items-center gap-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Valid for</label>
                    <input
                        type="number"
                        min="1"
                        max="3650"
                        value={meta.validity_days}
                        onChange={(e) => { setValidUntilTouched(false); setMeta((m) => ({ ...m, validity_days: e.target.value })); }}
                        className="w-16 px-2 py-2 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-400/60 transition-colors"
                    />
                    <span className="text-xs text-slate-500 dark:text-slate-600">days</span>
                </div>
                {isModern && (
                    <div className="flex items-center gap-1.5">
                        {ACCENT_PRESETS.map((c) => (
                            <button key={c} type="button" onClick={() => setMeta((m) => ({ ...m, accent_color: c }))}
                                className={`w-6 h-6 rounded-full border-2 transition-transform ${meta.accent_color === c ? 'scale-110 border-slate-900 dark:border-white' : 'border-transparent'}`}
                                style={{ background: c }} aria-label={c} />
                        ))}
                    </div>
                )}
                <button type="button" onClick={() => logoInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-slate-300 hover:border-indigo-400/40 transition-colors">
                    <Upload size={13} /> {company.logo_base64 ? 'Change logo' : 'Add logo'}
                </button>
                {company.logo_base64 && (
                    <button type="button" onClick={() => setCompany((c) => ({ ...c, logo_base64: null }))} className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-red-500 transition-colors">
                        Remove logo
                    </button>
                )}
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={onLogoChange} />

                <div className="flex items-center rounded-xl bg-white dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/10 p-0.5 text-xs font-bold">
                    <button
                        type="button"
                        onClick={() => setOrientation('portrait')}
                        className={`px-3 py-1.5 rounded-lg transition-colors ${orientation === 'portrait' ? 'bg-slate-900 dark:bg-white text-white dark:text-[#05030f]' : 'text-slate-500 dark:text-slate-400'}`}
                    >
                        Portrait
                    </button>
                    <button
                        type="button"
                        onClick={() => setOrientation('landscape')}
                        className={`px-3 py-1.5 rounded-lg transition-colors ${orientation === 'landscape' ? 'bg-slate-900 dark:bg-white text-white dark:text-[#05030f]' : 'text-slate-500 dark:text-slate-400'}`}
                    >
                        Landscape
                    </button>
                </div>

                <div className="ml-auto flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 dark:text-slate-600 hidden sm:inline">Saved in your browser — nothing sent until you download</span>
                    <button
                        type="button"
                        onClick={generate}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-[#05030f] rounded-xl text-xs font-black uppercase tracking-wide hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100"
                    >
                        {loading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                        {loading ? 'Generating…' : `Download PDF`}
                    </button>
                </div>
            </div>

            {/* THE DOCUMENT — this is the editor */}
            {orientation === 'landscape' && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">
                    Landscape printing is not yet supported for downloads — this previews the layout only.
                </p>
            )}
            <div className={`rounded-2xl overflow-hidden shadow-xl shadow-slate-900/10 dark:shadow-black/40 border border-slate-900/10 dark:border-white/10 bg-white transition-all ${orientation === 'landscape' ? 'max-w-none' : ''}`}>
                {isModern && <div className="h-3 w-full" style={{ background: accent }} />}
                <div className={`p-6 sm:p-10 text-slate-900 ${isCompact ? 'text-[13px]' : 'text-sm'}`} style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                    {/* Header */}
                    <div className={`flex flex-col sm:flex-row justify-between gap-6 mb-8 ${isClassic ? 'border-b-2 border-slate-900 pb-4' : ''}`}>
                        <div>
                            {company.logo_base64 && <img src={company.logo_base64} alt="Logo" className="h-12 max-w-[160px] object-contain mb-2" />}
                            <EditableText
                                value={company.name}
                                onChange={(v) => setCompany((c) => ({ ...c, name: v }))}
                                placeholder="Your business name"
                                className="block text-lg font-bold"
                                inline={false}
                            />
                            <EditableText
                                value={company.address}
                                onChange={(v) => setCompany((c) => ({ ...c, address: v }))}
                                placeholder="Business address"
                                as="textarea" rows={2}
                                className="block text-slate-500 text-xs mt-1 max-w-xs"
                                inline={false}
                            />
                            <div className="flex flex-col gap-y-0.5 text-xs text-slate-500 mt-1">
                                <EditableText value={company.email} onChange={(v) => setCompany((c) => ({ ...c, email: v }))} placeholder="email@business.com" inline={false} />
                                <EditableText value={company.phone} onChange={(v) => setCompany((c) => ({ ...c, phone: v }))} placeholder="Phone number" inline={false} />
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                                Tax ID: <EditableText value={company.tax_id} onChange={(v) => setCompany((c) => ({ ...c, tax_id: v }))} placeholder="optional" />
                            </div>
                        </div>
                        <div className="text-left sm:text-right">
                            <div className="text-2xl font-black tracking-tight" style={{ color: isModern ? accent : '#0f172a' }}>{meta.document_label}</div>
                            <div className="mt-2 text-xs space-y-0.5">
                                <div className="flex sm:justify-end gap-2"><span className="text-slate-500 dark:text-slate-400">{docWord} #</span><EditableText value={meta.quote_number} onChange={(v) => setMeta((m) => ({ ...m, quote_number: v }))} className="font-bold" /></div>
                                <div className="flex sm:justify-end gap-2"><span className="text-slate-500 dark:text-slate-400">Issue date</span><EditableText as="date" value={meta.issue_date} onChange={(v) => setMeta((m) => ({ ...m, issue_date: v }))} /></div>
                                <div className="flex sm:justify-end gap-2">
                                    <span className="text-slate-500 dark:text-slate-400">Valid until</span>
                                    <EditableText
                                        as="date"
                                        value={meta.valid_until}
                                        onChange={(v) => { setValidUntilTouched(true); setMeta((m) => ({ ...m, valid_until: v })); }}
                                        className="font-bold"
                                        formatDisplay={(v) => v}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Prepared for */}
                    <div className="mb-6">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Prepared For</p>
                        <EditableText value={client.name} onChange={(v) => setClient((c) => ({ ...c, name: v }))} placeholder="Client name" className="block font-bold" inline={false} />
                        <EditableText value={client.address} onChange={(v) => setClient((c) => ({ ...c, address: v }))} placeholder="Client address" as="textarea" rows={2} className="block text-slate-500 text-xs mt-0.5" inline={false} />
                        <EditableText value={client.email} onChange={(v) => setClient((c) => ({ ...c, email: v }))} placeholder="Client email (optional)" className="block text-slate-500 text-xs mt-0.5" inline={false} />
                    </div>

                    {/* Line items */}
                    <table className="w-full mb-2">
                        <thead>
                            <tr className={`text-left text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 ${isClassic ? 'border-b-2 border-slate-900' : 'border-b border-slate-900'}`}>
                                <th className="pb-2 pr-2"><EditableText value={headers.description} onChange={(v) => setHeaders((h) => ({ ...h, description: v }))} className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400" pulse={false} /></th>
                                <th className="pb-2 px-2 text-right w-16"><EditableText value={headers.qty} onChange={(v) => setHeaders((h) => ({ ...h, qty: v }))} className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 text-right" pulse={false} /></th>
                                <th className="pb-2 px-2 text-right w-24"><EditableText value={headers.unit_price} onChange={(v) => setHeaders((h) => ({ ...h, unit_price: v }))} className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 text-right" pulse={false} /></th>
                                <th className="pb-2 px-2 text-right w-16"><EditableText value={headers.discount} onChange={(v) => setHeaders((h) => ({ ...h, discount: v }))} className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 text-right" pulse={false} /></th>
                                <th className="pb-2 px-2 text-right w-16"><EditableText value={headers.tax} onChange={(v) => setHeaders((h) => ({ ...h, tax: v }))} className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 text-right" pulse={false} /></th>
                                <th className="pb-2 pl-2 text-right w-24"><EditableText value={headers.amount} onChange={(v) => setHeaders((h) => ({ ...h, amount: v }))} className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 text-right" pulse={false} /></th>
                                <th className="w-8"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, idx) => (
                                <tr key={idx} className="border-b border-slate-100 group">
                                    <td className="py-2 pr-2">
                                        <EditableText value={item.description} onChange={(v) => updateItem(idx, 'description', v)} placeholder="Item description" className="block" />
                                    </td>
                                    <td className="py-2 px-2 text-right">
                                        <EditableText as="number" min="0" value={item.quantity} onChange={(v) => updateItem(idx, 'quantity', v)} className="text-right w-12" />
                                    </td>
                                    <td className="py-2 px-2 text-right">
                                        <EditableText as="number" min="0" value={item.unit_price} onChange={(v) => updateItem(idx, 'unit_price', v)} formatDisplay={fmtMoney} className="text-right w-16" />
                                    </td>
                                    <td className="py-2 px-2 text-right">
                                        <EditableText as="number" min="0" max="100" value={item.discount_pct} onChange={(v) => updateItem(idx, 'discount_pct', v)} formatDisplay={(v) => (v > 0 ? `${v}%` : '—')} className="text-right w-12" />
                                    </td>
                                    <td className="py-2 px-2 text-right">
                                        <EditableText as="number" min="0" value={item.tax_rate} onChange={(v) => updateItem(idx, 'tax_rate', v)} formatDisplay={(v) => (v > 0 ? `${v}%` : '—')} className="text-right w-12" />
                                    </td>
                                    <td className="py-2 pl-2 text-right font-bold">{fmtMoney(lineTotals[idx]?.lineTotal)}</td>
                                    <td className="py-2 pl-1 text-right">
                                        <button type="button" onClick={() => removeItem(idx)} disabled={items.length === 1} className="opacity-0 group-hover:opacity-100 text-slate-600 dark:text-slate-300 hover:text-red-500 disabled:opacity-0 transition-opacity">
                                            <Trash2 size={13} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <button type="button" onClick={addItem} disabled={items.length >= maxItems} className="flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-500 disabled:opacity-40 transition-colors mb-6">
                        <Plus size={12} /> Add line item
                    </button>

                    {/* Totals */}
                    <div className="flex justify-end mb-8">
                        <div className="w-56 space-y-1 text-sm">
                            <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>{fmtMoney(totals.subtotal)}</span></div>
                            {totals.discount > 0 && <div className="flex justify-between text-slate-500"><span>Discount</span><span>-{fmtMoney(totals.discount)}</span></div>}
                            {totals.tax > 0 && <div className="flex justify-between text-slate-500"><span>Tax</span><span>{fmtMoney(totals.tax)}</span></div>}
                            <div className="flex justify-between font-black text-base pt-1.5 border-t-2 border-slate-900" style={{ color: isModern ? accent : '#0f172a' }}>
                                <span>Total</span><span>{fmtMoney(grandTotal)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Scope of work / Exclusions */}
                    <div className="grid sm:grid-cols-2 gap-6 text-xs text-slate-500 mb-6">
                        <div>
                            <p className="font-bold text-slate-700 mb-1">Scope of Work / Inclusions</p>
                            <EditableText value={meta.scope_of_work} onChange={(v) => setMeta((m) => ({ ...m, scope_of_work: v }))} placeholder="Add scope of work (optional)" as="textarea" rows={3} className="block" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-700 mb-1">Exclusions</p>
                            <EditableText value={meta.exclusions} onChange={(v) => setMeta((m) => ({ ...m, exclusions: v }))} placeholder="Add exclusions (optional)" as="textarea" rows={3} className="block" />
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="text-xs text-slate-500 mb-6">
                        <p className="font-bold text-slate-700 mb-1">Notes</p>
                        <EditableText value={meta.notes} onChange={(v) => setMeta((m) => ({ ...m, notes: v }))} placeholder="Add a note (optional)" as="textarea" rows={2} className="block" />
                    </div>

                    {/* Acceptance — static print-signature styling, matches PDF, not editable */}
                    <div className="mt-10 pt-5 border-t border-slate-200">
                        <p className="text-[11px] text-slate-500 mb-8">
                            To accept this {isEstimate ? 'estimate' : 'quotation'}, please sign below or reply confirming acceptance. This {isEstimate ? 'estimate' : 'quotation'} is valid until <span className="font-bold text-slate-700">{meta.valid_until || '—'}</span>.
                        </p>
                        <div className="grid grid-cols-2 gap-8">
                            <div className="pt-10 border-t border-slate-900 text-[11px] text-slate-500">Signature</div>
                            <div className="pt-10 border-t border-slate-900 text-[11px] text-slate-500">Date</div>
                        </div>
                    </div>

                    <p className="text-center text-[10px] text-slate-600 dark:text-slate-300 mt-10">Generated free at venqore.com/tools — no signup, no watermark, no expiry.</p>
                </div>
            </div>

            <p className="text-center text-xs text-slate-500 dark:text-slate-600 mt-4">
                This preview matches your downloaded PDF exactly — click anything above to edit it.
            </p>
        </ToolShell>
    );
}

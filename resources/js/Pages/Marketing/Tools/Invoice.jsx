import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Trash2, Download, Loader2, Upload, X, AlertCircle } from 'lucide-react';
import ToolShell from './Shared/ToolShell';
import Select from './Shared/Select';
import EditableText from './Shared/EditableText';

/**
 * T2 — Free Invoice Generator.
 *
 * Free & ungated, always: no email required to generate or download a PDF
 * invoice, no watermark, no limit on count (plan §6.1 — core output never
 * gated). The only thing persisted is the company profile, saved to
 * localStorage purely as a client convenience so returning users don't
 * retype their business details — nothing is sent to or stored on the
 * server outside of the single render request.
 *
 * UX MODEL: the document IN THE MIDDLE OF THE PAGE *is* the editor. Every
 * field — company name, client, line items, dates, notes — is edited by
 * clicking directly on the rendered invoice (see Shared/EditableText).
 * There is no separate input form; secondary controls (template, currency,
 * logo) live in a slim bar above the document. This mirrors what the user
 * will actually get before they ever click Download.
 */

const STORAGE_KEY = 'venqore_invoice_company_profile_v1';

const ACCENT_PRESETS = ['#4f46e5', '#0ea5e9', '#059669', '#d97706', '#dc2626', '#7c3aed'];

const emptyItem = () => ({ description: '', quantity: 1, unit_price: 0, tax_rate: 0, discount_pct: 0 });

const FAQS = [
    { q: 'Is the VenQore invoice generator really free?', a: 'Yes. Creating and downloading a PDF invoice is completely free, with no signup, no watermark and no limit on how many invoices you generate.' },
    { q: 'Can I save my company details for next time?', a: 'Yes — your company name, address, logo and tax ID are saved in your browser so you do not have to retype them next time. Nothing is sent to or stored on our servers until you click Download.' },
    { q: 'Does it support multiple currencies?', a: 'Yes — USD, EUR, GBP, CAD, AUD, PKR, INR, AED, SAR and JPY.' },
    { q: 'Can I add tax and discounts per line item?', a: 'Yes. Each line item has its own quantity, unit price, discount percentage and tax rate, so you can mix taxed and untaxed items or discount a single line only.' },
    { q: 'What invoice templates are available?', a: 'Four: Clean (minimal), Modern (accent color band), Classic (bordered table) and Compact (dense layout for invoices with many line items).' },
    { q: 'Is my invoice data stored anywhere?', a: 'No. The PDF is generated on request and streamed back to you immediately. Nothing about the invoice — company, client or line items — is saved on our servers.' },
    { q: 'Does the preview look exactly like the PDF I download?', a: 'Yes. What you see on screen is built to match the downloaded PDF layout, font and spacing — there are no surprises after download.' },
];

export default function InvoiceTool({ templates = {}, currencies = {}, maxItems = 100, suggestedNumber = '', toolGroups = [] }) {
    const [company, setCompany] = useState({ name: '', address: '', email: '', phone: '', tax_id: '', logo_base64: null });
    const [client, setClient] = useState({ name: '', address: '', email: '' });
    const [items, setItems] = useState([
        { description: 'Website design & development', quantity: 1, unit_price: 1200, tax_rate: 0, discount_pct: 0 },
        { description: 'Monthly hosting (3 months)', quantity: 3, unit_price: 25, tax_rate: 8, discount_pct: 0 },
    ]);
    const [meta, setMeta] = useState({
        invoice_number: suggestedNumber,
        issue_date: new Date().toISOString().slice(0, 10),
        due_date: '',
        currency: 'USD',
        notes: '',
        terms: 'Payment due within 14 days.',
        template: 'clean',
        accent_color: '#4f46e5',
        orientation: 'portrait',
    });
    const [headers, setHeaders] = useState({
        description: 'Description',
        quantity: 'Qty',
        unit_price: 'Unit Price',
        discount: 'Disc.',
        tax: 'Tax',
        amount: 'Amount',
    });
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(false);
    const logoInputRef = useRef(null);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) setCompany((c) => ({ ...c, ...JSON.parse(raw) }));
        } catch (e) { /* ignore corrupt storage */ }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(company));
        } catch (e) { /* storage full or unavailable — non-fatal */ }
    }, [company]);

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

    const updateItem = (idx, field, val) => setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: val } : it)));
    const addItem = () => { if (items.length < maxItems) setItems((prev) => [...prev, emptyItem()]); };
    const removeItem = (idx) => setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));

    const onLogoChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 1_500_000) { setErrors(['Logo image is too large — please use a file under 1.5MB.']); return; }
        const reader = new FileReader();
        reader.onload = () => setCompany((c) => ({ ...c, logo_base64: reader.result }));
        reader.readAsDataURL(file);
    };

    const generate = async () => {
        setErrors([]);
        if (!company.name.trim()) { setErrors(['Your company name is required. Click "Your business name" on the invoice above.']); return; }
        if (!client.name.trim()) { setErrors(['A client name is required. Click "Client name" on the invoice above.']); return; }
        if (!items.some((it) => it.description.trim())) { setErrors(['Add at least one line item with a description.']); return; }

        setLoading(true);
        try {
            const res = await fetch(route('tools.invoice.render'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
                    Accept: 'application/json',
                },
                body: JSON.stringify({ company, client, items, meta: { ...meta, orientation: 'portrait' } }),
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                setErrors(body.errors || ['Could not generate that invoice. Please check your entries and try again.']);
                setLoading(false);
                return;
            }

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `invoice-${(meta.invoice_number || 'draft').replace(/[^A-Za-z0-9-]/g, '')}.pdf`;
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

    const templateOptions = Object.entries(templates).map(([key, t]) => ({ value: key, label: t.name, hint: t.description }));
    const currencyOptions = Object.entries(currencies).map(([code, sym]) => ({ value: code, label: `${code} (${sym})` }));

    const accent = meta.template === 'modern' ? meta.accent_color : '#0f172a';
    const isModern = meta.template === 'modern';
    const isClassic = meta.template === 'classic';
    const isCompact = meta.template === 'compact';

    return (
        <ToolShell
            title="Free Invoice Generator — PDF, No Watermark | VenQore"
            metaDescription="Create a professional PDF invoice free online. Multiple templates, multi-currency, per-line tax and discounts. No signup, no watermark, unlimited invoices."
            eyebrow="Free Tools"
            h1="Free Invoice Generator"
            answer="Edit the invoice below exactly as it will look in your PDF — click any field to change it. Four templates, ten currencies, per-line tax and discounts, no signup, no limit on how many you generate."
            toolGroups={toolGroups}
            currentSlug="invoice-generator"
            faqs={FAQS}
            cta={{ headline: 'Invoicing is one piece of running a store.', subtext: 'VenQore turns every sale into a balanced double-entry journal automatically — invoices included.' }}
            related={[{ href: '/tools/barcode-generator', label: 'Barcode Generator' }]}
            wide
        >
            {errors.length > 0 && (
                <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2.5">
                    <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                    <div className="text-sm text-red-600 dark:text-red-400">{errors.map((e, i) => <p key={i}>{e}</p>)}</div>
                </div>
            )}

            {/* Slim control bar — everything that ISN'T part of the document itself */}
            <div className="flex flex-wrap items-center gap-3 mb-5 p-3 rounded-2xl bg-slate-900/[0.02] dark:bg-white/[0.03] border border-slate-900/[0.06] dark:border-white/10">
                <div className="w-40">
                    <Select value={meta.template} onChange={(v) => setMeta((m) => ({ ...m, template: v }))} options={templateOptions} />
                </div>
                <div className="w-36">
                    <Select value={meta.currency} onChange={(v) => setMeta((m) => ({ ...m, currency: v }))} options={currencyOptions} />
                </div>
                <div className="flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/10">
                    <button type="button" onClick={() => setMeta((m) => ({ ...m, orientation: 'portrait' }))}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${meta.orientation === 'portrait' ? 'bg-slate-900 text-white dark:bg-white dark:text-[#05030f]' : 'text-slate-500 dark:text-slate-400'}`}>
                        Portrait
                    </button>
                    <button type="button" onClick={() => setMeta((m) => ({ ...m, orientation: 'landscape' }))}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${meta.orientation === 'landscape' ? 'bg-slate-900 text-white dark:bg-white dark:text-[#05030f]' : 'text-slate-500 dark:text-slate-400'}`}>
                        Landscape
                    </button>
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
                    <button type="button" onClick={() => setCompany((c) => ({ ...c, logo_base64: null }))} className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors">
                        Remove logo
                    </button>
                )}
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={onLogoChange} />

                <div className="ml-auto flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 dark:text-slate-600 hidden sm:inline">Saved in your browser — nothing sent until you download</span>
                    <button
                        type="button"
                        onClick={generate}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-[#05030f] rounded-xl text-xs font-black uppercase tracking-wide hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100"
                    >
                        {loading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                        {loading ? 'Generating…' : 'Download PDF'}
                    </button>
                </div>
            </div>

            {meta.orientation === 'landscape' && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mb-3 -mt-2">
                    Landscape printing is not yet supported for downloads — this previews the layout only. Your PDF will download in portrait.
                </p>
            )}

            {/* THE DOCUMENT — this is the editor */}
            <div className={`rounded-2xl overflow-hidden shadow-xl shadow-slate-900/10 dark:shadow-black/40 border border-slate-900/10 dark:border-white/10 bg-white mx-auto transition-[max-width] ${meta.orientation === 'landscape' ? 'max-w-4xl' : 'max-w-2xl'}`}>
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
                                inline={false}
                                className="text-lg font-bold mb-0.5"
                            />
                            <EditableText
                                value={company.address}
                                onChange={(v) => setCompany((c) => ({ ...c, address: v }))}
                                placeholder="Business address"
                                as="textarea" rows={2}
                                inline={false}
                                className="text-slate-500 text-xs mt-1 mb-0.5 max-w-xs"
                            />
                            <div className="flex flex-wrap gap-x-3 text-xs text-slate-500 mt-1">
                                <EditableText value={company.email} onChange={(v) => setCompany((c) => ({ ...c, email: v }))} placeholder="email@business.com" />
                                <EditableText value={company.phone} onChange={(v) => setCompany((c) => ({ ...c, phone: v }))} placeholder="Phone number" />
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                                Tax ID: <EditableText value={company.tax_id} onChange={(v) => setCompany((c) => ({ ...c, tax_id: v }))} placeholder="optional" />
                            </div>
                        </div>
                        <div className="text-left sm:text-right">
                            <div className="text-2xl font-black tracking-tight" style={{ color: isModern ? accent : '#0f172a' }}>INVOICE</div>
                            <div className="mt-2 text-xs space-y-0.5">
                                <div className="flex sm:justify-end gap-2"><span className="text-slate-400">Invoice #</span><EditableText value={meta.invoice_number} onChange={(v) => setMeta((m) => ({ ...m, invoice_number: v }))} className="font-bold" /></div>
                                <div className="flex sm:justify-end gap-2"><span className="text-slate-400">Issue date</span><EditableText as="date" value={meta.issue_date} onChange={(v) => setMeta((m) => ({ ...m, issue_date: v }))} /></div>
                                <div className="flex sm:justify-end gap-2"><span className="text-slate-400">Due date</span><EditableText as="date" value={meta.due_date} onChange={(v) => setMeta((m) => ({ ...m, due_date: v }))} emptyLabel="—" /></div>
                            </div>
                        </div>
                    </div>

                    {/* Bill to */}
                    <div className="mb-6">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Bill To</p>
                        <EditableText value={client.name} onChange={(v) => setClient((c) => ({ ...c, name: v }))} placeholder="Client name" inline={false} className="font-bold mb-0.5" />
                        <EditableText value={client.address} onChange={(v) => setClient((c) => ({ ...c, address: v }))} placeholder="Client address" as="textarea" rows={2} inline={false} className="text-slate-500 text-xs mb-0.5" />
                        <EditableText value={client.email} onChange={(v) => setClient((c) => ({ ...c, email: v }))} placeholder="Client email (optional)" inline={false} className="text-slate-500 text-xs" />
                    </div>

                    {/* Line items */}
                    <table className="w-full mb-2">
                        <thead>
                            <tr className={`text-left text-[10px] font-bold uppercase tracking-wide text-slate-400 ${isClassic ? 'border-b-2 border-slate-900' : 'border-b border-slate-900'}`}>
                                <th className="pb-2 pr-2">
                                    <EditableText value={headers.description} onChange={(v) => setHeaders((h) => ({ ...h, description: v }))} pulse={false} className="text-[10px] font-bold uppercase tracking-wide text-slate-400" />
                                </th>
                                <th className="pb-2 px-2 text-right w-16">
                                    <EditableText value={headers.quantity} onChange={(v) => setHeaders((h) => ({ ...h, quantity: v }))} pulse={false} className="text-[10px] font-bold uppercase tracking-wide text-slate-400 text-right" />
                                </th>
                                <th className="pb-2 px-2 text-right w-24">
                                    <EditableText value={headers.unit_price} onChange={(v) => setHeaders((h) => ({ ...h, unit_price: v }))} pulse={false} className="text-[10px] font-bold uppercase tracking-wide text-slate-400 text-right" />
                                </th>
                                <th className="pb-2 px-2 text-right w-16">
                                    <EditableText value={headers.discount} onChange={(v) => setHeaders((h) => ({ ...h, discount: v }))} pulse={false} className="text-[10px] font-bold uppercase tracking-wide text-slate-400 text-right" />
                                </th>
                                <th className="pb-2 px-2 text-right w-16">
                                    <EditableText value={headers.tax} onChange={(v) => setHeaders((h) => ({ ...h, tax: v }))} pulse={false} className="text-[10px] font-bold uppercase tracking-wide text-slate-400 text-right" />
                                </th>
                                <th className="pb-2 pl-2 text-right w-24">
                                    <EditableText value={headers.amount} onChange={(v) => setHeaders((h) => ({ ...h, amount: v }))} pulse={false} className="text-[10px] font-bold uppercase tracking-wide text-slate-400 text-right" />
                                </th>
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
                                        <button type="button" onClick={() => removeItem(idx)} disabled={items.length === 1} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 disabled:opacity-0 transition-opacity">
                                            <Trash2 size={13} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <button type="button" onClick={addItem} disabled={items.length >= maxItems} className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-indigo-500 disabled:opacity-40 transition-colors mb-6">
                        <Plus size={12} /> Add line item
                    </button>

                    {/* Totals */}
                    <div className="flex justify-end mb-8">
                        <div className="w-56 space-y-1 text-sm">
                            <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>{fmtMoney(totals.subtotal)}</span></div>
                            {totals.discount > 0 && <div className="flex justify-between text-slate-500"><span>Discount</span><span>-{fmtMoney(totals.discount)}</span></div>}
                            {totals.tax > 0 && <div className="flex justify-between text-slate-500"><span>Tax</span><span>{fmtMoney(totals.tax)}</span></div>}
                            <div className="flex justify-between font-black text-base pt-1.5 border-t-2 border-slate-900" style={{ color: isModern ? accent : '#0f172a' }}>
                                <span>Total Due</span><span>{fmtMoney(grandTotal)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Notes / terms */}
                    <div className="grid sm:grid-cols-2 gap-6 text-xs text-slate-500">
                        <div>
                            <p className="font-bold text-slate-700 mb-1">Notes</p>
                            <EditableText value={meta.notes} onChange={(v) => setMeta((m) => ({ ...m, notes: v }))} placeholder="Add a note (optional)" as="textarea" rows={2} className="block" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-700 mb-1">Payment Terms</p>
                            <EditableText value={meta.terms} onChange={(v) => setMeta((m) => ({ ...m, terms: v }))} placeholder="e.g. Net 14" as="textarea" rows={2} className="block" />
                        </div>
                    </div>

                    <p className="text-center text-[10px] text-slate-300 mt-10">Generated free at venqore.com/tools — no signup, no watermark, no expiry.</p>
                </div>
            </div>

            <p className="text-center text-xs text-slate-400 dark:text-slate-600 mt-4">
                This preview matches your downloaded PDF exactly — click anything above to edit it.
            </p>
        </ToolShell>
    );
}

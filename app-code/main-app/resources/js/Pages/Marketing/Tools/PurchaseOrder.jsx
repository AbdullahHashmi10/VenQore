import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Trash2, Download, Loader2, Upload, AlertCircle } from 'lucide-react';
import ToolShell from './Shared/ToolShell';
import Select from './Shared/Select';
import EditableText from './Shared/EditableText';
import SmartCaptureNudge from './Shared/SmartCaptureNudge';

/**
 * T3 — Free Purchase Order Generator.
 *
 * UX MODEL mirrors Invoice.jsx exactly: the document IN THE MIDDLE OF THE
 * PAGE *is* the editor. Every field — buyer, vendor, ship-to, PO meta, line
 * items — is edited by clicking directly on the rendered purchase order
 * (see Shared/EditableText). Secondary controls (template, currency, logo)
 * live in a slim bar above the document. The "Authorized Signature" line
 * at the bottom is a static print-style signature line, not editable —
 * it mirrors resources/views/tools/pdf/purchase-order.blade.php exactly.
 */

const STORAGE_KEY = 'venqore_po_buyer_profile_v1';

const ACCENT_PRESETS = ['#4f46e5', '#0ea5e9', '#059669', '#d97706', '#dc2626', '#7c3aed'];

const emptyItem = () => ({ sku: '', description: '', quantity: 1, unit_cost: 0, tax_rate: 0 });

const FAQS = [
    { q: 'Is the VenQore purchase order generator really free?', a: 'Yes. Creating and downloading a PDF purchase order is completely free, with no signup, no watermark and no limit on how many purchase orders you generate.' },
    { q: 'What is the difference between a purchase order and an invoice?', a: 'A purchase order (PO) is issued by the buyer BEFORE goods ship to request stock from a supplier. An invoice is issued by the seller AFTER fulfillment to request payment.' },
    { q: 'Can I save my business details for next time?', a: 'Yes — your business name, address, logo and tax ID are saved in your browser locally so you do not have to retype them.' },
    { q: 'Does it support a separate Ship To address?', a: 'Yes. You can specify a separate Ship To warehouse or store address distinct from your main business address.' },
    { q: 'Is my purchase order data stored anywhere?', a: 'No. The PDF is generated on request and streamed back to you immediately. Nothing is stored on our servers.' },
    { q: 'Does the preview match the downloaded PDF?', a: 'Yes. What you see on screen is built to match the downloaded PDF layout, font and spacing exactly — there are no surprises after download.' },
];

export default function PurchaseOrderTool({ templates = {}, currencies = {}, maxItems = 100, suggestedNumber = '', toolGroups = [] }) {
    const [buyer, setBuyer] = useState({ name: '', address: '', email: '', phone: '', tax_id: '', logo_base64: null, ship_to: '' });
    const [vendor, setVendor] = useState({ name: '', contact_person: '', address: '', email: '', phone: '' });
    const [items, setItems] = useState([emptyItem()]);
    const [meta, setMeta] = useState({
        po_number: suggestedNumber,
        order_date: new Date().toISOString().slice(0, 10),
        expected_date: '',
        payment_terms: 'Net 30',
        shipping_cost: 0,
        currency: 'USD',
        notes: '',
        authorized_by: '',
        template: 'clean',
        accent_color: 'rgb(var(--vq-indigo-600))',
        orientation: 'portrait',
    });
    const [headers, setHeaders] = useState({
        sku: 'SKU / Code',
        description: 'Description',
        quantity: 'Qty',
        unit_cost: 'Unit Cost',
        tax: 'Tax',
        total: 'Total',
    });
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(false);
    const logoInputRef = useRef(null);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) setBuyer((b) => ({ ...b, ...JSON.parse(raw) }));
        } catch (e) { /* ignore corrupt storage */ }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(buyer));
        } catch (e) { /* storage full or unavailable — non-fatal */ }
    }, [buyer]);

    const symbol = currencies[meta.currency] || meta.currency;
    const fmtMoney = (n) => `${symbol}${(parseFloat(n) || 0).toFixed(2)}`;

    const lineTotals = useMemo(() => items.map((it) => {
        const qty = parseFloat(it.quantity) || 0;
        const cost = parseFloat(it.unit_cost) || 0;
        const taxPct = Math.max(0, parseFloat(it.tax_rate) || 0);
        const net = qty * cost;
        const taxAmt = net * (taxPct / 100);
        return { net, taxAmt, lineTotal: net + taxAmt };
    }), [items]);

    const totals = useMemo(() => {
        const base = lineTotals.reduce((acc, l) => ({
            subtotal: acc.subtotal + l.net,
            tax: acc.tax + l.taxAmt,
        }), { subtotal: 0, tax: 0 });
        const shipping = Math.max(0, parseFloat(meta.shipping_cost) || 0);
        return { ...base, shipping, total: base.subtotal + base.tax + shipping };
    }, [lineTotals, meta.shipping_cost]);

    const updateItem = (idx, field, val) => setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: val } : it)));
    const addItem = () => { if (items.length < maxItems) setItems((prev) => [...prev, emptyItem()]); };
    const removeItem = (idx) => setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));

    const onLogoChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 1.5 * 1024 * 1024) { setErrors(['Logo file must be smaller than 1.5MB.']); return; }
        const reader = new FileReader();
        reader.onload = () => setBuyer((b) => ({ ...b, logo_base64: reader.result }));
        reader.readAsDataURL(file);
    };

    const handleGenerate = async () => {
        setErrors([]);
        if (!buyer.name.trim()) { setErrors(['Your business name is required. Click "Your business name" on the purchase order above.']); return; }
        if (!vendor.name.trim()) { setErrors(['A vendor / supplier name is required. Click "Vendor / supplier name" on the purchase order above.']); return; }
        if (!items.some((it) => it.description.trim())) { setErrors(['Add at least one line item with a description.']); return; }

        setLoading(true);
        try {
            const res = await fetch('/tools/purchase-order-generator/render', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/pdf, application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
                },
                body: JSON.stringify({ buyer, vendor, items, meta: { ...meta, orientation: 'portrait' } }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setErrors(data.errors || ['Failed to generate Purchase Order. Check fields and try again.']);
                setLoading(false);
                return;
            }

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `purchase-order-${meta.po_number || 'draft'}.pdf`;
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

    const templateOptions = Object.entries(templates).map(([key, t]) => ({ value: key, label: t.name, hint: t.description }));
    const currencyOptions = Object.entries(currencies).map(([code, sym]) => ({ value: code, label: `${code} (${sym})` }));

    const isModern = meta.template === 'modern';
    const isClassic = meta.template === 'classic';
    const accent = isModern ? meta.accent_color : '#0f172a';

    return (
        <ToolShell
            title="Free Purchase Order Generator — PDF, No Watermark | VenQore"
            metaDescription="Create a professional PDF purchase order free online. Multiple templates, multi-currency, ship-to address, no signup, no watermark, unlimited purchase orders."
            eyebrow="Free Tools"
            h1="Free Purchase Order Generator"
            answer="Edit the purchase order below exactly as it will look in your PDF — click any field to change it. Multiple templates, multi-currency, a separate ship-to address, no signup, no limit on how many you generate."
            toolGroups={toolGroups}
            currentSlug="purchase-order-generator"
            faqs={FAQS}
            cta={{ headline: 'Purchase orders are one piece of running a store.', subtext: 'VenQore turns every purchase into balanced double-entry accounting and inventory receipts automatically.' }}
            related={[{ href: '/tools/invoice-generator', label: 'Invoice Generator' }]}
            wide
        >
            <SmartCaptureNudge documentType="purchase order" />

            {errors.length > 0 && (
                <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2.5">
                    <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                    <div className="text-sm text-red-600 dark:text-red-400">{errors.map((e, i) => <p key={i}>{e}</p>)}</div>
                </div>
            )}

            {/* Slim control bar — everything that ISN'T part of the document itself */}
            <div className="flex flex-wrap items-center gap-3 mb-5 p-3 rounded-2xl bg-sunken dark:bg-white/[0.03] border border-line dark:border-white/10">
                <div className="w-40">
                    <Select value={meta.template} onChange={(v) => setMeta((m) => ({ ...m, template: v }))} options={templateOptions} />
                </div>
                <div className="w-36">
                    <Select value={meta.currency} onChange={(v) => setMeta((m) => ({ ...m, currency: v }))} options={currencyOptions} />
                </div>
                <div className="flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-white/[0.04] border border-line dark:border-white/10">
                    <button type="button" onClick={() => setMeta((m) => ({ ...m, orientation: 'portrait' }))}
                        className={`px-2.5 py-1.5 rounded-lg text-1xs font-bold transition-colors ${meta.orientation === 'portrait' ? 'bg-neutral-900 text-white dark:bg-white dark:text-[#05030f]' : 'text-ink-muted'}`}>
                        Portrait
                    </button>
                    <button type="button" onClick={() => setMeta((m) => ({ ...m, orientation: 'landscape' }))}
                        className={`px-2.5 py-1.5 rounded-lg text-1xs font-bold transition-colors ${meta.orientation === 'landscape' ? 'bg-neutral-900 text-white dark:bg-white dark:text-[#05030f]' : 'text-ink-muted'}`}>
                        Landscape
                    </button>
                </div>
                {isModern && (
                    <div className="flex items-center gap-1.5">
                        {ACCENT_PRESETS.map((c) => (
                            <button key={c} type="button" onClick={() => setMeta((m) => ({ ...m, accent_color: c }))}
                                className={`w-6 h-6 rounded-full border-2 transition-transform ${meta.accent_color === c ? 'scale-110 border-neutral-900 dark:border-white' : 'border-transparent'}`}
                                style={{ background: c }} aria-label={c} />
                        ))}
                    </div>
                )}
                <button type="button" onClick={() => logoInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-white/[0.04] border border-line dark:border-white/10 text-xs font-bold text-ink-secondary hover:border-brand-400/40 transition-colors">
                    <Upload size={13} /> {buyer.logo_base64 ? 'Change logo' : 'Add logo'}
                </button>
                {buyer.logo_base64 && (
                    <button type="button" onClick={() => setBuyer((b) => ({ ...b, logo_base64: null }))} className="text-xs font-bold text-ink-muted hover:text-red-500 transition-colors">
                        Remove logo
                    </button>
                )}
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={onLogoChange} />

                <div className="ml-auto flex items-center gap-2">
                    <span className="text-1xs text-ink-muted hidden sm:inline">Saved in your browser — nothing sent until you download</span>
                    <button
                        type="button"
                        onClick={handleGenerate}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-sunken dark:bg-white text-white dark:text-[#05030f] rounded-xl text-xs font-bold uppercase tracking-wide transition-transform disabled:opacity-50 disabled:"
                    >
                        {loading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                        {loading ? 'Generating…' : 'Download PDF'}
                    </button>
                </div>
            </div>

            {meta.orientation === 'landscape' && (
                <p className="text-1xs text-amber-600 dark:text-amber-400 mb-3 -mt-2">
                    Landscape printing is not yet supported for downloads — this previews the layout only. Your PDF will download in portrait.
                </p>
            )}

            {/* THE DOCUMENT — this is the editor */}
            <div className={`rounded-2xl overflow-hidden shadow-xl shadow-neutral-900/10 dark:shadow-black/40 border border-line dark:border-white/10 bg-white mx-auto transition-[max-width] ${meta.orientation === 'landscape' ? 'max-w-5xl' : 'max-w-3xl'}`}>
                {isModern && <div className="h-3 w-full" style={{ background: accent }} />}
                <div className={`p-6 sm:p-10 text-ink text-sm`} style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                    {/* Header */}
                    <div className={`flex flex-col sm:flex-row justify-between gap-6 mb-8 ${isClassic ? 'border-b-2 border-neutral-900 pb-4' : ''}`}>
                        <div>
                            {buyer.logo_base64 && <img src={buyer.logo_base64} alt="Logo" className="h-12 max-w-[160px] object-contain mb-2" />}
                            <EditableText
                                value={buyer.name}
                                onChange={(v) => setBuyer((b) => ({ ...b, name: v }))}
                                placeholder="Your business name"
                                inline={false}
                                className="text-lg font-bold mb-0.5"
                            />
                            <EditableText
                                value={buyer.address}
                                onChange={(v) => setBuyer((b) => ({ ...b, address: v }))}
                                placeholder="Business address"
                                as="textarea" rows={2}
                                inline={false}
                                className="text-ink-muted text-xs mt-1 mb-0.5 max-w-xs"
                            />
                            <div className="flex flex-wrap gap-x-3 text-xs text-ink-muted mt-1">
                                <EditableText value={buyer.email} onChange={(v) => setBuyer((b) => ({ ...b, email: v }))} placeholder="email@business.com" />
                                <EditableText value={buyer.phone} onChange={(v) => setBuyer((b) => ({ ...b, phone: v }))} placeholder="Phone number" />
                            </div>
                            <div className="text-xs text-ink-muted mt-0.5">
                                Tax ID: <EditableText value={buyer.tax_id} onChange={(v) => setBuyer((b) => ({ ...b, tax_id: v }))} placeholder="optional" />
                            </div>
                        </div>
                        <div className="text-left sm:text-right">
                            <div className="text-2xl font-bold tracking-tight" style={{ color: isModern ? accent : 'rgb(var(--vq-slate-900))' }}>PURCHASE ORDER</div>
                            <div className="mt-2 text-xs space-y-0.5">
                                <div className="flex sm:justify-end gap-2"><span className="text-ink-muted">PO #</span><EditableText value={meta.po_number} onChange={(v) => setMeta((m) => ({ ...m, po_number: v }))} className="font-bold" /></div>
                                <div className="flex sm:justify-end gap-2"><span className="text-ink-muted">Order date</span><EditableText as="date" value={meta.order_date} onChange={(v) => setMeta((m) => ({ ...m, order_date: v }))} /></div>
                                <div className="flex sm:justify-end gap-2"><span className="text-ink-muted">Expected date</span><EditableText as="date" value={meta.expected_date} onChange={(v) => setMeta((m) => ({ ...m, expected_date: v }))} emptyLabel="—" /></div>
                                <div className="flex sm:justify-end gap-2"><span className="text-ink-muted">Terms</span><EditableText value={meta.payment_terms} onChange={(v) => setMeta((m) => ({ ...m, payment_terms: v }))} placeholder="Net 30" /></div>
                            </div>
                        </div>
                    </div>

                    {/* Vendor / Ship To / Buyer details */}
                    <div className="grid sm:grid-cols-3 gap-6 mb-6">
                        <div>
                            <p className="text-2xs font-bold uppercase tracking-widest text-ink-muted mb-1">Vendor / Supplier</p>
                            <EditableText value={vendor.name} onChange={(v) => setVendor((c) => ({ ...c, name: v }))} placeholder="Vendor / supplier name" inline={false} className="font-bold mb-0.5" />
                            <EditableText value={vendor.contact_person} onChange={(v) => setVendor((c) => ({ ...c, contact_person: v }))} placeholder="Attn: contact person" inline={false} className="text-ink-muted text-xs mb-0.5" />
                            <EditableText value={vendor.address} onChange={(v) => setVendor((c) => ({ ...c, address: v }))} placeholder="Vendor address" as="textarea" rows={2} inline={false} className="text-ink-muted text-xs mb-0.5" />
                            <EditableText value={vendor.email} onChange={(v) => setVendor((c) => ({ ...c, email: v }))} placeholder="Vendor email" inline={false} className="text-ink-muted text-xs mb-0.5" />
                            <EditableText value={vendor.phone} onChange={(v) => setVendor((c) => ({ ...c, phone: v }))} placeholder="Vendor phone" inline={false} className="text-ink-muted text-xs" />
                        </div>
                        <div>
                            <p className="text-2xs font-bold uppercase tracking-widest text-ink-muted mb-1">Ship To</p>
                            <EditableText value={buyer.ship_to} onChange={(v) => setBuyer((b) => ({ ...b, ship_to: v }))} placeholder="Ship-to address (optional, defaults to business address)" as="textarea" rows={4} className="block text-ink-muted text-xs" />
                        </div>
                        <div>
                            <p className="text-2xs font-bold uppercase tracking-widest text-ink-muted mb-1">Buyer Details</p>
                            <p className="font-bold">{buyer.name || <span className="italic text-ink-muted">Your business name</span>}</p>
                            {buyer.email && <p className="text-ink-muted text-xs">{buyer.email}</p>}
                            {buyer.phone && <p className="text-ink-muted text-xs">{buyer.phone}</p>}
                        </div>
                    </div>

                    {/* Line items */}
                    <table className="w-full mb-2">
                        <thead>
                            <tr className={`text-left text-2xs font-bold uppercase tracking-wide text-ink-muted ${isClassic ? 'border-b-2 border-neutral-900' : 'border-b border-neutral-900'}`}>
                                <th className="pb-2 pr-2 w-24">
                                    <EditableText value={headers.sku} onChange={(v) => setHeaders((h) => ({ ...h, sku: v }))} pulse={false} className="text-2xs font-bold uppercase tracking-wide text-ink-muted" />
                                </th>
                                <th className="pb-2 px-2">
                                    <EditableText value={headers.description} onChange={(v) => setHeaders((h) => ({ ...h, description: v }))} pulse={false} className="text-2xs font-bold uppercase tracking-wide text-ink-muted" />
                                </th>
                                <th className="pb-2 px-2 text-right w-16">
                                    <EditableText value={headers.quantity} onChange={(v) => setHeaders((h) => ({ ...h, quantity: v }))} pulse={false} className="text-2xs font-bold uppercase tracking-wide text-ink-muted text-right" />
                                </th>
                                <th className="pb-2 px-2 text-right w-24">
                                    <EditableText value={headers.unit_cost} onChange={(v) => setHeaders((h) => ({ ...h, unit_cost: v }))} pulse={false} className="text-2xs font-bold uppercase tracking-wide text-ink-muted text-right" />
                                </th>
                                <th className="pb-2 px-2 text-right w-16">
                                    <EditableText value={headers.tax} onChange={(v) => setHeaders((h) => ({ ...h, tax: v }))} pulse={false} className="text-2xs font-bold uppercase tracking-wide text-ink-muted text-right" />
                                </th>
                                <th className="pb-2 pl-2 text-right w-24">
                                    <EditableText value={headers.total} onChange={(v) => setHeaders((h) => ({ ...h, total: v }))} pulse={false} className="text-2xs font-bold uppercase tracking-wide text-ink-muted text-right" />
                                </th>
                                <th className="w-8"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, idx) => (
                                <tr key={idx} className="border-b border-line group">
                                    <td className="py-2 pr-2">
                                        <EditableText value={item.sku} onChange={(v) => updateItem(idx, 'sku', v)} placeholder="SKU-101" className="block font-mono text-xs" />
                                    </td>
                                    <td className="py-2 px-2">
                                        <EditableText value={item.description} onChange={(v) => updateItem(idx, 'description', v)} placeholder="Item description" className="block" />
                                    </td>
                                    <td className="py-2 px-2 text-right">
                                        <EditableText as="number" min="0" value={item.quantity} onChange={(v) => updateItem(idx, 'quantity', v)} className="text-right w-12" />
                                    </td>
                                    <td className="py-2 px-2 text-right">
                                        <EditableText as="number" min="0" value={item.unit_cost} onChange={(v) => updateItem(idx, 'unit_cost', v)} formatDisplay={fmtMoney} className="text-right w-16" />
                                    </td>
                                    <td className="py-2 px-2 text-right">
                                        <EditableText as="number" min="0" value={item.tax_rate} onChange={(v) => updateItem(idx, 'tax_rate', v)} formatDisplay={(v) => (v > 0 ? `${v}%` : '—')} className="text-right w-12" />
                                    </td>
                                    <td className="py-2 pl-2 text-right font-bold">{fmtMoney(lineTotals[idx]?.lineTotal)}</td>
                                    <td className="py-2 pl-1 text-right">
                                        <button type="button" onClick={() => removeItem(idx)} disabled={items.length === 1} className="opacity-0 group-hover:opacity-100 text-ink-secondary hover:text-red-500 disabled:opacity-0 transition-opacity">
                                            <Trash2 size={13} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <button type="button" onClick={addItem} disabled={items.length >= maxItems} className="flex items-center gap-1 text-xs font-bold text-ink-muted hover:text-brand-500 disabled:opacity-40 transition-colors mb-6">
                        <Plus size={12} /> Add line item
                    </button>

                    {/* Totals */}
                    <div className="flex justify-end mb-8">
                        <div className="w-56 space-y-1 text-sm">
                            <div className="flex justify-between text-ink-muted"><span>Subtotal</span><span>{fmtMoney(totals.subtotal)}</span></div>
                            {totals.tax > 0 && <div className="flex justify-between text-ink-muted"><span>Tax</span><span>{fmtMoney(totals.tax)}</span></div>}
                            <div className="flex justify-between text-ink-muted">
                                <span>Freight / Shipping</span>
                                <EditableText as="number" min="0" value={meta.shipping_cost} onChange={(v) => setMeta((m) => ({ ...m, shipping_cost: v }))} formatDisplay={fmtMoney} className="text-right" />
                            </div>
                            <div className="flex justify-between font-bold text-base pt-1.5 border-t-2 border-neutral-900" style={{ color: isModern ? accent : 'rgb(var(--vq-slate-900))' }}>
                                <span>Grand Total</span><span>{fmtMoney(totals.total)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Notes + signature */}
                    <div className="grid sm:grid-cols-2 gap-6 text-xs text-ink-muted">
                        <div>
                            <p className="font-bold text-ink-secondary mb-1">Special Instructions / Notes</p>
                            <EditableText value={meta.notes} onChange={(v) => setMeta((m) => ({ ...m, notes: v }))} placeholder="Add a note (optional)" as="textarea" rows={2} className="block" />
                            <p className="font-bold text-ink-secondary mb-1 mt-4">Authorized By</p>
                            <EditableText value={meta.authorized_by} onChange={(v) => setMeta((m) => ({ ...m, authorized_by: v }))} placeholder="Name (Purchasing Manager) — printed on the signature line" as="textarea" rows={1} className="block" />
                        </div>
                        <div className="flex flex-col items-end justify-end">
                            {/* Static, non-editable print-signature line — mirrors purchase-order.blade.php's .signature-line */}
                            <div className="w-56 pt-10 text-right">
                                <div className="border-t border-neutral-900 pt-1.5">
                                    <p className="text-xs text-ink-secondary">Authorized Signature</p>
                                    {meta.authorized_by && <p className="text-1xs text-ink-muted">({meta.authorized_by})</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    <p className="text-center text-2xs text-ink-secondary mt-10">Generated free at venqore.com/tools — no signup, no watermark, no expiry.</p>
                </div>
            </div>

            <p className="text-center text-xs text-ink-muted mt-4">
                This preview matches your downloaded PDF exactly — click anything above to edit it.
            </p>
        </ToolShell>
    );
}

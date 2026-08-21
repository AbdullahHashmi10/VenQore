import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Trash2, Download, Loader2, Upload, AlertCircle } from 'lucide-react';
import ToolShell from './Shared/ToolShell';
import Select from './Shared/Select';
import EditableText from './Shared/EditableText';
import SmartCaptureNudge from './Shared/SmartCaptureNudge';

/**
 * Free Receipt Generator.
 *
 * Free & ungated: no email required, no watermark, unlimited.
 * Persists store details to localStorage (venqore_receipt_store_profile_v1) as a client convenience.
 *
 * UX MODEL: mirrors Invoice.jsx — the document IN THE MIDDLE OF THE PAGE *is*
 * the editor. Every field (store name, address, phone, receipt number, date,
 * cashier, line items, tax, discount, payment method, cash tendered, returns
 * policy) is edited by clicking directly on the rendered receipt (see
 * Shared/EditableText). Secondary controls (paper size, currency, logo) live
 * in a slim bar above the document, matching Invoice.jsx's control bar.
 */

const STORAGE_KEY = 'venqore_receipt_store_profile_v1';

const emptyItem = () => ({ name: '', quantity: 1, unit_price: 0 });

const FAQS = [
    { q: 'Is the VenQore receipt generator really free?', a: 'Yes. Creating and downloading a PDF receipt is completely free, with no signup, no watermark and no limit on how many receipts you generate.' },
    { q: 'Can I print it on my thermal receipt printer?', a: 'Yes — select 80mm Thermal Roll paper preset and the PDF output is sized specifically for standard 80mm POS receipt roll printers.' },
    { q: 'What if I don\'t have a thermal printer?', a: 'Select the Standard Letter/A4 preset. It prints cleanly on any regular desktop printer or saves as a standard-sized PDF for digital record-keeping.' },
    { q: 'Can I show change due for cash payments?', a: 'Yes — select Cash as the payment method, type the amount tendered, and the generator automatically calculates and prints the change due on the receipt.' },
    { q: 'Can I set an overall tax rate and discount?', a: 'Yes. You can apply a single overall tax rate (%) and a single overall discount (either flat amount or percentage) to the total receipt.' },
    { q: 'Is my store or receipt data stored on your servers?', a: 'No. Everything is processed live to generate your PDF and streamed back. Your store profile is saved strictly in your browser\'s localStorage.' },
    { q: 'Does the preview match the downloaded PDF?', a: 'Yes. The on-screen receipt mirrors the layout, fields and thermal-vs-Letter sizing of the actual downloaded PDF, so what you see before you click Download is what you get.' },
];

export default function ReceiptTool({ paperPresets = {}, paymentMethods = [], currencies = {}, maxItems = 100, suggestedNumber = '', toolGroups = [] }) {
    const [store, setStore] = useState({ name: '', address: '', phone: '', logo_base64: null, footer_message: 'Thank you for shopping with us!' });
    const [items, setItems] = useState([emptyItem()]);
    const [meta, setMeta] = useState({
        receipt_number: suggestedNumber,
        date_time: new Date().toISOString().slice(0, 16).replace('T', ' '),
        cashier: '',
        returns_policy_days: 30,
        paper_preset: 'thermal_80mm',
        currency: 'USD',
        payment_method: 'Cash',
        amount_tendered: 0,
        tax_rate: 0,
        discount_value: 0,
        discount_type: 'flat',
        orientation: 'portrait',
    });
    const [headers, setHeaders] = useState({
        item: 'Item',
        quantity: 'Qty',
        total: 'Total',
    });
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(false);
    const logoInputRef = useRef(null);

    // Load saved store profile
    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) setStore((s) => ({ ...s, ...JSON.parse(raw) }));
        } catch (e) { /* ignore corrupt storage */ }
    }, []);

    // Save store profile
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
        } catch (e) { /* ignore storage errors */ }
    }, [store]);

    const symbol = currencies[meta.currency] || meta.currency;
    const fmtMoney = (n) => `${symbol}${(parseFloat(n) || 0).toFixed(2)}`;

    const totals = useMemo(() => {
        let subtotal = 0;
        items.forEach((it) => {
            const qty = parseFloat(it.quantity) || 0;
            const price = parseFloat(it.unit_price) || 0;
            subtotal += qty * price;
        });

        const discVal = Math.max(0, parseFloat(meta.discount_value) || 0);
        let discount = 0;
        if (meta.discount_type === 'percent') {
            const discPct = Math.min(100, discVal);
            discount = subtotal * (discPct / 100);
        } else {
            discount = Math.min(subtotal, discVal);
        }

        const taxable = Math.max(0, subtotal - discount);
        const taxPct = Math.max(0, parseFloat(meta.tax_rate) || 0);
        const tax = taxable * (taxPct / 100);
        const total = taxable + tax;

        const tendered = parseFloat(meta.amount_tendered) || 0;
        const changeDue = meta.payment_method === 'Cash' ? Math.max(0, tendered - total) : 0;

        return { subtotal, discount, tax, total, changeDue };
    }, [items, meta.discount_value, meta.discount_type, meta.tax_rate, meta.amount_tendered, meta.payment_method]);

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
        reader.onload = () => setStore((s) => ({ ...s, logo_base64: reader.result }));
        reader.readAsDataURL(file);
    };

    const generate = async () => {
        setErrors([]);
        if (!store.name.trim()) { setErrors(['Your store name is required. Click "Your store name" on the receipt above.']); return; }
        if (!items.some((it) => it.name.trim())) { setErrors(['Add at least one line item with a product name.']); return; }

        setLoading(true);
        try {
            const res = await fetch(route('tools.receipt.render'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
                    Accept: 'application/json',
                },
                body: JSON.stringify({ store, items, meta: { ...meta, orientation: 'portrait' } }),
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                setErrors(body.errors || ['Could not generate that receipt. Please check your entries and try again.']);
                setLoading(false);
                return;
            }

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `receipt-${(meta.receipt_number || 'draft').replace(/[^A-Za-z0-9-]/g, '')}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch (e) {
            setErrors(['Something went wrong generating the PDF receipt. Please try again.']);
        } finally {
            setLoading(false);
        }
    };

    const presetOptions = Object.entries(paperPresets).map(([key, p]) => ({
        value: key, label: p.name, hint: p.description,
    }));
    const currencyOptions = Object.entries(currencies).map(([code, sym]) => ({
        value: code, label: `${code} (${sym})`,
    }));
    const paymentOptions = paymentMethods.map((m) => ({
        value: m, label: m,
    }));

    const isThermal = meta.paper_preset === 'thermal_80mm';

    return (
        <ToolShell
            title="Free Receipt Generator — POS & Thermal PDF | VenQore"
            metaDescription="Create a free POS receipt PDF for 80mm thermal printers or A4 records. Overall tax, discount, cash change due calculation. Free, no watermark, no signup."
            eyebrow="Free Tools"
            h1="Free Receipt Generator"
            answer="Edit the receipt below exactly as it will look in your PDF — click any field to change it. Optimized for 80mm thermal receipt printers or Letter/A4 records, with overall tax, flat or percentage discount, cash change due calculations, and custom return notes."
            toolGroups={toolGroups}
            currentSlug="receipt-generator"
            faqs={FAQS}
            cta={{ headline: 'Tired of manually printing receipts?', subtext: 'VenQore POS automatically prints scannable thermal receipts with integrated inventory deduction on every sale.' }}
            related={[{ href: '/tools/invoice-generator', label: 'Invoice Generator' }, { href: '/tools/barcode-generator', label: 'Barcode Generator' }]}
            wide
        >
            <SmartCaptureNudge documentType="receipt" />

            {errors.length > 0 && (
                <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2.5">
                    <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                    <div className="text-sm text-red-600 dark:text-red-400">{errors.map((e, i) => <p key={i}>{e}</p>)}</div>
                </div>
            )}

            {/* Slim control bar — everything that ISN'T part of the document itself */}
            <div className="flex flex-wrap items-center gap-3 mb-5 p-3 rounded-2xl bg-sunken dark:bg-white/[0.03] border border-line dark:border-white/10">
                <div className="w-48">
                    <Select value={meta.paper_preset} onChange={(v) => setMeta((m) => ({ ...m, paper_preset: v }))} options={presetOptions} />
                </div>
                <div className="w-36">
                    <Select value={meta.currency} onChange={(v) => setMeta((m) => ({ ...m, currency: v }))} options={currencyOptions} />
                </div>
                <div className="w-36">
                    <Select value={meta.payment_method} onChange={(v) => setMeta((m) => ({ ...m, payment_method: v }))} options={paymentOptions} />
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
                <button type="button" onClick={() => logoInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-white/[0.04] border border-line dark:border-white/10 text-xs font-bold text-ink-secondary hover:border-brand-400/40 transition-colors">
                    <Upload size={13} /> {store.logo_base64 ? 'Change logo' : 'Add logo'}
                </button>
                {store.logo_base64 && (
                    <button type="button" onClick={() => setStore((s) => ({ ...s, logo_base64: null }))} className="text-xs font-bold text-ink-muted hover:text-red-500 transition-colors">
                        Remove logo
                    </button>
                )}
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={onLogoChange} />

                <div className="ml-auto flex items-center gap-2">
                    <span className="text-1xs text-ink-muted hidden sm:inline">Saved in your browser — nothing sent until you download</span>
                    <button
                        type="button"
                        onClick={generate}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-sunken dark:bg-white text-white dark:text-[#05030f] rounded-xl text-xs font-bold uppercase tracking-wide transition-transform disabled:opacity-50 disabled:"
                    >
                        {loading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                        {loading ? 'Generating…' : 'Download PDF'}
                    </button>
                </div>
            </div>

            {meta.orientation === 'landscape' && (
                <p className="text-1xs text-amber-600 dark:text-amber-400 mb-3 -mt-2 text-center">
                    Landscape printing is not yet supported for downloads — this previews the layout only. Your PDF will download in portrait.
                </p>
            )}

            {/* THE DOCUMENT — this is the editor */}
            <div className={`rounded-2xl overflow-hidden shadow-xl shadow-neutral-900/10 dark:shadow-black/40 border border-line dark:border-white/10 bg-white mx-auto transition-[max-width] ${meta.orientation === 'landscape' ? (isThermal ? 'max-w-md' : 'max-w-2xl') : (isThermal ? 'max-w-xs' : 'max-w-md')}`}>
                <div
                    className={`text-ink ${isThermal ? 'p-5 text-1xs font-mono' : 'p-8 text-xs'}`}
                    style={{ fontFamily: isThermal ? "'Courier New', Courier, monospace" : 'Helvetica, Arial, sans-serif' }}
                >
                    {store.logo_base64 && <img src={store.logo_base64} alt="Logo" className="h-12 max-w-[140px] object-contain mx-auto mb-2 block" />}

                    <EditableText
                        value={store.name}
                        onChange={(v) => setStore((s) => ({ ...s, name: v }))}
                        placeholder="Your store name"
                        inline={false}
                        className={`text-center font-bold uppercase mb-0.5 ${isThermal ? 'text-sm' : 'text-base'}`}
                    />
                    <EditableText
                        value={store.address}
                        onChange={(v) => setStore((s) => ({ ...s, address: v }))}
                        placeholder="Store address"
                        as="textarea" rows={1}
                        inline={false}
                        className="text-center text-ink-muted text-2xs mt-0.5 mb-0.5"
                    />
                    <div className="text-center text-ink-muted text-2xs mt-0.5">
                        Tel: <EditableText value={store.phone} onChange={(v) => setStore((s) => ({ ...s, phone: v }))} placeholder="Phone number" />
                    </div>

                    <div className="border-t border-dashed border-line my-2.5" />

                    <div className="flex justify-between text-2xs">
                        <span>
                            Receipt #: <EditableText value={meta.receipt_number} onChange={(v) => setMeta((m) => ({ ...m, receipt_number: v }))} className="font-bold" />
                        </span>
                        <EditableText value={meta.date_time} onChange={(v) => setMeta((m) => ({ ...m, date_time: v }))} className="text-right" />
                    </div>
                    <div className="text-2xs mt-0.5">
                        Cashier: <EditableText value={meta.cashier} onChange={(v) => setMeta((m) => ({ ...m, cashier: v }))} placeholder="optional" emptyLabel="—" />
                    </div>

                    <div className="border-t border-dashed border-line my-2.5" />

                    {/* Line items */}
                    <table className="w-full mb-1">
                        <thead>
                            <tr className="text-left text-3xs font-bold uppercase tracking-wide text-ink-muted border-b border-neutral-900">
                                <th className="pb-1 pr-1">
                                    <EditableText value={headers.item} onChange={(v) => setHeaders((h) => ({ ...h, item: v }))} pulse={false} className="text-3xs font-bold uppercase tracking-wide text-ink-muted" />
                                </th>
                                <th className="pb-1 px-1 text-right w-10">
                                    <EditableText value={headers.quantity} onChange={(v) => setHeaders((h) => ({ ...h, quantity: v }))} pulse={false} className="text-3xs font-bold uppercase tracking-wide text-ink-muted text-right" />
                                </th>
                                <th className="pb-1 pl-1 text-right w-16">
                                    <EditableText value={headers.total} onChange={(v) => setHeaders((h) => ({ ...h, total: v }))} pulse={false} className="text-3xs font-bold uppercase tracking-wide text-ink-muted text-right" />
                                </th>
                                <th className="w-4"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, idx) => {
                                const qty = parseFloat(item.quantity) || 0;
                                const price = parseFloat(item.unit_price) || 0;
                                const lineTotal = qty * price;
                                return (
                                    <tr key={idx} className="border-b border-line group align-top">
                                        <td className="py-1.5 pr-1">
                                            <EditableText value={item.name} onChange={(v) => updateItem(idx, 'name', v)} placeholder="Product name" className="block" />
                                            <div className="flex items-center gap-1 text-3xs text-ink-muted mt-0.5">
                                                <EditableText as="number" min="0" value={item.quantity} onChange={(v) => updateItem(idx, 'quantity', v)} className="w-8" />
                                                <span>@</span>
                                                <EditableText as="number" min="0" value={item.unit_price} onChange={(v) => updateItem(idx, 'unit_price', v)} formatDisplay={fmtMoney} className="w-12" />
                                            </div>
                                        </td>
                                        <td className="py-1.5 px-1 text-right">{qty}</td>
                                        <td className="py-1.5 pl-1 text-right font-bold">{fmtMoney(lineTotal)}</td>
                                        <td className="py-1.5 text-right">
                                            <button type="button" onClick={() => removeItem(idx)} disabled={items.length === 1} className="opacity-0 group-hover:opacity-100 text-ink-secondary hover:text-red-500 disabled:opacity-0 transition-opacity">
                                                <Trash2 size={11} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    <button type="button" onClick={addItem} disabled={items.length >= maxItems} className="flex items-center gap-1 text-2xs font-bold text-ink-muted hover:text-brand-500 disabled:opacity-40 transition-colors mb-2.5">
                        <Plus size={11} /> Add product
                    </button>

                    <div className="border-t border-dashed border-line my-2.5" />

                    {/* Totals */}
                    <div className="space-y-1 text-2xs">
                        <div className="flex justify-between">
                            <span>Subtotal</span><span>{fmtMoney(totals.subtotal)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>
                                Discount (
                                <EditableText as="number" min="0" value={meta.discount_value} onChange={(v) => setMeta((m) => ({ ...m, discount_value: v }))} className="w-8" />
                                {meta.discount_type === 'percent' ? '%' : symbol})
                            </span>
                            <span>-{fmtMoney(totals.discount)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>
                                Tax (
                                <EditableText as="number" min="0" max="100" value={meta.tax_rate} onChange={(v) => setMeta((m) => ({ ...m, tax_rate: v }))} className="w-8" />
                                %)
                            </span>
                            <span>{fmtMoney(totals.tax)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-xs pt-1.5 border-t border-neutral-900 border-b-2 border-double pb-1.5">
                            <span>TOTAL</span><span>{fmtMoney(totals.total)}</span>
                        </div>
                        <div className="flex justify-between pt-1">
                            <span>Payment Method</span><span>{meta.payment_method}</span>
                        </div>
                        {meta.payment_method === 'Cash' && (
                            <>
                                <div className="flex justify-between items-center">
                                    <span>Amount Tendered</span>
                                    <EditableText as="number" min="0" value={meta.amount_tendered} onChange={(v) => setMeta((m) => ({ ...m, amount_tendered: v }))} formatDisplay={fmtMoney} className="text-right" />
                                </div>
                                <div className="flex justify-between font-bold">
                                    <span>Change Due</span><span>{fmtMoney(totals.changeDue)}</span>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="border-t border-dashed border-line my-2.5" />

                    <div className="text-center text-3xs text-ink-muted space-y-1">
                        <div>
                            Returns accepted within{''}
                            <EditableText as="number" min="0" max="365" value={meta.returns_policy_days} onChange={(v) => setMeta((m) => ({ ...m, returns_policy_days: v }))} className="inline-block" />
                            {''}days with receipt.
                        </div>
                        <EditableText
                            value={store.footer_message}
                            onChange={(v) => setStore((s) => ({ ...s, footer_message: v }))}
                            placeholder="Thank you for shopping with us!"
                            className="block"
                        />
                        <div className="text-4xs text-ink-secondary">Generated free at venqore.com/tools</div>
                    </div>

                    <div className="flex justify-between text-3xs text-ink-muted mt-3 gap-2">
                        <button type="button" onClick={() => logoInputRef.current?.click()} className="hover:text-brand-500 transition-colors">
                            {isThermal ? '80mm Thermal Roll' : 'Standard Letter / A4'}
                        </button>
                    </div>
                </div>
            </div>

            <p className="text-center text-xs text-ink-muted mt-4">
                This preview matches your downloaded PDF exactly — click anything above to edit it.
            </p>
        </ToolShell>
    );
}

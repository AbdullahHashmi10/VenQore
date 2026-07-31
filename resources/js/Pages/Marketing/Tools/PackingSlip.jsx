import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Trash2, Download, Loader2, Upload, AlertCircle, Package } from 'lucide-react';
import ToolShell from './Shared/ToolShell';
import EditableText from './Shared/EditableText';

/**
 * Free Packing Slip Generator.
 *
 * UX MODEL: the document IN THE MIDDLE OF THE PAGE *is* the editor, mirroring
 * the Invoice Generator (see Invoice.jsx). Every field — ship from, ship to,
 * order meta, line items — is edited by clicking directly on the rendered
 * packing slip (see Shared/EditableText). There is no separate input form;
 * the only secondary control (logo upload) lives in a slim bar above the
 * document, alongside the Download button.
 *
 * IMPORTANT: a packing slip carries NO pricing, currency or totals anywhere
 * — by design it only tells the recipient what's in the box, never what it
 * costs. Do not add price/currency/total fields to this document.
 */

const STORAGE_KEY = 'venqore_packing_slip_from_profile_v1';

const emptyItem = () => ({ sku: '', description: '', quantity_ordered: 1, quantity_shipped: 1, package_number: 'Box 1', notes: '' });

const FAQS = [
    { q: 'Does a packing slip need prices?', a: 'No. A packing slip carries no pricing at all — no unit price, no tax, no total. It travels inside the box to tell whoever opens it what is inside, not what is owed.' },
    { q: "What's the difference between a packing slip and an invoice?", a: 'An invoice is a bill: it lists prices, tax and a total amount owed. A packing slip is a shipping document: it lists what was ordered and what was actually shipped, with zero pricing, and physically ships inside the box.' },
    { q: 'What is a partial shipment and how is it shown?', a: 'A partial shipment happens when the quantity shipped is less than the quantity ordered. This tool compares Qty Ordered to Qty Shipped on every line automatically and prints a clear notice on the PDF.' },
    { q: 'Is the packing slip generator really free?', a: 'Yes. Creating and downloading a PDF packing slip is completely free, with no signup, no watermark and no limit on how many you generate.' },
    { q: 'Can I save my business details for next time?', a: 'Yes — your ship-from business name, address and logo are saved in your browser so you do not have to retype them next time.' },
    { q: 'Does the preview match the downloaded PDF?', a: 'Yes. What you see on screen is built to match the downloaded PDF layout, font and spacing — including the automatic partial-shipment notice — so there are no surprises after download.' },
];

export default function PackingSlipTool({ templates = {}, maxItems = 100, suggestedNumber = '', toolGroups = [] }) {
    const [shipFrom, setShipFrom] = useState({ name: '', address: '', email: '', phone: '', logo_base64: null });
    const [shipTo, setShipTo] = useState({ name: '', address: '', email: '', phone: '' });
    const [billTo, setBillTo] = useState({ name: '', address: '', email: '', phone: '' });
    const [sameAsShipTo, setSameAsShipTo] = useState(true);
    const [items, setItems] = useState([emptyItem()]);
    const [meta, setMeta] = useState({
        order_number: suggestedNumber,
        pack_date: new Date().toISOString().slice(0, 10),
        carrier: '',
        tracking_number: '',
        special_instructions: '',
        gift_message: '',
        template: 'clean',
        accent_color: '#4f46e5',
    });
    const [headers, setHeaders] = useState({
        sku: 'SKU',
        description: 'Description / Item',
        package_number: 'Box / Pkg',
        quantity_ordered: 'Qty Ordered',
        quantity_shipped: 'Qty Shipped',
    });
    const [orientation, setOrientation] = useState('portrait');
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(false);
    const logoInputRef = useRef(null);

    // Load saved profile once on mount
    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) setShipFrom((sf) => ({ ...sf, ...JSON.parse(raw) }));
        } catch (e) { /* ignore corrupt storage */ }
    }, []);

    // Persist shipFrom profile
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(shipFrom));
        } catch (e) { /* ignore storage error */ }
    }, [shipFrom]);

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
        reader.onload = () => setShipFrom((sf) => ({ ...sf, logo_base64: reader.result }));
        reader.readAsDataURL(file);
    };

    const hasPartialShipment = useMemo(() => {
        return items.some((it) => (parseFloat(it.quantity_shipped) || 0) < (parseFloat(it.quantity_ordered) || 0));
    }, [items]);

    const generate = async () => {
        setErrors([]);
        if (!shipFrom.name.trim()) { setErrors(['Your business / ship-from name is required. Click "Your business name" on the packing slip above.']); return; }
        if (!shipTo.name.trim()) { setErrors(['A recipient / ship-to name is required. Click "Recipient name" on the packing slip above.']); return; }
        if (!items.some((it) => it.description.trim())) { setErrors(['Add at least one line item with a description.']); return; }

        setLoading(true);
        try {
            const payload = {
                shipFrom,
                shipTo,
                billTo: sameAsShipTo ? {} : billTo,
                items,
                meta,
                headers,
                orientation,
            };

            const res = await fetch(route('tools.packing-slip.render'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
                    Accept: 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                setErrors(body.errors || ['Could not generate that packing slip. Please check your entries and try again.']);
                setLoading(false);
                return;
            }

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `packing-slip-${(meta.order_number || 'draft').replace(/[^A-Za-z0-9-]/g, '')}.pdf`;
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

    const isClassic = meta.template === 'classic';
    const isCompact = meta.template === 'compact';

    return (
        <ToolShell
            title="Free Packing Slip Generator — PDF, No Prices | VenQore"
            metaDescription="Create a free PDF packing slip online. No prices or totals — just what's inside the box, with automatic partial-shipment detection. No signup, no watermark."
            eyebrow="Free Tools"
            h1="Free Packing Slip Generator"
            answer="Edit the packing slip below exactly as it will look in your PDF — click any field to change it. Separate Ship-To and Bill-To addresses, carrier/tracking details, package/box tracking, and automatic partial shipment alerts — completely price-free, no signup, no watermark."
            toolGroups={toolGroups}
            currentSlug="packing-slip-generator"
            faqs={FAQS}
            cta={{ headline: 'Streamline warehouse & shipping operations.', subtext: 'VenQore syncs inventory across channels, prints barcode labels, and manages orders effortlessly.' }}
            related={[{ href: '/tools/purchase-order-generator', label: 'Purchase Order Generator' }, { href: '/tools/invoice-generator', label: 'Invoice Generator' }]}
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
                <button type="button" onClick={() => logoInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-slate-300 hover:border-indigo-400/40 transition-colors">
                    <Upload size={13} /> {shipFrom.logo_base64 ? 'Change logo' : 'Add logo'}
                </button>
                {shipFrom.logo_base64 && (
                    <button type="button" onClick={() => setShipFrom((sf) => ({ ...sf, logo_base64: null }))} className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors">
                        Remove logo
                    </button>
                )}
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={onLogoChange} />

                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={sameAsShipTo}
                        onChange={(e) => setSameAsShipTo(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    Bill To same as Ship To
                </label>

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

            {/* THE DOCUMENT — this is the editor */}
            {orientation === 'landscape' && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">
                    Landscape printing is not yet supported for downloads — this previews the layout only.
                </p>
            )}
            <div className={`rounded-2xl overflow-hidden shadow-xl shadow-slate-900/10 dark:shadow-black/40 border border-slate-900/10 dark:border-white/10 bg-white transition-all ${orientation === 'landscape' ? 'max-w-none' : ''}`}>
                <div className={`p-6 sm:p-10 text-slate-900 ${isCompact ? 'text-[13px]' : 'text-sm'}`} style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                    {/* Header */}
                    <div className={`flex flex-col sm:flex-row justify-between gap-6 mb-6 ${isClassic ? 'border-b-2 border-slate-900 pb-4' : ''}`}>
                        <div>
                            {shipFrom.logo_base64 && <img src={shipFrom.logo_base64} alt="Logo" className="h-12 max-w-[160px] object-contain mb-2" />}
                            <EditableText
                                value={shipFrom.name}
                                onChange={(v) => setShipFrom((sf) => ({ ...sf, name: v }))}
                                placeholder="Your business name"
                                className="block text-lg font-bold"
                                inline={false}
                            />
                            <EditableText
                                value={shipFrom.address}
                                onChange={(v) => setShipFrom((sf) => ({ ...sf, address: v }))}
                                placeholder="Ship from address"
                                as="textarea" rows={2}
                                className="block text-slate-500 text-xs mt-1 max-w-xs"
                                inline={false}
                            />
                            <div className="flex flex-col gap-y-0.5 text-xs text-slate-500 mt-1">
                                <EditableText value={shipFrom.email} onChange={(v) => setShipFrom((sf) => ({ ...sf, email: v }))} placeholder="email@business.com" inline={false} />
                                <EditableText value={shipFrom.phone} onChange={(v) => setShipFrom((sf) => ({ ...sf, phone: v }))} placeholder="Phone number" inline={false} />
                            </div>
                        </div>
                        <div className="text-left sm:text-right">
                            <div className="text-2xl font-black tracking-tight text-slate-900">PACKING SLIP</div>
                            <div className="mt-2 text-xs space-y-0.5">
                                <div className="flex sm:justify-end gap-2"><span className="text-slate-400">Order #</span><EditableText value={meta.order_number} onChange={(v) => setMeta((m) => ({ ...m, order_number: v }))} className="font-bold" /></div>
                                <div className="flex sm:justify-end gap-2"><span className="text-slate-400">Pack date</span><EditableText as="date" value={meta.pack_date} onChange={(v) => setMeta((m) => ({ ...m, pack_date: v }))} /></div>
                                <div className="flex sm:justify-end gap-2"><span className="text-slate-400">Carrier</span><EditableText value={meta.carrier} onChange={(v) => setMeta((m) => ({ ...m, carrier: v }))} placeholder="e.g. FedEx, UPS, DHL" emptyLabel="—" /></div>
                                <div className="flex sm:justify-end gap-2"><span className="text-slate-400">Tracking #</span><EditableText value={meta.tracking_number} onChange={(v) => setMeta((m) => ({ ...m, tracking_number: v }))} placeholder="Tracking number" className="font-bold" emptyLabel="—" /></div>
                            </div>
                        </div>
                    </div>

                    {/* Automatic partial-shipment notice — computed live, not editable */}
                    {hasPartialShipment && (
                        <div className="mb-6 px-4 py-2.5 rounded-lg bg-amber-50 border border-amber-500 text-amber-700 text-xs font-bold text-center">
                            NOTICE: This is a PARTIAL SHIPMENT. Remaining ordered items will ship separately.
                        </div>
                    )}

                    {/* Ship To / Bill To / Ship From recap */}
                    <div className="grid sm:grid-cols-3 gap-6 mb-6">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Ship To (Recipient)</p>
                            <EditableText value={shipTo.name} onChange={(v) => setShipTo((st) => ({ ...st, name: v }))} placeholder="Recipient name" className="block font-bold" inline={false} />
                            <EditableText value={shipTo.address} onChange={(v) => setShipTo((st) => ({ ...st, address: v }))} placeholder="Delivery address" as="textarea" rows={2} className="block text-slate-500 text-xs mt-0.5" inline={false} />
                            <EditableText value={shipTo.phone} onChange={(v) => setShipTo((st) => ({ ...st, phone: v }))} placeholder="Phone (optional)" className="block text-slate-500 text-xs mt-0.5" inline={false} />
                            <EditableText value={shipTo.email} onChange={(v) => setShipTo((st) => ({ ...st, email: v }))} placeholder="Email (optional)" className="block text-slate-500 text-xs mt-0.5" inline={false} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Bill To</p>
                            {sameAsShipTo ? (
                                <p className="text-slate-400 italic text-xs">Same as Ship To</p>
                            ) : (
                                <>
                                    <EditableText value={billTo.name} onChange={(v) => setBillTo((bt) => ({ ...bt, name: v }))} placeholder="Billing contact / company" className="block font-bold" inline={false} />
                                    <EditableText value={billTo.address} onChange={(v) => setBillTo((bt) => ({ ...bt, address: v }))} placeholder="Billing address" as="textarea" rows={2} className="block text-slate-500 text-xs mt-0.5" inline={false} />
                                    <EditableText value={billTo.phone} onChange={(v) => setBillTo((bt) => ({ ...bt, phone: v }))} placeholder="Phone (optional)" className="block text-slate-500 text-xs mt-0.5" inline={false} />
                                    <EditableText value={billTo.email} onChange={(v) => setBillTo((bt) => ({ ...bt, email: v }))} placeholder="Email (optional)" className="block text-slate-500 text-xs mt-0.5" inline={false} />
                                </>
                            )}
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Ship From</p>
                            <p className="font-bold">{shipFrom.name || <span className="italic text-slate-400">Your business name</span>}</p>
                            {shipFrom.address && <p className="text-slate-500 text-xs">{shipFrom.address}</p>}
                        </div>
                    </div>

                    {/* Line items */}
                    <table className="w-full mb-2">
                        <thead>
                            <tr className={`text-left text-[10px] font-bold uppercase tracking-wide text-slate-400 ${isClassic ? 'border-b-2 border-slate-900' : 'border-b border-slate-900'}`}>
                                <th className="pb-2 pr-2 w-24"><EditableText value={headers.sku} onChange={(v) => setHeaders((h) => ({ ...h, sku: v }))} className="text-[10px] font-bold uppercase tracking-wide text-slate-400" pulse={false} /></th>
                                <th className="pb-2 px-2"><EditableText value={headers.description} onChange={(v) => setHeaders((h) => ({ ...h, description: v }))} className="text-[10px] font-bold uppercase tracking-wide text-slate-400" pulse={false} /></th>
                                <th className="pb-2 px-2 w-20"><EditableText value={headers.package_number} onChange={(v) => setHeaders((h) => ({ ...h, package_number: v }))} className="text-[10px] font-bold uppercase tracking-wide text-slate-400" pulse={false} /></th>
                                <th className="pb-2 px-2 text-right w-20"><EditableText value={headers.quantity_ordered} onChange={(v) => setHeaders((h) => ({ ...h, quantity_ordered: v }))} className="text-[10px] font-bold uppercase tracking-wide text-slate-400 text-right" pulse={false} /></th>
                                <th className="pb-2 pl-2 text-right w-20"><EditableText value={headers.quantity_shipped} onChange={(v) => setHeaders((h) => ({ ...h, quantity_shipped: v }))} className="text-[10px] font-bold uppercase tracking-wide text-slate-400 text-right" pulse={false} /></th>
                                <th className="w-8"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, idx) => {
                                const isShort = (parseFloat(item.quantity_shipped) || 0) < (parseFloat(item.quantity_ordered) || 0);
                                return (
                                    <tr key={idx} className="border-b border-slate-100 group align-top">
                                        <td className="py-2 pr-2">
                                            <EditableText value={item.sku} onChange={(v) => updateItem(idx, 'sku', v)} placeholder="SKU" className="block" />
                                        </td>
                                        <td className="py-2 px-2">
                                            <EditableText value={item.description} onChange={(v) => updateItem(idx, 'description', v)} placeholder="Item description" className="block" />
                                            <EditableText value={item.notes} onChange={(v) => updateItem(idx, 'notes', v)} placeholder="Note (optional)" className="block text-slate-400 text-xs" />
                                        </td>
                                        <td className="py-2 px-2">
                                            <EditableText value={item.package_number} onChange={(v) => updateItem(idx, 'package_number', v)} placeholder="Box 1" />
                                        </td>
                                        <td className="py-2 px-2 text-right">
                                            <EditableText as="number" min="0" value={item.quantity_ordered} onChange={(v) => updateItem(idx, 'quantity_ordered', v)} className="text-right w-14" />
                                        </td>
                                        <td className="py-2 pl-2 text-right">
                                            <EditableText as="number" min="0" value={item.quantity_shipped} onChange={(v) => updateItem(idx, 'quantity_shipped', v)} className={`text-right w-14 font-bold ${isShort ? 'text-amber-600' : ''}`} />
                                        </td>
                                        <td className="py-2 pl-1 text-right">
                                            <button type="button" onClick={() => removeItem(idx)} disabled={items.length === 1} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 disabled:opacity-0 transition-opacity">
                                                <Trash2 size={13} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    <button type="button" onClick={addItem} disabled={items.length >= maxItems} className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-indigo-500 disabled:opacity-40 transition-colors mb-8">
                        <Plus size={12} /> Add line item
                    </button>

                    {/* Notes */}
                    <div className="grid sm:grid-cols-2 gap-6 text-xs text-slate-500">
                        <div>
                            <p className="font-bold text-slate-700 mb-1 flex items-center gap-1.5"><Package size={12} className="text-pink-500" /> Gift Message</p>
                            <EditableText value={meta.gift_message} onChange={(v) => setMeta((m) => ({ ...m, gift_message: v }))} placeholder="Add a gift message (optional)" as="textarea" rows={2} className="block" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-700 mb-1">Special Handling / Delivery Instructions</p>
                            <EditableText value={meta.special_instructions} onChange={(v) => setMeta((m) => ({ ...m, special_instructions: v }))} placeholder="e.g. Leave at back door, Handle with extreme care..." as="textarea" rows={2} className="block" />
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

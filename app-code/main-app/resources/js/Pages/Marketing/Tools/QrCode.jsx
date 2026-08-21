import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Download, AlertCircle, Image as ImageIcon, X, Loader2, Info } from 'lucide-react';
import ToolShell from './Shared/ToolShell';
import Select from './Shared/Select';

/**
 * QR Code Generator — free, ungated.
 *
 * Multiple content types (URL, text, WiFi, vCard, email, phone), each with
 * its own small form. Live preview debounces and POSTs to
 * tools.qr.render, mirroring Barcode.jsx's UX. Logo overlay forces High
 * error correction — see the note near the error-correction control.
 */

const TYPE_OPTIONS = [
    { value: 'url', label: 'Website / URL', hint: 'Link to a page' },
    { value: 'text', label: 'Plain text', hint: 'Any free-form message' },
    { value: 'wifi', label: 'WiFi network', hint: 'Scan to auto-join' },
    { value: 'vcard', label: 'Contact card (vCard)', hint: 'Save to contacts' },
    { value: 'email', label: 'Email', hint: 'Pre-filled mailto' },
    { value: 'phone', label: 'Phone number', hint: 'Tap to call' },
];

const EC_OPTIONS = [
    { value: 'L', label: 'Low (L)', hint: '~7% damage recovery' },
    { value: 'M', label: 'Medium (M)', hint: '~15% damage recovery' },
    { value: 'Q', label: 'Quartile (Q)', hint: '~25% damage recovery' },
    { value: 'H', label: 'High (H)', hint: '~30% — required for logos' },
];

const FAQS = [
    { q: 'Is the VenQore QR code generator really free?', a: 'Yes. Generating and downloading a QR code as PNG or SVG is completely free, with no signup and no watermark.' },
    { q: 'What is a QR code error correction level?', a: 'Error correction lets a QR code still scan correctly even if part of it is damaged, dirty, or covered — for example by a logo. Higher levels (Q, H) tolerate more damage but make the code slightly denser.' },
    { q: 'Can I put my logo in the middle of the QR code?', a: 'Yes. Upload a logo and it is composited into the center. Because that covers part of the pattern, logo overlays require High (H) error correction, which we switch to automatically.' },
    { q: 'What content types can I encode?', a: 'URLs, plain text, WiFi credentials, a vCard contact card, a pre-filled email, and a phone number.' },
    { q: 'PNG or SVG — which should I choose?', a: 'SVG is vector and scales to any size with no quality loss — best for print. PNG is a fixed-resolution image, simpler for quick sharing or embedding.' },
];

const inputBase = 'w-full px-4 py-3 rounded-xl bg-white dark:bg-white/[0.04] border border-neutral-900/10 dark:border-white/10 text-ink placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-brand-400/60 transition-colors';
const labelBase = 'block text-xs font-bold uppercase tracking-widest text-ink-muted mb-2';

function Field({ label, ...props }) {
    return (
        <div>
            <label className={labelBase}>{label}</label>
            <input className={inputBase} {...props} />
        </div>
    );
}

export default function QrCodeTool({ supportsRaster = true, supportsLogo = true, toolGroups = [] }) {
    const [type, setType] = useState('url');
    const [fields, setFields] = useState({ encryption: 'WPA' });
    const setField = (k, v) => setFields((f) => ({ ...f, [k]: v }));

    const [output, setOutput] = useState(supportsRaster ? 'png' : 'svg');
    const [size, setSize] = useState(400);
    const [margin, setMargin] = useState(16);
    const [errorCorrection, setErrorCorrection] = useState('M');
    const [foreground, setForeground] = useState('#000000');
    const [background, setBackground] = useState('#FFFFFF');
    const [logo, setLogo] = useState(null);
    const logoInputRef = useRef(null);

    const [result, setResult] = useState(null);
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(false);
    const debounceRef = useRef(null);

    const csrf = () => document.querySelector('meta[name="csrf-token"]')?.content || '';

    // Logo requires High error correction to stay scannable — force it.
    useEffect(() => {
        if (logo && errorCorrection !== 'H') setErrorCorrection('H');
    }, [logo]); // eslint-disable-line react-hooks/exhaustive-deps

    const hasContent = () => {
        switch (type) {
            case 'url': return !!(fields.url || '').trim();
            case 'text': return !!(fields.text || '').trim();
            case 'wifi': return !!(fields.ssid || '').trim();
            case 'vcard': return !!(fields.name || '').trim();
            case 'email': return !!(fields.address || '').trim();
            case 'phone': return !!(fields.number || '').trim();
            default: return false;
        }
    };

    const generate = useCallback(() => {
        if (!hasContent()) { setResult(null); setErrors([]); return; }
        setLoading(true);
        fetch(route('tools.qr.render'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': csrf() },
            body: JSON.stringify({
                type, fields, output, size, margin,
                error_correction: errorCorrection,
                foreground, background,
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [type, fields, output, size, margin, errorCorrection, foreground, background, logo]);

    useEffect(() => {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(generate, 350);
        return () => clearTimeout(debounceRef.current);
    }, [generate]);

    const download = () => {
        if (!result) return;
        const a = document.createElement('a');
        a.href = `data:${result.mime_type};base64,${result.image_base64}`;
        a.download = `qr-code-${type}.${result.file_extension}`;
        a.click();
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setLogo(reader.result);
        reader.readAsDataURL(file);
    };

    return (
        <ToolShell
            title="Free QR Code Generator — URL, WiFi, vCard | VenQore"
            metaDescription="Generate free QR codes for URLs, WiFi, contact cards, email and phone. Custom colors, logo overlay, PNG/SVG export. No signup, no watermark."
            eyebrow="Free Tool"
            h1="Free QR Code Generator"
            answer="The VenQore QR Code Generator creates free, print-ready QR codes for URLs, plain text, WiFi networks, contact cards (vCard), email and phone numbers. Customize colors, size, margin and error correction, optionally add a logo in the center, and export as PNG or SVG. No signup, no watermark."
            faqs={FAQS}
            toolGroups={toolGroups}
            currentSlug="qr-code-generator"
            cta={{
                headline: 'Give every product, table and receipt its own QR code.',
                subtext: 'VenQore generates QR codes for products, invoices and menus automatically — and writes a balanced double-entry journal on every sale.',
            }}
            related={[{ label: 'Barcode Generator', href: '/tools/barcode-generator' }, { label: 'Price Tag Generator', href: '/tools/price-tag-generator' }]}
        >
            <div className="rounded-2xl bg-sunken dark:bg-white/[0.03] border border-line dark:border-white/10 p-5 sm:p-7">
                <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
                    {/* Controls */}
                    <div className="space-y-5 min-w-0">
                        <div>
                            <label className={labelBase}>Content type</label>
                            <Select value={type} onChange={(v) => { setFields({ encryption: 'WPA' }); setType(v); }} options={TYPE_OPTIONS} />
                        </div>

                        {/* Type-specific fields */}
                        {type === 'url' && (
                            <Field label="URL" type="text" placeholder="e.g. venqore.com" value={fields.url || ''} onChange={(e) => setField('url', e.target.value)} />
                        )}

                        {type === 'text' && (
                            <div>
                                <label className={labelBase}>Text</label>
                                <textarea
                                    rows={3}
                                    className={inputBase}
                                    placeholder="Any text to encode"
                                    value={fields.text || ''}
                                    onChange={(e) => setField('text', e.target.value)}
                                />
                            </div>
                        )}

                        {type === 'wifi' && (
                            <div className="space-y-4">
                                <Field label="Network name (SSID)" type="text" value={fields.ssid || ''} onChange={(e) => setField('ssid', e.target.value)} />
                                <div>
                                    <label className={labelBase}>Encryption</label>
                                    <Select
                                        value={fields.encryption || 'WPA'}
                                        onChange={(v) => setField('encryption', v)}
                                        options={[
                                            { value: 'WPA', label: 'WPA / WPA2' },
                                            { value: 'WEP', label: 'WEP' },
                                            { value: 'nopass', label: 'No password (open network)' },
                                        ]}
                                    />
                                </div>
                                {fields.encryption !== 'nopass' && (
                                    <Field label="Password" type="text" value={fields.password || ''} onChange={(e) => setField('password', e.target.value)} />
                                )}
                            </div>
                        )}

                        {type === 'vcard' && (
                            <div className="space-y-4">
                                <Field label="Full name" type="text" value={fields.name || ''} onChange={(e) => setField('name', e.target.value)} />
                                <Field label="Phone" type="text" value={fields.phone || ''} onChange={(e) => setField('phone', e.target.value)} />
                                <Field label="Email" type="email" value={fields.email || ''} onChange={(e) => setField('email', e.target.value)} />
                                <Field label="Company" type="text" value={fields.company || ''} onChange={(e) => setField('company', e.target.value)} />
                            </div>
                        )}

                        {type === 'email' && (
                            <div className="space-y-4">
                                <Field label="Email address" type="email" value={fields.address || ''} onChange={(e) => setField('address', e.target.value)} />
                                <Field label="Subject (optional)" type="text" value={fields.subject || ''} onChange={(e) => setField('subject', e.target.value)} />
                                <div>
                                    <label className={labelBase}>Body (optional)</label>
                                    <textarea rows={2} className={inputBase} value={fields.body || ''} onChange={(e) => setField('body', e.target.value)} />
                                </div>
                            </div>
                        )}

                        {type === 'phone' && (
                            <Field label="Phone number" type="text" placeholder="e.g. +1 555 123 4567" value={fields.number || ''} onChange={(e) => setField('number', e.target.value)} />
                        )}

                        {/* Customization */}
                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div>
                                <label className={labelBase}>Foreground</label>
                                <div className="flex items-center gap-2">
                                    <input type="color" value={foreground} onChange={(e) => setForeground(e.target.value)} className="w-11 h-11 rounded-lg border border-line dark:border-white/10 bg-transparent cursor-pointer" />
                                    <input type="text" value={foreground} onChange={(e) => setForeground(e.target.value)} className={`${inputBase} font-mono text-xs`} />
                                </div>
                            </div>
                            <div>
                                <label className={labelBase}>Background</label>
                                <div className="flex items-center gap-2">
                                    <input type="color" value={background} onChange={(e) => setBackground(e.target.value)} className="w-11 h-11 rounded-lg border border-line dark:border-white/10 bg-transparent cursor-pointer" />
                                    <input type="text" value={background} onChange={(e) => setBackground(e.target.value)} className={`${inputBase} font-mono text-xs`} />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelBase}>Size ({size}px)</label>
                                <input type="range" min="100" max="1000" step="10" value={size} onChange={(e) => setSize(Number(e.target.value))} className="w-full accent-brand-500" />
                            </div>
                            <div>
                                <label className={labelBase}>Margin ({margin}px)</label>
                                <input type="range" min="0" max="60" value={margin} onChange={(e) => setMargin(Number(e.target.value))} className="w-full accent-brand-500" />
                            </div>
                        </div>

                        <div>
                            <label className={labelBase}>Error correction</label>
                            <Select value={errorCorrection} onChange={setErrorCorrection} options={EC_OPTIONS} />
                            <p className="text-xs text-ink-muted mt-1.5 flex items-start gap-1.5">
                                <Info size={13} className="shrink-0 mt-0.5" />
                                Higher levels tolerate more damage or a logo overlay, at the cost of a slightly denser code.
                            </p>
                        </div>

                        <div>
                            <label className={labelBase}>Image format</label>
                            <div className="flex gap-2 flex-wrap">
                                {['png', 'svg'].map((fmt) => {
                                    const disabled = !supportsRaster && fmt !== 'svg';
                                    return (
                                        <button
                                            key={fmt}
                                            onClick={() => !disabled && setOutput(fmt)}
                                            disabled={disabled}
                                            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-colors disabled:opacity-35 disabled:cursor-not-allowed ${
                                                output === fmt
                                                    ? 'bg-sunken dark:bg-white text-white dark:text-[#05030f]'
                                                    : 'bg-white dark:bg-white/[0.04] border border-line dark:border-white/10 text-ink-muted hover:text-ink dark:hover:text-white'
                                            }`}
                                        >
                                            {fmt}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Logo overlay */}
                        <div className="space-y-2.5">
                            <button
                                type="button"
                                onClick={() => { if (!logo) logoInputRef.current?.click(); else setLogo(null); }}
                                disabled={!supportsLogo || output !== 'png'}
                                title={!supportsLogo ? 'Logo overlay needs the GD extension' : output !== 'png' ? 'Logo overlay requires PNG output' : ''}
                                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-colors disabled:opacity-35 ${logo ? 'bg-brand-500/15 border border-brand-400/40 text-brand-600 dark:text-brand-300' : 'bg-white dark:bg-white/[0.04] border border-line dark:border-white/10 text-ink-muted'}`}
                            >
                                <ImageIcon size={13} /> {logo ? 'Remove logo' : 'Add logo (center)'}
                            </button>
                            <input ref={logoInputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleLogoUpload} />

                            {logo && (
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-white/[0.04] border border-line dark:border-white/10">
                                    <img src={logo} alt="" className="w-9 h-9 object-contain rounded bg-white" />
                                    <span className="text-xs text-ink-muted flex-1 leading-snug">Error correction was switched to High to keep the code scannable with a logo in the center.</span>
                                    <button onClick={() => setLogo(null)} className="text-ink-muted hover:text-red-500 transition-colors"><X size={16} /></button>
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
                    </div>

                    {/* Preview */}
                    <div className="flex flex-col min-w-0">
                        <div
                            className="w-full aspect-square rounded-2xl border border-line flex items-center justify-center p-6 mb-3"
                            style={{ background: background || '#ffffff' }}
                        >
                            {loading && <Loader2 size={20} className="text-ink-muted animate-spin" />}
                            {!loading && result && (
                                <img
                                    src={`data:${result.mime_type};base64,${result.image_base64}`}
                                    alt="Generated QR code"
                                    className="max-w-full max-h-full"
                                />
                            )}
                            {!loading && !result && <span className="text-ink-muted text-sm text-center px-4">Fill in the fields to see your QR code</span>}
                        </div>

                        <button
                            onClick={download}
                            disabled={!result}
                            className="w-full py-3.5 bg-sunken dark:bg-white text-white dark:text-[#05030f] rounded-xl text-sm font-bold uppercase tracking-wide transition-transform disabled:opacity-40 disabled: flex items-center justify-center gap-2"
                        >
                            <Download size={16} /> Download {result ? result.file_extension.toUpperCase() : output.toUpperCase()}
                        </button>
                        <p className="text-1xs text-ink-muted text-center mt-2">Free — no email, no watermark.</p>
                    </div>
                </div>
            </div>
        </ToolShell>
    );
}

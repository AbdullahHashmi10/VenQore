import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Copy, Download, ExternalLink, Image, LayoutGrid, Map, Pause, Printer, QrCode, RefreshCw, Save, Server, ShoppingBag, TrendingUp, Wifi } from 'lucide-react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import StoreTabs from '@/Components/Commerce/StoreTabs';
import { ListPageFrame, ListStatCards } from '@/Components/ListShell';
import { Alert, Button, Card, CardTitle, Field, ImageInput, Switch, inputCls } from '@/Components/Commerce/ui';

const themes = [
    ['visual-grid', 'Visual Grid', 'Large photographs and fast browsing.', 'from-amber-100 via-white to-emerald-100'],
    ['editorial-ledger', 'Editorial Ledger', 'Premium menu typography and elegant rows.', 'from-slate-950 via-violet-950 to-amber-950'],
    ['express-rail', 'Express Rail', 'Dense, quick scanning for busy locations.', 'from-sky-700 via-slate-950 to-rose-500'],
];

export default function Setup({ catalogue, languages = [], tables = [], stats = { today: 0, week: 0 }, urls = {}, floor_plan_url, save_url, tabs, store_status }) {
    const { data, setData, post, processing, errors, isDirty } = useForm({
        enabled: !!catalogue.enabled,
        theme: catalogue.theme || 'visual-grid',
        show_images: catalogue.show_images !== false,
        alt_lang: catalogue.alt_lang || '',
        paused: !!catalogue.paused,
        require_seated: !!catalogue.require_seated,
        auto_hours: !!catalogue.auto_hours,
        name: catalogue.name || '',
        tagline: catalogue.tagline || '',
        lan_url: catalogue.lan_url || '',
        logo: null,
        banner: null,
    });
    const hasFloor = tables.length > 0;
    const [copied, setCopied] = useState(false);
    const copyLink = (text) => {
        try { navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); } catch (e) { /* clipboard unavailable */ }
    };
    const tone = 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400';
    const mute = 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400';
    const state = !data.enabled ? 'Off' : data.paused ? 'Paused' : 'Taking orders';
    const statCards = [
        { label: 'Catalogue', value: state, icon: Server, icon_tone: state === 'Taking orders' ? tone : mute, value_tone: state === 'Taking orders' ? 'text-emerald-600' : 'text-amber-600' },
        { label: 'Orders today', value: stats.today, icon: ShoppingBag, icon_tone: tone },
        { label: 'Last 7 days', value: stats.week, icon: TrendingUp, icon_tone: tone },
        { label: hasFloor ? 'Table QR codes' : 'QR codes', value: hasFloor ? tables.length : 1, icon: QrCode, icon_tone: tone },
    ];
    const tableAction = (key, table, confirmText) => {
        if (confirmText && !window.confirm(confirmText)) return;
        router.post((urls[key] || '').replace('__ID__', table.id), {}, { preserveScroll: true });
    };
    const submit = (event) => {
        event.preventDefault();
        post(save_url, { forceFormData: true, preserveScroll: true });
    };

    return (
        <OneGlanceLayout title="Online Store" activeMenu="Online Store" noPadding>
            <Head title="QR Menu & Catalogue" />
            <ListPageFrame className="min-w-0 bg-app md:flex md:flex-col md:h-full md:gap-2 md:px-4 md:pt-2 md:pb-2">
            <StoreTabs
                active="catalogue"
                urls={tabs}
                status={store_status}
                left={isDirty ? <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />Unsaved changes</span> : null}
                action={{ label: processing ? 'Saving…' : 'Save catalogue', form: 'onsite-catalogue-form', icon: Save, disabled: processing }}
            />
            <ListStatCards cards={statCards} />
            <div className="md:flex-1 md:min-h-0 md:overflow-auto">
            <form id="onsite-catalogue-form" onSubmit={submit} className="flex w-full flex-col gap-6 pb-12 md:grid md:grid-cols-3 md:gap-2 md:pb-0 md:items-start [&>*]:min-w-0">
                <div className="flex flex-col gap-6 md:col-span-2 md:gap-2">
                <div className="flex flex-col gap-4 rounded-[14px] border border-line bg-surface p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between md:hidden">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[.18em] text-brand-600">Local ordering</p>
                        <h1 className="mt-1 text-2xl font-black tracking-tight text-ink">Onsite Catalogue</h1>
                        <p className="mt-1 max-w-2xl text-sm text-ink-muted">A catalogue served by this VenQore computer over the business Wi-Fi. Customer orders open directly in the POS.</p>
                    </div>
                </div>

                <Card className="space-y-4">
                    <CardTitle icon={Server} tone="emerald" title="Availability" sub="This switch is independent from Online Store publishing and online-order intake. Guest orders appear in Front of House under Guest added items." />
                    <Switch checked={data.enabled} onChange={(value) => setData('enabled', value)} label="Enable onsite catalogue" desc="Allow phones connected to your local network to browse and send orders to the POS." />
                    <Field label="Local server address" error={errors.lan_url} hint="Use the fixed LAN address customers can reach while connected to your Wi-Fi, for example http://192.168.1.100:8000.">
                        <input className={`${inputCls} h-10`} value={data.lan_url} onChange={(e) => setData('lan_url', e.target.value)} placeholder="http://192.168.1.100:8000" />
                    </Field>
                    <Alert kind="info"><b>Customers need to reach this address.</b> If you use a local address, their phones must be on the same Wi-Fi and the computer's address must stay fixed so printed QR codes keep working. If you use your public web address, the menu works on mobile data too.</Alert>
                    <div className="divide-y divide-line rounded-[14px] border border-line px-4">
                        <Switch checked={data.paused} onChange={(value) => setData('paused', value)} label="Pause QR ordering" desc="Guests can still read the menu, but cannot send orders. Use it when the kitchen is overwhelmed." />
                        <Switch checked={data.require_seated} onChange={(value) => setData('require_seated', value)} label="Only when staff have seated the table" desc="A table's QR only takes orders while the table is open in Front of House. Stops someone ordering from a photo of the code." />
                        <Switch checked={data.auto_hours} onChange={(value) => setData('auto_hours', value)} label="Close outside opening hours" desc={catalogue.has_hours ? 'Uses the opening hours from Online Store Settings.' : 'Add opening hours in Online Store Settings first.'} />
                    </div>
                    {errors.auto_hours && <p className="text-sm text-red-600" role="alert">{errors.auto_hours}</p>}
                </Card>

                <Card className="space-y-4">
                    <CardTitle icon={Image} tone="violet" title="Catalogue identity" sub="These details belong only to the onsite catalogue." />
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Catalogue name" error={errors.name}><input className={`${inputCls} h-10`} value={data.name} onChange={(e) => setData('name', e.target.value)} /></Field>
                        <Field label="Tagline" error={errors.tagline}><input className={`${inputCls} h-10`} value={data.tagline} onChange={(e) => setData('tagline', e.target.value)} placeholder="Fresh food, ordered from your table" /></Field>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
                        <ImageInput label="Logo" current={catalogue.logo_url} error={errors.logo} hint="Square, up to 2 MB" accept="image/*" onChange={(file) => setData('logo', file)} />
                        <ImageInput wide label="Cover image" current={catalogue.banner_url} error={errors.banner} hint="Wide JPG, PNG or WebP, up to 3 MB" onChange={(file) => setData('banner', file)} />
                    </div>
                </Card>

                <Card className="space-y-4">
                    <CardTitle icon={LayoutGrid} tone="sky" title="Menu template" sub="The three formats are based on the supplied VenQore menu studio concept." />
                    <div className="grid gap-2 md:grid-cols-3">
                        {themes.map(([value, title, copy, preview]) => (
                            <button key={value} type="button" onClick={() => setData('theme', value)} className={`overflow-hidden rounded-[14px] border text-left transition ${data.theme === value ? 'border-brand-500 ring-2 ring-brand-200' : 'border-line hover:border-ink-300'}`}>
                                <span className={`block h-20 bg-gradient-to-br ${preview}`} />
                                <span className="block bg-surface p-3"><b className="block text-ink">{title}</b><span className="mt-1 block text-xs text-ink-muted">{copy}</span></span>
                            </button>
                        ))}
                    </div>
                    <Field label="Second menu language (optional)" error={errors.alt_lang} hint="Guests get a switch between English and this language. You type each dish's name in this language on the Products page. Leave empty for English only.">
                        <select className={`${inputCls} h-10`} value={data.alt_lang} onChange={(e) => setData('alt_lang', e.target.value)}>
                            <option value="">None (English only)</option>
                            {languages.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
                        </select>
                    </Field>
                    <Switch checked={data.show_images} onChange={(value) => setData('show_images', value)} label="Show product photographs" desc="Turn this off for a faster text-led menu on older phones." />
                    {data.enabled && <a href={`${catalogue.preview_url}?theme=${encodeURIComponent(data.theme)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-brand-600 hover:underline"><ExternalLink size={15} />Preview selected layout</a>}
                </Card>
                </div>

                <div className="flex flex-col gap-6 md:gap-2">
                <Card className="space-y-4">
                    <CardTitle icon={QrCode} tone="amber" title="QR code" sub={hasFloor ? `${tables.length} tables found. Each table receives its own ordering link.` : 'No floor plan found. One general catalogue QR code was created.'} />
                    {!hasFloor ? (
                        <div className="space-y-3">
                            <a href={catalogue.general_qr_url} target="_blank" rel="noreferrer" className="block h-auto rounded-[14px] border border-line bg-white p-3"><img src={catalogue.general_qr_url} alt="General onsite catalogue QR code" className="mx-auto aspect-square w-full max-w-[16rem]" /></a>
                            <div className="flex h-10 items-center rounded-[12px] border border-line bg-sunken px-3"><span className="truncate text-xs font-mono text-ink-secondary">{catalogue.general_url}</span></div>
                            <div className="grid grid-cols-3 gap-2">
                                <a href={catalogue.general_qr_url} download className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[12px] bg-brand-600 px-2 text-sm font-bold text-white hover:bg-brand-700"><Download size={15} />Download</a>
                                <Button type="button" variant="secondary" className="!px-2" onClick={() => copyLink(catalogue.general_url)}><Copy size={15} />{copied ? 'Copied' : 'Copy'}</Button>
                                <a href={catalogue.general_url} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[12px] border border-line bg-sunken px-2 text-sm font-bold text-ink hover:bg-interactive-hover"><ExternalLink size={15} />Open</a>
                            </div>
                            <p className="text-xs text-ink-muted">Orders from this code create a new walk-in tab in the POS.</p>
                            <Link href={floor_plan_url} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[12px] border border-line bg-surface px-4 text-sm font-bold text-ink hover:bg-interactive-hover"><Map size={15} />Create a floor plan</Link>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <p className="text-xs text-ink-muted">Print the unique QR for each table and place it only on that table.</p>
                            <div className="grid grid-cols-1 gap-2">
                                <a href={urls.cards} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center justify-center gap-2 rounded-[12px] bg-brand-600 px-4 text-sm font-bold text-white hover:bg-brand-700"><Printer size={15} />Print all table cards (A4)</a>
                                <Link href={floor_plan_url} className="inline-flex h-10 items-center justify-center gap-2 rounded-[12px] border border-line bg-surface px-4 text-sm font-bold text-ink hover:bg-interactive-hover"><Map size={15} />Manage floor plan</Link>
                            </div>
                            <div className="grid grid-cols-1 gap-2 pt-1">
                                {tables.map((table) => <div key={table.id} className="flex h-24 items-center gap-3 rounded-[14px] border border-line p-2">
                                    <a href={table.qr_url} target="_blank" rel="noreferrer" className="h-20 w-20 shrink-0 rounded-[12px] bg-white p-1"><img src={table.qr_url} alt={`${table.label} QR code`} className="h-full w-full" /></a>
                                    <div className="min-w-0 flex-1"><b className="block truncate text-ink">{table.label}</b><span className="block truncate text-xs text-ink-muted">{table.zone} · {table.code}</span>
                                        <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ${table.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{table.enabled ? 'Ordering on' : 'Ordering off'}</span>
                                        <div className="mt-1 flex flex-wrap gap-3 text-xs font-bold">
                                            <button type="button" className="inline-flex items-center gap-1 text-brand-600 hover:underline" onClick={() => tableAction('table_toggle', table)}><Pause size={12} />{table.enabled ? 'Turn off' : 'Turn on'}</button>
                                            <button type="button" className="inline-flex items-center gap-1 text-rose-600 hover:underline" onClick={() => tableAction('table_regenerate', table, `Create a new QR code for ${table.label}? The printed one stops working and must be replaced.`)}><RefreshCw size={12} />New code</button>
                                        </div>
                                    </div></div>)}
                            </div>
                        </div>
                    )}
                    <div className="flex gap-3 rounded-[14px] border border-sky-200 bg-sky-50 p-3 text-xs text-sky-950"><Wifi className="mt-0.5 shrink-0" size={16} /><p><b>Customer connection:</b> display a separate Wi-Fi QR beside the menu QR, or configure the router’s captive portal. Standard phone QR scanning cannot reliably join Wi-Fi and open a web address in one scan.</p></div>
                </Card>
                </div>
            </form>
            </div>
            </ListPageFrame>
        </OneGlanceLayout>
    );
}

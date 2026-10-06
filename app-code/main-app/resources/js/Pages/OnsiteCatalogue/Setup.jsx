import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ExternalLink, Image, LayoutGrid, Map, QrCode, Save, Server, Wifi } from 'lucide-react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import StoreTabs from '@/Components/Commerce/StoreTabs';
import { Alert, Button, Card, CardTitle, Field, ImageInput, Switch, inputCls } from '@/Components/Commerce/ui';

const themes = [
    ['visual-grid', 'Visual Grid', 'Large photographs and fast browsing.', 'from-amber-100 via-white to-emerald-100'],
    ['editorial-ledger', 'Editorial Ledger', 'Premium menu typography and elegant rows.', 'from-slate-950 via-violet-950 to-amber-950'],
    ['express-rail', 'Express Rail', 'Dense, quick scanning for busy locations.', 'from-sky-700 via-slate-950 to-rose-500'],
];

export default function Setup({ catalogue, tables = [], floor_plan_url, save_url, tabs, store_status }) {
    const { data, setData, post, processing, errors } = useForm({
        enabled: !!catalogue.enabled,
        theme: catalogue.theme || 'visual-grid',
        show_images: catalogue.show_images !== false,
        name: catalogue.name || '',
        tagline: catalogue.tagline || '',
        lan_url: catalogue.lan_url || '',
        logo: null,
        banner: null,
    });
    const hasFloor = tables.length > 0;
    const submit = (event) => {
        event.preventDefault();
        post(save_url, { forceFormData: true, preserveScroll: true });
    };

    return (
        <OneGlanceLayout title="Online Store" activeMenu="Online Store">
            <Head title="Onsite Catalogue" />
            <form id="onsite-catalogue-form" onSubmit={submit} className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-12">
                <StoreTabs active="catalogue" urls={tabs} status={store_status} action={{ label: processing ? 'Saving…' : 'Save catalogue', form: 'onsite-catalogue-form', icon: Save, disabled: processing }} />
                <div className="flex flex-col gap-4 rounded-3xl border border-line bg-surface p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[.18em] text-brand-600">Local ordering</p>
                        <h1 className="mt-1 text-2xl font-black tracking-tight text-ink">Onsite Catalogue</h1>
                        <p className="mt-1 max-w-2xl text-sm text-ink-muted">A catalogue served by this VenQore computer over the business Wi-Fi. Customer orders open directly in the POS.</p>
                    </div>
                </div>

                <Card className="space-y-5">
                    <CardTitle icon={Server} title="Availability" sub="This switch is independent from Online Store publishing and online-order intake." />
                    <Switch checked={data.enabled} onChange={(value) => setData('enabled', value)} label="Enable onsite catalogue" desc="Allow phones connected to your local network to browse and send orders to the POS." />
                    <Field label="Local server address" error={errors.lan_url} hint="Use the fixed LAN address customers can reach while connected to your Wi-Fi, for example http://192.168.1.100:8000.">
                        <input className={inputCls} value={data.lan_url} onChange={(e) => setData('lan_url', e.target.value)} placeholder="http://192.168.1.100:8000" />
                    </Field>
                    <Alert kind="info"><b>No Internet is required.</b> The VenQore computer and customer phones must be connected to the same router. Keep the computer’s LAN address fixed so printed QR codes remain valid.</Alert>
                </Card>

                <Card className="space-y-5">
                    <CardTitle icon={Image} tone="plum" title="Catalogue identity" sub="These details belong only to the onsite catalogue." />
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Catalogue name" error={errors.name}><input className={inputCls} value={data.name} onChange={(e) => setData('name', e.target.value)} /></Field>
                        <Field label="Tagline" error={errors.tagline}><input className={inputCls} value={data.tagline} onChange={(e) => setData('tagline', e.target.value)} placeholder="Fresh food, ordered from your table" /></Field>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
                        <ImageInput label="Logo" current={catalogue.logo_url} error={errors.logo} hint="Square, up to 2 MB" accept="image/*" onChange={(file) => setData('logo', file)} />
                        <ImageInput wide label="Cover image" current={catalogue.banner_url} error={errors.banner} hint="Wide JPG, PNG or WebP, up to 3 MB" onChange={(file) => setData('banner', file)} />
                    </div>
                </Card>

                <Card className="space-y-5">
                    <CardTitle icon={LayoutGrid} tone="sky" title="Menu template" sub="The three formats are based on the supplied VenQore menu studio concept." />
                    <div className="grid gap-3 md:grid-cols-3">
                        {themes.map(([value, title, copy, preview]) => (
                            <button key={value} type="button" onClick={() => setData('theme', value)} className={`overflow-hidden rounded-2xl border text-left transition ${data.theme === value ? 'border-brand-500 ring-2 ring-brand-200' : 'border-line hover:border-ink-300'}`}>
                                <span className={`block h-24 bg-gradient-to-br ${preview}`} />
                                <span className="block bg-surface p-4"><b className="block text-ink">{title}</b><span className="mt-1 block text-xs text-ink-muted">{copy}</span></span>
                            </button>
                        ))}
                    </div>
                    <Switch checked={data.show_images} onChange={(value) => setData('show_images', value)} label="Show product photographs" desc="Turn this off for a faster text-led menu on older phones." />
                    {data.enabled && <a href={`${catalogue.preview_url}?theme=${encodeURIComponent(data.theme)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-brand-600 hover:underline"><ExternalLink size={15} />Preview selected layout</a>}
                </Card>

                <Card className="space-y-5">
                    <CardTitle icon={QrCode} tone="amber" title="QR code setup" sub={hasFloor ? `${tables.length} tables found. Each table receives its own ordering link.` : 'No floor plan found. VenQore has created one general catalogue QR code.'} />
                    {!hasFloor ? (
                        <div className="grid gap-5 rounded-2xl border border-line bg-canvas p-5 sm:grid-cols-[14rem_1fr] sm:items-center">
                            <a href={catalogue.general_qr_url} target="_blank" rel="noreferrer" className="rounded-2xl bg-white p-3 shadow-sm"><img src={catalogue.general_qr_url} alt="General onsite catalogue QR code" className="aspect-square w-full" /></a>
                            <div>
                                <h3 className="font-bold text-ink">General counter catalogue</h3>
                                <p className="mt-1 break-all text-sm text-ink-muted">{catalogue.general_url}</p>
                                <p className="mt-3 text-sm text-ink-muted">Orders from this code create a new walk-in tab in the POS.</p>
                                <Link href={floor_plan_url} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2 text-sm font-bold text-ink"><Map size={15} />Create a floor plan</Link>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex flex-col gap-3 rounded-2xl bg-brand-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                                <div><b className="text-ink">Table ordering is ready</b><p className="text-sm text-ink-muted">Print the unique QR for each table and place it only on that table.</p></div>
                                <Link href={floor_plan_url} className="inline-flex items-center gap-2 rounded-xl bg-surface px-4 py-2 text-sm font-bold text-ink shadow-sm"><Map size={15} />Manage floor plan</Link>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                {tables.map((table) => <div key={table.id} className="flex items-center gap-3 rounded-2xl border border-line p-3">
                                    <a href={table.qr_url} target="_blank" rel="noreferrer" className="h-20 w-20 shrink-0 rounded-xl bg-white p-1"><img src={table.qr_url} alt={`${table.label} QR code`} className="h-full w-full" /></a>
                                    <div className="min-w-0"><b className="block text-ink">{table.label}</b><span className="block text-xs text-ink-muted">{table.zone} · {table.code}</span><span className={`mt-2 inline-flex rounded-full px-2 py-1 text-[11px] font-bold ${table.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{table.enabled ? 'Ordering enabled' : 'Disabled'}</span></div>
                                </div>)}
                            </div>
                        </div>
                    )}
                    <div className="flex gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950"><Wifi className="mt-0.5 shrink-0" size={18} /><p><b>Customer connection:</b> display a separate Wi-Fi QR beside the menu QR, or configure the router’s captive portal. Standard phone QR scanning cannot reliably join Wi-Fi and open a web address in one scan.</p></div>
                </Card>
            </form>
        </OneGlanceLayout>
    );
}

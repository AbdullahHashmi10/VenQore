import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import StoreTabs from '@/Components/Commerce/StoreTabs';
import { Clock, Coins, CreditCard, LayoutTemplate, MapPin, Save, Store as StoreIcon, Truck } from 'lucide-react';
import { Alert, Button, Card, CardTitle, Field, ImageInput, Switch, inputCls } from '@/Components/Commerce/ui';
import { DAY_LABEL } from '@/lib/commerce';

import PremiumSelect from '@/Components/PremiumSelect';
import V6TimePicker, { getScheduleGuidance } from '@/Components/Commerce/V6TimePicker';
import { Sparkles, Moon, Sun, Info, Coffee, CheckCircle2, ExternalLink, Image as ImageIcon } from 'lucide-react';

function format12Time(val) {
    if (!val) return '';
    const [hStr, mStr] = val.split(':');
    const h24 = parseInt(hStr, 10);
    const m = (parseInt(mStr, 10) || 0).toString().padStart(2, '0');
    if (isNaN(h24)) return val;
    const period = h24 >= 12 ? 'PM' : 'AM';
    let h12 = h24 % 12;
    if (h12 === 0) h12 = 12;
    return `${h12}:${m} ${period}`;
}

const COLOUR_SWATCHES = ['#0BAA8F', '#2563EB', '#7C3AED', '#DB2777', '#DC2626', '#EA580C', '#CA8A04', '#16A34A', '#0F172A'];
function ColourPicker({ value, onChange, defaultLabel }) {
    const ok = /^#[0-9a-fA-F]{6}$/.test(value || '');
    return (
        <div className="flex flex-wrap items-center gap-2.5">
            {COLOUR_SWATCHES.map((c) => (
                <button key={c} type="button" aria-label={`Use colour ${c}`} onClick={() => onChange(c)} style={{ background: c }} className={`h-9 w-9 rounded-full border-2 transition ${(value || '').toLowerCase() === c.toLowerCase() ? 'border-ink ring-2 ring-offset-2 ring-brand-300' : 'border-white shadow'}`} />
            ))}
            <label className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-sm font-semibold cursor-pointer hover:bg-interactive-hover">
                <input type="color" aria-label="Pick a custom colour" value={ok ? value : '#0BAA8F'} onChange={(e) => onChange(e.target.value)} className="h-6 w-6 cursor-pointer border-0 bg-transparent p-0" />
                Custom
            </label>
            <button type="button" onClick={() => onChange('')} className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${value ? 'border-line hover:bg-interactive-hover' : 'border-brand-500 bg-brand-50'}`}>{defaultLabel}</button>
            {ok ? <span className="text-xs font-mono text-ink-muted">{value.toUpperCase()}</span> : null}
        </div>
    );
}

export default function Settings({ store, countries, cities, warehouses, days, timezones = [], store_time_now = '', hours_guidance = null, urls, edit_photos_url: editPhotosUrl = null }) {
    const { data, setData, post, processing, errors } = useForm({
        display_name: store.display_name || '', slug: store.slug || '', description: store.description || '',
        country_id: store.country_id || '', city_id: store.city_id || '', address_line: store.address_line || '', map_url: store.map_url || '', latitude: store.latitude ?? '', longitude: store.longitude ?? '',
        phone: store.phone || '', email: store.email || '',
        timezone: store.timezone || 'Asia/Karachi',
        opening_hours: Object.fromEntries(days.map((d) => [
            d,
            store.opening_hours?.[d]
                ? {
                    open: store.opening_hours[d].open || '',
                    close: store.opening_hours[d].close || '',
                    break_start: store.opening_hours[d].break_start || '',
                    break_end: store.opening_hours[d].break_end || '',
                  }
                : { open: '', close: '', break_start: '', break_end: '' },
        ])),
        supports_pickup: !!store.supports_pickup, supports_delivery: !!store.supports_delivery,
        delivery_charge: store.delivery_charge ?? 0, delivery_note: store.delivery_note || '', min_order_amount: store.min_order_amount ?? 0,
        warehouse_id: store.warehouse_id || '', pricing_mode: store.pricing_mode || 'same', pricing_percent: store.pricing_percent ?? 0,
        accept_cod: !!store.accept_cod, accept_pickup_payment: !!store.accept_pickup_payment, accept_bank_transfer: !!store.accept_bank_transfer,
        bank_instructions: store.bank_instructions || '', accept_deadline_minutes: store.accept_deadline_minutes || 120, logo: null, banner: null, show_images: store.show_images !== false, booking_enabled: !!store.booking_enabled,
        orders_outside_hours: !!store.orders_outside_hours,
        orders_during_break: !!store.orders_during_break,
        announcement: store.announcement || '', prep_minutes: store.prep_minutes || '', delivery_zones: (store.delivery_zones || []).map((z) => ({ name: z.name, fee: z.fee, min_order: z.min_order || 0 })),
        customer_mode: store.customer_mode || 'ordering', catalogue_theme: store.catalogue_theme || 'visual-grid', storefront_template: store.storefront_template || 'auto', brand_color: store.brand_color || '', brand_color_2: store.brand_color_2 || '',
    });
    const cityOptions = cities.filter((c) => String(c.country_id) === String(data.country_id));
    const countrySelectOptions = [{ value: '', label: 'Select country…' }, ...countries.map((c) => ({ value: String(c.id), label: c.name }))];
    const citySelectOptions = [{ value: '', label: 'Select city…' }, ...cityOptions.map((c) => ({ value: String(c.id), label: c.name }))];
    const warehouseSelectOptions = [{ value: '', label: 'Select warehouse…' }, ...warehouses.map((w) => ({ value: String(w.id), label: w.name }))];
    const pricingModeOptions = [
        { value: 'same', label: 'Same as regular price' },
        { value: 'increase', label: 'Increase by a percentage' },
        { value: 'decrease', label: 'Decrease by a percentage' },
    ];
    const hour = (d, k, v) => setData('opening_hours', { ...data.opening_hours, [d]: { ...data.opening_hours[d], [k]: v } });
    const applyPresetAll = (open, close, break_start = '', break_end = '') => {
        setData('opening_hours', Object.fromEntries(days.map((d) => [d, { open, close, break_start, break_end }])));
    };
    const applyBreakToAll = (break_start, break_end) => {
        const updated = { ...data.opening_hours };
        for (const d of days) {
            if (updated[d]?.open && updated[d]?.close) {
                updated[d] = { ...updated[d], break_start, break_end };
            }
        }
        setData('opening_hours', updated);
    };
    const toggleDay = (d) => {
        const current = data.opening_hours[d];
        if (current && (current.open || current.close)) {
            setData('opening_hours', { ...data.opening_hours, [d]: { open: '', close: '', break_start: '', break_end: '' } });
        } else {
            const defaultHours = data.opening_hours[days[0]]?.open
                ? { ...data.opening_hours[days[0]] }
                : { open: '15:00', close: '03:00', break_start: '20:00', break_end: '21:00' };
            setData('opening_hours', { ...data.opening_hours, [d]: defaultHours });
        }
    };
    const submit = (e) => { e.preventDefault(); post(urls.settings_save, { forceFormData: true, preserveScroll: true }); };
    const chk = (k, label, desc) => <Switch checked={data[k]} onChange={(v) => setData(k, v)} label={label} desc={desc} />;
    const copyMonday = () => setData('opening_hours', Object.fromEntries(days.map((d) => [d, { ...data.opening_hours[days[0]] }])));
    const SECTIONS = [['profile', 'Public profile', StoreIcon], ['appearance', 'Catalogue style', LayoutTemplate], ['location', 'Location & contact', MapPin], ['hours', 'Opening hours', Clock], ['fulfilment', 'Pickup & delivery', Truck], ['payment', 'Payment & orders', CreditCard], ['pricing', 'Online pricing', Coins]];

    return (
        <OneGlanceLayout title="Online Store" activeMenu="Online Store">
            <Head title="Online Store settings" />
            <div className="flex flex-col min-h-full min-w-0 gap-6">
            <StoreTabs active="settings" urls={urls} status={store.status} action={{ label: processing ? 'Saving…' : 'Save settings', form: 'store-settings-form', icon: Save, disabled: processing }} />
            <form id="store-settings-form" onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-[1fr_19rem] xl:grid-cols-[1fr_21rem] gap-6 items-start [&>*]:min-w-0">
              <div className="flex flex-col gap-6 min-w-0">
                <Card id="profile" className="space-y-4 scroll-mt-24">
                    <CardTitle icon={StoreIcon} title="Public profile" sub="What customers see at the top of your store" />
                    <Field label="Business name shown to customers" error={errors.display_name}><input className={inputCls} value={data.display_name} onChange={(e) => setData('display_name', e.target.value)} required /></Field>
                    <Field label="Store link" error={errors.slug} hint={`/shop/${data.slug || 'your-store'}`}><input className={inputCls} value={data.slug} onChange={(e) => setData('slug', e.target.value.toLowerCase())} required /></Field>
                    <Field label="Short description" error={errors.description}><textarea className={inputCls} rows={3} value={data.description} onChange={(e) => setData('description', e.target.value)} /></Field>
                    <div className="grid sm:grid-cols-[auto_1fr] gap-4 items-start">
                        <ImageInput label="Logo" current={store.logo_url} error={errors.logo} hint="Square, up to 2 MB" accept="image/*" onChange={(f) => setData('logo', f)} />
                        <ImageInput wide label="Banner" current={store.banner_url} error={errors.banner} hint="Wide JPG, PNG or WebP, up to 3 MB" onChange={(f) => setData('banner', f)} />
                    </div>
                    <Field label="Announcement (shown above your catalogue)" error={errors.announcement} hint="e.g. Closed Friday for Eid. Leave empty for none."><input className={inputCls} maxLength={240} value={data.announcement} onChange={(e) => setData('announcement', e.target.value)} /></Field>
                    {chk('show_images', 'Show product photos', 'Turn off for a compact, text-only catalogue.')}
                    {store.services_on && chk('booking_enabled', 'Accept booking requests', `Customers pick a service and a time at ${store.booking_url}. Each request arrives as a draft job for you to confirm.`)}
                </Card>

                <Card id="appearance" className="space-y-5 scroll-mt-24">
                    <CardTitle icon={LayoutTemplate} tone="plum" title="Catalogue style" sub="Choose what customers can do and how your products are presented" />
                    <Field label="Customer experience" error={errors.customer_mode}>
                        <div className="grid sm:grid-cols-2 gap-3">
                            {[
                                ['ordering', 'Catalogue and ordering', 'Customers can browse, add to cart and place pickup or delivery orders.'],
                                ['catalogue', 'Catalogue only', 'Customers browse products and prices, then contact you to buy.'],
                            ].map(([value, title, copy]) => (
                                <button key={value} type="button" onClick={() => setData('customer_mode', value)} className={`text-left rounded-2xl border p-4 transition ${data.customer_mode === value ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-200' : 'border-line bg-surface hover:bg-interactive-hover'}`}>
                                    <span className="block font-bold text-ink">{title}</span>
                                    <span className="mt-1 block text-sm leading-5 text-ink-muted">{copy}</span>
                                </button>
                            ))}
                        </div>
                    </Field>
                    <Field label="Primary colour" error={errors.brand_color} hint="Main colour for buttons, highlights and badges on your online store and QR menu. Default keeps the template's own colours.">
                        <ColourPicker value={data.brand_color} onChange={(v) => setData('brand_color', v)} defaultLabel="Default" />
                    </Field>
                    <Field label="Secondary colour (optional)" error={errors.brand_color_2} hint="Blends with the primary colour in buttons and headers. Leave on None for a single-colour look.">
                        <ColourPicker value={data.brand_color_2} onChange={(v) => setData('brand_color_2', v)} defaultLabel="None" />
                    </Field>
                    {(() => {
                        // One choice: is this a restaurant/café or a shop? Businesses with the kitchen (Front of House)
                        // module get Restaurant by default; "auto" keeps following that if the modules change later.
                        const rec = store.runs_foh ? 'restaurant' : 'default';
                        const cur = data.storefront_template === 'auto' || !data.storefront_template ? rec : data.storefront_template;
                        const pick = (v) => setData((d) => ({ ...d, storefront_template: v === rec ? 'auto' : v, catalogue_theme: v === 'restaurant' ? 'editorial-ledger' : 'visual-grid' }));
                        return (
                            <Field label="What kind of business is this?" error={errors.storefront_template || errors.catalogue_theme} hint={store.runs_foh ? 'Your kitchen (Front of House) is switched on, so we recommend the restaurant website.' : 'We recommend the shop website. Choose Restaurant & café if you serve food.'}>
                                <div className="grid sm:grid-cols-2 gap-3">
                                    {[
                                        ['restaurant', Coffee, 'Restaurant & café', 'A restaurant website: full-screen food photo, your menu by course, order online, dine in and table booking.'],
                                        ['default', StoreIcon, 'Shop', 'An online shop: product grid with categories and filters, deals and a quick-add cart.'],
                                    ].map(([value, Icon, title, copy]) => (
                                        <button key={value} type="button" aria-pressed={cur === value} onClick={() => pick(value)} className={`relative text-left rounded-2xl border p-4 transition ${cur === value ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-200' : 'border-line bg-surface hover:bg-interactive-hover'}`}>
                                            <span className="flex items-center gap-2 font-bold text-ink"><Icon size={17} />{title}{rec === value && <span className="ml-auto rounded-full bg-brand-500 px-2 py-0.5 text-[11px] font-bold text-white">Recommended</span>}</span>
                                            <span className="mt-1.5 block text-sm leading-5 text-ink-muted">{copy}</span>
                                            {cur === value && <CheckCircle2 size={18} className="absolute right-3 bottom-3 text-brand-500" />}
                                        </button>
                                    ))}
                                </div>
                                <a href={`${store.storefront_url}?template=${cur}`} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-brand-600 hover:underline"><ExternalLink size={14} />Preview this design (owner only)</a>
                                {editPhotosUrl && (
                                    <a href={editPhotosUrl} target="_blank" rel="noreferrer" className="mt-3 flex items-center gap-3 rounded-2xl border border-dashed border-brand-300 bg-brand-50 p-4 transition hover:bg-brand-100">
                                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-500 text-white"><ImageIcon size={18} /></span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block font-bold text-ink">Edit photos on your store</span>
                                            <span className="block text-sm text-ink-muted">Opens your storefront with “Add photo” on every spot — main photo or slideshow, welcome photos, delivery, takeaway and dine in.</span>
                                        </span>
                                        <ExternalLink size={16} className="shrink-0 text-brand-600" />
                                    </a>
                                )}
                            </Field>
                        );
                    })()}
                    {data.customer_mode === 'catalogue' && <Alert kind="info">Your public QR link stays the same. Cart, checkout and ordering controls will be removed from the customer page.</Alert>}
                </Card>

                <Card id="location" className="space-y-4 scroll-mt-24">
                    <CardTitle icon={MapPin} tone="sky" title="Location & contact" sub="Used for the directory and shown to customers" />
                    <div className="grid sm:grid-cols-2 gap-4">
                        <Field label="Country" error={errors.country_id}>
                            <PremiumSelect
                                options={countrySelectOptions}
                                value={String(data.country_id || '')}
                                onChange={(val) => { setData((d) => ({ ...d, country_id: val, city_id: '' })); }}
                                searchable={true}
                                placeholder="Select country…"
                            />
                        </Field>
                        <Field label="City" error={errors.city_id} hint="Only pilot cities are available for now.">
                            <PremiumSelect
                                options={citySelectOptions}
                                value={String(data.city_id || '')}
                                onChange={(val) => setData('city_id', val)}
                                disabled={!data.country_id}
                                searchable={true}
                                placeholder="Select city…"
                            />
                        </Field>
                    </div>
                    <Field label="Address" error={errors.address_line}><input className={inputCls} value={data.address_line} onChange={(e) => setData('address_line', e.target.value)} /></Field>
                    <Field label="Map link (optional)" error={errors.map_url} hint="Paste a Google Maps link and we read the location from it, or set the pin below."><input className={inputCls} value={data.map_url} onChange={(e) => setData('map_url', e.target.value)} placeholder="https://maps.google.com/…" /></Field>
                    <div className="grid sm:grid-cols-3 gap-4 items-end">
                        <Field label="Shop latitude" error={errors.latitude}><input className={inputCls} inputMode="decimal" value={data.latitude} onChange={(e) => setData('latitude', e.target.value)} placeholder="31.5204" /></Field>
                        <Field label="Shop longitude" error={errors.longitude}><input className={inputCls} inputMode="decimal" value={data.longitude} onChange={(e) => setData('longitude', e.target.value)} placeholder="74.3587" /></Field>
                        <button type="button" className="rounded-xl border border-line px-3 py-2 text-sm font-semibold hover:bg-sunken"
                            onClick={() => navigator.geolocation?.getCurrentPosition((p) => { setData('latitude', p.coords.latitude.toFixed(6)); setData('longitude', p.coords.longitude.toFixed(6)); }, () => {}, { enableHighAccuracy: true, timeout: 10000 })}>
                            Use my current location (stand in the shop)
                        </button>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <Field label="Phone" error={errors.phone}><input className={inputCls} value={data.phone} onChange={(e) => setData('phone', e.target.value)} /></Field>
                        <Field label="Email (optional)" error={errors.email}><input className={inputCls} value={data.email} onChange={(e) => setData('email', e.target.value)} /></Field>
                    </div>
                </Card>

                <Card id="hours" className="space-y-5 scroll-mt-24">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line">
                        <CardTitle
                            icon={Clock}
                            tone="amber"
                            title="Opening hours"
                            sub="Set your store's schedule. Overnight shifts (e.g. 3:00 PM to 3:00 AM) crossing midnight are fully supported."
                        />
                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                className="!px-2.5 !py-1 text-xs border border-line"
                                onClick={copyMonday}
                            >
                                Copy {DAY_LABEL[days[0]]} to all
                            </Button>
                        </div>
                    </div>

                    {/* Timezone & Store Local Time Banner */}
                    <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                                    <Clock size={13} />
                                    Store Operating Timezone
                                </div>
                                <div className="text-xs text-ink-muted">
                                    Your hours and order intake are evaluated according to this timezone.
                                    {store_time_now && <span className="font-semibold text-ink ml-1">Current store time: {store_time_now}</span>}
                                </div>
                            </div>
                            <div className="w-full sm:w-72">
                                <PremiumSelect
                                    options={timezones.length > 0 ? timezones : [{ value: data.timezone || 'Asia/Karachi', label: data.timezone || 'Asia/Karachi' }]}
                                    value={data.timezone || 'Asia/Karachi'}
                                    onChange={(tz) => setData('timezone', tz)}
                                    searchable={true}
                                    placeholder="Select timezone…"
                                />
                            </div>
                        </div>

                        {/* Overnight Guidance explanation */}
                        <div className="flex items-start gap-2.5 pt-2 border-t border-amber-200/40 dark:border-amber-800/30 text-xs text-amber-900 dark:text-amber-200/90 leading-relaxed">
                            <Info size={15} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                            <div>
                                <b>How Overnight Shifts Work:</b> When a closing time is set earlier in the clock than the opening time (for example, <b>3:00 PM</b> to <b>3:00 AM</b>), the system recognizes this as an <b>overnight schedule</b> spanning midnight. The store will remain <b>OPEN</b> all evening and through the night until 3:00 AM the following morning.
                            </div>
                        </div>
                    </div>

                    {/* Quick Presets Bar */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider mr-1">Quick Presets:</span>
                        <button
                            type="button"
                            onClick={() => applyPresetAll('15:00', '03:00', '20:00', '21:00')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/80 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-medium transition-all"
                        >
                            <Moon size={12} />
                            Evening & Night + Dinner Break (3:00 PM – 3:00 AM · Break 8:00 PM – 9:00 PM)
                        </button>
                        <button
                            type="button"
                            onClick={() => applyPresetAll('09:00', '21:00', '13:00', '14:00')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-line bg-surface-2 hover:bg-surface text-ink text-xs font-medium transition-all"
                        >
                            <Sun size={12} />
                            Standard Retail (9:00 AM – 9:00 PM · Break 1:00 PM – 2:00 PM)
                        </button>
                        <button
                            type="button"
                            onClick={() => applyPresetAll('00:00', '00:00', '', '')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-line bg-surface-2 hover:bg-surface text-ink text-xs font-medium transition-all"
                        >
                            <Sparkles size={12} />
                            24/7 All Day
                        </button>
                        <button
                            type="button"
                            onClick={() => applyBreakToAll('20:00', '21:00')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/70 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-xs font-medium transition-all ml-auto"
                        >
                            <Coffee size={12} />
                            Apply 8–9 PM Break to Open Days
                        </button>
                    </div>

                    {/* Schedule Day List */}
                    <div className="divide-y divide-line/60 rounded-2xl border border-line overflow-hidden bg-surface">
                        {days.map((d) => {
                            const current = data.opening_hours[d] || { open: '', close: '', break_start: '', break_end: '' };
                            const guidance = getScheduleGuidance(current.open, current.close);
                            const isDayOpen = !!(current.open && current.close);
                            const hasBreak = !!(current.break_start || current.break_end);

                            return (
                                <div key={d} className="p-3.5 hover:bg-surface-2/40 transition-colors">
                                    <div className="grid grid-cols-1 sm:grid-cols-[7rem_1fr_1fr_auto] items-center gap-3">
                                        {/* Day name & toggle */}
                                        <div className="flex flex-wrap items-center justify-between gap-y-2 sm:justify-start gap-2">
                                            <span className="font-semibold text-sm text-ink">{DAY_LABEL[d]}</span>
                                            <button
                                                type="button"
                                                onClick={() => toggleDay(d)}
                                                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full transition-colors ${
                                                    isDayOpen
                                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                        : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 hover:bg-neutral-200'
                                                }`}
                                            >
                                                {isDayOpen ? 'Open' : 'Closed'}
                                            </button>
                                        </div>

                                        {/* Opens At */}
                                        <div>
                                            <label className="block text-[11px] text-ink-muted font-medium mb-1 sm:hidden">
                                                Opens at
                                            </label>
                                            <V6TimePicker
                                                value={current.open || ''}
                                                onChange={(val) => hour(d, 'open', val)}
                                                placeholder="Opens at…"
                                                isCloseTime={false}
                                                label={`${DAY_LABEL[d]} opens at`}
                                            />
                                        </div>

                                        {/* Closes At */}
                                        <div>
                                            <label className="block text-[11px] text-ink-muted font-medium mb-1 sm:hidden">
                                                Closes at
                                            </label>
                                            <V6TimePicker
                                                value={current.close || ''}
                                                onChange={(val) => hour(d, 'close', val)}
                                                placeholder="Closes at…"
                                                isCloseTime={true}
                                                label={`${DAY_LABEL[d]} closes at`}
                                            />
                                        </div>

                                        {/* Schedule Status Badge */}
                                        <div className="hidden sm:flex items-center justify-end min-w-[5rem]">
                                            {guidance.status === 'overnight' ? (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                                                    <Moon size={11} />
                                                    Overnight
                                                </span>
                                            ) : guidance.status === 'daytime' ? (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                                                    <Sun size={11} />
                                                    Open
                                                </span>
                                            ) : guidance.status === 'all_day' ? (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/60">
                                                    <Sparkles size={11} />
                                                    24 Hours
                                                </span>
                                            ) : (
                                                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                                                    Closed
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Schedule guidance summary note */}
                                    <div className="mt-2 text-xs flex items-center gap-1.5 pl-0.5">
                                        {guidance.status === 'overnight' && (
                                            <span className="text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                                                {guidance.summary}
                                            </span>
                                        )}
                                        {guidance.status === 'daytime' && (
                                            <span className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                                {guidance.label}
                                            </span>
                                        )}
                                        {guidance.status === 'all_day' && (
                                            <span className="text-sky-700 dark:text-sky-400 font-medium flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                                                Store operates around the clock (24 hours).
                                            </span>
                                        )}
                                        {guidance.status === 'incomplete' && (
                                            <span className="text-amber-600 dark:text-amber-400 font-medium">
                                                ⚠️ Incomplete: set both opening and closing times, or leave both blank for closed.
                                            </span>
                                        )}
                                        {guidance.status === 'closed' && (
                                            <span className="text-ink-muted">
                                                Closed all day. Customers cannot place orders for this day unless advance orders are enabled.
                                            </span>
                                        )}
                                    </div>

                                    {/* Mid-Shift Break Configuration per day */}
                                    {isDayOpen && (
                                        <div className="mt-2.5 pt-2 border-t border-line/40 space-y-2">
                                            <div className="flex items-center justify-between flex-wrap gap-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-semibold text-ink-muted flex items-center gap-1">
                                                        <Coffee size={12} className="text-amber-600 dark:text-amber-400" />
                                                        Mid-Shift Break:
                                                    </span>
                                                    {(current.break_start && current.break_end) ? (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
                                                            {format12Time(current.break_start)} – {format12Time(current.break_end)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[11px] text-ink-muted">None (continuous shift)</span>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {(current.break_start && current.break_end) && (
                                                        <button
                                                            type="button"
                                                            onClick={() => applyBreakToAll(current.break_start, current.break_end)}
                                                            className="text-[11px] text-ink-muted hover:text-ink underline"
                                                        >
                                                            Copy this break to all days
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (current.break_start || current.break_end) {
                                                                setData('opening_hours', { ...data.opening_hours, [d]: { ...current, break_start: '', break_end: '' } });
                                                            } else {
                                                                setData('opening_hours', { ...data.opening_hours, [d]: { ...current, break_start: '20:00', break_end: '21:00' } });
                                                            }
                                                        }}
                                                        className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                                                    >
                                                        {(current.break_start || current.break_end) ? 'Remove break' : '+ Add mid-shift break'}
                                                    </button>
                                                </div>
                                            </div>

                                            {(current.break_start || current.break_end) && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-2.5 rounded-xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30">
                                                    <div>
                                                        <label className="block text-[11px] text-amber-900 dark:text-amber-200 font-medium mb-1">
                                                            Break starts at
                                                        </label>
                                                        <V6TimePicker
                                                            value={current.break_start || ''}
                                                            onChange={(val) => hour(d, 'break_start', val)}
                                                            placeholder="Break starts…"
                                                            label={`${DAY_LABEL[d]} break starts`}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] text-amber-900 dark:text-amber-200 font-medium mb-1">
                                                            Break ends at (reopens)
                                                        </label>
                                                        <V6TimePicker
                                                            value={current.break_end || ''}
                                                            onChange={(val) => hour(d, 'break_end', val)}
                                                            placeholder="Break ends…"
                                                            label={`${DAY_LABEL[d]} break ends`}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </Card>

                <Card id="fulfilment" className="space-y-4 scroll-mt-24">
                    <CardTitle icon={Truck} tone="violet" title="Pickup & delivery" />
                    <div className="divide-y divide-line">{chk('supports_pickup', 'Customer pickup', 'Customers collect from your address.')}{chk('supports_delivery', 'Delivery by you', 'You deliver; set a flat fee or delivery areas below.')}</div>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <Field label="Flat delivery charge" error={errors.delivery_charge}><input type="number" min="0" step="0.01" className={inputCls} value={data.delivery_charge} onChange={(e) => setData('delivery_charge', e.target.value)} /></Field>
                        <Field label="Minimum order (0 = none)" error={errors.min_order_amount}><input type="number" min="0" step="0.01" className={inputCls} value={data.min_order_amount} onChange={(e) => setData('min_order_amount', e.target.value)} /></Field>
                    </div>
                    <div className="rounded-2xl border border-line bg-surface-2/40 p-4 space-y-3">
                        <div className="text-xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                            <Clock size={13} className="text-brand-600" />
                            Order Intake Policies
                        </div>
                        <div className="space-y-3 divide-y divide-line/60">
                            <div className="pt-1 first:pt-0">
                                {chk('orders_outside_hours', 'Accept advance orders when closed', 'Customers can browse and submit orders even when the shop is closed. Order preparation starts when your next shift opens.')}
                            </div>
                            <div className="pt-3">
                                {chk('orders_during_break', 'Accept orders during mid-shift breaks', 'Allow orders while your team is on scheduled break (queued and prepared as soon as the break ends). Off by default.')}
                            </div>
                        </div>
                    </div>
                    <Field label="Usual preparation time in minutes (optional)" error={errors.prep_minutes} hint="Shown to customers as an estimate, never a promise."><input type="number" min="1" max="1440" className={inputCls} value={data.prep_minutes} onChange={(e) => setData('prep_minutes', e.target.value)} /></Field>
                    <div className="space-y-2">
                        <div className="text-sm font-medium">Delivery areas (optional)</div>
                        <p className="text-xs text-ink-muted">If you add areas, customers must pick one. Each area sets its own fee and minimum order, and addresses outside them are not accepted. Leave empty to use the flat charge above.</p>
                        {errors.delivery_zones && <p className="text-xs text-red-600" role="alert">{errors.delivery_zones}</p>}
                        {data.delivery_zones.map((z, i) => (
                            <div key={i} className="grid grid-cols-[1fr_6rem_6rem_auto] gap-2 items-center">
                                <input className={inputCls} placeholder="Area name" aria-label="Area name" maxLength={60} value={z.name} onChange={(e) => setData('delivery_zones', data.delivery_zones.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                                <input className={inputCls} type="number" min="0" step="0.01" placeholder="Fee" aria-label="Fee" value={z.fee} onChange={(e) => setData('delivery_zones', data.delivery_zones.map((x, j) => (j === i ? { ...x, fee: e.target.value } : x)))} />
                                <input className={inputCls} type="number" min="0" step="0.01" placeholder="Min order" aria-label="Minimum order" value={z.min_order} onChange={(e) => setData('delivery_zones', data.delivery_zones.map((x, j) => (j === i ? { ...x, min_order: e.target.value } : x)))} />
                                <button type="button" className="text-sm underline" onClick={() => setData('delivery_zones', data.delivery_zones.filter((_, j) => j !== i))}>Remove</button>
                            </div>
                        ))}
                        {data.delivery_zones.length < 20 && <Button type="button" variant="secondary" onClick={() => setData('delivery_zones', [...data.delivery_zones, { name: '', fee: 0, min_order: 0 }])}>Add delivery area</Button>}
                    </div>
                    <Field label="Delivery instructions shown to customers" error={errors.delivery_note}><input className={inputCls} value={data.delivery_note} onChange={(e) => setData('delivery_note', e.target.value)} placeholder="e.g. We deliver within 5 km" /></Field>
                </Card>

                <Card id="payment" className="space-y-4 scroll-mt-24">
                    <CardTitle icon={CreditCard} tone="emerald" title="Payment & orders" sub="How customers pay and how long you have to accept" />
                    <div className="divide-y divide-line">{chk('accept_cod', 'Cash on delivery', 'Delivery orders only.')}{chk('accept_pickup_payment', 'Pay at pickup', 'Pickup orders only.')}{chk('accept_bank_transfer', 'Bank transfer', 'Customer reports the transfer; you verify it before marking paid.')}</div>
                    {data.accept_bank_transfer && <Field label="Bank transfer instructions" error={errors.bank_instructions}><textarea className={inputCls} rows={3} value={data.bank_instructions} onChange={(e) => setData('bank_instructions', e.target.value)} /></Field>}
                    <Field label="Fulfilment warehouse" error={errors.warehouse_id} hint="Online orders reserve and deduct stock from this warehouse.">
                        <PremiumSelect
                            options={warehouseSelectOptions}
                            value={String(data.warehouse_id || '')}
                            onChange={(val) => setData('warehouse_id', val)}
                            searchable={true}
                            placeholder="Select warehouse…"
                        />
                    </Field>
                    <Field label="Minutes to accept an order before it expires" error={errors.accept_deadline_minutes}><input type="number" min="15" max="1440" className={inputCls} value={data.accept_deadline_minutes} onChange={(e) => setData('accept_deadline_minutes', e.target.value)} /></Field>
                </Card>

                <Card id="pricing" className="space-y-4 scroll-mt-24">
                    <CardTitle icon={Coins} tone="rose" title="Online pricing" sub="Applies to products without their own online price. Your regular price never changes." />
                    <div className="grid sm:grid-cols-2 gap-4">
                        <Field label="Default online price" error={errors.pricing_mode}>
                            <PremiumSelect
                                options={pricingModeOptions}
                                value={data.pricing_mode || 'same'}
                                onChange={(val) => setData('pricing_mode', val)}
                                searchable={false}
                            />
                        </Field>
                        {data.pricing_mode !== 'same' && <Field label="Percentage" error={errors.pricing_percent}><input type="number" min="0" step="0.01" className={inputCls} value={data.pricing_percent} onChange={(e) => setData('pricing_percent', e.target.value)} /></Field>}
                    </div>
                    {data.pricing_mode !== 'same' && <Alert kind="info">Example: a Rs 1,000 product shows as Rs {(1000 * (1 + (data.pricing_mode === 'increase' ? 1 : -1) * Number(data.pricing_percent || 0) / 100)).toLocaleString(undefined, { maximumFractionDigits: 2 })} online.</Alert>}
                </Card>

              </div>
              <aside className="hidden lg:flex flex-col gap-3 sticky top-4">
                {/* Store Live Hub Card */}
                <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm space-y-3.5">
                    <div className="flex items-start gap-3">
                        {store.logo_url ? (
                            <img src={store.logo_url} alt="" className="h-11 w-11 rounded-xl object-cover border border-line shrink-0" />
                        ) : (
                            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white font-bold shrink-0 text-base shadow-sm">
                                {(data.display_name || '?').charAt(0).toUpperCase()}
                            </span>
                        )}
                        <div className="min-w-0 flex-1">
                            <div className="font-bold text-ink truncate text-sm">{data.display_name || 'Your business'}</div>
                            <div className="text-xs text-ink-muted truncate font-mono">/shop/{data.slug || 'your-store'}</div>
                        </div>
                    </div>

                    <a
                        href={`/shop/${data.slug || store.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl bg-surface-2 hover:bg-surface-3 border border-line text-ink font-semibold text-xs shadow-sm transition-all"
                    >
                        <ExternalLink size={13} />
                        View Live Store
                    </a>

                    <div className="border-t border-line/70 pt-3 space-y-2.5 text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-y-2">
                            <span className="text-ink-muted font-medium">Store Status</span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-[11px] ${store.status === 'published' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${store.status === 'published' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                {store.status === 'published' ? 'Published' : 'Draft / Unpublished'}
                            </span>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-y-2">
                            <span className="text-ink-muted font-medium">Order Intake</span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-[11px] ${store.intake_paused ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'}`}>
                                {store.intake_paused ? 'Intake Paused' : 'Intake Active'}
                            </span>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-y-2">
                            <span className="text-ink-muted font-medium">Live Shift</span>
                            <span className="font-semibold text-ink text-right">
                                {hours_guidance?.badge || (store.open_now ? 'Open now' : 'Closed now')}
                            </span>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-y-2">
                            <span className="text-ink-muted font-medium">Store Time</span>
                            <span className="font-mono text-ink text-[11px] font-semibold">
                                {store_time_now ? store_time_now.split('(')[0].trim() : '—'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Operations & Policy Highlights */}
                <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm space-y-3 text-xs">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                        <CheckCircle2 size={13} className="text-brand-600" />
                        Config Summary
                    </div>

                    <div className="space-y-2.5 divide-y divide-line/60">
                        <div className="flex flex-wrap items-center justify-between gap-y-2 pt-1 first:pt-0">
                            <span className="text-ink-muted">Timezone</span>
                            <span className="font-medium text-ink truncate max-w-[120px]">{data.timezone}</span>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-y-2 pt-2">
                            <span className="text-ink-muted">Closed Orders</span>
                            <span className={`font-semibold ${data.orders_outside_hours ? 'text-emerald-600' : 'text-neutral-500'}`}>
                                {data.orders_outside_hours ? 'Allowed' : 'Blocked'}
                            </span>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-y-2 pt-2">
                            <span className="text-ink-muted">Break Orders</span>
                            <span className={`font-semibold ${data.orders_during_break ? 'text-emerald-600' : 'text-neutral-500'}`}>
                                {data.orders_during_break ? 'Allowed' : 'Blocked'}
                            </span>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-y-2 pt-2">
                            <span className="text-ink-muted">Fulfilment</span>
                            <div className="flex items-center gap-1">
                                {data.supports_pickup && <span className="bg-surface-2 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-line">Pickup</span>}
                                {data.supports_delivery && <span className="bg-surface-2 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-line">Delivery</span>}
                                {!data.supports_pickup && !data.supports_delivery && <span className="text-rose-500 font-medium text-[11px]">None set</span>}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-y-2 pt-2">
                            <span className="text-ink-muted">Payments</span>
                            <div className="flex items-center gap-1">
                                {data.accept_cod && <span className="bg-surface-2 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-line">COD</span>}
                                {data.accept_pickup_payment && <span className="bg-surface-2 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-line">Pickup</span>}
                                {data.accept_bank_transfer && <span className="bg-surface-2 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-line">Bank</span>}
                                {!data.accept_cod && !data.accept_pickup_payment && !data.accept_bank_transfer && <span className="text-rose-500 font-medium text-[11px]">None set</span>}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-y-2 pt-2">
                            <span className="text-ink-muted">Warehouse</span>
                            <span className="font-medium text-ink truncate max-w-[120px]">
                                {warehouses.find(w => String(w.id) === String(data.warehouse_id))?.name || 'Unassigned'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Section Quick Jump */}
                <nav aria-label="Settings sections" className="rounded-2xl border border-line bg-surface p-2 shadow-sm space-y-0.5">
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                        Page Sections
                    </div>
                    {SECTIONS.map(([id, label, SecIcon]) => (
                        <a key={id} href={`#${id}`} className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-ink-secondary hover:bg-interactive-hover hover:text-ink font-medium transition-colors">
                            <SecIcon size={14} aria-hidden="true" />
                            {label}
                        </a>
                    ))}
                </nav>
              </aside>
              {Object.keys(errors).length > 0 && <div className="lg:col-span-2"><Alert kind="error">Please fix the highlighted fields, then save again.</Alert></div>}
            </form>
            </div>
        </OneGlanceLayout>
    );
}

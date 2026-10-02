import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import StoreTabs from '@/Components/Commerce/StoreTabs';
import { Alert, Button, Card, Field, inputCls } from '@/Components/Commerce/ui';
import { DAY_LABEL } from '@/lib/commerce';

export default function Settings({ store, countries, cities, warehouses, days, urls }) {
    const { data, setData, post, processing, errors } = useForm({
        display_name: store.display_name || '', slug: store.slug || '', description: store.description || '',
        country_id: store.country_id || '', city_id: store.city_id || '', address_line: store.address_line || '', map_url: store.map_url || '',
        phone: store.phone || '', email: store.email || '',
        opening_hours: Object.fromEntries(days.map((d) => [d, store.opening_hours?.[d] || { open: '', close: '' }])),
        supports_pickup: !!store.supports_pickup, supports_delivery: !!store.supports_delivery,
        delivery_charge: store.delivery_charge ?? 0, delivery_note: store.delivery_note || '', min_order_amount: store.min_order_amount ?? 0,
        warehouse_id: store.warehouse_id || '', pricing_mode: store.pricing_mode || 'same', pricing_percent: store.pricing_percent ?? 0,
        accept_cod: !!store.accept_cod, accept_pickup_payment: !!store.accept_pickup_payment, accept_bank_transfer: !!store.accept_bank_transfer,
        bank_instructions: store.bank_instructions || '', accept_deadline_minutes: store.accept_deadline_minutes || 120, logo: null,
    });
    const cityOptions = cities.filter((c) => String(c.country_id) === String(data.country_id));
    const hour = (d, k, v) => setData('opening_hours', { ...data.opening_hours, [d]: { ...data.opening_hours[d], [k]: v } });
    const submit = (e) => { e.preventDefault(); post(urls.settings_save, { forceFormData: true, preserveScroll: true }); };
    const chk = (k, label) => <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={data[k]} onChange={(e) => setData(k, e.target.checked)} />{label}</label>;

    return (
        <OneGlanceLayout title="Online Store" activeMenu="Marketing">
            <Head title="Online Store settings" />
            <h1 className="text-2xl font-bold text-ink mb-4">Online Store</h1>
            <StoreTabs active="settings" urls={urls} status={store.status} />
            <form onSubmit={submit} className="space-y-6 max-w-3xl">
                <Card className="space-y-4">
                    <h2 className="font-semibold">Public profile</h2>
                    <Field label="Business name shown to customers" error={errors.display_name}><input className={inputCls} value={data.display_name} onChange={(e) => setData('display_name', e.target.value)} required /></Field>
                    <Field label="Store link" error={errors.slug} hint={`/shop/${data.slug || 'your-store'}`}><input className={inputCls} value={data.slug} onChange={(e) => setData('slug', e.target.value.toLowerCase())} required /></Field>
                    <Field label="Short description" error={errors.description}><textarea className={inputCls} rows={3} value={data.description} onChange={(e) => setData('description', e.target.value)} /></Field>
                    <Field label="Logo" error={errors.logo} hint={store.logo_url ? 'A logo is set. Choose a file to replace it.' : 'PNG or JPG, up to 2 MB.'}><input type="file" accept="image/*" onChange={(e) => setData('logo', e.target.files[0] || null)} /></Field>
                </Card>

                <Card className="space-y-4">
                    <h2 className="font-semibold">Location &amp; contact</h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <Field label="Country" error={errors.country_id}><select className={inputCls} value={data.country_id} onChange={(e) => { setData((d) => ({ ...d, country_id: e.target.value, city_id: '' })); }}><option value="">Select…</option>{countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
                        <Field label="City" error={errors.city_id} hint="Only pilot cities are available for now."><select className={inputCls} value={data.city_id} onChange={(e) => setData('city_id', e.target.value)} disabled={!data.country_id}><option value="">Select…</option>{cityOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
                    </div>
                    <Field label="Address" error={errors.address_line}><input className={inputCls} value={data.address_line} onChange={(e) => setData('address_line', e.target.value)} /></Field>
                    <Field label="Map link (optional)" error={errors.map_url}><input className={inputCls} value={data.map_url} onChange={(e) => setData('map_url', e.target.value)} placeholder="https://maps.google.com/…" /></Field>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <Field label="Phone" error={errors.phone}><input className={inputCls} value={data.phone} onChange={(e) => setData('phone', e.target.value)} /></Field>
                        <Field label="Email (optional)" error={errors.email}><input className={inputCls} value={data.email} onChange={(e) => setData('email', e.target.value)} /></Field>
                    </div>
                </Card>

                <Card className="space-y-3">
                    <h2 className="font-semibold">Opening hours</h2>
                    <p className="text-xs text-ink-muted">Leave a day blank for closed. Times use your business timezone. A closing time earlier than the opening time means it closes after midnight.</p>
                    {days.map((d) => (
                        <div key={d} className="grid grid-cols-[6rem_1fr_1fr] items-center gap-3 text-sm">
                            <span>{DAY_LABEL[d]}</span>
                            <input type="time" className={inputCls} aria-label={`${DAY_LABEL[d]} opens`} value={data.opening_hours[d].open || ''} onChange={(e) => hour(d, 'open', e.target.value)} />
                            <input type="time" className={inputCls} aria-label={`${DAY_LABEL[d]} closes`} value={data.opening_hours[d].close || ''} onChange={(e) => hour(d, 'close', e.target.value)} />
                        </div>
                    ))}
                </Card>

                <Card className="space-y-4">
                    <h2 className="font-semibold">Fulfilment &amp; payment</h2>
                    <div className="flex flex-wrap gap-6">{chk('supports_pickup', 'Customer pickup')}{chk('supports_delivery', 'Delivery by you')}</div>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <Field label="Flat delivery charge" error={errors.delivery_charge}><input type="number" min="0" step="0.01" className={inputCls} value={data.delivery_charge} onChange={(e) => setData('delivery_charge', e.target.value)} /></Field>
                        <Field label="Minimum order (0 = none)" error={errors.min_order_amount}><input type="number" min="0" step="0.01" className={inputCls} value={data.min_order_amount} onChange={(e) => setData('min_order_amount', e.target.value)} /></Field>
                    </div>
                    <Field label="Delivery instructions shown to customers" error={errors.delivery_note}><input className={inputCls} value={data.delivery_note} onChange={(e) => setData('delivery_note', e.target.value)} placeholder="e.g. We deliver within 5 km" /></Field>
                    <div className="flex flex-wrap gap-6">{chk('accept_cod', 'Cash on delivery')}{chk('accept_pickup_payment', 'Pay at pickup')}{chk('accept_bank_transfer', 'Bank transfer (you verify it)')}</div>
                    {data.accept_bank_transfer && <Field label="Bank transfer instructions" error={errors.bank_instructions}><textarea className={inputCls} rows={3} value={data.bank_instructions} onChange={(e) => setData('bank_instructions', e.target.value)} /></Field>}
                    <Field label="Fulfilment warehouse" error={errors.warehouse_id} hint="Online orders reserve and deduct stock from this warehouse."><select className={inputCls} value={data.warehouse_id} onChange={(e) => setData('warehouse_id', e.target.value)}><option value="">Select…</option>{warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</select></Field>
                    <Field label="Minutes to accept an order before it expires" error={errors.accept_deadline_minutes}><input type="number" min="15" max="1440" className={inputCls} value={data.accept_deadline_minutes} onChange={(e) => setData('accept_deadline_minutes', e.target.value)} /></Field>
                </Card>

                <Card className="space-y-4">
                    <h2 className="font-semibold">Online pricing</h2>
                    <p className="text-xs text-ink-muted">Applies to products without their own online price. Your regular retail price is never changed.</p>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <Field label="Default online price" error={errors.pricing_mode}><select className={inputCls} value={data.pricing_mode} onChange={(e) => setData('pricing_mode', e.target.value)}><option value="same">Same as regular price</option><option value="increase">Increase by a percentage</option><option value="decrease">Decrease by a percentage</option></select></Field>
                        {data.pricing_mode !== 'same' && <Field label="Percentage" error={errors.pricing_percent}><input type="number" min="0" step="0.01" className={inputCls} value={data.pricing_percent} onChange={(e) => setData('pricing_percent', e.target.value)} /></Field>}
                    </div>
                    {data.pricing_mode !== 'same' && <Alert kind="info">Example: a Rs 1,000 product shows as Rs {(1000 * (1 + (data.pricing_mode === 'increase' ? 1 : -1) * Number(data.pricing_percent || 0) / 100)).toLocaleString(undefined, { maximumFractionDigits: 2 })} online.</Alert>}
                </Card>

                <Button type="submit" disabled={processing} onClick={() => {}}>{processing ? 'Saving…' : 'Save settings'}</Button>
            </form>
        </OneGlanceLayout>
    );
}

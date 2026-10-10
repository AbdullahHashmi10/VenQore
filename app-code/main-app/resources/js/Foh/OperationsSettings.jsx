import React, { useState } from 'react';
import axios from 'axios';
import { router, Link } from '@inertiajs/react';

/** FOH operations inside the copied POS settings workspace. */
export default function OperationsSettings({ settings, storeSettings, storeSlug, addToast }) {
    const [values, setValues] = useState(settings);
    const [busy, setBusy] = useState(false);
    const save = async (key, value) => {
        setBusy(true);
        try {
            const { data } = await axios.post(route('store.foh.settings.save', { store_slug: storeSlug }), { [key]: value });
            setValues(data.fohSettings || { ...values, [key]: value });
            router.reload({ only: ['fohSettings', 'tabs', 'settings'], preserveState: true, preserveScroll: true });
        } catch (error) { addToast?.(error?.response?.data?.message || 'FOH settings could not be saved.', 'error'); }
        finally { setBusy(false); }
    };
    return <div className="vqs-page">
        <h3>Restaurant service</h3><p className="text-ink-muted mb-4">Choose the work this restaurant handles. Changes apply to every FOH device.</p>
        <div className="foh-set-box">
            {['tables', 'takeaway', 'delivery'].map(key => <label className="foh-set-row" key={key}><span className="capitalize font-semibold">{key}</span>
                <input type="checkbox" checked={!!values[key]} disabled={busy} onChange={e => save(key, e.target.checked)} /></label>)}
            <label className="foh-set-row"><span>Takeaway flow</span><select disabled={busy} value={values.takeaway_flow} onChange={e => save('takeaway_flow', e.target.value)}><option value="pay_first">Pay, then prepare</option><option value="fire_first">Prepare, then pay</option></select></label>
            <label className="foh-set-row"><span>Require takeaway name</span><input type="checkbox" disabled={busy} checked={!!values.takeaway_name_required} onChange={e => save('takeaway_name_required', e.target.checked)} /></label>
            <label className="foh-set-row"><span>Stock deduction</span><select disabled={busy} value={values.stock || 'per_item'} onChange={e => save('stock', e.target.value)}><option value="never">Never deduct stock</option><option value="per_item">Only products marked to track</option></select></label>
            <label className="foh-set-row"><span>Default delivery fee</span><input type="number" min="0" defaultValue={values.delivery_fee || 0} disabled={busy} onBlur={e => save('delivery_fee', Number(e.target.value))} /></label>
            <label className="foh-set-row"><span>Default covers</span><input type="number" min="1" max="99" defaultValue={values.default_covers || 2} disabled={busy} onBlur={e => save('default_covers', Number(e.target.value))} /></label>
            <label className="foh-set-row"><span>Service charge (%)</span><input type="number" min="0" max="100" defaultValue={storeSettings?.service_charge_percent || 0} disabled={busy} onBlur={e => save('service_charge_percent', Number(e.target.value))} /></label>
        </div>
        <div className="flex flex-wrap gap-3 mt-5">
            <Link className="vqt-btn" href={route('store.tables.plan', { store_slug: storeSlug })}>Floor plan builder</Link>
            <Link className="vqt-btn" href={route('store.foh.settings', { store_slug: storeSlug })}>All restaurant settings</Link>
        </div>
    </div>;
}

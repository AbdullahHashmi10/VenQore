import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import { Utensils, ShoppingBag, Bike, Save, PackageX } from 'lucide-react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { toast } from '@/Foh/useFoh';
import '@/Foh/foh.css';

const Switch = ({ on, onChange, label, hint, Icon }) => (
    <label className="foh-set-row">
        <span className="foh-set-l">{Icon && <Icon size={16} aria-hidden="true" />}<b>{label}</b>{hint && <small>{hint}</small>}</span>
        <input type="checkbox" role="switch" checked={!!on} onChange={(e) => onChange(e.target.checked)} />
    </label>
);

/** One page for how front of house runs: what is switched on, stock behaviour, the takeaway flow, kitchen options. */
export default function FohSettings({ storeSlug, fohSettings, extra, categories = [], untrackedCount: untracked0 = 0 }) {
    const [f, setF] = useState({ ...fohSettings });
    const [x, setX] = useState({ ...extra });
    const [saving, setSaving] = useState(false);
    const [picked, setPicked] = useState([]);
    const [untracked, setUntracked] = useState(untracked0);
    const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
    const setE = (k) => (v) => setX((s) => ({ ...s, [k]: v }));
    const flag = (k) => x[k] === '1';

    const save = async () => {
        setSaving(true);
        try {
            await axios.post(route('store.foh.settings.save', { store_slug: storeSlug }), {
                tables: !!f.tables, takeaway: !!f.takeaway, delivery: !!f.delivery,
                stock: f.stock, takeaway_flow: f.takeaway_flow, default_tab: f.default_tab,
                takeaway_collect: !!f.takeaway_collect, takeaway_autoclose: !!f.takeaway_autoclose,
                service_charge_percent: Number(x.service_charge_percent) || 0,
                prepares_orders: x.prepares_orders, kds_auto_print: x.kds_auto_print, kot_enabled: x.kot_enabled,
                kot_show_prices: x.kot_show_prices, pos_sound_alert: x.pos_sound_alert,
            });
            toast('Front of house settings saved', 'success');
        } catch (e) {
            toast(e?.response?.data?.message || 'Could not save the settings', 'error');
        } finally { setSaving(false); }
    };

    const untrack = async (track) => {
        if (!picked.length) return;
        try {
            const { data } = await axios.post(route('store.foh.settings.untrack', { store_slug: storeSlug }), { category_ids: picked, track });
            setUntracked(data.untrackedCount);
            toast(`${data.changed} item${data.changed === 1 ? '' : 's'} updated`, 'success');
            setPicked([]);
        } catch (e) { toast('Could not update those categories', 'error'); }
    };

    return (
        <OneGlanceLayout title="FOH Settings" activeMenu="Restaurant">
            <Head title="FOH Settings" />
            <div className="foh-set">
                <header className="foh-set-h">
                    <h1>Front of house settings</h1>
                    <button type="button" className="vqt-btn vqt-btn-go" onClick={save} disabled={saving}><Save size={16} /> {saving ? 'Saving…' : 'Save'}</button>
                </header>

                <section>
                    <h2>What you serve</h2>
                    <Switch Icon={Utensils} label="Tables" hint="Dine-in with a floor plan" on={f.tables} onChange={set('tables')} />
                    <Switch Icon={ShoppingBag} label="Takeaway" hint="Orders handed over at the counter" on={f.takeaway} onChange={set('takeaway')} />
                    <Switch Icon={Bike} label="Delivery" hint="Orders sent out with a rider" on={f.delivery} onChange={set('delivery')} />
                    <label className="foh-set-row"><span className="foh-set-l"><b>Open on</b><small>The tab FOH starts on</small></span>
                        <select value={f.default_tab} onChange={(e) => set('default_tab')(e.target.value)}>
                            <option value="auto">Automatic</option><option value="overview">Overview</option><option value="tables">Tables</option>
                            <option value="takeaway">Takeaway</option><option value="delivery">Delivery</option>
                        </select></label>
                </section>

                <section>
                    <h2>Stock</h2>
                    <label className="foh-set-row"><span className="foh-set-l"><b>FOH sales and stock</b><small>Made-to-order kitchens usually do not count every plate</small></span>
                        <select value={f.stock} onChange={(e) => set('stock')(e.target.value)}>
                            <option value="per_item">Follow each item's stock setting</option>
                            <option value="never">Never deduct stock from FOH sales</option>
                        </select></label>
                    <div className="foh-set-box">
                        <b><PackageX size={15} aria-hidden="true" /> Don't track stock for whole categories</b>
                        <small>{untracked} item{untracked === 1 ? '' : 's'} currently untracked.</small>
                        <div className="foh-chips">
                            {categories.map((c) => (
                                <button key={c.id} type="button" data-on={picked.includes(c.id) ? '1' : '0'}
                                    onClick={() => setPicked((p) => (p.includes(c.id) ? p.filter((i) => i !== c.id) : [...p, c.id]))}>{c.name} <i>{c.products_count}</i></button>
                            ))}
                        </div>
                        <div className="foh-set-acts">
                            <button type="button" className="vqt-btn" disabled={!picked.length} onClick={() => untrack(false)}>Stop tracking</button>
                            <button type="button" className="vqt-btn" disabled={!picked.length} onClick={() => untrack(true)}>Track again</button>
                        </div>
                    </div>
                </section>

                <section>
                    <h2>Takeaway and delivery</h2>
                    <label className="foh-set-row"><span className="foh-set-l"><b>Flow</b><small>Pay before the kitchen starts, or send to the kitchen first</small></span>
                        <select value={f.takeaway_flow} onChange={(e) => set('takeaway_flow')(e.target.value)}>
                            <option value="fire_first">Fire first, pay when ready</option><option value="pay_first">Pay first</option>
                        </select></label>
                    <Switch label="Keep paid orders until collected" hint="A paid bag stays on the board until the kitchen is done and it is handed over" on={f.takeaway_collect} onChange={set('takeaway_collect')} />
                    <Switch label="Close automatically when collected" hint="Remove the order once it is handed over" on={f.takeaway_autoclose} onChange={set('takeaway_autoclose')} />
                </section>

                <section>
                    <h2>Charges and kitchen</h2>
                    <label className="foh-set-row"><span className="foh-set-l"><b>Service charge %</b><small>Added to dine-in bills</small></span>
                        <input type="number" min="0" max="100" step="0.5" value={x.service_charge_percent} onChange={(e) => setE('service_charge_percent')(e.target.value)} /></label>
                    <Switch label="Send orders to the kitchen" on={flag('prepares_orders')} onChange={(v) => setE('prepares_orders')(v ? '1' : '0')} />
                    <Switch label="Print kitchen tickets" on={flag('kot_enabled')} onChange={(v) => setE('kot_enabled')(v ? '1' : '0')} />
                    <Switch label="Show prices on kitchen tickets" on={flag('kot_show_prices')} onChange={(v) => setE('kot_show_prices')(v ? '1' : '0')} />
                    <Switch label="Print automatically on the kitchen screen" on={flag('kds_auto_print')} onChange={(v) => setE('kds_auto_print')(v ? '1' : '0')} />
                    <Switch label="Sound alert for new orders" on={flag('pos_sound_alert')} onChange={(v) => setE('pos_sound_alert')(v ? '1' : '0')} />
                </section>

                <p className="foh-muted">Floor plan and riders: <Link href={route('store.restaurant.riders', { store_slug: storeSlug })}>Riders</Link>.</p>
            </div>
        </OneGlanceLayout>
    );
}

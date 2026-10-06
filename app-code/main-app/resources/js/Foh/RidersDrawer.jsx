import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { X, Wallet, Bike } from 'lucide-react';
import { Link } from '@inertiajs/react';

/**
 * Who is out and the cash to collect, inside FOH. Same endpoints the old
 * dispatch page used (riders.list, rider-cashup, cash-up): nothing moved on the server.
 */
export default function RidersDrawer({ storeSlug, money, onClose }) {
    const r = useCallback((name) => route(name, { store_slug: storeSlug }), [storeSlug]);
    const [riders, setRiders] = useState([]);
    const [riderId, setRiderId] = useState('');
    const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [data, setData] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        axios.get(r('store.riders.list')).then((res) => {
            const list = res.data?.riders || [];
            setRiders(list);
            if (list[0]) setRiderId(list[0].id);
        }).catch(() => setError('Could not load riders.'));
    }, [r]);

    const load = useCallback(async () => {
        if (!riderId) return;
        setBusy(true); setError('');
        try {
            const res = await axios.get(r('store.restaurant.dispatch.rider-cashup'), { params: { rider_id: riderId, date } });
            setData(res.data);
        } catch (e) { setError('Could not load this rider\'s cash-up.'); setData(null); }
        finally { setBusy(false); }
    }, [riderId, date, r]);
    useEffect(() => { load(); }, [load]);

    const handIn = async () => {
        const ids = (data?.deliveries || []).filter((d) => !d.cash_handed_in).map((d) => d.occupancy_id);
        if (!ids.length) return;
        setBusy(true);
        try { await axios.post(r('store.restaurant.dispatch.cash-up'), { occupancy_ids: ids }); await load(); }
        catch (e) { setError('Could not mark the cash as handed in.'); setBusy(false); }
    };

    const pending = (data?.deliveries || []).filter((d) => !d.cash_handed_in).length;

    return (
        <div className="vqt-modal-scrim" onMouseDown={onClose}>
            <aside className="foh-drawer bg-surface border border-line" role="dialog" aria-modal="true" aria-label="Riders" onMouseDown={(e) => e.stopPropagation()}>
                <header className="vqt-modal-h">
                    <h2 className="font-bold text-ink flex items-center gap-2" style={{ fontSize: 'var(--vq-t-lg)' }}><Bike size={16} /> Riders</h2>
                    <button type="button" className="vqt-icon-btn" onClick={onClose} aria-label="Close"><X size={16} /></button>
                </header>
                <div className="foh-drawer-b">
                    <div className="foh-rider-row">
                        <select value={riderId} onChange={(e) => setRiderId(e.target.value)} aria-label="Rider">
                            {riders.map((x) => <option key={x.id} value={x.id}>{x.name}{x.live_count ? ` · ${x.live_count} out` : ''}</option>)}
                        </select>
                        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Date" />
                    </div>
                    {riders.length === 0 && <p className="foh-muted">No riders yet. <Link href={route('store.restaurant.riders', { store_slug: storeSlug })}>Add riders</Link></p>}
                    {error && <p className="foh-late">{error}</p>}
                    {data && (
                        <>
                            <div className="foh-rider-sum">
                                <span>Expected cash <b className="vq-num">{money(data.total_expected)}</b></span>
                                <span>Collected <b className="vq-num">{money(data.total_collected)}</b></span>
                                <span data-hot={data.variance < 0 ? '1' : '0'}>Variance <b className="vq-num">{money(data.variance)}</b></span>
                            </div>
                            <ul className="foh-attn">
                                {data.deliveries.map((d) => (
                                    <li key={d.occupancy_id}>
                                        <div className="foh-rider-d">
                                            <b>{d.code}</b><span className="foh-t-n">{d.customer_name || d.address || d.status}</span>
                                            <i className="vq-num">{d.payment_method === 'cash' ? money(d.expected_cash) : d.payment_method}</i>
                                            <span className="foh-badge" data-tone={d.cash_handed_in ? 'go' : 'warn'}>{d.cash_handed_in ? 'Handed in' : 'Out'}</span>
                                        </div>
                                    </li>
                                ))}
                                {data.deliveries.length === 0 && <li className="foh-empty">No deliveries for this rider on that day.</li>}
                            </ul>
                            <button type="button" className="vqt-btn vqt-btn-go" disabled={busy || pending === 0} onClick={handIn}><Wallet size={16} /> Cash handed in ({pending})</button>
                        </>
                    )}
                </div>
            </aside>
        </div>
    );
}

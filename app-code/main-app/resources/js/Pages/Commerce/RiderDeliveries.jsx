import React, { useEffect, useRef, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { disablePush, enablePush, pushState } from '@/lib/webPush';

const NEXT = { assigned: ['accepted', 'Accept ride'], accepted: ['collected', 'Picked up from store'], collected: ['out_for_delivery', 'Start delivery'], out_for_delivery: ['delivered', 'Delivered'] };
const LABEL = { assigned: 'New', accepted: 'Accepted', collected: 'Picked up', out_for_delivery: 'On the way', delivered: 'Delivered', failed: 'Failed' };
const fmt = (n, s = 'Rs') => `${s} ${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const box = { flex: 1, minWidth: 100, border: '1px solid #ddd', borderRadius: 12, padding: 10 };

const ALERT_TEXT = {
    on: 'Alerts are on. This phone will buzz when a delivery is given to you.',
    off: 'Get an alert on this phone when a delivery is given to you, even when this page is closed.',
    blocked: 'Alerts are blocked for this site. Allow notifications in the browser settings to turn them on.',
};

export default function RiderDeliveries({ rider, deliveries = [], today, stepUrl, push = null }) {
    const { errors = {} } = usePage().props;
    const [cash, setCash] = useState({});
    const [busy, setBusy] = useState(null);
    const [alerts, setAlerts] = useState('unsupported');
    const [alertBusy, setAlertBusy] = useState(false);
    const [alertNote, setAlertNote] = useState('');

    const current = deliveries.filter((d) => d.status !== 'delivered');
    const done = deliveries.filter((d) => d.status === 'delivered');

    useEffect(() => {
        if (push) pushState().then(setAlerts);
    }, [push]);

    /* Keep the list fresh while the page is open: pick up rides given to this rider, and buzz once per new one. */
    const seen = useRef(new Set(current.filter((d) => d.status === 'assigned').map((d) => d.id)));
    useEffect(() => {
        const fresh = current.filter((d) => d.status === 'assigned' && !seen.current.has(d.id));
        if (fresh.length) {
            fresh.forEach((d) => seen.current.add(d.id));
            try { navigator.vibrate?.([200, 100, 200]); } catch { /* not supported */ }
        }
    }, [current]);
    useEffect(() => {
        const tick = () => {
            if (document.visibilityState === 'visible' && navigator.onLine !== false) {
                router.reload({ only: ['deliveries', 'today'], preserveScroll: true, preserveState: true });
            }
        };
        const id = setInterval(tick, 20000);
        document.addEventListener('visibilitychange', tick);
        return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick); };
    }, []);

    const toggleAlerts = async () => {
        setAlertBusy(true);
        setAlertNote('');
        if (alerts === 'on') {
            await disablePush({ off: push.off });
            setAlerts('off');
        } else {
            const res = await enablePush({ key: push.key, on: push.on });
            if (res.ok) setAlerts('on');
            else if (res.reason === 'blocked') setAlerts('blocked');
            else setAlertNote(res.reason === 'server' ? 'Alerts are not available on this server yet.' : 'Could not turn alerts on. Try again.');
        }
        setAlertBusy(false);
    };

    const step = (d, to, extra = {}) => {
        setBusy(d.id);
        router.post(stepUrl, { delivery_id: d.id, to, ...extra }, { preserveScroll: true, onFinish: () => setBusy(null) });
    };
    const fail = (d) => {
        const reason = window.prompt('Why could the delivery not be completed?');
        if (reason && reason.trim()) step(d, 'failed', { reason: reason.trim() });
    };

    return (
        <div style={{ maxWidth: 560, margin: '0 auto', padding: 16, fontFamily: 'system-ui, sans-serif' }}>
            <Head title="My rides"><meta name="robots" content="noindex,nofollow" /></Head>
            <h1 style={{ fontSize: 22, margin: '4px 0' }}>My rides</h1>
            <p style={{ margin: 0, color: '#555' }}>{rider.name}</p>

            {push && alerts !== 'unsupported' && (
                <div style={{ margin: '12px 0 0', padding: 10, border: '1px solid #ddd', borderRadius: 12, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ flex: 1, minWidth: 180, fontSize: 14, color: '#444' }}>{ALERT_TEXT[alerts]}{alertNote ? ` ${alertNote}` : ''}</span>
                    {alerts !== 'blocked' && (
                        <button type="button" onClick={toggleAlerts} disabled={alertBusy}
                            style={{ padding: '10px 14px', borderRadius: 10, border: alerts === 'on' ? '1px solid #999' : 0, background: alerts === 'on' ? '#fff' : '#0f766e', color: alerts === 'on' ? '#333' : '#fff', fontWeight: 700 }}>
                            {alertBusy ? 'Please wait…' : alerts === 'on' ? 'Turn alerts off' : 'Turn alerts on'}
                        </button>
                    )}
                </div>
            )}

            <div style={{ display: 'flex', gap: 8, margin: '14px 0', flexWrap: 'wrap' }}>
                <div style={box}><small>Rides now</small><br /><b>{current.length}</b></div>
                <div style={box}><small>Done today</small><br /><b>{today.delivered}</b></div>
                <div style={box}><small>Earned today</small><br /><b>{fmt(today.earned)}</b></div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                <div style={box}><small>Still to collect from customers</small><br /><b>{fmt(today.cash_to_collect)}</b></div>
                <div style={{ ...box, borderColor: today.cash_to_hand_in > 0 ? '#b45309' : '#ddd' }}><small>Give to the owner</small><br /><b>{fmt(today.cash_to_hand_in)}</b></div>
            </div>

            {errors.delivery && <p role="alert" style={{ color: '#b91c1c' }}>{errors.delivery}</p>}

            <h2 style={{ fontSize: 16 }}>Rides now</h2>
            {current.length === 0 && <p style={{ color: '#555' }}>No rides right now.</p>}
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
                {current.map((d) => {
                    const nxt = NEXT[d.status];
                    const cod = Number(d.cash_expected) > 0;
                    return (
                        <li key={d.id} style={{ border: '1px solid #ddd', borderRadius: 14, padding: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <b>{d.customer_name}</b><span style={{ fontSize: 12, fontWeight: 700 }}>{LABEL[d.status]}</span>
                            </div>
                            <div style={{ color: '#555', fontSize: 14 }}>{d.public_number}{d.assigned_at_local ? ` · given ${d.assigned_at_local}` : ''}</div>
                            <p style={{ margin: '8px 0' }}>{d.delivery_address}</p>
                            {d.delivery_address && d.status !== 'failed' && (
                                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(d.delivery_address)}`} target="_blank" rel="noopener noreferrer"
                                    style={{ display: 'inline-block', margin: '0 0 8px', padding: '8px 12px', border: '1px solid #ccc', borderRadius: 10 }}>Open in maps</a>
                            )}
                            {d.customer_note && <p style={{ margin: '0 0 8px', fontSize: 14 }}>Note: {d.customer_note}</p>}
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                {d.status !== 'failed' && <a href={`tel:${d.customer_phone}`} style={{ padding: '8px 12px', border: '1px solid #ccc', borderRadius: 10 }}>Call {d.customer_phone}</a>}
                                {cod ? <b>Collect {fmt(d.cash_expected, d.currency_symbol)}</b> : <span style={{ color: '#555' }}>Nothing to collect (already paid)</span>}
                            </div>
                            {d.status === 'failed' && <p style={{ color: '#b91c1c' }}>Failed: {d.fail_reason}. Bring it back to the store; the manager will reassign.</p>}
                            {nxt && (
                                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                                    {nxt[0] === 'delivered' && cod && (
                                        <input aria-label="Cash collected" inputMode="decimal" placeholder={`Cash collected (${d.cash_expected})`} value={cash[d.id] ?? ''}
                                            onChange={(e) => setCash({ ...cash, [d.id]: e.target.value })} style={{ padding: 10, border: '1px solid #ccc', borderRadius: 10, flex: 1, minWidth: 140 }} />
                                    )}
                                    <button type="button" disabled={busy === d.id} onClick={() => step(d, nxt[0], nxt[0] === 'delivered' && cod && cash[d.id] !== undefined && cash[d.id] !== '' ? { cash_collected: Number(cash[d.id]) } : {})}
                                        style={{ padding: '12px 16px', borderRadius: 12, border: 0, background: '#0f766e', color: '#fff', fontWeight: 700, flex: 1 }}>{nxt[1]}</button>
                                    {['accepted', 'collected', 'out_for_delivery'].includes(d.status) && (
                                        <button type="button" onClick={() => fail(d)} style={{ padding: '12px 16px', borderRadius: 12, border: '1px solid #b91c1c', background: '#fff', color: '#b91c1c', fontWeight: 700 }}>Could not deliver</button>
                                    )}
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>

            <h2 style={{ fontSize: 16, marginTop: 22 }}>Done today ({done.length})</h2>
            {done.length === 0 && <p style={{ color: '#555' }}>Nothing delivered yet today.</p>}
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
                {done.map((d) => {
                    const cod = Number(d.cash_expected) > 0;
                    return (
                        <li key={d.id} style={{ border: '1px solid #ddd', borderRadius: 12, padding: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <b>{d.customer_name} · {d.public_number}</b><span>{d.delivered_at_local}</span>
                            </div>
                            <div style={{ fontSize: 14, color: '#444', marginTop: 4 }}>
                                Earned {fmt(d.rider_fee)}
                                {cod ? ` · Collected ${fmt(d.cash_collected, d.currency_symbol)} · ${d.cash_acknowledged_at ? 'owner received it' : 'give to the owner'}` : ' · No cash (paid already)'}
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

import React, { useEffect, useMemo, useState } from 'react';
import { Globe, ShoppingBag, Bike, Plus, PackageCheck, Clock, Bell, Receipt, Flame, Link2 } from 'lucide-react';
import { Link } from '@inertiajs/react';
import FloorPane from '@/Pos/Table/FloorPane';
import { SeatDialog, NewTicketDialog } from '@/Pos/Table/TableBar';
import { QuickFloorModal } from '@/Pos/Table/QuickFloorSetup';
import { alertAge } from '@/Pos/Table/useTableService';
import { DELIVERY_META, DELIVERY_STATES, isLate, elapsedLabel } from '@/Pos/Table/Delivery';
import OrderPane from './OrderPane';
import { toast } from './useFoh';
import RidersDrawer from './RidersDrawer';
import { onlineStage } from './OnlineOrderPane';
import { setKitchenOn, cookWord, kitchenOn } from '@/Pos/Table/kitchenWord';

/* One word for "being made", set once from the store's kitchen setting. */
export { setKitchenOn, cookWord };

/* A paid lane ticket is waiting on the kitchen / the customer, not on the till. */
export const kitchenDone = (c) => {
    const k = c.kitchen_progress || { fired: 0, ready: 0, served: 0 };
    return k.fired === 0 || (k.ready + k.served) >= k.fired;
};
export const laneBadge = (c) => {
    if (c.collected_at) return { text: 'Collected', tone: 'ok' };
    if (c.paid_at) return kitchenDone(c) ? { text: 'Ready to collect', tone: 'go' } : { text: `Paid · ${cookWord().toLowerCase()}`, tone: 'warn' };
    if (c.check_dropped_at) return { text: 'Bill dropped', tone: 'warn' };
    if (c.unsent > 0 && kitchenOn()) return { text: `${c.unsent} to fire`, tone: 'warn' };
    return { text: c.lines ? 'Open' : 'Empty', tone: 'quiet' };
};

/* ── Overview: what needs a person right now ─────────────────────────── */
const Col = ({ title, Icon, children, n }) => (
    <section className="foh-col"><h2 className="foh-h2"><Icon size={15} aria-hidden="true" /> {title}{n ? <b className="vq-num">{n}</b> : null}</h2>{children}</section>
);
const MiniCard = ({ card, sub, tone, money, goto }) => (
    <li><button type="button" data-tone={tone} onClick={() => goto(card)}>
        <b>{card.code}</b><span className="foh-t-n">{sub}</span><i className="vq-num">{money(card.paid_at ? card.paid_total : card.order_total)}</i>
    </button></li>
);

const OnlineMini = ({ o, money, go }) => {
    const st = onlineStage(o, kitchenOn());
    return <li><button type="button" data-tone={st.tone} onClick={() => go?.(o)}>
        <b>{o.number}</b><span className="foh-t-n"><Globe size={12} aria-hidden="true" /> {st.text}</span><i className="vq-num">{money(o.total)}</i>
    </button></li>;
};

export function OverviewTab({ tables, money, goto, fohSettings, online = [], gotoOnline }) {
    const now = Date.now();
    const seated = tables.positions.filter((p) => p.occupancy_id);
    const lane = (k) => tables.tickets.filter((t) => t.order_type === k && !t.collected_at);
    const take = lane('takeaway');
    const del = lane('delivery');
    const onTake = online.filter((o) => o.fulfilment !== 'delivery');
    const onDel = online.filter((o) => o.fulfilment === 'delivery');
    const newOnline = online.filter((o) => o.status === 'pending').length;
    const c = tables.counts || {};
    const needs = newOnline + [...seated, ...take, ...del].filter((x) => alertAge(x, now) > 0 || x.customer_pending > 0 || x.guest_call || x.state === 'check_dropped' || (x.paid_at && kitchenDone(x)) || isLate(x.delivery, fohSettings?.delivery_grace)).length;
    const cooking = [...seated, ...take, ...del].filter((x) => x.state === 'in_kitchen').length;
    const showTables = fohSettings?.tables !== false, showTake = fohSettings?.takeaway !== false, showDel = fohSettings?.delivery !== false;
    const lateCount = del.filter((t) => isLate(t.delivery, fohSettings?.delivery_grace)).length;

    return (
        <div className="foh-overview">
            <p className="foh-today">
                {showTables && <span><b className="vq-num">{seated.length}/{tables.positions.length}</b>Tables in use</span>}
                <span><b className="vq-num">{c.covers ?? 0}</b>Guests</span>
                <span><b className="vq-num">{money(c.due ?? 0)}</b>On the floor</span>
                <span data-hot={needs ? '1' : '0'}><b className="vq-num">{needs}</b>Need someone</span>
                <span><b className="vq-num">{cooking}</b>{cookWord()}</span>
            </p>
            <div className="foh-cols" data-n={[showTables, showTake, showDel].filter(Boolean).length}>
                {showTables && (
                    <Col title="Tables" Icon={Receipt} n={seated.length}>
                        <ul className="foh-attn">
                            {seated.slice().sort((a, b) => alertAge(b, now) - alertAge(a, now)).map((t) => {
                                const age = alertAge(t, now);
                                const sub = t.guest_call === 'bill' ? 'Guest wants the bill' : t.guest_call ? 'Guest called a waiter' : t.customer_pending > 0 ? 'Guest added items' : t.state === 'check_dropped' ? 'Waiting to pay' : age ? `${t.state.replace('_', ' ')} ${age}m` : t.state.replace('_', ' ');
                                return <MiniCard key={t.id} card={t} sub={sub} tone={age || t.guest_call || t.state === 'check_dropped' ? 'warn' : 'quiet'} money={money} goto={goto} />;
                            })}
                            {seated.length === 0 && <li className="foh-empty">No table is open.</li>}
                        </ul>
                    </Col>
                )}
                {showTake && (
                    <Col title="Takeaway" Icon={ShoppingBag} n={take.length + onTake.length}>
                        <ul className="foh-attn">{onTake.map((o) => <OnlineMini key={o.id} o={o} money={money} go={gotoOnline} />)}</ul>
                        <ul className="foh-attn">
                            {take.map((t) => { const b = laneBadge(t); return <MiniCard key={t.id} card={t} sub={b.text} tone={b.tone} money={money} goto={goto} />; })}
                            {take.length + onTake.length === 0 && <li className="foh-empty">No takeaway orders.</li>}
                        </ul>
                    </Col>
                )}
                {showDel && (
                    <Col title="Delivery" Icon={Bike} n={del.length + onDel.length}>
                        <ul className="foh-attn">{onDel.map((o) => <OnlineMini key={o.id} o={o} money={money} go={gotoOnline} />)}</ul>
                        {lateCount > 0 && <p className="foh-late">{lateCount} late</p>}
                        <ul className="foh-attn">
                            {del.map((t) => {
                                const st = t.delivery?.status || 'placed';
                                const late = isLate(t.delivery, fohSettings?.delivery_grace);
                                return <MiniCard key={t.id} card={t} sub={`${DELIVERY_META[st]?.label || st}${t.delivery?.status_at ? ' · ' + elapsedLabel(t.delivery.status_at) : ''}${late ? ' · LATE' : ''}`} tone={late ? 'warn' : 'quiet'} money={money} goto={goto} />;
                            })}
                            {del.length + onDel.length === 0 && <li className="foh-empty">No deliveries.</li>}
                        </ul>
                    </Col>
                )}
            </div>
        </div>
    );
}

/* ── Tables ──────────────────────────────────────────────────────────── */
export function TablesTab({ tables, order, money, storeSlug, canManage, fohSettings }) {
    const [seatFor, setSeatFor] = useState(null);
    const [quick, setQuick] = useState(false);
    const [floorView, setFloorView] = useState(() => {
        try { return localStorage.getItem('foh_floor_view') || 'map'; } catch { return 'map'; }
    });
    const changeFloorView = (view) => {
        setFloorView(view);
        try { localStorage.setItem('foh_floor_view', view); } catch { /* private browsing */ }
    };
    const floorMap = useMemo(() => {
        const raw = order.settings?.floor_map;
        try { return raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : null; } catch { return null; }
    }, [order.settings?.floor_map]);
    const card = tables.selected && tables.selected.kind !== 'ticket' ? tables.selected : null;
    const now = useNow();

    if (card && card.occupancy_id) {
        return (
            <div className="foh-with-rail">
                <nav className="foh-rail" aria-label="Tables">
                    {tables.positions.map((p) => (
                        <button key={p.id} type="button" data-on={p.id === card.id ? '1' : '0'} data-busy={p.occupancy_id ? '1' : '0'}
                            onClick={() => (p.occupancy_id ? tables.select(p.id) : setSeatFor(p))} title={p.label || p.code}>
                            <b>{p.code}</b><i>{p.occupancy_id ? elapsedLabel(p.opened_at) : 'free'}</i>
                        </button>
                    ))}
                </nav>
                <div className="foh-rail-body"><OrderPane {...order} card={card} onBack={() => tables.select(null)} /></div>
                {seatFor && (
                    <SeatDialog position={seatFor} defaultCovers={fohSettings?.default_covers} busy={tables.busy} onCancel={() => setSeatFor(null)}
                        onConfirm={async ({ covers }) => { const p = await tables.openTable(seatFor.id, { covers, orderType: 'dine_in' }); setSeatFor(null); if (p) tables.select(p.id); }} />
                )}
            </div>
        );
    }
    const pick = (t) => {
        if (t.occupancy_id) { tables.select(t.id); return; }
        if (t.status === 'cleaning') { toast(`${t.label || t.code} is being cleaned. Mark it free from the floor first.`, 'warning'); return; }
        setSeatFor(t);
    };
    const empty = tables.loaded && tables.positions.length === 0;
    return (
        <>
            {empty ? (
                <div className="foh-empty-state">
                    <h2>No tables yet</h2>
                    <p>Add your tables in one step: pick a zone and how many.</p>
                    {canManage && <button type="button" className="vqt-btn vqt-btn-go" onClick={() => setQuick(true)}><Plus size={16} /> Set up the floor</button>}
                </div>
            ) : (
                <FloorPane
                    embedded title="Tables" positions={tables.visible.filter((p) => p.kind !== 'ticket')} tabs={tables.tabs.filter((t) => !['takeaway', 'delivery'].includes(t.id || t.key))}
                    zone={tables.zone} setZone={tables.setZone} counts={tables.counts} selectedId={tables.selectedId}
                    onPick={pick} onRefresh={tables.refresh} money={money} now={now} storeSlug={storeSlug}
                    variant="map" view={floorView} setView={changeFloorView} floorMap={floorMap}
                    onSetup={() => setQuick(true)} canArrange={false}
                />
            )}
            {seatFor && (
                <SeatDialog position={seatFor} defaultCovers={fohSettings?.default_covers} busy={tables.busy} onCancel={() => setSeatFor(null)}
                    onConfirm={async ({ covers }) => { const p = await tables.openTable(seatFor.id, { covers, orderType: 'dine_in' }); setSeatFor(null); if (p) tables.select(p.id); }} />
            )}
            {quick && (
                <QuickFloorModal storeSlug={storeSlug} onClose={() => setQuick(false)} onError={(m) => toast(m, 'error')}
                    onDone={(v) => { setQuick(false); toast(`${v.count} tables added to ${v.zone}`, 'success'); tables.refresh(); }} />
            )}
        </>
    );
}

const useNow = () => {
    const [n, setN] = useState(() => Date.now());
    useEffect(() => { const i = setInterval(() => setN(Date.now()), 30000); return () => clearInterval(i); }, []);
    return n;
};

/* ── Takeaway & Delivery share one list + the same order pane ────────── */
export function LaneTab({ kind, tables, order, money, storeSlug, caps, fohSettings }) {
    const [creating, setCreating] = useState(false);
    const [riders, setRiders] = useState(false);
    const isDelivery = kind === 'delivery';
    const Icon = isDelivery ? Bike : ShoppingBag;
    const list = tables.tickets.filter((t) => t.order_type === kind && !t.collected_at);
    const card = tables.selected && tables.selected.kind === 'ticket' && tables.selected.order_type === kind ? tables.selected : null;

    useEffect(() => {
        const h = () => setCreating(true);
        window.addEventListener('foh:new', h);
        return () => window.removeEventListener('foh:new', h);
    }, []);

    const leave = async () => {
        /* An order nobody added anything to would sit in the list forever. */
        if (card && !card.lines && !card.paid_at) await tables.closeTable(card.occupancy_id, false);
        tables.select(null);
    };

    if (card) {
        const b = laneBadge(card);
        return (
            <div className="foh-with-rail foh-lane-workspace">
                <nav className="foh-rail" aria-label={`${isDelivery ? 'Delivery' : 'Takeaway'} orders`}>
                    {list.map((ticket) => (
                        <button key={ticket.id} type="button" data-on={ticket.id === card.id ? '1' : '0'} data-busy="1"
                            onClick={() => tables.select(ticket.id)} title={`${ticket.code} · ${laneBadge(ticket).text}`}>
                            <b>{ticket.code}</b><i>{laneBadge(ticket).text}</i>
                        </button>
                    ))}
                </nav>
                <div className="foh-rail-body">
                    {card.paid_at ? <div className="foh-paid">
                    <button type="button" className="vqt-back" onClick={() => tables.select(null)}>← {card.code}</button>
                    <h2>{b.text}</h2>
                    <p>{card.label} · paid {money(card.paid_total)}</p>
                    {kitchenDone(card)
                        ? <button type="button" className="vqt-btn vqt-btn-go" disabled={tables.busy} onClick={() => tables.collected(card.occupancy_id)}><PackageCheck size={16} /> {isDelivery ? 'Handed to rider' : 'Handed to customer'}</button>
                        : <p className="foh-muted">The order is still being made. Collect it when it is ready.</p>}
                    </div> : <OrderPane {...order} card={card} onBack={leave} />}
                </div>
            </div>
        );
    }

    return (
        <div className="foh-lane">
            <div className="foh-lane-h">
                <h2 className="foh-h2"><Icon size={16} aria-hidden="true" /> {isDelivery ? 'Delivery' : 'Takeaway'}</h2>
                <span className="foh-spacer" />
                {isDelivery && <Link className="vqt-btn" href={route('store.restaurant.riders', { store_slug: storeSlug })}>Riders</Link>}
                {isDelivery && <button type="button" className="vqt-btn" onClick={() => setRiders(true)}>Rider cash-up</button>}
                <button type="button" className="vqt-btn vqt-btn-go" onClick={() => setCreating(true)}><Plus size={16} /> New {isDelivery ? 'delivery' : 'takeaway'}</button>
            </div>
            {list.length === 0 && <p className="foh-empty">No open {isDelivery ? 'deliveries' : 'takeaway orders'}.</p>}
            {isDelivery && list.some((t) => isLate(t.delivery, fohSettings?.delivery_grace)) && <p className="foh-late">{list.filter((t) => isLate(t.delivery, fohSettings?.delivery_grace)).length} late</p>}
            <ul className="foh-tickets">
                {(isDelivery ? [...list].sort((a, b) => DELIVERY_STATES.indexOf(a.delivery?.status || 'placed') - DELIVERY_STATES.indexOf(b.delivery?.status || 'placed')) : list).map((t) => {
                    const b = laneBadge(t);
                    return (
                        <li key={t.id}>
                            <button type="button" onClick={() => tables.select(t.id)} data-tone={b.tone}>
                                <b>{t.code}</b>
                                <span className="foh-t-n">{t.label !== t.code ? t.label : (t.phone || 'Walk-in')}</span>
                                {isDelivery && <span className="foh-badge" data-tone={isLate(t.delivery, fohSettings?.delivery_grace) ? 'warn' : 'quiet'}>{DELIVERY_META[t.delivery?.status || 'placed']?.short}{isLate(t.delivery, fohSettings?.delivery_grace) ? ' · late' : ''}</span>}
                                <span className="foh-badge" data-tone={b.tone}>{b.text}</span>
                                <i className="vq-num">{money(t.paid_at ? t.paid_total : t.order_total)}</i>
                            </button>
                        </li>
                    );
                })}
            </ul>
            {riders && <RidersDrawer storeSlug={storeSlug} money={money} onClose={() => setRiders(false)} />}
            {creating && (
                <NewTicketDialog orderType={kind} storeSlug={storeSlug} busy={tables.busy} nameRequired={!!fohSettings?.takeaway_name_required} defaults={{ deliveryFee: fohSettings?.delivery_fee, etaMinutes: fohSettings?.delivery_eta }} onCancel={() => setCreating(false)}
                    onConfirm={async (meta) => { const t = await tables.openLane(kind, meta); setCreating(false); if (t) tables.select(t.id); }} />
            )}
        </div>
    );
}

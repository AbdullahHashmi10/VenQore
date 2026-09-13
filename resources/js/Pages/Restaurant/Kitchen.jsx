/* ==========================================================================
   THE KITCHEN DISPLAY
   ==========================================================================
   What this screen is for, in one sentence: a cook standing two metres away
   has to be able to see which ticket is oldest without walking over.

   Everything below follows from that. Tickets are ordered by age, not by
   table. The elapsed clock is the largest thing on a ticket after the food.
   Age is a colour as well as a number, because a number has to be read and a
   colour does not. And the whole board re-reads itself every ten seconds --
   the previous version was static until somebody clicked, which on a wall
   screen with nobody near it means it was never right.

   `time_elapsed_mins` is deliberately NOT used for the clock: it is a stored
   integer nothing increments, so it froze at whatever it was when the ticket
   was written. The clock counts from `fired_at`, which is a fact.
   ========================================================================== */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import {
    ChefHat, Clock, Check, Undo2, Utensils, ShoppingBag, Bike,
    LayoutGrid, RefreshCcw, WifiOff,
} from 'lucide-react';
import '@/Pos/Table/kds.css';

const POLL_MS = 10000;
const TICK_MS = 1000;

/* The ladder a ticket climbs. Bump moves it forward, recall moves it back. */
const FLOW = ['pending', 'preparing', 'ready', 'served'];
const NEXT_LABEL = { pending: 'Start', preparing: 'Ready', ready: 'Served', served: 'Done' };

const TYPE_ICON = { dine_in: Utensils, takeaway: ShoppingBag, delivery: Bike };

/* Age bands. Chosen to be about a kitchen, not about a colour scale: under
   five minutes is normal, ten is the point a waiter starts being asked, and
   past twenty something has gone wrong and the ticket should be the loudest
   thing on the wall. */
const ageBand = (mins) => (mins >= 20 ? 'late' : mins >= 10 ? 'slow' : mins >= 5 ? 'on' : 'new');

function minutesSince(iso) {
    if (!iso) return 0;
    return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
}

function clock(iso) {
    if (!iso) return '—';
    const total = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
    const m = Math.floor(total / 60);
    const sec = total % 60;
    if (m >= 60) {
        const h = Math.floor(m / 60);
        return `${h}h ${String(m % 60).padStart(2, '0')}m`;
    }
    return `${m}:${String(sec).padStart(2, '0')}`;
}

function Ticket({ order, onBump, onRecall, busy }) {
    const mins = minutesSince(order.fired_at || order.created_at);
    const band = order.status === 'served' ? 'done' : ageBand(mins);
    const Icon = TYPE_ICON[order.order_type] || Utensils;
    const idx = FLOW.indexOf(order.status);
    const canBump = idx >= 0 && idx < FLOW.length - 1;
    const canRecall = idx > 0;

    return (
        <article className="kds-ticket" data-band={band} data-status={order.status}>
            <header className="kds-ticket-h">
                <span className="kds-ticket-where">
                    <Icon size={14} aria-hidden="true" />
                    <b>{order.position_code || order.table_number || order.order_number}</b>
                </span>
                {order.course > 1 && (
                    <span className="kds-course">Course {order.course}</span>
                )}
                <span className="kds-clock vq-num" title={`Fired ${order.fired_at || order.created_at}`}>
                    <Clock size={13} aria-hidden="true" />
                    {clock(order.fired_at || order.created_at)}
                </span>
            </header>

            <ul className="kds-items">
                {(order.items || []).map((it, i) => (
                    <li key={i} className="kds-item">
                        <span className="kds-qty vq-num">{it.qty || 1}</span>
                        <span className="kds-item-body">
                            <span className="kds-item-name">{it.name}</span>
                            {Array.isArray(it.mods) && it.mods.length > 0 && (
                                <span className="kds-item-mods">
                                    {it.mods.map(m => m.name).join(' · ')}
                                </span>
                            )}
                            {Array.isArray(it.modifiers) && it.modifiers.length > 0 && (
                                <span className="kds-item-mods">{it.modifiers.join(' · ')}</span>
                            )}
                            {it.notes && <span className="kds-item-note">“{it.notes}”</span>}
                        </span>
                    </li>
                ))}
                {(order.items || []).length === 0 && (
                    <li className="kds-item kds-item-empty">Ticket has no items</li>
                )}
            </ul>

            <footer className="kds-ticket-f">
                {canRecall && (
                    <button
                        type="button"
                        className="kds-btn"
                        onClick={() => onRecall(order.id)}
                        disabled={busy}
                        title="Put this ticket back a step"
                    >
                        <Undo2 size={15} aria-hidden="true" />
                    </button>
                )}
                <button
                    type="button"
                    className="kds-btn kds-btn-go"
                    onClick={() => onBump(order.id)}
                    disabled={busy || !canBump}
                >
                    <Check size={16} aria-hidden="true" />
                    {NEXT_LABEL[order.status] || 'Done'}
                </button>
            </footer>
        </article>
    );
}

export default function RestaurantKitchen({ storeSlug, orders: initial = [] }) {
    const [orders, setOrders] = useState(initial);
    const [status, setStatus] = useState('open');   /* open | all | ready | served */
    const [station, setStation] = useState('all');
    const [busyId, setBusyId] = useState(null);
    const [live, setLive] = useState(true);
    const [, setTick] = useState(0);
    const inFlight = useRef(false);

    const r = useCallback((name, params = {}) => route(name, { store_slug: storeSlug, ...params }), [storeSlug]);

    const refresh = useCallback(async () => {
        if (inFlight.current) return;
        try {
            const { data } = await axios.get(r('store.restaurant.kitchen.state'));
            if (Array.isArray(data?.orders)) setOrders(data.orders);
            setLive(true);
        } catch (_) {
            /* A wall screen that has lost the server must SAY so. A kitchen
               reading a frozen board is worse than a kitchen reading none. */
            setLive(false);
        }
    }, [r]);

    useEffect(() => {
        const id = setInterval(refresh, POLL_MS);
        return () => clearInterval(id);
    }, [refresh]);

    /* The clock is a second-by-second read-out, so it ticks on its own rather
       than waiting for the poll. */
    useEffect(() => {
        const id = setInterval(() => setTick(t => t + 1), TICK_MS);
        return () => clearInterval(id);
    }, []);

    const act = async (name, id) => {
        setBusyId(id);
        inFlight.current = true;
        try {
            const { data } = await axios.post(r(name, { id }));
            if (data?.order) {
                setOrders(prev => prev.map(o => (o.id === data.order.id ? data.order : o)));
            }
            setLive(true);
        } catch (_) {
            setLive(false);
        } finally {
            inFlight.current = false;
            setBusyId(null);
        }
    };

    const stations = useMemo(() => {
        const set = new Set(orders.map(o => o.station).filter(Boolean));
        return [...set].sort();
    }, [orders]);

    const shown = useMemo(() => {
        let list = orders;
        if (status === 'open') list = list.filter(o => o.status === 'pending' || o.status === 'preparing');
        else if (status !== 'all') list = list.filter(o => o.status === status);
        if (station !== 'all') list = list.filter(o => (o.station || 'kitchen') === station);
        /* Oldest first, always. A kitchen board sorted any other way asks the
           cook to work out what is late. */
        return [...list].sort((a, b) =>
            new Date(a.fired_at || a.created_at) - new Date(b.fired_at || b.created_at));
    }, [orders, status, station]);

    const lateCount = shown.filter(o =>
        (o.status === 'pending' || o.status === 'preparing')
        && minutesSince(o.fired_at || o.created_at) >= 10).length;

    return (
        <div className="kds">
            <Head title="Kitchen" />

            <header className="kds-bar">
                <span className="kds-brand">
                    <ChefHat size={20} aria-hidden="true" />
                    <b>Kitchen</b>
                </span>

                <div className="kds-seg" role="tablist" aria-label="Which tickets">
                    {[['open', 'Cooking'], ['ready', 'Ready'], ['served', 'Served'], ['all', 'All']].map(([id, label]) => (
                        <button
                            key={id}
                            type="button"
                            role="tab"
                            aria-selected={status === id}
                            data-on={status === id ? '1' : '0'}
                            onClick={() => setStatus(id)}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {stations.length > 1 && (
                    <div className="kds-seg" role="tablist" aria-label="Station">
                        <button type="button" role="tab" aria-selected={station === 'all'}
                                data-on={station === 'all' ? '1' : '0'} onClick={() => setStation('all')}>
                            All stations
                        </button>
                        {stations.map(s => (
                            <button key={s} type="button" role="tab" aria-selected={station === s}
                                    data-on={station === s ? '1' : '0'} onClick={() => setStation(s)}>
                                {s}
                            </button>
                        ))}
                    </div>
                )}

                <span className="kds-bar-end">
                    {lateCount > 0 && (
                        <span className="kds-late" title="Tickets over ten minutes old">
                            {lateCount} late
                        </span>
                    )}
                    <span className="kds-live" data-live={live ? '1' : '0'} title={live ? 'Updating every 10 seconds' : 'Not reaching the server'}>
                        {live ? <RefreshCcw size={13} aria-hidden="true" /> : <WifiOff size={13} aria-hidden="true" />}
                        {live ? 'Live' : 'Offline'}
                    </span>
                    <Link href={route('store.tables.index', { store_slug: storeSlug })} className="kds-link">
                        <LayoutGrid size={14} aria-hidden="true" />
                        Floor
                    </Link>
                </span>
            </header>

            <main className="kds-board">
                {shown.map(o => (
                    <Ticket
                        key={o.id}
                        order={o}
                        busy={busyId === o.id}
                        onBump={id => act('store.restaurant.order.bump', id)}
                        onRecall={id => act('store.restaurant.order.recall', id)}
                    />
                ))}

                {shown.length === 0 && (
                    <div className="kds-empty">
                        <ChefHat size={40} strokeWidth={1.5} aria-hidden="true" />
                        <p>{status === 'open' ? 'Nothing on. The pass is clear.' : 'No tickets here.'}</p>
                    </div>
                )}
            </main>
        </div>
    );
}

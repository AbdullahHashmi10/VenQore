/* ==========================================================================
   THE FLOOR — a rank-1 pane of the Table terminal
   ==========================================================================
   Layout Law §10: "the unit of work is the table, not the sale". So the floor
   is not a widget bolted to a till; it is the pane the whole shift starts
   from, and it has exactly two fits the law measured:

     map   >= 484px   cards, laid out as the room reads
     list  >= 254px   rows: code, covers, elapsed, due

   Below that it is a STEP -- a full surface you come from, not a column you
   squeeze in beside the order. That demotion is the engine's decision; this
   component only knows how to be whichever one it was handed.

   THE ONE IDEA WORTH DEFENDING HERE
   ---------------------------------
   A floor plan that only reports the past is wallpaper. Every card carries a
   state derived from the bill itself -- free, seated, ordered, in kitchen,
   served, check dropped -- and two of those states become ALARMS when they go
   stale: a table seated with nobody taking its order, and a bill dropped that
   nobody has paid. Those cards ring, and they sort to the front. The question
   this screen answers is not "what happened" but "where should I walk".
   ========================================================================== */

import React, { useMemo, useState } from 'react';
import {
    Users, Clock, CircleDot, Plus, ShoppingBag, Bike, AlertTriangle, Phone, Calendar,
} from 'lucide-react';
import { STATES, alertAge } from './useTableService';
import { DeliveryChip, isLate } from './Delivery';
import ReservationModal from './ReservationModal';
import { useTermText } from '@/lib/terms';
import './floor-views.css';

/* Minutes since something happened, said the way a person says it. A waiter
   glancing at a floor needs "over an hour" to be instantly different from
   "just sat down"; a timestamp makes them do the arithmetic themselves. */
export function elapsed(iso) {
    if (!iso) return '';
    const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
}

/* Kept for callers that only need the coarse answer. The real state comes off
   the card now -- derived on the server from the bill, never from a status
   column somebody has to remember to update. */
export function toneOf(card) {
    return STATES[card?.state]?.tone || (card?.occupancy_id ? 'ordered' : 'free');
}

const LANE_ICON = { takeaway: ShoppingBag, delivery: Bike };

function StateChip({ card, alert }) {
    const spec = STATES[card.state] || STATES.free;
    return (
        <span className="vqt-state" data-tone={spec.tone} data-alert={alert ? '1' : '0'}>
            {alert ? <AlertTriangle size={10} aria-hidden="true" /> : null}
            {spec.label}
        </span>
    );
}

function Server({ server }) {
    if (!server) return null;
    return (
        <span className="vqt-server" title={`Opened by ${server.name}`} aria-label={`Server ${server.name}`}>
            {server.initials}
        </span>
    );
}

/* ── A TABLE ─────────────────────────────────────────────────────────── */
/* ── A TABLE ─────────────────────────────────────────────────────────── */
function TableCard({ p, selected, onPick, money, variant, now, show = {} }) {
    const alert = alertAge(p, now);
    const showMoney = show.showMoney !== false;
    const showTime = show.showTime !== false;
    const showServer = show.showServer !== false;
    const due = Number(p.order_total) || 0;
    const unsent = Number(p.unsent) || 0;
    const customerPending = Number(p.customer_pending) || 0;
    const isList = variant === 'list';
    const inAction = !!p.occupancy_id || (p.state && p.state !== 'free' && p.state !== 'cleaning');

    const isCodeInLabel = p.label && p.label.trim().toLowerCase() === p.code.trim().toLowerCase();
    const displayTitle = (!p.label || isCodeInLabel) ? `Table ${p.code}` : p.label;

    /* SEATING CHART: a square per table, the number big enough to read from
       across the room, colour for the state and nothing else. */
    if (variant === 'grid') {
        return (
            <button
                type="button"
                onClick={() => onPick(p)}
                className="vqt-table vqt-seat"
                data-tone={toneOf(p)}
                data-in-action={inAction ? '1' : '0'}
                data-selected={selected ? '1' : '0'}
                data-variant="grid"
                data-alert={alert ? '1' : '0'}
                aria-pressed={selected}
                aria-label={`${displayTitle}, ${(STATES[p.state] || {}).label || ''}${due ? `, ${money(due)} due` : ''}${alert ? `, waiting ${alert} minutes` : ''}`}
                title={displayTitle}
            >
                <span className="vqt-seat-code vq-num">{p.code}</span>
                <span className="vqt-seat-sub">
                    {alert ? `${alert}m` : inAction ? (showTime ? elapsed(p.opened_at) : (STATES[p.state] || {}).label) : `${p.capacity || 2} seats`}
                </span>
                {showMoney && inAction && due > 0 && <span className="vqt-seat-due vq-num">{money(due)}</span>}
                {(unsent > 0 || customerPending > 0) && <span className="vqt-seat-badge" aria-hidden="true" />}
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={() => onPick(p)}
            className="vqt-table"
            data-tone={toneOf(p)}
            data-in-action={inAction ? '1' : '0'}
            data-selected={selected ? '1' : '0'}
            data-variant={variant}
            data-alert={alert ? '1' : '0'}
            aria-pressed={selected}
            aria-label={`${displayTitle}, ${(STATES[p.state] || {}).label || ''}${due ? `, ${money(due)} due` : ''}${alert ? `, waiting ${alert} minutes` : ''}`}
        >
            <div className="vqt-card-header">
                <span className="vqt-table-code">{p.code}</span>
                <div className="vqt-card-title-col vq-clip">
                    <span className="vqt-table-name vq-clip">{displayTitle}</span>
                    <span className="vqt-table-sub vq-clip">
                        {inAction ? (
                            <>
                                <Users size={11} aria-hidden="true" />
                                <span>{p.covers || 1}</span>
                                {showTime && (
                                    <>
                                        <span className="vqt-dot">·</span>
                                        <Clock size={11} aria-hidden="true" />
                                        <span>{elapsed(p.opened_at)}</span>
                                    </>
                                )}
                            </>
                        ) : (
                            <>
                                <Users size={11} aria-hidden="true" />
                                <span>seats {p.capacity || 2}</span>
                            </>
                        )}
                    </span>
                </div>
                {!isList && showServer && p.server && <Server server={p.server} />}
            </div>

            {(unsent > 0 || customerPending > 0) && (
                <div className="vqt-card-mid-badges">
                    {customerPending > 0 && (
                        <span className="vqt-table-unsent" title={`${customerPending} new customer items`}>
                            <ShoppingBag size={10} aria-hidden="true" />
                            {customerPending} new
                        </span>
                    )}
                    {unsent > 0 && (
                        <span className="vqt-table-unsent" title={`${unsent} not yet sent to the kitchen`}>
                            <CircleDot size={10} aria-hidden="true" />
                            {unsent} unsent
                        </span>
                    )}
                </div>
            )}

            <div className="vqt-table-footer">
                <StateChip card={p} alert={alert} />
                {showMoney && inAction && due > 0 && (
                    <span className="vq-num vqt-table-due" title={money(due)}>
                        {money(due)}
                    </span>
                )}
            </div>

            {alert > 0 && (
                <span className="vqt-alert-age vq-num" aria-hidden="true">{alert}m</span>
            )}
        </button>
    );
}

/* ── A LANE TICKET ───────────────────────────────────────────────────── */
function TicketCard({ t, selected, onPick, money, variant, now, onUpdateDelivery }) {
    const alert = alertAge(t, now);
    const lateRun = isLate(t.delivery);
    const due = Number(t.order_total) || 0;
    const unsent = Number(t.unsent) || 0;
    const customerPending = Number(t.customer_pending) || 0;
    const Icon = LANE_ICON[t.order_type] || ShoppingBag;
    const isList = variant === 'list';
    const isDelivery = t.order_type === 'delivery';
    const inAction = true;
    const isCodeInCustomer = t.customer_name && t.customer_name.trim().toLowerCase() === t.code.trim().toLowerCase();
    const displayTitle = (!t.customer_name || isCodeInCustomer)
        ? (isDelivery ? 'Delivery Order' : 'Takeaway Order')
        : t.customer_name;

    return (
        <button
            type="button"
            onClick={() => onPick(t)}
            className="vqt-table vqt-ticket"
            data-tone={toneOf(t)}
            data-in-action={inAction ? '1' : '0'}
            data-selected={selected ? '1' : '0'}
            data-variant={variant}
            data-alert={(alert || lateRun) ? '1' : '0'}
            aria-pressed={selected}
            aria-label={`${t.order_type} ${t.code}${due ? `, ${money(due)} due` : ''}${
                t.delivery ? `, ${t.delivery.status}${lateRun ? ', past its promised time' : ''}` : ''}`}
        >
            <div className="vqt-card-header">
                <span className="vqt-table-code vqt-ticket-code">
                    <Icon size={12} aria-hidden="true" />
                    {t.code}
                </span>
                <div className="vqt-card-title-col vq-clip">
                    <span className="vqt-table-name vq-clip">{displayTitle}</span>
                    <span className="vqt-table-sub vq-clip">
                        <Clock size={11} aria-hidden="true" />
                        <span>{elapsed(t.opened_at)}</span>
                        {t.phone && (
                            <>
                                <span className="vqt-dot">·</span>
                                <Phone size={11} aria-hidden="true" />
                                <span>{t.phone}</span>
                            </>
                        )}
                    </span>
                </div>
                {!isList && t.server && <Server server={t.server} />}
            </div>

            {isDelivery && (t.address || t.delivery) && (
                <div className="vqt-ticket-details">
                    {t.address && <span className="vqt-ticket-addr vq-clip">{t.address}</span>}
                    {t.delivery && (
                        <div className="vqt-ticket-run">
                            <DeliveryChip delivery={t.delivery} compact={isList} />
                            {t.delivery.rider && (
                                <span className="vqt-ticket-rider vq-clip">{t.delivery.rider}</span>
                            )}
                        </div>
                    )}
                </div>
            )}

            {isDelivery && t.delivery && t.delivery.status !== 'out' && t.delivery.status !== 'delivered' && onUpdateDelivery && (
                <div className="vqt-dispatch-row">
                    <button
                        type="button"
                        className="vqt-quick-dispatch"
                        title="Mark this delivery as Out for Delivery"
                        onClick={(e) => {
                            e.stopPropagation();
                            onUpdateDelivery(t.occupancy_id, { status: 'out' });
                        }}
                    >
                        <Bike size={11} aria-hidden="true" />
                        <span>Out for Delivery</span>
                    </button>
                </div>
            )}

            {(unsent > 0 || customerPending > 0) && (
                <div className="vqt-card-mid-badges">
                    {customerPending > 0 && (
                        <span className="vqt-table-unsent" title={`${customerPending} new customer items`}>
                            <ShoppingBag size={10} aria-hidden="true" />
                            {customerPending} new
                        </span>
                    )}
                    {unsent > 0 && (
                        <span className="vqt-table-unsent" title={`${unsent} not yet sent to the kitchen`}>
                            <CircleDot size={10} aria-hidden="true" />
                            {unsent} unsent
                        </span>
                    )}
                </div>
            )}

            <div className="vqt-table-footer">
                <StateChip card={t} alert={alert} />
                {due > 0 && (
                    <span className="vq-num vqt-table-due" title={money(due)}>
                        {money(due)}
                    </span>
                )}
            </div>

            {(alert || lateRun) > 0 && (
                <span className="vqt-alert-age vq-num" aria-hidden="true">{alert}m</span>
            )}
        </button>
    );
}

export default function FloorPane({
    positions = [],
    tabs = [],
    zone = 'all',
    setZone,
    counts,
    selectedId,
    onPick,
    onNewTicket,
    onUpdateDelivery,
    onSetup,
    onRefresh,
    money,
    /* 'map' | 'list' — the engine's decision, never this component's */
    variant = 'map',
    /* How THIS DEVICE wants the floor drawn (Settings → Tables & floor):
       view  cards | sections | grid | list
       sort  attention | number
       size  compact | normal | large
       show  { showMoney, showTime, showServer } */
    view = 'cards',
    sort = 'attention',
    size = 'normal',
    show = {},
    embedded = false,
    storeSlug = null,
    /* Passed in rather than read here so every card in one paint agrees on
       what time it is, and so a parent tick re-sorts the whole floor at once. */
    now = Date.now(),
}) {
    const tt = useTermText();
    const [showReservations, setShowReservations] = useState(false);
    const ordered = useMemo(() => {
        /* SORT ORDER IS THE FEATURE.

           Alarms first, oldest alarm at the very top -- the floor answers
           "where do I walk" before it answers anything else. Then open bills,
           then everything free. Sorting purely by table number makes the
           waiter scan the whole room for the four cards that need them. */
        const rank = (c) => {
            if (alertAge(c, now)) return 0;      // somebody is waiting on a person
            if (c.occupancy_id) return 1;        // money on it
            if (c.state === 'cleaning') return 2; // blocks a seating RIGHT NOW
            if (c.state === 'reserved') return 3; // a promise about later
            return 4;                             // free, and quiet
        };
        const byNumber = (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
            || String(a.code).localeCompare(String(b.code), undefined, { numeric: true });
        /* "Table number" keeps every table where the room expects it -- a
           waiter who knows T7 is bottom-right does not want it jumping to the
           top. Lane tickets still come first: they have no fixed place. */
        if (sort === 'number') {
            return [...positions].sort((a, b) => {
                const ta = a.kind === 'ticket' ? 0 : 1; const tb = b.kind === 'ticket' ? 0 : 1;
                return ta - tb || byNumber(a, b);
            });
        }
        return [...positions].sort((a, b) => {
            const ra = rank(a); const rb = rank(b);
            if (ra !== rb) return ra - rb;
            if (ra === 0) return alertAge(b, now) - alertAge(a, now);
            return byNumber(a, b);
        });
    }, [positions, now, sort]);

    /* The engine's word is final on width: a column too narrow for cards gets
       rows -- except the seating chart, whose squares fit anywhere. */
    const eff = variant === 'list' && view !== 'grid' ? 'list' : view;
    const cardVariant = eff === 'list' ? 'list' : eff === 'grid' ? 'grid' : 'map';
    const sections = useMemo(() => {
        if (eff !== 'sections') return null;
        const out = new Map();
        for (const c of ordered) {
            const key = c.kind === 'ticket' ? (c.order_type === 'delivery' ? 'Delivery' : 'Takeaway') : (c.zone || 'Tables');
            if (!out.has(key)) out.set(key, []);
            out.get(key).push(c);
        }
        return [...out.entries()];
    }, [ordered, eff]);

    const laneTab = tabs.find(t => t.id === zone && t.kind === 'lane');
    const zoneTabs = useMemo(() => tabs.filter(t => t.kind !== 'lane'), [tabs]);
    const takeawayTab = useMemo(() => tabs.find(t => t.id === 'takeaway'), [tabs]);
    const deliveryTab = useMemo(() => tabs.find(t => t.id === 'delivery'), [tabs]);
    const takeawayCount = takeawayTab ? (takeawayTab.count || 0) : (counts?.takeawayCount || 0);
    const deliveryCount = deliveryTab ? (deliveryTab.count || 0) : (counts?.deliveryCount || 0);

    return (
        <section
            className={embedded ? 'vqt-floor vqt-floor-embedded' : 'vq-pane vqt-floor bg-surface border border-line/80 shadow-md'}
            data-pane="floor"
        >
            {!embedded && (
                <header className="vq-pane-h bg-sunken/60 text-ink-muted border-b border-line" style={{ display: 'flex', alignItems: 'center' }}>
                    <Users size={15} className="text-brand-500 dark:text-brand-400" />
                    <span>Floor</span>
                    {counts?.alerts > 0 && (
                        <span className="vqt-h-alert" title={tt('Tables waiting on someone')}>
                            <AlertTriangle size={11} aria-hidden="true" />
                            {counts.alerts}
                        </span>
                    )}

                    <button
                        type="button"
                        onClick={() => setShowReservations(true)}
                        className="vqt-icon-btn"
                        style={{
                            marginLeft: '8px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: 'rgba(59,130,246,0.1)',
                            color: '#2563eb',
                            border: '1px solid rgba(59,130,246,0.2)',
                            cursor: 'pointer',
                        }}
                        title="View reservations and waitlist"
                    >
                        <Calendar size={12} />
                        <span>Bookings</span>
                    </button>

                    <span className="vq-num ml-auto text-2xs opacity-80 font-bold">
                        {counts ? `${counts.open} open · ${counts.free} free` : ''}
                    </span>
                </header>
            )}

            {/* Unified Single Toolbar Row: Dining Area Tabs on Left + Channel Actions on Right */}
            <div className="vqt-toolbar-row vq-pane-fixed">
                <div className="vqt-zones" role="tablist" aria-label="Areas">
                    <button
                        type="button" role="tab" aria-selected={zone === 'all'}
                        className="vqt-zone" data-on={zone === 'all' ? '1' : '0'}
                        onClick={() => setZone('all')}
                    >
                        All
                    </button>
                    {zoneTabs.map(t => (
                        <button
                            key={t.id} type="button" role="tab" aria-selected={zone === t.id}
                            className="vqt-zone" data-on={zone === t.id ? '1' : '0'}
                            onClick={() => setZone(t.id)}
                        >
                            <span>{t.label}</span>
                        </button>
                    ))}
                </div>

                <div className="vqt-channel-actions">
                    {takeawayTab !== undefined && (
                        takeawayCount > 0 ? (
                            <div className="vqt-channel-pill vqt-channel-takeaway" data-active={zone === 'takeaway' ? '1' : '0'}>
                                <button
                                    type="button"
                                    className="vqt-channel-filter-btn"
                                    onClick={() => setZone(zone === 'takeaway' ? 'all' : 'takeaway')}
                                    title={zone === 'takeaway' ? "Showing Takeaway orders (click to show all)" : "Filter to Takeaway orders"}
                                >
                                    <ShoppingBag size={12} aria-hidden="true" />
                                    <span>Takeaway</span>
                                    <span className="vqt-channel-badge">{takeawayCount}</span>
                                </button>
                                <button
                                    type="button"
                                    className="vqt-channel-add-btn"
                                    onClick={() => onNewTicket?.('takeaway')}
                                    title="Start new Takeaway order"
                                    aria-label="New Takeaway order"
                                >
                                    <Plus size={11} strokeWidth={2.5} />
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                className="vqt-channel-btn vqt-channel-takeaway"
                                data-active={zone === 'takeaway' ? '1' : '0'}
                                onClick={() => onNewTicket?.('takeaway')}
                                title="Start a new Takeaway order (bag at counter, no table needed)"
                            >
                                <ShoppingBag size={12} aria-hidden="true" />
                                <span>+ Takeaway</span>
                            </button>
                        )
                    )}

                    {deliveryTab !== undefined && (
                        deliveryCount > 0 ? (
                            <div className="vqt-channel-pill vqt-channel-delivery" data-active={zone === 'delivery' ? '1' : '0'}>
                                <button
                                    type="button"
                                    className="vqt-channel-filter-btn"
                                    onClick={() => setZone(zone === 'delivery' ? 'all' : 'delivery')}
                                    title={zone === 'delivery' ? "Showing Delivery orders (click to show all)" : "Filter to Delivery orders"}
                                >
                                    <Bike size={12} aria-hidden="true" />
                                    <span>Delivery</span>
                                    <span className="vqt-channel-badge">{deliveryCount}</span>
                                </button>
                                <button
                                    type="button"
                                    className="vqt-channel-add-btn"
                                    onClick={() => onNewTicket?.('delivery')}
                                    title="Start new Delivery order"
                                    aria-label="New Delivery order"
                                >
                                    <Plus size={11} strokeWidth={2.5} />
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                className="vqt-channel-btn vqt-channel-delivery"
                                data-active={zone === 'delivery' ? '1' : '0'}
                                onClick={() => onNewTicket?.('delivery')}
                                title="Start a new Delivery order (courier / driver dispatch, no table needed)"
                            >
                                <Bike size={12} aria-hidden="true" />
                                <span>+ Delivery</span>
                            </button>
                        )
                    )}
                </div>
            </div>

            <div className="vq-pane-body vqt-floor-body" data-variant={cardVariant} data-view={eff} data-size={size}>
                {/* A lane's primary action is "start one", and it belongs at
                    the top of the lane rather than in a menu: a counter with a
                    queue takes a new bag every ninety seconds. */}
                {laneTab && (
                    <button type="button" className="vqt-new-ticket" onClick={() => onNewTicket?.(zone)}>
                        <Plus size={15} aria-hidden="true" />
                        New {laneTab.label.toLowerCase()} ticket
                    </button>
                )}

                {(sections || [[null, ordered]]).map(([title, cards]) => (
                    <React.Fragment key={title || 'all'}>
                        {title && (
                            <div className="vqt-section-h">
                                <span>{title}</span>
                                <span className="vq-num">{cards.filter(c => c.occupancy_id).length} busy · {cards.length}</span>
                            </div>
                        )}
                        {cards.map(c => (
                            c.kind === 'ticket'
                                ? <TicketCard key={c.id} t={c} variant={cardVariant === 'grid' ? 'map' : cardVariant} now={now}
                                              selected={c.id === selectedId} onPick={onPick} money={money}
                                              onUpdateDelivery={onUpdateDelivery} />
                                : <TableCard key={c.id} p={c} variant={cardVariant} now={now} show={show}
                                             selected={c.id === selectedId} onPick={onPick} money={money} />
                        ))}
                    </React.Fragment>
                ))}

                {ordered.length === 0 && (
                    <div className="vqt-floor-empty">
                        <div className="w-14 h-14 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 mb-3 shadow-sm">
                            <Plus size={26} strokeWidth={2} />
                        </div>
                        <p className="font-bold text-ink text-base">
                            {laneTab ? `No ${laneTab.label.toLowerCase()} tickets open` : tt('No tables in this area')}
                        </p>
                        {laneTab ? (
                            <p className="text-xs text-ink-muted mt-1">Start one above.</p>
                        ) : (
                            <>
                                <p className="text-xs text-ink-muted mt-1 mb-4 max-w-sm">
                                    {tt('Tables come from the floor plan. Build it once and this fills in.')}
                                </p>
                                <button type="button" className="vqt-new-ticket" onClick={onSetup}>
                                    <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
                                    <span>Set up the floor plan</span>
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

            {counts && (
                /* The floor's own footing. Covers and money owed are what a
                   manager walking past actually wants off this screen, and
                   they are read-outs -- so they are typeset, not buttoned. */
                <footer className="vqt-floor-foot">
                    <span><b className="vq-num">{counts.covers}</b> covers</span>
                    <span className="vqt-foot-sep" aria-hidden="true" />
                    <span><b className="vq-num">{money(counts.due)}</b> due</span>
                    {counts.unsent > 0 && (
                        <>
                            <span className="vqt-foot-sep" aria-hidden="true" />
                            <span className="vqt-foot-warn"><b className="vq-num">{counts.unsent}</b> unsent</span>
                        </>
                    )}
                </footer>
            )}

            {showReservations && (
                <ReservationModal
                    storeSlug={storeSlug}
                    positions={positions}
                    onRefresh={onRefresh}
                    onClose={() => setShowReservations(false)}
                />
            )}
        </section>
    );
}

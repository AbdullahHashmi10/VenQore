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

import React, { useMemo } from 'react';
import {
    Users, Clock, CircleDot, Plus, ShoppingBag, Bike, AlertTriangle, Phone,
} from 'lucide-react';
import { STATES, alertAge } from './useTableService';

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
function TableCard({ p, selected, onPick, money, variant, now }) {
    const alert = alertAge(p, now);
    const due = Number(p.order_total) || 0;
    const unsent = Number(p.unsent) || 0;
    const isList = variant === 'list';
    const open = !!p.occupancy_id;

    return (
        <button
            type="button"
            onClick={() => onPick(p)}
            className="vqt-table"
            data-tone={toneOf(p)}
            data-selected={selected ? '1' : '0'}
            data-variant={variant}
            data-alert={alert ? '1' : '0'}
            aria-pressed={selected}
            aria-label={`${p.label || p.code}, ${(STATES[p.state] || {}).label || ''}${due ? `, ${money(due)} due` : ''}${alert ? `, waiting ${alert} minutes` : ''}`}
        >
            <span className="vqt-table-code">{p.code}</span>

            <span className="vqt-table-mid">
                <span className="vqt-table-name vq-clip">{p.label || p.code}</span>
                <span className="vqt-table-sub vq-clip">
                    {open ? (
                        <>
                            <Users size={11} aria-hidden="true" />
                            {p.covers || 0}
                            <span className="vqt-dot" aria-hidden="true">·</span>
                            <Clock size={11} aria-hidden="true" />
                            {elapsed(p.opened_at)}
                        </>
                    ) : (
                        <>
                            <Users size={11} aria-hidden="true" />
                            {`seats ${p.capacity || 0}`}
                        </>
                    )}
                </span>
            </span>

            <span className="vqt-table-end">
                <StateChip card={p} alert={alert} />
                {open && due > 0 && (
                    <span className="vq-num vqt-table-due" title={money(due)}>{money(due)}</span>
                )}
                {open && unsent > 0 && (
                    <span className="vqt-table-unsent" title={`${unsent} not yet sent to the kitchen`}>
                        <CircleDot size={10} aria-hidden="true" />
                        {unsent}
                    </span>
                )}
                {!isList && <Server server={p.server} />}
            </span>

            {/* The alarm says how long, because "eight minutes" is what makes
                someone move and a red border on its own does not. */}
            {alert > 0 && (
                <span className="vqt-alert-age vq-num" aria-hidden="true">{alert}m</span>
            )}
        </button>
    );
}

/* ── A LANE TICKET ───────────────────────────────────────────────────── */
function TicketCard({ t, selected, onPick, money, variant, now }) {
    const alert = alertAge(t, now);
    const due = Number(t.order_total) || 0;
    const unsent = Number(t.unsent) || 0;
    const Icon = LANE_ICON[t.order_type] || ShoppingBag;

    return (
        <button
            type="button"
            onClick={() => onPick(t)}
            className="vqt-table vqt-ticket"
            data-tone={toneOf(t)}
            data-selected={selected ? '1' : '0'}
            data-variant={variant}
            data-alert={alert ? '1' : '0'}
            aria-pressed={selected}
            aria-label={`${t.order_type} ${t.code}${due ? `, ${money(due)} due` : ''}`}
        >
            <span className="vqt-table-code vqt-ticket-code">
                <Icon size={12} aria-hidden="true" />
                {t.code}
            </span>

            <span className="vqt-table-mid">
                <span className="vqt-table-name vq-clip">{t.label || t.code}</span>
                <span className="vqt-table-sub vq-clip">
                    <Clock size={11} aria-hidden="true" />
                    {elapsed(t.opened_at)}
                    {t.phone && (
                        <>
                            <span className="vqt-dot" aria-hidden="true">·</span>
                            <Phone size={11} aria-hidden="true" />
                            {t.phone}
                        </>
                    )}
                </span>
                {/* Where it is going. A delivery with no address on the card is
                    a driver walking back to ask. */}
                {t.order_type === 'delivery' && t.address && (
                    <span className="vqt-ticket-addr vq-clip">{t.address}</span>
                )}
            </span>

            <span className="vqt-table-end">
                <StateChip card={t} alert={alert} />
                {due > 0 && <span className="vq-num vqt-table-due" title={money(due)}>{money(due)}</span>}
                {unsent > 0 && (
                    <span className="vqt-table-unsent" title={`${unsent} not yet sent to the kitchen`}>
                        <CircleDot size={10} aria-hidden="true" />
                        {unsent}
                    </span>
                )}
                {variant !== 'list' && <Server server={t.server} />}
            </span>

            {alert > 0 && <span className="vqt-alert-age vq-num" aria-hidden="true">{alert}m</span>}
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
    onSetup,
    money,
    /* 'map' | 'list' — the engine's decision, never this component's */
    variant = 'map',
    embedded = false,
    /* Passed in rather than read here so every card in one paint agrees on
       what time it is, and so a parent tick re-sorts the whole floor at once. */
    now = Date.now(),
}) {
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
        return [...positions].sort((a, b) => {
            const ra = rank(a); const rb = rank(b);
            if (ra !== rb) return ra - rb;
            if (ra === 0) return alertAge(b, now) - alertAge(a, now);
            return (a.sort_order ?? 0) - (b.sort_order ?? 0)
                || String(a.code).localeCompare(String(b.code), undefined, { numeric: true });
        });
    }, [positions, now]);

    const laneTab = tabs.find(t => t.id === zone && t.kind === 'lane');

    return (
        <section
            className={embedded ? 'vqt-floor vqt-floor-embedded' : 'vq-pane vqt-floor bg-surface border border-line/80 shadow-md'}
            data-pane="floor"
        >
            {!embedded && (
                <header className="vq-pane-h bg-sunken/60 text-ink-muted border-b border-line">
                    <Users size={15} className="text-brand-500 dark:text-brand-400" />
                    <span>Floor</span>
                    {counts?.alerts > 0 && (
                        <span className="vqt-h-alert" title="Tables waiting on someone">
                            <AlertTriangle size={11} aria-hidden="true" />
                            {counts.alerts}
                        </span>
                    )}
                    <span className="vq-num ml-auto text-2xs opacity-80 font-bold">
                        {counts ? `${counts.open} open · ${counts.free} free` : ''}
                    </span>
                </header>
            )}

            {tabs.length > 1 && (
                <div className="vqt-zones vq-pane-fixed" role="tablist" aria-label="Areas">
                    <button
                        type="button" role="tab" aria-selected={zone === 'all'}
                        className="vqt-zone" data-on={zone === 'all' ? '1' : '0'}
                        onClick={() => setZone('all')}
                    >
                        All
                    </button>
                    {tabs.map(t => {
                        const Icon = t.kind === 'lane' ? (LANE_ICON[t.id] || ShoppingBag) : null;
                        return (
                            <button
                                key={t.id} type="button" role="tab" aria-selected={zone === t.id}
                                className="vqt-zone" data-on={zone === t.id ? '1' : '0'}
                                data-kind={t.kind}
                                onClick={() => setZone(t.id)}
                            >
                                {Icon && <Icon size={12} aria-hidden="true" />}
                                {t.label}
                                {t.kind === 'lane' && t.count > 0 && (
                                    <span className="vqt-zone-n vq-num">{t.count}</span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            <div className="vq-pane-body vqt-floor-body" data-variant={variant}>
                {/* A lane's primary action is "start one", and it belongs at
                    the top of the lane rather than in a menu: a counter with a
                    queue takes a new bag every ninety seconds. */}
                {laneTab && (
                    <button type="button" className="vqt-new-ticket" onClick={() => onNewTicket?.(zone)}>
                        <Plus size={15} aria-hidden="true" />
                        New {laneTab.label.toLowerCase()} ticket
                    </button>
                )}

                {ordered.map(c => (
                    c.kind === 'ticket'
                        ? <TicketCard key={c.id} t={c} variant={variant} now={now}
                                      selected={c.id === selectedId} onPick={onPick} money={money} />
                        : <TableCard key={c.id} p={c} variant={variant} now={now}
                                     selected={c.id === selectedId} onPick={onPick} money={money} />
                ))}

                {ordered.length === 0 && (
                    <div className="vqt-floor-empty">
                        <div className="w-14 h-14 rounded-2xl bg-sunken border border-line flex items-center justify-center text-ink-muted mb-3">
                            <Plus size={26} strokeWidth={1.75} />
                        </div>
                        <p className="font-bold text-ink">
                            {laneTab ? `No ${laneTab.label.toLowerCase()} tickets open` : 'No tables in this area'}
                        </p>
                        {laneTab ? (
                            <p className="text-xs text-ink-muted mt-1">Start one above.</p>
                        ) : (
                            <>
                                <p className="text-xs text-ink-muted mt-1 mb-3">
                                    Tables come from the floor plan. Build it once and this fills in.
                                </p>
                                {/* This empty state used to say "add tables in
                                    Settings" and point at a screen that did not
                                    exist. It exists now, so it is a button. */}
                                <button type="button" className="vqt-new-ticket" onClick={onSetup}>
                                    <Plus size={15} aria-hidden="true" />
                                    Set up the floor plan
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
        </section>
    );
}

/* ==========================================================================
   Previews for everything that is not the register's shape
   ==========================================================================
   The floor, the kitchen tickets, the printed receipt, the payment panel, the
   hardware and the keyboard. Each takes the SAME values the settings write,
   so what is drawn here is what the till does — and wherever the store's own
   data has loaded (its tables, its products, its categories, its name and
   address) that is what is drawn, not a stock example.
   ========================================================================== */

import React, { useMemo } from 'react';
import {
    ArrowDown, Printer, Monitor, ScanBarcode, Scale, Tv, CreditCard, Unlock, Wifi, WifiOff, ShoppingBag, Bike,
    UtensilsCrossed, CloudUpload,
} from 'lucide-react';
import { resolveStation, printerLabel, hueFor } from '../kitchenRouting';
import { sampleItems } from './RegisterLivePreview';

/* ── FLOOR ────────────────────────────────────────────────────────────── */

const DEMO_TABLES = [
    { code: 'T1', zone: 'Main hall', state: 'in_kitchen', covers: 4, capacity: 4, order_total: 4250, server: 'AK', mins: 22 },
    { code: 'T2', zone: 'Main hall', state: 'free', capacity: 2 },
    { code: 'T3', zone: 'Main hall', state: 'ordered', covers: 2, capacity: 2, order_total: 1890, server: 'SR', mins: 9 },
    { code: 'T4', zone: 'Main hall', state: 'seated', covers: 3, capacity: 4, server: 'AK', mins: 11, alert: true },
    { code: 'T5', zone: 'Main hall', state: 'free', capacity: 6 },
    { code: 'T6', zone: 'Main hall', state: 'served', covers: 5, capacity: 6, order_total: 7600, server: 'SR', mins: 48 },
    { code: 'P1', zone: 'Patio', state: 'check_dropped', covers: 2, capacity: 2, order_total: 2340, server: 'NB', mins: 63, alert: true },
    { code: 'P2', zone: 'Patio', state: 'free', capacity: 4 },
    { code: 'P3', zone: 'Patio', state: 'reserved', capacity: 4 },
];

const STATE_LABEL = {
    free: 'Free', seated: 'Seated', ordered: 'Ordered', in_kitchen: 'In kitchen', served: 'Served',
    check_dropped: 'Bill given', cleaning: 'Cleaning', reserved: 'Reserved',
};
const toneOf = t => (t.alert ? 'alert'
    : t.state === 'in_kitchen' ? 'kitchen'
    : t.state === 'seated' ? 'seated'
    : (t.state === 'ordered' || t.state === 'served' || t.state === 'check_dropped') ? 'ordered'
    : 'free');

export function FloorPreview({ positions, view = 'cards', sort = 'attention', size = 'normal', showMoney = true, showServer = true, showTime = true, lanes = {}, money }) {
    const tables = useMemo(() => {
        const real = (Array.isArray(positions) ? positions : []).filter(p => p && p.kind !== 'ticket' && p.code).slice(0, 12).map(p => ({
            code: String(p.code), zone: p.zone || 'Main hall', state: p.state || (p.occupancy_id ? 'ordered' : 'free'),
            covers: p.covers, capacity: p.capacity, order_total: Number(p.order_total) || 0,
            server: p.server?.initials, mins: p.opened_at ? Math.max(1, Math.round((Date.now() - new Date(p.opened_at).getTime()) / 60000)) : null,
        }));
        const list = real.length >= 3 ? real : DEMO_TABLES;
        const rank = t => (t.alert ? 0 : t.order_total ? 1 : t.state === 'reserved' ? 3 : 4);
        const sorted = [...list].sort((a, b) => (sort === 'attention' ? rank(a) - rank(b) : 0)
            || a.code.localeCompare(b.code, undefined, { numeric: true }));
        sorted.zones = [...new Set(list.map(t => t.zone))];
        return sorted;
    }, [positions, sort]);

    const min = (view === 'grid' || view === 'map') ? ({ compact: 64, normal: 78, large: 96 }[size])
        : view === 'list' ? 400 : ({ compact: 128, normal: 150, large: 190 }[size]);
    const h = { compact: 70, normal: 86, large: 108 }[size];

    const Card = ({ t }) => {
        const tone = toneOf(t);
        if (view === 'grid' || view === 'map') {
            const cap = Number(t.capacity) || 2;
            return (
                <div className="pvf-t" data-view={view} data-tone={tone}
                     data-shape={cap <= 2 ? 'round' : cap <= 4 ? 'square' : 'long'}>
                    <span className="pvf-code vqs-num">{t.code}</span>
                    <span className="pvf-state">{t.alert ? `${t.mins}m` : STATE_LABEL[t.state]}</span>
                </div>
            );
        }
        return (
            <div className="pvf-t" data-view={view === 'list' ? 'list' : 'cards'} data-tone={tone}>
                <div className="pvf-t-top">
                    <span className="pvf-code vqs-num">{t.code}</span>
                    <div style={{ minWidth: 0 }}>
                        <div className="pvf-name">Table {t.code}</div>
                        <div className="pvf-sub">
                            {t.order_total || t.state === 'seated'
                                ? `${t.covers || 1} guests${showTime && t.mins ? ` · ${t.mins}m` : ''}`
                                : `seats ${t.capacity || 2}`}
                        </div>
                    </div>
                    {showServer && t.server && view !== 'list' && <span className="pvf-srv">{t.server}</span>}
                </div>
                <div className="pvf-foot">
                    <span className="pvf-state">{t.alert ? `Waiting ${t.mins}m` : STATE_LABEL[t.state]}</span>
                    {showMoney && t.order_total > 0 && <span className="pvf-due vqs-num">{money(t.order_total)}</span>}
                </div>
            </div>
        );
    };

    const zones = tables.zones || [...new Set(tables.map(t => t.zone))];
    return (
        <div className="pv-card pvf" style={{ '--pvf-min': `${min}px`, '--pvf-h': `${h}px` }}>
            <div className="pvf-tabs">
                <span className="pvf-tab" data-on="1">All</span>
                {zones.map(z => <span key={z} className="pvf-tab">{z}</span>)}
                {lanes.takeaway && <span className="pvf-tab"><ShoppingBag size={12} style={{ marginRight: 5 }} />Takeaway</span>}
                {lanes.delivery && <span className="pvf-tab"><Bike size={12} style={{ marginRight: 5 }} />Delivery</span>}
            </div>
            {view === 'sections' ? zones.map(z => (
                <div key={z}>
                    <div className="pvf-zone"><span>{z}</span><span>{tables.filter(t => t.zone === z && t.state !== 'free').length} busy</span></div>
                    <div className="pvf-grid" style={{ marginTop: 6 }}>
                        {tables.filter(t => t.zone === z).map(t => <Card key={t.code} t={t} />)}
                    </div>
                </div>
            )) : (
                <div className={view === 'map' ? 'pvf-grid pvf-room' : 'pvf-grid'}>
                    {tables.map(t => <Card key={t.code} t={t} />)}
                </div>
            )}
            <div className="pvf-legend">
                <span><i style={{ background: 'var(--vq-surface)' }} />Free</span>
                <span><i style={{ borderColor: 'var(--vq-info, #3b82f6)' }} />Seated</span>
                <span><i style={{ borderColor: 'var(--vq-accent)' }} />Ordered</span>
                <span><i style={{ borderColor: 'var(--vq-warning)' }} />Cooking</span>
                <span><i style={{ borderColor: 'var(--vq-danger)', background: 'var(--vq-danger-bg)' }} />Needs someone</span>
            </div>
        </div>
    );
}

/* ── KITCHEN TICKETS ──────────────────────────────────────────────────── */

const DEMO_ORDER = [
    { id: 'd1', name: 'Mint Lemonade', qty: 2, kitchen_station: 'Bar', category: 'Drinks' },
    { id: 'd2', name: 'Zinger Burger', qty: 2, kitchen_station: 'Grill', category: 'Burgers', mods: ['No onion'] },
    { id: 'd3', name: 'Loaded Fries', qty: 1, kitchen_station: 'Fryer', category: 'Sides' },
    { id: 'd4', name: 'Caesar Salad', qty: 1, kitchen_station: 'Cold prep', category: 'Starters' },
    { id: 'd5', name: 'Alfredo Pasta', qty: 1, kitchen_station: 'Pasta', category: 'Mains' },
];

export function TicketsPreview({ routing, products, categories = [] }) {
    const order = useMemo(() => {
        const { items, real } = sampleItems(products, true);
        if (!real) return DEMO_ORDER;
        /* Spread the sample across categories, so a station that owns one
           category visibly gets something. */
        const byCat = new Map();
        for (const it of items) {
            const k = String(it.category_id ?? 'none');
            if (!byCat.has(k)) byCat.set(k, it);
        }
        const picked = [...byCat.values(), ...items].filter((v, i, a) => a.indexOf(v) === i).slice(0, 6);
        return picked.map((it, i) => ({ ...it, qty: i === 1 ? 2 : 1 }));
    }, [products]);

    const groups = useMemo(() => {
        const g = new Map();
        for (const it of order) {
            const st = resolveStation(routing, it);
            if (!g.has(st.name)) g.set(st.name, { ...st, lines: [] });
            g.get(st.name).lines.push(it);
        }
        return [...g.values()];
    }, [order, routing]);

    const catName = id => categories.find(c => String(c.id) === String(id))?.name;

    return (
        <div className="pvk">
            <div className="pv-card">
                <h5>An order for table T4</h5>
                <div className="pvk-order">
                    {order.map(it => {
                        const st = resolveStation(routing, it);
                        return (
                            <div key={it.id} className="pvk-item">
                                <i style={{ background: hueFor(routing, st.name) }} />
                                <span><b className="vqs-num">{it.qty}×</b> {it.name}</span>
                                <span className="vqs-muted">{st.name}{catName(it.category_id) ? ` · ${catName(it.category_id)}` : ''}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className="pvk-arrow"><ArrowDown size={20} /></div>
            <p className="vqs-preview-cap" style={{ textAlign: 'center' }}>
                {groups.length === 1
                    ? 'Everything prints on one ticket.'
                    : `This order becomes ${groups.length} tickets — one for each station.`}
            </p>
            <div className="pvk-tickets">
                {groups.map(g => (
                    g.printer === 'none' ? (
                        <div key={g.name} className="pvk-screenonly">
                            <Monitor size={15} /> {g.name}: shows on the kitchen screen only
                        </div>
                    ) : (
                        <div key={g.name} className="pvk-ticket">
                            <div className="pvk-ticket-h">[ DINE-IN ]</div>
                            {g.name.toLowerCase() !== 'kitchen' && <div className="pvk-ticket-st">{g.name.toUpperCase()}</div>}
                            <div style={{ textAlign: 'center', fontWeight: 900, fontSize: 13 }}>TABLE: T4</div>
                            <div className="pvk-ticket-to"><span>{printerLabel(g.printer)}</span></div>
                            <hr />
                            {g.lines.map(l => (
                                <div key={l.id}>
                                    <div className="pvk-ticket-line">{l.qty}x {l.name}</div>
                                    {l.mods && <div className="pvk-ticket-mod">* {l.mods.join(', ')}</div>}
                                </div>
                            ))}
                            <hr />
                            <div style={{ textAlign: 'center', fontSize: 10 }}>No prices on kitchen tickets</div>
                        </div>
                    )
                ))}
            </div>
        </div>
    );
}

/* ── PAYMENT PANEL ────────────────────────────────────────────────────── */

export function PaymentPreview({ money, enableTax, taxRate, taxBasis = 'exclusive', roundMode, roundOffOnTill, autoFillCash, cashDefault, discountPresets = [], serviceChargePct = 0, tip = false, restaurant = false, freeQty, products }) {
    const { items } = useMemo(() => sampleItems(products, restaurant), [products, restaurant]);
    const lines = items.slice(0, 3);
    const sub = lines.reduce((a, l, i) => a + l.price * (i === 0 ? 2 : 1), 0) + 0.37;
    const disc = discountPresets.length ? sub * discountPresets[0] / 100 : 0;
    const afterDisc = sub - disc;
    const rate = enableTax ? (Number(taxRate) || 0) : 0;
    const tax = rate ? (taxBasis === 'inclusive' ? afterDisc - afterDisc / (1 + rate / 100) : afterDisc * rate / 100) : 0;
    const svc = restaurant ? afterDisc * (Number(serviceChargePct) || 0) / 100 : 0;
    const raw = afterDisc + (taxBasis === 'inclusive' ? 0 : tax) + svc;
    let total = raw;
    if (roundOffOnTill && roundMode && roundMode !== 'none') {
        const d = roundMode === '0' || roundMode === '1' || roundMode === true ? 0 : Number(roundMode);
        const f = 10 ** (Number.isFinite(d) ? d : 0);
        total = Math.round(raw * f) / f;
    }
    const rounding = total - raw;
    return (
        <div className="pvp">
            <div className="pvp-total">
                <div className="pvp-row"><span>Subtotal</span><b>{money(sub)}</b></div>
                {disc > 0 && <div className="pvp-row" data-new="1"><span>Discount {discountPresets[0]}% (example)</span><b>−{money(disc)}</b></div>}
                {tax > 0 && <div className="pvp-row" data-new="1"><span>Tax {rate}%{taxBasis === 'inclusive' ? ' (included)' : ''}</span><b>{money(tax)}</b></div>}
                {svc > 0 && <div className="pvp-row" data-new="1"><span>Service charge {serviceChargePct}%</span><b>{money(svc)}</b></div>}
                {tip && <div className="pvp-row" data-new="1"><span>Tip</span><b style={{ opacity: .7 }}>typed by staff</b></div>}
                {Math.abs(rounding) > 0.0001 && <div className="pvp-row" data-new="1"><span>Rounding</span><b>{money(rounding)}</b></div>}
                <div className="pvp-big"><span>Total payable</span><b>{money(total)}</b></div>
            </div>
            {discountPresets.length > 0 && (
                <div>
                    <p className="vqs-preview-cap" style={{ marginBottom: 6 }}>Quick discount buttons</p>
                    <div className="pvp-chips">{discountPresets.map(d => <span key={d} className="pvp-chip">{d}%</span>)}</div>
                </div>
            )}
            <div className="pvp-chips">
                {['Cash', 'Card', 'Bank transfer'].map((m, i) => (
                    <span key={m} className="pvp-chip" style={i === 0 && cashDefault ? { background: 'var(--vq-accent-quiet)', color: 'var(--vq-accent-text)', borderColor: 'var(--vq-accent-quiet-line)' } : undefined}>{m}</span>
                ))}
            </div>
            <div className="pvp-field" data-filled={autoFillCash ? '1' : '0'}>
                <span>Amount received</span>
                <b>{autoFillCash ? money(total) : '—'}</b>
            </div>
            {freeQty && <p className="vqs-preview-cap">Each line can carry free items (e.g. buy 10, get 1 free) — they are shown but not charged.</p>}
        </div>
    );
}

/* ── HARDWARE ─────────────────────────────────────────────────────────── */

export function HardwarePreview({ station, isOnline, pendingCount }) {
    const { connected, version, printers = [], defaultPrinter, hardware, roles = [] } = station || {};
    const scale = hardware?.serial?.scale;
    const display = hardware?.customerDisplay || hardware?.serial?.pole;
    const rows = [
        { icon: Printer, name: 'Receipt printer', sub: connected ? (defaultPrinter || 'Not chosen yet') : 'Prints through the browser', tone: connected ? (defaultPrinter ? 'ok' : 'warn') : 'idle' },
        { icon: UtensilsCrossed, name: 'Kitchen & bar printers', sub: roles.filter(r => r.printer && (r.role === 'kitchen' || r.role === 'bar')).map(r => `${r.role}: ${r.printer}`).join(' · ') || (connected ? 'Set in VenQore Station' : 'Need VenQore Station'), tone: connected ? 'ok' : 'idle' },
        { icon: Unlock, name: 'Cash drawer', sub: connected ? 'Opens through the receipt printer' : 'Needs VenQore Station', tone: connected ? 'ok' : 'idle' },
        { icon: ScanBarcode, name: 'Barcode scanner', sub: 'Works like a keyboard — plug and scan', tone: 'ok' },
        { icon: Scale, name: 'Weighing scale', sub: scale?.connected ? 'Connected' : (connected ? 'Not found' : 'Needs VenQore Station'), tone: scale?.connected ? 'ok' : 'idle' },
        { icon: Tv, name: 'Customer screen', sub: connected ? (display?.connected ? 'Connected' : 'Available') : 'Needs VenQore Station', tone: display?.connected ? 'ok' : connected ? 'warn' : 'idle' },
        { icon: CreditCard, name: 'Card machine', sub: 'Used on its own; record the sale as Card', tone: 'idle' },
    ];
    return (
        <div className="pvh">
            <div className="pvh-hub">
                <Monitor size={22} />
                <div>
                    <b>{connected ? `VenQore Station ${version || ''}`.trim() : 'Web browser'}</b>
                    <small>{connected ? `${printers.length} printer${printers.length === 1 ? '' : 's'} found on this computer` : 'Install VenQore Station to print silently and use a drawer, scale and customer screen.'}</small>
                </div>
            </div>
            {rows.map(r => (
                <div key={r.name} className="pvh-dev">
                    <span className="pvh-dev-i"><r.icon size={17} /></span>
                    <span style={{ minWidth: 0 }}><b>{r.name}</b><small>{r.sub}</small></span>
                    <span className="vqs-dot" data-tone={r.tone === 'idle' ? undefined : r.tone} />
                </div>
            ))}
            <div className="pvh-dev">
                <span className="pvh-dev-i">{isOnline ? <Wifi size={17} /> : <WifiOff size={17} />}</span>
                <span><b>{isOnline ? 'Online' : 'Offline'}</b><small>{pendingCount ? `${pendingCount} sale${pendingCount === 1 ? '' : 's'} waiting to upload` : 'Sales save straight away'}</small></span>
                <span className="vqs-dot" data-tone={isOnline ? (pendingCount ? 'warn' : 'ok') : 'bad'} />
            </div>
            {pendingCount > 0 && <p className="vqs-preview-cap"><CloudUpload size={13} style={{ verticalAlign: '-2px' }} /> Waiting sales upload by themselves when the internet is back.</p>}
        </div>
    );
}

/* ── KEYBOARD ─────────────────────────────────────────────────────────── */

export function KeysPreview({ lastKey, keymap }) {
    const fkeys = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'];
    const hit = lastKey?.combo;
    const match = keymap.find(k => k.keys.includes(hit) || (k.match && hit && k.match.test(hit)));
    return (
        <div className="pv-card">
            <h5>Function keys</h5>
            <div className="pvkb">
                {fkeys.map(k => <kbd key={k} className="vqs-kbd" data-hit={hit === k ? '1' : '0'}>{k}</kbd>)}
            </div>
            <div className="pvkb-big">
                {hit ? (
                    <>
                        <b>{hit}</b>
                        <small>{match ? match.does : 'This key does nothing on the register.'}</small>
                    </>
                ) : (
                    <>
                        <b>Press any key</b>
                        <small>While this page is open, keys are only tested — nothing happens to your sale.</small>
                    </>
                )}
            </div>
        </div>
    );
}

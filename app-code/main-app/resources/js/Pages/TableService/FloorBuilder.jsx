/* ==========================================================================
   THE FLOOR BUILDER — VenQore V6 Redesign
   ==========================================================================
   The architectural blueprint for restaurant dining rooms and spatial layout.
   Redesigned according to VenQore V6: rich color ramps, glassmorphism,
   animated micro-interactions, room visualizer grid, and instant onboarding.
   ========================================================================== */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import {
    LayoutGrid, Plus, Trash2, Check, X, Users, ShoppingBag, Bike,
    Loader2, AlertTriangle, ChevronLeft, Lock, Pencil, GripVertical,
    QrCode, RefreshCcw, Layers, Zap, List, Sparkles, UtensilsCrossed,
    Printer, Compass, ArrowRight,
} from 'lucide-react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import Toast from '@/Components/Toast';
import ConfirmModal from '@/Components/ConfirmModal';
import RestaurantFeatureGate from '@/Components/Restaurant/RestaurantFeatureGate';
import '@/Pos/Table/floorbuilder.css';
import { useTermText } from '@/lib/terms';

const AREA_PRESETS = [
    'Main Dining',
    'Outdoor Patio',
    'Rooftop Terrace',
    'Bar & Lounge',
    'Private VIP',
];

export default function FloorBuilder({
    zones: initialZones = [],
    positions: initialPositions = [],
    settings = {},
    storeSlug,
}) {
    const tt = useTermText();
    const [zones, setZones] = useState(initialZones);
    const [positions, setPositions] = useState(initialPositions);
    const [lanes, setLanes] = useState({
        takeaway: String(settings?.lane_takeaway ?? '0') === '1',
        delivery: String(settings?.lane_delivery ?? '0') === '1',
    });
    const [busy, setBusy] = useState(false);
    const [toasts, setToasts] = useState([]);
    const [confirm, setConfirm] = useState(null);
    const [openZone, setOpenZone] = useState(() => initialZones[0]?.name || null);
    const [renaming, setRenaming] = useState(null);
    const [addingZone, setAddingZone] = useState(false);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
    const dragId = useRef(null);

    const r = (name, params = {}) => route(name, { store_slug: storeSlug, ...params });
    const say = (msg, type = 'success') => {
        setToasts(t => [...t, { id: Date.now() + Math.random(), message: msg, type }]);
    };

    const post = async (name, body) => {
        setBusy(true);
        try {
            const { data } = await axios.post(r(name), body);
            if (Array.isArray(data?.zones)) setZones(data.zones);
            if (Array.isArray(data?.positions)) setPositions(data.positions);
            return data;
        } catch (e) {
            say(e?.response?.data?.message || 'That did not work.', 'error');
            return null;
        } finally {
            setBusy(false);
        }
    };

    const byZone = useMemo(() => {
        const m = new Map();
        zones.forEach(z => m.set(z.name, []));
        positions.forEach(p => {
            if (!m.has(p.zone)) m.set(p.zone, []);
            m.get(p.zone).push(p);
        });
        return m;
    }, [zones, positions]);

    const totals = useMemo(() => ({
        tables: positions.length,
        seats: positions.reduce((a, p) => a + (Number(p.capacity) || 0), 0),
        busy: positions.filter(p => p.has_open_bill).length,
        zonesCount: zones.length,
    }), [positions, zones]);

    // Validated open zone - falls back to first zone if active one is deleted or invalid
    const activeZoneName = useMemo(() => {
        if (!openZone && zones.length > 0) return zones[0].name;
        if (openZone && zones.some(z => z.name === openZone)) return openZone;
        return zones[0]?.name || null;
    }, [zones, openZone]);

    /* ── zones ─────────────────────────────────────────────────────────── */

    const addZone = async (name) => {
        const clean = (name || '').trim();
        if (!clean) return;
        const d = await post('store.tables.plan.zone.add', { name: clean });
        if (d) {
            setOpenZone(clean);
            setAddingZone(false);
            say(`${clean} added to floor`);
        }
    };

    const renameZone = async (from, to) => {
        const clean = (to || '').trim();
        setRenaming(null);
        if (!clean || clean === from) return;
        const d = await post('store.tables.plan.zone.rename', { from, to: clean });
        if (d) {
            setOpenZone(clean);
            say(`Area renamed to ${clean}`);
        }
    };

    const removeZone = (name) => {
        const tables = byZone.get(name) || [];
        const others = zones.filter(z => z.name !== name);
        const openBills = tables.filter(t => t.has_open_bill).length;

        if (openBills) {
            say(`${name} has ${openBills} table${openBills === 1 ? '' : 's'} with an open bill. Settle or close ${openBills === 1 ? 'it' : 'them'} first.`, 'error');
            return;
        }
        setConfirm({
            title: `Remove ${name}?`,
            message: tables.length === 0
                ? 'This area is empty, so nothing else changes.'
                : others.length
                    ? `${tables.length} table${tables.length === 1 ? '' : 's'} are in it. They will move to ${others[0].name} rather than be deleted.`
                    : `${tables.length} table${tables.length === 1 ? '' : 's'} are in it and there is nowhere to move them, so they will be deleted.`,
            onConfirm: async () => {
                setConfirm(null);
                const d = await post('store.tables.plan.zone.remove', {
                    name,
                    move_to: tables.length && others.length ? others[0].name : null,
                });
                if (d) {
                    setOpenZone(others[0]?.name || null);
                    say(`${name} removed`);
                }
            },
        });
    };

    /* ── tables ────────────────────────────────────────────────────────── */

    const removeTable = (p) => {
        if (p.has_open_bill) {
            say(`${p.label || p.code} has an open bill. Settle or close it first.`, 'error');
            return;
        }
        setConfirm({
            title: `Remove ${p.label || p.code}?`,
            message: 'The table will be removed from the floor plan. Past sales remain completely untouched.',
            onConfirm: async () => {
                setConfirm(null);
                const d = await post('store.tables.plan.table.remove', { id: p.id });
                if (d) say(`${p.code} removed`);
            },
        });
    };

    const onDrop = async (targetId) => {
        const from = dragId.current;
        dragId.current = null;
        if (!from || from === targetId) return;
        const zoneName = positions.find(p => p.id === from)?.zone;
        const list = (byZone.get(zoneName) || []).map(p => p.id);
        const a = list.indexOf(from);
        const b = list.indexOf(targetId);
        if (a === -1 || b === -1) return;
        list.splice(b, 0, list.splice(a, 1)[0]);

        setPositions(prev => {
            const order = new Map(list.map((id, i) => [id, i]));
            return [...prev].sort((x, y) =>
                (order.has(x.id) && order.has(y.id)) ? order.get(x.id) - order.get(y.id) : 0);
        });
        await post('store.tables.plan.reorder', { ids: list });
    };

    const toggleLane = async (which, value) => {
        const next = { ...lanes, [which]: value };
        setLanes(next);
        setBusy(true);
        try {
            await axios.post(r('store.tables.plan.lanes'), next);
            say(value ? `${which === 'takeaway' ? 'Takeaway' : 'Delivery'} orders enabled` : `${which === 'takeaway' ? 'Takeaway' : 'Delivery'} orders disabled`);
        } catch (e) {
            setLanes(lanes);
            say(e?.response?.data?.message || 'That could not be saved.', 'error');
        } finally {
            setBusy(false);
        }
    };

    /* ── Quick Starter Wizard for Empty Floors ─────────────────────────── */
    const applyStarter = async (starterName, tableCount, seatsPerTable, prefix) => {
        const d = await post('store.tables.plan.zone.add', { name: starterName });
        if (d) {
            setOpenZone(starterName);
            await post('store.tables.plan.tables.bulk', {
                zone: starterName,
                count: tableCount,
                prefix: prefix,
                start: 1,
                capacity: seatsPerTable,
            });
            say(`Created ${starterName} with ${tableCount} tables`);
        }
    };

    const activeZoneTables = byZone.get(activeZoneName) || [];
    const activeZoneSeats = activeZoneTables.reduce((acc, t) => acc + (Number(t.capacity) || 0), 0);

    return (
        <OneGlanceLayout>
            <Head title="Floor plan" />

            <div className="vqfb">
                {/* ── HEADER HERO CARD ────────────────────────────────────────── */}
                <header className="vqfb-head">
                    <div className="vqfb-head-top">
                        <div className="vqfb-head-main">
                            <Link
                                href={route('store.tables.index', { store_slug: storeSlug })}
                                className="vqfb-back"
                                title="Back to Table Service"
                            >
                                <ChevronLeft size={16} aria-hidden="true" />
                                <span>Floor</span>
                            </Link>

                            <div className="min-w-0">
                                <div className="vqfb-eyebrow">
                                    <span className="vqfb-eyebrow-dot" aria-hidden="true" />
                                    <span>VenQore V6 · Spatial Architecture</span>
                                </div>
                                <h1 className="vqfb-title">Floor plan</h1>
                                <p className="vqfb-sub">
                                    Configure dining areas, tables, and off-table service channels. Tables configured
                                    here automatically connect with POS terminals, waiter handhelds, and QR ordering.
                                </p>
                            </div>
                        </div>

                        {/* ── KPI METRIC PILLS ── */}
                        <div className="vqfb-totals">
                            <div className="vqfb-stat-pill" title="Total tables across all areas">
                                <span className="vqfb-stat-icon teal">
                                    <LayoutGrid size={14} aria-hidden="true" />
                                </span>
                                <span>
                                    <b className="vqfb-stat-num">{totals.tables}</b> tables
                                </span>
                            </div>

                            <div className="vqfb-stat-pill" title="Total seating capacity">
                                <span className="vqfb-stat-icon sky">
                                    <Users size={14} aria-hidden="true" />
                                </span>
                                <span>
                                    <b className="vqfb-stat-num">{totals.seats}</b> seats
                                </span>
                            </div>

                            <div className="vqfb-stat-pill" title="Total active dining areas">
                                <span className="vqfb-stat-icon lime">
                                    <Layers size={14} aria-hidden="true" />
                                </span>
                                <span>
                                    <b className="vqfb-stat-num">{totals.zonesCount}</b> {totals.zonesCount === 1 ? 'area' : 'areas'}
                                </span>
                            </div>

                            {totals.busy > 0 && (
                                <div className="vqfb-total-busy" title="Tables currently with open guest bills">
                                    <Lock size={12} aria-hidden="true" />
                                    <span><b>{totals.busy}</b> in use</span>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {String(settings?.service_mode) === 'counter' && (
                    <div className="px-6 pt-4">
                        <RestaurantFeatureGate
                            storeSlug={storeSlug}
                            title="Table Service is Currently Set to Counter Only"
                            description="The POS is currently running in quick counter mode. Turn table service on so cashiers and servers can seat guests at tables and split bills."
                            settingKey="service_mode"
                            turnOnValue="both"
                            turnOnLabel="Turn Table Service On"
                            isEnabled={false}
                            icon={UtensilsCrossed}
                            mode="banner"
                        />
                    </div>
                )}

                {/* ── TWO-COLUMN WORKSPACE ────────────────────────────────────── */}
                <div className="vqfb-body">
                    {/* ── LEFT SIDEBAR: AREAS & LANES ──────────────────────────── */}
                    <aside className="vqfb-zones">
                        <div className="vqfb-h2">
                            <span>Areas</span>
                            <span className="vqfb-h2-tag">{zones.length}</span>
                        </div>

                        {zones.map(z => (
                            <div key={z.name} className="vqfb-zone" data-on={activeZoneName === z.name ? '1' : '0'}>
                                {renaming === z.name ? (
                                    <InlineText
                                        value={z.name}
                                        onCancel={() => setRenaming(null)}
                                        onSave={v => renameZone(z.name, v)}
                                        aria-label="Area name"
                                    />
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            className="vqfb-zone-pick"
                                            onClick={() => setOpenZone(z.name)}
                                            aria-pressed={activeZoneName === z.name}
                                        >
                                            <span className="vqfb-zone-icon" aria-hidden="true">
                                                <UtensilsCrossed size={14} />
                                            </span>
                                            <span className="vq-clip">{z.name}</span>
                                            <span className="vqfb-zone-n">{z.count}</span>
                                        </button>
                                        <button
                                            type="button"
                                            className="vqfb-icon"
                                            onClick={() => setRenaming(z.name)}
                                            title={`Rename ${z.name}`}
                                            aria-label={`Rename ${z.name}`}
                                        >
                                            <Pencil size={13} />
                                        </button>
                                        <button
                                            type="button"
                                            className="vqfb-icon vqfb-icon-danger"
                                            onClick={() => removeZone(z.name)}
                                            title={`Remove ${z.name}`}
                                            aria-label={`Remove ${z.name}`}
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </>
                                )}
                            </div>
                        ))}

                        {addingZone ? (
                            <div className="flex flex-col gap-2 p-1">
                                <InlineText
                                    value=""
                                    placeholder="e.g. Garden Terrace"
                                    onCancel={() => setAddingZone(false)}
                                    onSave={addZone}
                                    aria-label="New area name"
                                />
                                <div className="vqfb-quick-presets">
                                    {AREA_PRESETS.filter(p => !zones.some(z => z.name.toLowerCase() === p.toLowerCase())).slice(0, 3).map(preset => (
                                        <button
                                            key={preset}
                                            type="button"
                                            className="vqfb-preset-pill"
                                            onClick={() => addZone(preset)}
                                        >
                                            + {preset}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <button
                                type="button"
                                className="vqfb-add-zone"
                                onClick={() => setAddingZone(true)}
                            >
                                <Plus size={15} aria-hidden="true" />
                                Add an area
                            </button>
                        )}

                        {zones.length === 0 && (
                            <p className="vqfb-hint">
                                Ground floor, Terrace, Garden — whatever you call your rooms. Add one to start.
                            </p>
                        )}

                        {/* ── BEYOND THE TABLES (LANES) ────────────────────────── */}
                        <div className="vqfb-h2 vqfb-h2-gap">
                            <span>Beyond the tables</span>
                            <span className="vqfb-h2-tag">Lanes</span>
                        </div>
                        <p className="vqfb-hint">
                            {tt('Orders that never sit down. They get their own tab on the floor and their own ticket numbers — not made-up tables.')}
                        </p>
                        <LaneToggle
                            icon={ShoppingBag}
                            iconClass="takeaway"
                            label="Takeaway"
                            hint="Counter and collection orders."
                            on={lanes.takeaway}
                            onChange={v => toggleLane('takeaway', v)}
                        />
                        <LaneToggle
                            icon={Bike}
                            iconClass="delivery"
                            label="Delivery"
                            hint="Adds address and phone to the ticket."
                            on={lanes.delivery}
                            onChange={v => toggleLane('delivery', v)}
                        />
                    </aside>

                    {/* ── RIGHT MAIN CANVAS: TABLES IN OPEN AREA ───────────────── */}
                    <main className="vqfb-tables">
                        {!activeZoneName ? (
                            /* ── RICH DELIGHTFUL EMPTY STATE ── */
                            <div className="vqfb-empty">
                                <div className="vqfb-empty-orb" aria-hidden="true">
                                    <LayoutGrid size={36} strokeWidth={1.8} />
                                </div>
                                <h2 className="vqfb-empty-title">Design Your Restaurant Floor Plan</h2>
                                <p className="vqfb-empty-desc">
                                    Set up dining areas, rooms, or outdoor terraces. Choose an instant starter pack
                                    below to auto-generate standard layouts or click "Add an area" to build custom.
                                </p>

                                <div className="vqfb-starters">
                                    <button
                                        type="button"
                                        className="vqfb-starter-card"
                                        onClick={() => applyStarter('Main Dining', 12, 4, 'T')}
                                    >
                                        <span className="vqfb-starter-icon" aria-hidden="true">🍽️</span>
                                        <span className="vqfb-starter-name">Main Dining Hall</span>
                                        <span className="vqfb-starter-hint">12 tables · 48 seats (T1 … T12)</span>
                                    </button>

                                    <button
                                        type="button"
                                        className="vqfb-starter-card"
                                        onClick={() => applyStarter('Outdoor Patio', 8, 4, 'P')}
                                    >
                                        <span className="vqfb-starter-icon" aria-hidden="true">🌿</span>
                                        <span className="vqfb-starter-name">Outdoor Patio</span>
                                        <span className="vqfb-starter-hint">8 tables · 32 seats (P1 … P8)</span>
                                    </button>

                                    <button
                                        type="button"
                                        className="vqfb-starter-card"
                                        onClick={() => applyStarter('Bar & Counter', 6, 2, 'B')}
                                    >
                                        <span className="vqfb-starter-icon" aria-hidden="true">🍸</span>
                                        <span className="vqfb-starter-name">Bar & Lounge</span>
                                        <span className="vqfb-starter-hint">6 tables · 12 seats (B1 … B6)</span>
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    className="vqfb-btn vqfb-btn-go"
                                    onClick={() => setAddingZone(true)}
                                >
                                    <Plus size={15} />
                                    <span>Create Custom Dining Area</span>
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* ── AREA TOOLBAR WITH VIEW TOGGLE ── */}
                                <div className="vqfb-area-bar">
                                    <div className="vqfb-area-info">
                                        <span className="vqfb-area-badge">
                                            <Compass size={13} aria-hidden="true" />
                                            Active Area
                                        </span>
                                        <h2 className="vqfb-area-title">{activeZoneName}</h2>
                                        <span className="vqfb-h2-tag">
                                            {activeZoneTables.length} tables · {activeZoneSeats} seats
                                        </span>
                                    </div>

                                    <div className="vqfb-view-switch" aria-label="View layout mode">
                                        <button
                                            type="button"
                                            className="vqfb-view-btn"
                                            data-active={viewMode === 'grid' ? '1' : '0'}
                                            onClick={() => setViewMode('grid')}
                                            aria-pressed={viewMode === 'grid'}
                                        >
                                            <LayoutGrid size={13} />
                                            <span>Room Grid</span>
                                        </button>
                                        <button
                                            type="button"
                                            className="vqfb-view-btn"
                                            data-active={viewMode === 'list' ? '1' : '0'}
                                            onClick={() => setViewMode('list')}
                                            aria-pressed={viewMode === 'list'}
                                        >
                                            <List size={13} />
                                            <span>Fast List</span>
                                        </button>
                                    </div>
                                </div>

                                {/* ── BULK ADD TOOL ── */}
                                <BulkAdd
                                    zone={activeZoneName}
                                    busy={busy}
                                    existing={activeZoneTables.length}
                                    onCreate={async (spec) => {
                                        const d = await post('store.tables.plan.tables.bulk', { zone: activeZoneName, ...spec });
                                        if (d) {
                                            const skipped = (d.skipped || []).length;
                                            say(skipped
                                                ? `${d.created} added · ${skipped} skipped, those codes were taken`
                                                : `${d.created} table${d.created === 1 ? '' : 's'} added to ${activeZoneName}`);
                                        }
                                    }}
                                />

                                {/* ── VISUAL ROOM GRID VIEW ── */}
                                {viewMode === 'grid' && (
                                    <div className="vqfb-grid">
                                        {activeZoneTables.map((p, idx) => (
                                            <TableGridCard
                                                key={p.id}
                                                p={p}
                                                idx={idx}
                                                busy={busy}
                                                onSave={async (patch) => {
                                                    const d = await post('store.tables.plan.table.update', { id: p.id, ...patch });
                                                    if (d) say('Table saved');
                                                }}
                                                onToggleOrdering={async () => {
                                                    const enabled = !p.customer_ordering_enabled;
                                                    const d = await post('store.tables.plan.table.update', { id: p.id, customer_ordering_enabled: enabled });
                                                    if (d) say(enabled ? `${p.code} QR ordering enabled` : `${p.code} QR ordering disabled`);
                                                }}
                                                onRegenerate={() => setConfirm({
                                                    title: `Replace ${p.code} QR code?`,
                                                    message: 'The currently printed QR code will stop working immediately. Print and place the replacement after rotating it.',
                                                    confirmLabel: 'Replace QR',
                                                    onConfirm: async () => {
                                                        setConfirm(null);
                                                        const d = await post('store.tables.plan.table.qr.regenerate', { id: p.id });
                                                        if (d) say(`${p.code} QR code replaced`);
                                                    },
                                                })}
                                                onRemove={() => removeTable(p)}
                                            />
                                        ))}

                                        {activeZoneTables.length === 0 && (
                                            <div className="vqfb-hint vqfb-hint-pad col-span-full">
                                                No tables in {activeZoneName} yet. Use the bulk table generator above to populate it in one click!
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ── DENSE REORDERABLE LIST VIEW ── */}
                                {viewMode === 'list' && (
                                    <div className="vqfb-rows">
                                        <div className="vqfb-rowhead">
                                            <span />
                                            <span>Code</span>
                                            <span>Name</span>
                                            <span>Seats</span>
                                            <span />
                                        </div>

                                        {activeZoneTables.map(p => (
                                            <TableRow
                                                key={p.id}
                                                p={p}
                                                busy={busy}
                                                onDragStart={() => { dragId.current = p.id; }}
                                                onDropRow={() => onDrop(p.id)}
                                                onSave={async (patch) => {
                                                    const d = await post('store.tables.plan.table.update', { id: p.id, ...patch });
                                                    if (d) say('Saved');
                                                }}
                                                onToggleOrdering={async () => {
                                                    const enabled = !p.customer_ordering_enabled;
                                                    const d = await post('store.tables.plan.table.update', { id: p.id, customer_ordering_enabled: enabled });
                                                    if (d) say(enabled ? `${p.code} QR ordering enabled` : `${p.code} QR ordering disabled`);
                                                }}
                                                onRegenerate={() => setConfirm({
                                                    title: `Replace ${p.code} QR code?`,
                                                    message: 'The currently printed QR code will stop working immediately. Print and place the replacement after rotating it.',
                                                    confirmLabel: 'Replace QR',
                                                    onConfirm: async () => {
                                                        setConfirm(null);
                                                        const d = await post('store.tables.plan.table.qr.regenerate', { id: p.id });
                                                        if (d) say(`${p.code} QR code replaced`);
                                                    },
                                                })}
                                                onRemove={() => removeTable(p)}
                                            />
                                        ))}

                                        {activeZoneTables.length === 0 && (
                                            <p className="vqfb-hint vqfb-hint-pad">
                                                No tables in {activeZoneName} yet. Add them in one go above.
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* ── ADD ONE TABLE ── */}
                                <AddOne
                                    busy={busy}
                                    onAdd={async (spec) => {
                                        const d = await post('store.tables.plan.table.add', { zone: activeZoneName, ...spec });
                                        if (d) say(`${spec.code} added`);
                                    }}
                                />
                            </>
                        )}
                    </main>
                </div>
            </div>

            {busy && (
                <output className="vqfb-busy" aria-live="polite">
                    <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                    <span>Saving changes…</span>
                </output>
            )}

            <Toast toasts={toasts} removeToast={id => setToasts(x => x.filter(y => y.id !== id))} />

            <ConfirmModal
                show={!!confirm}
                title={confirm?.title || ''}
                message={confirm?.message || ''}
                confirmLabel={confirm?.confirmLabel || 'Remove'}
                isDangerous
                onConfirm={confirm?.onConfirm || (() => {})}
                onClose={() => setConfirm(null)}
            />
        </OneGlanceLayout>
    );
}

/* ── SUB-COMPONENTS ─────────────────────────────────────────────────── */

function InlineText({ value, placeholder, onSave, onCancel, ...rest }) {
    const [v, setV] = useState(value);
    const inputRef = useRef(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, []);

    return (
        <form
            className="vqfb-inline"
            onSubmit={(e) => {
                e.preventDefault();
                onSave(v);
            }}
        >
            <input
                ref={inputRef}
                className="vqfb-input"
                value={v}
                placeholder={placeholder}
                onChange={e => setV(e.target.value)}
                onKeyDown={e => {
                    if (e.key === 'Escape') { e.preventDefault(); onCancel(); }
                }}
                {...rest}
            />
            <button
                type="submit"
                className="vqfb-icon vqfb-icon-go"
                title="Save"
                aria-label="Save"
            >
                <Check size={14} />
            </button>
            <button
                type="button"
                className="vqfb-icon"
                onClick={onCancel}
                title="Cancel"
                aria-label="Cancel"
            >
                <X size={14} />
            </button>
        </form>
    );
}

function LaneToggle({ icon: Icon, iconClass, label, hint, on, onChange }) {
    return (
        <label className="vqfb-lane" data-on={on ? '1' : '0'}>
            <span className={`vqfb-lane-icon ${iconClass || ''}`}>
                <Icon size={16} aria-hidden="true" />
            </span>
            <span className="min-w-0">
                <span className="vqfb-lane-l">
                    {label}
                    <span className="vqfb-lane-badge">
                        {on ? 'Active' : 'Off'}
                    </span>
                </span>
                <span className="vqfb-lane-h">{hint}</span>
            </span>
            <input
                type="checkbox"
                className="sr-only"
                checked={on}
                onChange={e => onChange(e.target.checked)}
            />
            <span className="vqfb-switch" aria-hidden="true"><span /></span>
        </label>
    );
}

/* THE RAPID BULK TABLE GENERATOR */
function BulkAdd({ zone, existing, busy, onCreate }) {
    const [count, setCount] = useState(existing ? 4 : 12);
    const [prefix, setPrefix] = useState('T');
    const [start, setStart] = useState(existing + 1);
    const [capacity, setCapacity] = useState(4);

    const preview = useMemo(() => {
        const n = Math.max(1, Math.min(200, Number(count) || 1));
        const s = Math.max(0, Number(start) || 0);
        const first = `${prefix}${s}`;
        const last = `${prefix}${s + n - 1}`;
        const totalSeats = n * (Math.max(1, Number(capacity) || 1));
        const range = n === 1 ? first : `${first} … ${last}`;
        return { range, n, totalSeats };
    }, [count, prefix, start, capacity]);

    return (
        <section className="vqfb-bulk">
            <div className="min-w-0">
                <h3 className="vqfb-bulk-h">
                    <Zap size={16} className="text-brand-600" aria-hidden="true" />
                    <span>Add tables to {zone}</span>
                </h3>
                <p className="vqfb-bulk-p">
                    Creates <span className="vqfb-bulk-preview-badge">{preview.range}</span> ({preview.n} tables, {preview.totalSeats} seats). Codes already taken are skipped.
                </p>
            </div>
            <div className="vqfb-bulk-f">
                <Num label="How many" value={count} min={1} max={200} onChange={setCount} />
                <label className="vqfb-num">
                    <span>Prefix</span>
                    <input
                        className="vqfb-input"
                        value={prefix}
                        maxLength={8}
                        onChange={e => setPrefix(e.target.value)}
                    />
                </label>
                <Num label="Start at" value={start} min={0} max={99999} onChange={setStart} />
                <Num label="Seats each" value={capacity} min={1} max={99} onChange={setCapacity} />
                <button
                    type="button"
                    className="vqfb-btn vqfb-btn-go"
                    disabled={busy}
                    onClick={() => onCreate({
                        count: Math.max(1, Math.min(200, Number(count) || 1)),
                        prefix,
                        start: Math.max(0, Number(start) || 0),
                        capacity: Math.max(1, Math.min(99, Number(capacity) || 1)),
                    })}
                >
                    <Plus size={15} />
                    Add Tables
                </button>
            </div>
        </section>
    );
}

function Num({ label, value, min, max, onChange }) {
    return (
        <label className="vqfb-num">
            <span>{label}</span>
            <input
                type="number"
                className="vqfb-input vq-num"
                value={value}
                min={min}
                max={max}
                onChange={e => onChange(e.target.value)}
            />
        </label>
    );
}

/* ── VISUAL TABLE GRID CARD ── */
function TableGridCard({ p, idx, busy, onSave, onRemove, onToggleOrdering, onRegenerate }) {
    const [editing, setEditing] = useState(false);
    const [code, setCode] = useState(p.code);
    const [label, setLabel] = useState(p.label === p.code ? '' : p.label);
    const [capacity, setCapacity] = useState(p.capacity);

    const dirty = code !== p.code
        || (label || '') !== (p.label === p.code ? '' : p.label || '')
        || Number(capacity) !== Number(p.capacity);

    const saveChanges = () => {
        onSave({
            code: code.trim(),
            label: label.trim() || null,
            capacity: Math.max(1, Math.min(99, Number(capacity) || 1)),
        });
        setEditing(false);
    };

    const numSeats = Math.max(1, Math.min(12, Number(p.capacity) || 2));

    return (
        <div
            className="vqfb-table-card"
            data-busy={p.has_open_bill ? '1' : '0'}
            style={{ animationDelay: `${idx * 40}ms` }}
        >
            <div>
                <div className="vqfb-card-top">
                    <span className="vqfb-table-code-badge">{p.code}</span>
                    <div className="flex items-center gap-1">
                        {p.has_open_bill && (
                            <span className="vqfb-locked" title="Open bill on this table">
                                <Lock size={10} aria-hidden="true" />
                                In Use
                            </span>
                        )}
                        <button
                            type="button"
                            className="vqfb-icon"
                            disabled={busy}
                            onClick={onToggleOrdering}
                            title={`${p.customer_ordering_enabled ? 'Disable' : 'Enable'} QR ordering for ${p.code}`}
                            aria-label={`Toggle QR ordering for ${p.code}`}
                            style={{ opacity: p.customer_ordering_enabled ? 1 : 0.4 }}
                        >
                            <QrCode size={14} />
                        </button>
                    </div>
                </div>

                {editing ? (
                    <div className="mt-3 flex flex-col gap-2">
                        <input
                            className="vqfb-input text-xs"
                            value={code}
                            placeholder="Code (e.g. T1)"
                            onChange={e => setCode(e.target.value)}
                        />
                        <input
                            className="vqfb-input text-xs"
                            value={label}
                            placeholder="Name (e.g. Window 1)"
                            onChange={e => setLabel(e.target.value)}
                        />
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-ink-muted">Seats:</span>
                            <input
                                type="number"
                                className="vqfb-input text-xs w-16"
                                value={capacity}
                                min={1}
                                max={99}
                                onChange={e => setCapacity(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <button
                                type="button"
                                className="vqfb-btn vqfb-btn-go text-xs py-1 px-3 h-8"
                                disabled={busy}
                                onClick={saveChanges}
                            >
                                <Check size={12} /> Save
                            </button>
                            <button
                                type="button"
                                className="vqfb-btn text-xs py-1 px-3 h-8"
                                onClick={() => {
                                    setCode(p.code);
                                    setLabel(p.label === p.code ? '' : p.label);
                                    setCapacity(p.capacity);
                                    setEditing(false);
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="vqfb-card-name" title={p.label || p.code}>
                            {p.label && p.label !== p.code ? p.label : 'Standard Table'}
                        </div>

                        <div className="vqfb-seats-row">
                            <Users size={12} className="text-ink-muted" aria-hidden="true" />
                            <span>{p.capacity} seats</span>
                            <span className="vqfb-seat-dots" aria-hidden="true">
                                {Array.from({ length: numSeats }).map((_, i) => (
                                    <span key={i} className="vqfb-seat-dot" />
                                ))}
                            </span>
                        </div>
                    </>
                )}
            </div>

            {!editing && (
                <div className="vqfb-card-footer">
                    <div className="flex items-center gap-1">
                        {p.qr_url && p.customer_ordering_enabled && (
                            <a
                                className="vqfb-icon"
                                href={p.qr_url}
                                target="_blank"
                                rel="noreferrer"
                                title={`Print QR code for ${p.code}`}
                                aria-label={`Print QR code for ${p.code}`}
                            >
                                <Printer size={13} />
                            </a>
                        )}
                        {p.customer_ordering_enabled && (
                            <button
                                type="button"
                                className="vqfb-icon"
                                disabled={busy}
                                onClick={onRegenerate}
                                title={`Regenerate QR code for ${p.code}`}
                                aria-label={`Regenerate QR code for ${p.code}`}
                            >
                                <RefreshCcw size={12} />
                            </button>
                        )}
                    </div>

                    <div className="vqfb-card-actions">
                        <button
                            type="button"
                            className="vqfb-icon"
                            onClick={() => setEditing(true)}
                            title={`Edit ${p.code}`}
                            aria-label={`Edit ${p.code}`}
                        >
                            <Pencil size={13} />
                        </button>
                        {!p.has_open_bill && (
                            <button
                                type="button"
                                className="vqfb-icon vqfb-icon-danger"
                                disabled={busy}
                                onClick={onRemove}
                                title={`Remove ${p.code}`}
                                aria-label={`Remove ${p.code}`}
                            >
                                <Trash2 size={13} />
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── REORDERABLE TABLE ROW ── */
function TableRow({ p, busy, onSave, onRemove, onDragStart, onDropRow, onToggleOrdering, onRegenerate }) {
    const [code, setCode] = useState(p.code);
    const [label, setLabel] = useState(p.label === p.code ? '' : p.label);
    const [capacity, setCapacity] = useState(p.capacity);
    const dirty = code !== p.code
        || (label || '') !== (p.label === p.code ? '' : p.label || '')
        || Number(capacity) !== Number(p.capacity);

    return (
        <div
            className="vqfb-row"
            data-busy={p.has_open_bill ? '1' : '0'}
            draggable={!p.has_open_bill}
            onDragStart={onDragStart}
            onDragOver={e => e.preventDefault()}
            onDrop={onDropRow}
        >
            <span className="vqfb-grip" aria-hidden="true" title="Drag to reorder"><GripVertical size={14} /></span>

            <input
                className="vqfb-input vq-num"
                value={code}
                maxLength={24}
                aria-label={`Code for ${p.code}`}
                onChange={e => setCode(e.target.value)}
            />

            <input
                className="vqfb-input"
                value={label}
                placeholder="optional name, e.g. Window 2"
                maxLength={80}
                aria-label={`Name for ${p.code}`}
                onChange={e => setLabel(e.target.value)}
            />

            <span className="vqfb-seats">
                <Users size={12} aria-hidden="true" />
                <input
                    type="number"
                    className="vqfb-input vq-num"
                    value={capacity}
                    min={1}
                    max={99}
                    aria-label={`Seats at ${p.code}`}
                    onChange={e => setCapacity(e.target.value)}
                />
            </span>

            <span className="vqfb-row-end">
                <button
                    type="button"
                    className="vqfb-icon"
                    disabled={busy}
                    onClick={onToggleOrdering}
                    title={`${p.customer_ordering_enabled ? 'Disable' : 'Enable'} customer QR ordering for ${p.code}`}
                    aria-label={`${p.customer_ordering_enabled ? 'Disable' : 'Enable'} customer QR ordering for ${p.code}`}
                    style={{ opacity: p.customer_ordering_enabled ? 1 : 0.4 }}
                >
                    <QrCode size={14} />
                </button>

                {p.qr_url && p.customer_ordering_enabled && (
                    <a
                        className="vqfb-icon"
                        href={p.qr_url}
                        target="_blank"
                        rel="noreferrer"
                        title={`Open printable QR for ${p.code}`}
                        aria-label={`Open printable QR for ${p.code}`}
                    >
                        <Printer size={13} />
                    </a>
                )}

                {p.customer_ordering_enabled && (
                    <button
                        type="button"
                        className="vqfb-icon"
                        disabled={busy}
                        onClick={onRegenerate}
                        title={`Replace QR code for ${p.code}`}
                        aria-label={`Replace QR code for ${p.code}`}
                    >
                        <RefreshCcw size={13} />
                    </button>
                )}

                {dirty && (
                    <button
                        type="button"
                        className="vqfb-icon vqfb-icon-go"
                        disabled={busy}
                        title="Save this table"
                        aria-label="Save this table"
                        onClick={() => onSave({
                            code: code.trim(),
                            label: label.trim() || null,
                            capacity: Math.max(1, Math.min(99, Number(capacity) || 1)),
                        })}
                    >
                        <Check size={14} />
                    </button>
                )}

                {p.has_open_bill ? (
                    <span className="vqfb-locked" title="This table has an open bill">
                        <Lock size={11} aria-hidden="true" />
                        In use
                    </span>
                ) : (
                    <button
                        type="button"
                        className="vqfb-icon vqfb-icon-danger"
                        disabled={busy}
                        onClick={onRemove}
                        title={`Remove ${p.code}`}
                        aria-label={`Remove ${p.code}`}
                    >
                        <Trash2 size={14} />
                    </button>
                )}
            </span>
        </div>
    );
}

function AddOne({ busy, onAdd }) {
    const [open, setOpen] = useState(false);
    const [code, setCode] = useState('');
    const [label, setLabel] = useState('');
    const [capacity, setCapacity] = useState(4);
    const codeInputRef = useRef(null);

    useEffect(() => {
        if (open && codeInputRef.current) {
            codeInputRef.current.focus();
        }
    }, [open]);

    if (!open) {
        return (
            <button type="button" className="vqfb-add-one" onClick={() => setOpen(true)}>
                <Plus size={15} aria-hidden="true" />
                <span>Add one table</span>
            </button>
        );
    }

    const submit = () => {
        if (!code.trim()) return;
        onAdd({ code: code.trim(), label: label.trim() || null, capacity: Number(capacity) || 1 });
        setCode('');
        setLabel('');
    };

    return (
        <form
            className="vqfb-row vqfb-row-new"
            onSubmit={(e) => {
                e.preventDefault();
                submit();
            }}
        >
            <span className="vqfb-grip" aria-hidden="true"><Plus size={14} /></span>
            <input
                ref={codeInputRef}
                className="vqfb-input vq-num"
                value={code}
                placeholder="T13"
                maxLength={24}
                aria-label="New table code"
                onChange={e => setCode(e.target.value)}
            />
            <input
                className="vqfb-input"
                value={label}
                placeholder="optional name"
                maxLength={80}
                aria-label="New table name"
                onChange={e => setLabel(e.target.value)}
            />
            <span className="vqfb-seats">
                <Users size={12} aria-hidden="true" />
                <input
                    type="number"
                    className="vqfb-input vq-num"
                    value={capacity}
                    min={1}
                    max={99}
                    aria-label="Seats"
                    onChange={e => setCapacity(e.target.value)}
                />
            </span>
            <span className="vqfb-row-end">
                <button
                    type="submit"
                    className="vqfb-icon vqfb-icon-go"
                    disabled={busy || !code.trim()}
                    title="Add"
                    aria-label="Add"
                >
                    <Check size={14} />
                </button>
                <button
                    type="button"
                    className="vqfb-icon"
                    onClick={() => setOpen(false)}
                    title="Cancel"
                    aria-label="Cancel"
                >
                    <X size={14} />
                </button>
            </span>
        </form>
    );
}

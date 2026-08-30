/* ==========================================================================
   THE FLOOR BUILDER
   ==========================================================================
   The first screen a restaurant customer touches, and until now the one that
   did not exist: `Position::create` appeared exactly once in the whole
   codebase, inside a seeding helper, so a shop could not add a table. The
   floor screen's own empty state said "Add tables in Settings" and pointed at
   nothing.

   Two rules shape everything below.

   1. NOBODY ADDS FORTY TABLES ONE AT A TIME. Bulk creation is the primary
      control, not a power-user extra: "12 tables, prefix T, from 1" is how a
      real floor gets entered, and the per-table row exists for the corrections
      afterwards.

   2. THE FLOOR IS NOT A SETTINGS FORM. It is a live thing with money on it, so
      the destructive edges are where the care goes: a table with an open bill
      cannot be deleted, and removing an area offers to move its tables rather
      than quietly taking them with it.
   ========================================================================== */

import React, { useMemo, useRef, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import {
    LayoutGrid, Plus, Trash2, Check, X, Users, ShoppingBag, Bike,
    Loader2, AlertTriangle, ChevronLeft, Lock, Pencil, GripVertical,
} from 'lucide-react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import Toast from '@/Components/Toast';
import ConfirmModal from '@/Components/ConfirmModal';
import '@/Pos/Table/floorbuilder.css';

export default function FloorBuilder({ zones: initialZones = [], positions: initialPositions = [], settings = {}, storeSlug }) {
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
    }), [positions]);

    /* ── zones ─────────────────────────────────────────────────────────── */

    const addZone = async (name) => {
        const clean = (name || '').trim();
        if (!clean) return;
        const d = await post('store.tables.plan.zone.add', { name: clean });
        if (d) { setOpenZone(clean); setAddingZone(false); say(`${clean} added`); }
    };

    const renameZone = async (from, to) => {
        const clean = (to || '').trim();
        setRenaming(null);
        if (!clean || clean === from) return;
        const d = await post('store.tables.plan.zone.rename', { from, to: clean });
        if (d) { setOpenZone(clean); say(`Renamed to ${clean}`); }
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
                if (d) { setOpenZone(others[0]?.name || null); say(`${name} removed`); }
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
            message: 'The table goes from the floor plan. Past sales are untouched.',
            onConfirm: async () => {
                setConfirm(null);
                const d = await post('store.tables.plan.table.remove', { id: p.id });
                if (d) say(`${p.code} removed`);
            },
        });
    };

    /* Reorder is drag on desktop and nothing on touch, deliberately: a
       long-press drag that fights the page scroll is worse than an order
       nobody can change from a phone. The codes carry the order anyway. */
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
        /* Optimistic: the row is already under the cursor where the operator
           dropped it, and snapping it back while a request flies would read as
           the drag having failed. */
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
            say(value ? `${which === 'takeaway' ? 'Takeaway' : 'Delivery'} turned on` : `${which === 'takeaway' ? 'Takeaway' : 'Delivery'} turned off`);
        } catch (e) {
            setLanes(lanes);
            say(e?.response?.data?.message || 'That could not be saved.', 'error');
        } finally { setBusy(false); }
    };

    return (
        <OneGlanceLayout>
            <Head title="Floor plan" />

            <div className="vqfb">
                <header className="vqfb-head">
                    <Link href={route('store.tables.index', { store_slug: storeSlug })} className="vqfb-back">
                        <ChevronLeft size={16} aria-hidden="true" />
                        Floor
                    </Link>
                    <div className="min-w-0">
                        <h1 className="vqfb-title">Floor plan</h1>
                        <p className="vqfb-sub">
                            Your areas and the tables in them. This is the only place tables come from —
                            the floor screen shows what you build here.
                        </p>
                    </div>
                    <div className="vqfb-totals">
                        <span><b className="vq-num">{totals.tables}</b> tables</span>
                        <span><b className="vq-num">{totals.seats}</b> seats</span>
                        {totals.busy > 0 && (
                            <span className="vqfb-total-busy">
                                <Lock size={11} aria-hidden="true" />
                                <b className="vq-num">{totals.busy}</b> in use
                            </span>
                        )}
                    </div>
                </header>

                <div className="vqfb-body">
                    {/* ── AREAS ────────────────────────────────────────── */}
                    <aside className="vqfb-zones">
                        <h2 className="vqfb-h2">Areas</h2>

                        {zones.map(z => (
                            <div key={z.name} className="vqfb-zone" data-on={openZone === z.name ? '1' : '0'}>
                                {renaming === z.name ? (
                                    <InlineText
                                        value={z.name}
                                        onCancel={() => setRenaming(null)}
                                        onSave={v => renameZone(z.name, v)}
                                        aria-label="Area name"
                                    />
                                ) : (
                                    <>
                                        <button type="button" className="vqfb-zone-pick" onClick={() => setOpenZone(z.name)}>
                                            <span className="vq-clip">{z.name}</span>
                                            <span className="vqfb-zone-n vq-num">{z.count}</span>
                                        </button>
                                        <button type="button" className="vqfb-icon" onClick={() => setRenaming(z.name)} title={`Rename ${z.name}`}>
                                            <Pencil size={13} />
                                        </button>
                                        <button type="button" className="vqfb-icon vqfb-icon-danger" onClick={() => removeZone(z.name)} title={`Remove ${z.name}`}>
                                            <Trash2 size={13} />
                                        </button>
                                    </>
                                )}
                            </div>
                        ))}

                        {addingZone ? (
                            <InlineText
                                value=""
                                placeholder="Terrace"
                                onCancel={() => setAddingZone(false)}
                                onSave={addZone}
                                aria-label="New area name"
                            />
                        ) : (
                            <button type="button" className="vqfb-add-zone" onClick={() => setAddingZone(true)}>
                                <Plus size={15} aria-hidden="true" />
                                Add an area
                            </button>
                        )}

                        {zones.length === 0 && (
                            <p className="vqfb-hint">
                                Ground floor, Terrace, Garden — whatever you call them. Add one to start.
                            </p>
                        )}

                        {/* ── LANES ────────────────────────────────────── */}
                        <h2 className="vqfb-h2 vqfb-h2-gap">Beyond the tables</h2>
                        <p className="vqfb-hint">
                            Orders that never sit down. They get their own tab on the floor and their own
                            ticket numbers — not made-up tables.
                        </p>
                        <LaneToggle
                            icon={ShoppingBag} label="Takeaway"
                            hint="Counter and collection orders."
                            on={lanes.takeaway} onChange={v => toggleLane('takeaway', v)}
                        />
                        <LaneToggle
                            icon={Bike} label="Delivery"
                            hint="Adds address and phone to the ticket."
                            on={lanes.delivery} onChange={v => toggleLane('delivery', v)}
                        />
                    </aside>

                    {/* ── TABLES IN THE OPEN AREA ──────────────────────── */}
                    <main className="vqfb-tables">
                        {!openZone ? (
                            <div className="vqfb-empty">
                                <LayoutGrid size={38} strokeWidth={1.5} aria-hidden="true" />
                                <p className="font-bold text-ink">Add an area first</p>
                                <p className="text-xs text-ink-muted">Tables live inside an area.</p>
                            </div>
                        ) : (
                            <>
                                <BulkAdd
                                    zone={openZone}
                                    busy={busy}
                                    existing={(byZone.get(openZone) || []).length}
                                    onCreate={async (spec) => {
                                        const d = await post('store.tables.plan.tables.bulk', { zone: openZone, ...spec });
                                        if (d) {
                                            const skipped = (d.skipped || []).length;
                                            say(skipped
                                                ? `${d.created} added · ${skipped} skipped, those codes were taken`
                                                : `${d.created} table${d.created === 1 ? '' : 's'} added`);
                                        }
                                    }}
                                />

                                <div className="vqfb-rows">
                                    <div className="vqfb-rowhead">
                                        <span />
                                        <span>Code</span>
                                        <span>Name</span>
                                        <span>Seats</span>
                                        <span />
                                    </div>

                                    {(byZone.get(openZone) || []).map(p => (
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
                                            onRemove={() => removeTable(p)}
                                        />
                                    ))}

                                    {(byZone.get(openZone) || []).length === 0 && (
                                        <p className="vqfb-hint vqfb-hint-pad">
                                            No tables in {openZone} yet. Add them in one go above.
                                        </p>
                                    )}
                                </div>

                                <AddOne
                                    busy={busy}
                                    onAdd={async (spec) => {
                                        const d = await post('store.tables.plan.table.add', { zone: openZone, ...spec });
                                        if (d) say(`${spec.code} added`);
                                    }}
                                />
                            </>
                        )}
                    </main>
                </div>
            </div>

            {busy && (
                <span className="vqfb-busy" role="status" aria-live="polite">
                    <Loader2 size={14} className="animate-spin" aria-hidden="true" /> Saving
                </span>
            )}

            {/* Toast owns its own fixed container and takes the whole list --
                the same way every other screen in the product uses it. */}
            <Toast toasts={toasts} removeToast={id => setToasts(x => x.filter(y => y.id !== id))} />

            <ConfirmModal
                show={!!confirm}
                title={confirm?.title || ''}
                message={confirm?.message || ''}
                confirmLabel="Remove"
                isDangerous
                onConfirm={confirm?.onConfirm || (() => {})}
                onClose={() => setConfirm(null)}
            />
        </OneGlanceLayout>
    );
}

/* ── pieces ─────────────────────────────────────────────────────────── */

function InlineText({ value, placeholder, onSave, onCancel, ...rest }) {
    const [v, setV] = useState(value);
    return (
        <div className="vqfb-inline">
            <input
                className="vqfb-input"
                value={v}
                placeholder={placeholder}
                onChange={e => setV(e.target.value)}
                onKeyDown={e => {
                    if (e.key === 'Enter') { e.preventDefault(); onSave(v); }
                    if (e.key === 'Escape') { e.preventDefault(); onCancel(); }
                }}
                autoFocus
                {...rest}
            />
            <button type="button" className="vqfb-icon vqfb-icon-go" onClick={() => onSave(v)} title="Save">
                <Check size={14} />
            </button>
            <button type="button" className="vqfb-icon" onClick={onCancel} title="Cancel">
                <X size={14} />
            </button>
        </div>
    );
}

function LaneToggle({ icon: Icon, label, hint, on, onChange }) {
    return (
        <label className="vqfb-lane" data-on={on ? '1' : '0'}>
            <span className="vqfb-lane-icon"><Icon size={15} aria-hidden="true" /></span>
            <span className="min-w-0">
                <span className="vqfb-lane-l">{label}</span>
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

/* THE PRIMARY CONTROL. Twelve tables in one gesture, because that is how a
   floor is actually entered. Codes already taken are skipped rather than
   failing the batch -- adding tables 13 to 20 to a room that already has 1 to
   12 should not be an error message. */
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
        return n === 1 ? first : `${first} … ${last}`;
    }, [count, prefix, start]);

    return (
        <section className="vqfb-bulk">
            <div className="min-w-0">
                <h3 className="vqfb-bulk-h">Add tables to {zone}</h3>
                <p className="vqfb-bulk-p">
                    Creates <b className="vq-num">{preview}</b>. Codes already in use are skipped.
                </p>
            </div>
            <div className="vqfb-bulk-f">
                <Num label="How many" value={count} min={1} max={200} onChange={setCount} />
                <label className="vqfb-num">
                    <span>Prefix</span>
                    <input className="vqfb-input" value={prefix} maxLength={8}
                           onChange={e => setPrefix(e.target.value)} />
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
                    Add
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
                type="number" className="vqfb-input vq-num" value={value} min={min} max={max}
                onChange={e => onChange(e.target.value)}
            />
        </label>
    );
}

function TableRow({ p, busy, onSave, onRemove, onDragStart, onDropRow }) {
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
            <span className="vqfb-grip" aria-hidden="true"><GripVertical size={14} /></span>

            <input className="vqfb-input vq-num" value={code} maxLength={24}
                   aria-label={`Code for ${p.code}`}
                   onChange={e => setCode(e.target.value)} />

            <input className="vqfb-input" value={label} placeholder="optional, e.g. Window 2"
                   maxLength={80} aria-label={`Name for ${p.code}`}
                   onChange={e => setLabel(e.target.value)} />

            <span className="vqfb-seats">
                <Users size={12} aria-hidden="true" />
                <input type="number" className="vqfb-input vq-num" value={capacity} min={1} max={99}
                       aria-label={`Seats at ${p.code}`}
                       onChange={e => setCapacity(e.target.value)} />
            </span>

            <span className="vqfb-row-end">
                {dirty && (
                    <button type="button" className="vqfb-icon vqfb-icon-go" disabled={busy}
                            title="Save this table"
                            onClick={() => onSave({
                                code: code.trim(),
                                label: label.trim() || null,
                                capacity: Math.max(1, Math.min(99, Number(capacity) || 1)),
                            })}>
                        <Check size={14} />
                    </button>
                )}
                {p.has_open_bill ? (
                    /* Not a disabled bin with no explanation. The reason a
                       table cannot be removed is the only useful thing to say
                       here, and it is a state that clears itself. */
                    <span className="vqfb-locked" title="This table has an open bill">
                        <Lock size={11} aria-hidden="true" />
                        In use
                    </span>
                ) : (
                    <button type="button" className="vqfb-icon vqfb-icon-danger" disabled={busy}
                            onClick={onRemove} title={`Remove ${p.code}`}>
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

    if (!open) {
        return (
            <button type="button" className="vqfb-add-one" onClick={() => setOpen(true)}>
                <Plus size={15} aria-hidden="true" />
                Add one more
            </button>
        );
    }

    const submit = () => {
        if (!code.trim()) return;
        onAdd({ code: code.trim(), label: label.trim() || null, capacity: Number(capacity) || 1 });
        setCode(''); setLabel('');
    };

    return (
        <div className="vqfb-row vqfb-row-new" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }}>
            <span className="vqfb-grip" aria-hidden="true"><Plus size={14} /></span>
            <input className="vqfb-input vq-num" value={code} placeholder="T13" maxLength={24}
                   aria-label="New table code" autoFocus onChange={e => setCode(e.target.value)} />
            <input className="vqfb-input" value={label} placeholder="optional name" maxLength={80}
                   aria-label="New table name" onChange={e => setLabel(e.target.value)} />
            <span className="vqfb-seats">
                <Users size={12} aria-hidden="true" />
                <input type="number" className="vqfb-input vq-num" value={capacity} min={1} max={99}
                       aria-label="Seats" onChange={e => setCapacity(e.target.value)} />
            </span>
            <span className="vqfb-row-end">
                <button type="button" className="vqfb-icon vqfb-icon-go" disabled={busy || !code.trim()}
                        onClick={submit} title="Add">
                    <Check size={14} />
                </button>
                <button type="button" className="vqfb-icon" onClick={() => setOpen(false)} title="Cancel">
                    <X size={14} />
                </button>
            </span>
        </div>
    );
}

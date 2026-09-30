/* ==========================================================================
   QUICK FLOOR SETUP — the thirty seconds between "we do table service" and
   "we can take an order at table four"
   ==========================================================================
   The full Floor Builder at /tables/plan is the right tool for a real room:
   zones, per-table capacities, seat maps, takeout lanes. It is also four
   screens and a lot of decisions, and a restaurant that has just switched the
   register on does not yet know whether the patio is one area or two — they
   know they have twelve tables.

   So this asks the three questions whose answers are always known on day one
   — what do you call the room, how many tables, how many seats — generates
   T1…T12, and gets out of the way. The Floor Builder is one click away and is
   where the room gets its real shape later.

   WHY IT GENERATES CODES RATHER THAN ASKING FOR THEM
   -------------------------------------------------
   Twelve text inputs is not setup, it is data entry. Nearly every room in the
   world numbers its tables sequentially with a one-letter prefix, so that is
   the default and the preview shows exactly what will be created before
   anything is. A room that genuinely has "Booth A" and "Window 3" edits them
   afterwards in the builder, where renaming one table is a single field.

   THE SERVER ALREADY REFUSES DUPLICATES.
   `plan/tables/bulk` walks past codes that are taken and reports them, so
   running this twice adds the missing tables instead of erroring or making a
   second T1. That is why re-running it is offered rather than guarded.
   ========================================================================== */

import React, { useMemo, useState } from 'react';
import axios from 'axios';
import { LayoutGrid, Users, Hash, Check, Loader2, ExternalLink } from 'lucide-react';

/* The rooms almost every venue actually has. Chips rather than a dropdown:
   the point is to not type, and a list of four is faster to read than to
   open. */
export const ZONE_SUGGESTIONS = ['Main Dining', 'Patio', 'Bar', 'Private Room'];

export const DEFAULT_FLOOR = {
    zone: 'Main Dining',
    count: 12,
    prefix: 'T',
    start: 1,
    capacity: 4,
};

/* What will be created, said out loud before it is. */
export function previewCodes(v, max = 8) {
    const n = Math.max(0, Math.min(200, Number(v.count) || 0));
    const start = Math.max(0, Number(v.start) || 0);
    const out = [];
    for (let i = 0; i < Math.min(n, max); i++) out.push(`${v.prefix}${start + i}`);
    return { codes: out, more: Math.max(0, n - out.length), total: n };
}

/**
 * Create the area, then the tables in it.
 *
 * Sequential and not parallel: the bulk call names the zone it is filling, so
 * a zone that has not been declared yet would take the tables and leave the
 * area list without it — the floor would show twelve tables in a room the
 * tab strip does not know about.
 *
 * An area that already exists is not an error here. The endpoint refuses a
 * duplicate name with a 422, which is the right answer to "add this area" and
 * the wrong answer to "put twelve tables in Main Dining" — so that one case is
 * swallowed and the tables go in.
 */
export async function applyQuickFloor(storeSlug, v) {
    const r = (name) => route(name, { store_slug: storeSlug });
    const zone = (v.zone || '').trim() || DEFAULT_FLOOR.zone;

    try {
        await axios.post(r('store.tables.plan.zone.add'), { name: zone });
    } catch (e) {
        /* 422 is "there is already an area called that", which is exactly the
           state we want. Anything else is a real failure and must surface. */
        if (e?.response?.status !== 422) throw e;
    }

    const { data } = await axios.post(r('store.tables.plan.tables.bulk'), {
        zone,
        count: Math.max(1, Math.min(200, Number(v.count) || 1)),
        prefix: (v.prefix || 'T').trim() || 'T',
        start: Math.max(0, Number(v.start) || 0),
        capacity: Math.max(1, Math.min(99, Number(v.capacity) || 4)),
    });

    return data;
}

function Stepper({ label, icon: Icon, value, onChange, min, max, step = 1, suffix }) {
    const clamp = (n) => Math.max(min, Math.min(max, n));
    return (
        <label className="vqf-step">
            <span className="vqf-step-l"><Icon size={12} aria-hidden="true" /> {label}</span>
            <span className="vqf-step-c">
                <button
                    type="button"
                    onClick={() => onChange(clamp((Number(value) || 0) - step))}
                    aria-label={`Fewer ${label.toLowerCase()}`}
                >−</button>
                <input
                    className="vq-num"
                    value={value}
                    inputMode="numeric"
                    onChange={(e) => {
                        const raw = e.target.value.replace(/[^\d]/g, '');
                        onChange(raw === '' ? '' : clamp(Number(raw)));
                    }}
                    onBlur={(e) => { if (e.target.value === '') onChange(min); }}
                    aria-label={label}
                />
                <button
                    type="button"
                    onClick={() => onChange(clamp((Number(value) || 0) + step))}
                    aria-label={`More ${label.toLowerCase()}`}
                >+</button>
            </span>
            {suffix && <span className="vqf-step-s">{suffix}</span>}
        </label>
    );
}

/* ── The form ────────────────────────────────────────────────────────────
   Controlled, so the wizard can hold the value across its steps and submit it
   with everything else at the end. */
export function QuickFloorSetup({ value, onChange, storeSlug, compact = false }) {
    const v = value;
    const set = (k, val) => onChange({ ...v, [k]: val });
    const pv = useMemo(() => previewCodes(v, compact ? 6 : 10), [v, compact]);

    return (
        <div className="vqf">
            <div className="vqf-zone">
                <label className="vqt-field vqt-field-stacked">
                    <span className="vqt-field-l"><LayoutGrid size={12} aria-hidden="true" /> What is this area called?</span>
                    <input
                        className="vqt-input"
                        value={v.zone}
                        onChange={(e) => set('zone', e.target.value)}
                        placeholder="Main Dining"
                        maxLength={48}
                    />
                </label>
                <div className="vqf-chips">
                    {ZONE_SUGGESTIONS.map(z => (
                        <button
                            key={z}
                            type="button"
                            className="vqf-chip"
                            data-on={z === v.zone ? '1' : '0'}
                            onClick={() => set('zone', z)}
                        >
                            {z}
                        </button>
                    ))}
                </div>
            </div>

            <div className="vqf-nums">
                <Stepper label="Tables" icon={Hash} value={v.count} onChange={(n) => set('count', n)} min={1} max={200} />
                <Stepper label="Seats each" icon={Users} value={v.capacity} onChange={(n) => set('capacity', n)} min={1} max={99} />
                <label className="vqf-step">
                    <span className="vqf-step-l"><Hash size={12} aria-hidden="true" /> Prefix</span>
                    <span className="vqf-step-c vqf-step-c-plain">
                        <input
                            value={v.prefix}
                            maxLength={8}
                            onChange={(e) => set('prefix', e.target.value.replace(/\s/g, ''))}
                            aria-label="Table code prefix"
                        />
                    </span>
                </label>
            </div>

            {/* WHAT WILL BE CREATED, before anything is. A setup step that
                reports what it did after the fact makes the operator undo it
                to find out what it meant. */}
            <div className="vqf-preview" aria-live="polite">
                <span className="vqf-preview-l">
                    Creates <b className="vq-num">{pv.total}</b> table{pv.total === 1 ? '' : 's'} in{' '}
                    <b>{(v.zone || '').trim() || 'Main Dining'}</b>
                </span>
                <span className="vqf-preview-codes">
                    {pv.codes.map(c => <span key={c} className="vqf-tag vq-num">{c}</span>)}
                    {pv.more > 0 && <span className="vqf-tag vqf-tag-more vq-num">+{pv.more}</span>}
                </span>
            </div>

            <p className="vqf-note">
                Rename, resize or rearrange any of this later in the Floor Plan — nothing
                here is locked in, and running this again only adds the tables that are missing.
                {storeSlug && (
                    <>
                        {' '}
                        <a
                            className="vqf-link"
                            href={route('store.tables.plan', { store_slug: storeSlug })}
                        >
                            Open the full Floor Plan <ExternalLink size={11} aria-hidden="true" />
                        </a>
                    </>
                )}
            </p>
        </div>
    );
}

/* ── Standalone ──────────────────────────────────────────────────────────
   The same form as a modal, for the empty floor: a table terminal with no
   tables on it is otherwise a screen that says "no tables" and offers no way
   to have some. */
export function QuickFloorModal({ storeSlug, onClose, onDone, onError }) {
    const [v, setV] = useState(DEFAULT_FLOOR);
    const [busy, setBusy] = useState(false);

    const go = async () => {
        setBusy(true);
        try {
            await applyQuickFloor(storeSlug, v);
            onDone?.(v);
        } catch (e) {
            onError?.(e?.response?.data?.message || 'The floor could not be set up.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="vqt-modal-scrim" onMouseDown={onClose}>
            <div
                className="vqt-modal vqt-modal-wide bg-surface border border-line"
                role="dialog"
                aria-modal="true"
                aria-label="Set up the floor"
                onMouseDown={(e) => e.stopPropagation()}
            >
                <header className="vqt-modal-h">
                    <LayoutGrid size={16} className="text-brand-600" aria-hidden="true" />
                    <h2 className="font-bold text-ink" style={{ fontSize: 'var(--vq-t-lg)' }}>
                        Set up the floor
                    </h2>
                </header>
                <p className="vqt-modal-note">
                    Three answers and this room can take an order. Everything is editable afterwards.
                </p>
                <div className="vqt-modal-b">
                    <QuickFloorSetup value={v} onChange={setV} storeSlug={storeSlug} />
                </div>
                <footer className="vqt-modal-f">
                    <button type="button" className="vqt-btn" onClick={onClose}>Not now</button>
                    <button type="button" className="vqt-btn vqt-btn-go" disabled={busy} onClick={go}>
                        {busy ? <Loader2 size={15} className="vqf-spin" /> : <Check size={15} />}
                        Create tables
                    </button>
                </footer>
            </div>
        </div>
    );
}

export default QuickFloorSetup;

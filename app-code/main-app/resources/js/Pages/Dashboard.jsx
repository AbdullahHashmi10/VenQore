import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import axios from 'axios';
import ReactGridLayout from 'react-grid-layout';
import useMeasure from 'react-use-measure';
import {
    Check, Globe, Info, Lock, Plus, RotateCcw, Save, X,
} from 'lucide-react';

import QoreShell from '@/Shell/QoreShell';
import { usePermission } from '@/Hooks/usePermission';
import { getChartComponent } from '../Dashboard/chartRegistry';
import { gridProps } from '../Dashboard/layoutLaw';
import { constraintsFor } from '../Dashboard/variantLaw';
import DashboardCardFrame from '../Dashboard/components/DashboardCardFrame';
import DashboardCardEditor from '../Dashboard/components/DashboardCardEditor';
import AddCardModal from '../Dashboard/components/AddCardModal';

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  The dashboard. Singular.                                                 ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * One board for every role — cashier, accountant, owner, admin. What differs
 * is not the page but the cards: the Reckoner's gates (permission → plan →
 * capability → module) decide what a user may see, role and business presets
 * decide what they start with, and from there the board is theirs — add,
 * edit, resize, rearrange, all persisted via /api/dashboards.
 *
 * Every figure on this page is a real read through /api/reckoner/read.
 * Nothing is composed server-side; nothing is a sample number.
 *
 * Geometry is Layout Law v2.0 (layout-law.json): 12 columns, 64px row track,
 * 24px gutter, size(n) = n·64 + (n−1)·24. Six categories, eighteen fits.
 * Visuals are V6 tokens only.
 */

const PUBLISH_ROLES = ['cashier', 'accountant', 'purchasing_officer', 'manager', 'viewer'];

/**
 * Everything a read returns that is not the figures themselves.
 *
 * The card face states the window it is showing and formats to the unit the
 * Reckoner actually resolved, so it needs the envelope as well as the data.
 */
const envelopeOf = (result) => ({
    period: result.period ?? null,
    label: result.label ?? null,
    help: result.help ?? null,
    unit: result.unit ?? null,
    precision: result.precision ?? null,
    direction: result.direction ?? null,
    shape: result.shape ?? null,
});

export default function Dashboard() {
    const { store } = usePage().props;
    const { hasPerm, isAdmin } = usePermission();
    const [gridRef, { width }] = useMeasure();

    const [dashboards, setDashboards] = useState([]);
    const [current, setCurrent] = useState(null);
    const [catalogue, setCatalogue] = useState([]);
    const [cardData, setCardData] = useState({});
    /*
     * The rest of the read envelope, kept per card.
     *
     * `result.data` alone is the figures; `result.period` is the window they
     * cover, and `result.label`/`unit`/`precision`/`direction` are what the
     * Reckoner actually resolved for this card, which can differ from the
     * catalogue entry once a card carries args. Throwing all of that away and
     * keeping only `.data` is why the card face had no way to say "This month ·
     * 23 Jul – 21 Aug" and had to guess a unit from the catalogue.
     */
    const [cardMeta, setCardMeta] = useState({});
    const [cardLoaders, setCardLoaders] = useState({});
    const [cardErrors, setCardErrors] = useState({});
    /* A period switched on the card face, before it has been persisted. */
    const [periodOverrides, setPeriodOverrides] = useState({});

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingCardId, setEditingCardId] = useState(null);
    const [layout, setLayout] = useState([]);
    const [dirty, setDirty] = useState(false);
    const [saving, setSaving] = useState(false);
    const [publishOpen, setPublishOpen] = useState(false);
    const publishRef = useRef(null);
    // Which board the grid has already reported its settled layout for.
    const settledRef = useRef(null);

    const isManager = isAdmin || hasPerm('admin.settings_manage');
    const locked = Boolean(current?.is_locked) && !isManager;

    /* ── Loading ────────────────────────────────────────────────────────── */

    async function loadDashboards() {
        try {
            const res = await axios.get('/api/dashboards');
            const list = res.data.data || [];
            setDashboards(list);
            if (list.length > 0) {
                const first = list.find((d) => d.is_default) || list[0];
                loadDetail(first.id);
            }
        } catch (err) {
            console.error('Failed to load dashboards list', err);
        }
    }

    async function loadCatalogue() {
        try {
            const res = await axios.get('/api/reckoner/catalogue');
            setCatalogue(res.data.data || []);
        } catch (err) {
            console.error('Failed to load the reading catalogue', err);
        }
    }

    async function loadDetail(id) {
        try {
            const res = await axios.get(`/api/dashboards/${id}`);
            const db = res.data.data;
            settledRef.current = null; // the next layout callback is the baseline
            setCurrent(db);
            setDirty(false);
            /*
             * Carry the Layout Law onto every grid item.
             *
             * The floor and the category max were enforced where a card is
             * created and nowhere else, so a resize handle could drag a card
             * straight through both — which is how a ring ended up in a box
             * too short for its legend. `react-grid-layout` refuses a drag
             * that breaks these, so the law now holds at the one place a user
             * can actually break it.
             */
            setLayout((db.cards || []).map((c) => ({
                i: c.id, x: c.x, y: c.y, w: c.w, h: c.h, ...constraintsFor(c),
            })));
            fetchCardsData(db.cards || []);
        } catch (err) {
            console.error('Failed to load dashboard details', err);
        }
    }

    /* ── Data plane — batch reads through the Reckoner ──────────────────── */

    async function fetchCardsData(cards) {
        if (!cards.length) return;

        setCardLoaders(Object.fromEntries(cards.map((c) => [c.id, true])));
        setCardErrors(Object.fromEntries(cards.map((c) => [c.id, false])));

        // One request per DISTINCT reading — the Reckoner keys its results by
        // (key, period, args), so two cards showing the same reading collapse
        // into one entry server-side. Reading the response back by array index
        // would then shift every later card onto the wrong number: a board
        // holding "Revenue · today" as both a stat and a sparkline would show
        // the next card's figure under the second one. Cards are matched to
        // their result by that same identity instead.
        const identity = (c) => [
            c.reading_key,
            c.period || 'today',
            JSON.stringify(c.period_custom ?? null),
            c.granularity || '',
            JSON.stringify(c.args ?? {}),
        ].join('|');

        const distinct = new Map(); // identity → request
        const cardsBy = new Map();  // identity → [card ids]
        for (const card of cards) {
            const id = identity(card);
            if (!distinct.has(id)) {
                distinct.set(id, {
                    key: card.reading_key,
                    period: card.period || 'today',
                    custom: card.period_custom,
                    granularity: card.granularity,
                    args: card.args || {},
                });
                cardsBy.set(id, []);
            }
            cardsBy.get(id).push(card.id);
        }

        // MAX_BATCH is 24 server-side; a bigger board reads in several passes.
        const entries = Array.from(distinct.entries());
        const chunks = [];
        for (let i = 0; i < entries.length; i += 24) chunks.push(entries.slice(i, i + 24));

        /*
         * Chunks go out together, and each one paints as it lands.
         *
         * This used to be a `for` loop with an `await` in it, so a board
         * needing three passes waited three round-trips end to end, and every
         * card held its skeleton until the last one returned. The passes are
         * independent — they are only chunks because the server caps a batch
         * at 24 — so there is nothing to serialise. Firing them at once turns
         * three round-trips into one wall-clock wait, and applying each
         * chunk's results as they arrive means the first cards are readable
         * while the rest are still in flight.
         */
        const settle = (chunk, results) => {
            const data = {};
            const meta = {};
            const errors = {};

            chunk.forEach(([identityKey, request], i) => {
                // Match on the reading key the server echoes back, falling
                // back to position within the results for this chunk.
                const result = results.find((r) => r?.key === request.key
                    && (r?.period?.key ?? request.period) === request.period)
                    ?? results[i];

                for (const cardId of cardsBy.get(identityKey) || []) {
                    if (result?.ok) {
                        data[cardId] = result.data;
                        meta[cardId] = envelopeOf(result);
                    } else {
                        errors[cardId] = true;
                    }
                }
            });

            const done = Object.fromEntries(
                chunk.flatMap(([k]) => (cardsBy.get(k) || []).map((id) => [id, false])),
            );

            setCardData((d) => ({ ...d, ...data }));
            setCardMeta((m) => ({ ...m, ...meta }));
            setCardErrors((e) => ({ ...e, ...errors }));
            setCardLoaders((l) => ({ ...l, ...done }));
        };

        await Promise.all(chunks.map(async (chunk) => {
            try {
                const res = await axios.post('/api/reckoner/read', {
                    requests: chunk.map(([, request]) => request),
                });
                settle(chunk, res.data.data || []);
            } catch (err) {
                console.error('Failed to batch-read card values', err);
                settle(chunk, []);
            }
        }));
    }

    /**
     * Switch one card's window from its own face.
     *
     * Reads that card alone rather than the board — a period switch is about
     * one card, and re-reading nine to answer a question about one is both
     * slow and visibly wrong, because the other eight flash their skeletons.
     *
     * The choice is persisted quietly afterwards. A PATCH that reloaded the
     * board would undo the point of the single read, so this one does not.
     */
    const changeCardPeriod = async (cardId, period) => {
        const card = (current?.cards || []).find((c) => c.id === cardId);
        if (!card || card.period === period) return;

        setPeriodOverrides((o) => ({ ...o, [cardId]: period }));
        setCardLoaders((l) => ({ ...l, [cardId]: true }));
        setCardErrors((e) => ({ ...e, [cardId]: false }));

        try {
            const res = await axios.post('/api/reckoner/read', {
                requests: [{
                    key: card.reading_key,
                    period,
                    custom: card.period_custom,
                    granularity: card.granularity,
                    args: card.args || {},
                }],
            });

            const result = (res.data.data || [])[0];
            if (result?.ok) {
                setCardData((d) => ({ ...d, [cardId]: result.data }));
                setCardMeta((m) => ({ ...m, [cardId]: envelopeOf(result) }));
            } else {
                setCardErrors((e) => ({ ...e, [cardId]: true }));
            }
        } catch (err) {
            console.error('Failed to re-read the card for its new period', err);
            setCardErrors((e) => ({ ...e, [cardId]: true }));
        } finally {
            setCardLoaders((l) => ({ ...l, [cardId]: false }));
        }

        // Fire and forget. A failed save costs the user the choice on their
        // next visit, not the card they are looking at now.
        axios.patch(`/api/dashboards/${current.id}/cards/${cardId}`, { period })
            .catch((err) => console.error('Failed to persist the card period', err));
    };

    useEffect(() => {
        /*
         * The board first, the catalogue behind it.
         *
         * The catalogue is a few hundred reading definitions and it is only
         * needed once someone opens "Add card". Awaiting it alongside the
         * board made it compete for the same connections as the reads that
         * actually paint the page, so it now goes out after the first frame
         * has something in it.
         */
        loadDashboards();
        const idle = window.requestIdleCallback
            ? window.requestIdleCallback(loadCatalogue, { timeout: 2000 })
            : setTimeout(loadCatalogue, 300);
        return () => {
            if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
            else clearTimeout(idle);
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    /* ── Layout ─────────────────────────────────────────────────────────── */

    /**
     * react-grid-layout compacts on mount and reports the result, so the first
     * callback after a load is the grid tidying stored coordinates — not the
     * user moving anything. Counting it as a change put an "Unsaved
     * arrangement" badge and a Save button in front of people who had done
     * nothing, most visibly when a gated card left a hole for the others to
     * close up into. The first callback per load is the baseline.
     */
    const onLayoutChange = (next) => {
        setLayout(next);
        if (!current) return;

        if (settledRef.current !== current.id) {
            settledRef.current = current.id;
            return;
        }

        const before = new Map((current.cards || []).map((c) => [c.id, c]));
        const moved = next.some((item) => {
            const c = before.get(item.i);
            return c && (c.x !== item.x || c.y !== item.y || c.w !== item.w || c.h !== item.h);
        });
        if (moved) setDirty(true);
    };

    const saveLayout = async () => {
        if (!current || saving) return;
        setSaving(true);
        const cards = (current.cards || []).map((c) => {
            const item = layout.find((l) => l.i === c.id);
            return item ? { ...c, x: item.x, y: item.y, w: item.w, h: item.h } : c;
        });
        try {
            await axios.put(`/api/dashboards/${current.id}/layout`, { cards });
            await loadDetail(current.id);
        } catch (err) {
            console.error('Failed to save layout', err);
        } finally {
            setSaving(false);
        }
    };

    /* ── Cards ──────────────────────────────────────────────────────────── */

    // Rethrows on purpose: the modal keeps itself open and names the reason
    // (card cap, locked layout, a reading gated since the catalogue loaded)
    // rather than closing on a card that was never added.
    const addCard = async (config) => {
        if (!current) return;
        await axios.post(`/api/dashboards/${current.id}/cards`, config);
        await loadDetail(current.id);
    };

    const removeCard = async (cardId) => {
        if (!current) return;
        try {
            await axios.delete(`/api/dashboards/${current.id}/cards/${cardId}`);
            await loadDetail(current.id);
        } catch (err) {
            console.error('Failed to remove card', err);
        }
    };

    /**
     * PATCH keeps the card's id — the layout, loader state and data cache are
     * all keyed on it. M1 is enforced server-side by enforceAccentBudget();
     * the optimistic clear here just stops two accent cards flashing for the
     * round-trip.
     */
    const updateCard = async (cardId, patch) => {
        if (!current) return;
        if (patch.style?.accent) {
            setCurrent((d) => ({
                ...d,
                cards: d.cards.map((c) => (c.id === cardId
                    ? c
                    : { ...c, style: { ...c.style, accent: false } })),
            }));
        }
        try {
            await axios.patch(`/api/dashboards/${current.id}/cards/${cardId}`, patch);
            setEditingCardId(null);
            await loadDetail(current.id);
        } catch (err) {
            console.error('Failed to update card', err);
        }
    };

    const resetBoard = async () => {
        if (!current) return;
        // Named object, named consequence — not "Confirm".
        if (!window.confirm(`Reset “${current.name}” to its default cards? Your arrangement is replaced.`)) return;
        try {
            await axios.post(`/api/dashboards/${current.id}/reset`);
            await loadDetail(current.id);
        } catch (err) {
            console.error('Failed to reset board', err);
        }
    };

    /* ── Publish (managers) ─────────────────────────────────────────────── */

    const [publishRole, setPublishRole] = useState('cashier');
    const [publishLock, setPublishLock] = useState(false);
    const [publishBusy, setPublishBusy] = useState(false);
    const [publishDone, setPublishDone] = useState(false);

    useEffect(() => {
        if (!publishOpen) return undefined;
        const onDown = (e) => {
            if (publishRef.current && !publishRef.current.contains(e.target)) setPublishOpen(false);
        };
        document.addEventListener('pointerdown', onDown);
        return () => document.removeEventListener('pointerdown', onDown);
    }, [publishOpen]);

    const publish = async () => {
        if (!current || publishBusy) return;
        setPublishBusy(true);
        setPublishDone(false);
        try {
            await axios.post(`/api/dashboards/${current.id}/publish`, {
                for_role: publishRole,
                is_locked: publishLock,
            });
            setPublishDone(true);
            setTimeout(() => { setPublishOpen(false); setPublishDone(false); }, 1200);
        } catch (err) {
            console.error('Failed to publish layout', err);
        } finally {
            setPublishBusy(false);
        }
    };

    /* ── Accent bookkeeping for the editor ──────────────────────────────── */

    const accentHolder = useMemo(() => {
        const card = current?.cards?.find((c) => c.style?.accent);
        if (!card) return null;
        const def = catalogue.find((m) => m.key === card.reading_key);
        return { id: card.id, label: card.title_override || def?.label || 'A card' };
    }, [current, catalogue]);

    const editingCard = current?.cards?.find((c) => c.id === editingCardId) || null;
    const cardCount = current?.cards?.length || 0;

    /* ── Render ─────────────────────────────────────────────────────────── */

    return (
        <QoreShell title="Dashboard" archetype="dashboard">
            <Head title="Dashboard" />
            <style>{PAGE_CSS}</style>

            <div className="vqd-page">
                {/* ── Board header ── */}
                <div className="vqd-head">
                    <div className="vqd-head-l">
                        <h1 className="vqd-h1">{current?.name || 'Your dashboard'}</h1>
                        <p className="vqd-sub">
                            <span className="vqd-count">{cardCount} {cardCount === 1 ? 'card' : 'cards'}</span>
                            {current?.is_locked && (
                                <span className="vqd-locked"><Lock size={11} aria-hidden="true" /> Locked by management</span>
                            )}
                            {!current?.is_locked && dirty && <span className="vqd-dirty">Unsaved arrangement</span>}
                        </p>
                    </div>

                    <div className="vqd-head-r">
                        {dashboards.length > 1 && (
                            <div className="vqd-tabs" role="tablist" aria-label="Dashboards">
                                {dashboards.map((db) => (
                                    <button
                                        key={db.id}
                                        type="button"
                                        role="tab"
                                        aria-selected={current?.id === db.id}
                                        className={`vqd-tab${current?.id === db.id ? ' is-on' : ''}`}
                                        onClick={() => loadDetail(db.id)}
                                    >
                                        {db.name}
                                    </button>
                                ))}
                            </div>
                        )}

                        {!locked && (
                            <button type="button" className="vqd-btn vqd-btn--ghost" onClick={resetBoard} title="Reset to default cards">
                                <RotateCcw size={13} /> <span>Reset</span>
                            </button>
                        )}

                        {!locked && dirty && (
                            <button type="button" className="vqd-btn vqd-btn--ghost" disabled={saving} onClick={saveLayout}>
                                <Save size={13} /> <span>{saving ? 'Saving…' : 'Save layout'}</span>
                            </button>
                        )}

                        {isManager && (
                            <div className="vqd-publish" ref={publishRef}>
                                <button
                                    type="button"
                                    className="vqd-btn vqd-btn--ghost"
                                    aria-haspopup="dialog"
                                    aria-expanded={publishOpen}
                                    onClick={() => setPublishOpen((v) => !v)}
                                >
                                    <Globe size={13} /> <span>Publish</span>
                                </button>

                                {publishOpen && (
                                    <div className="vqd-pop" aria-label="Publish this layout to a role">
                                        <div className="vqd-pop-head">
                                            <span className="vqd-pop-title">Publish to a role</span>
                                            <button type="button" className="vqd-pop-x" onClick={() => setPublishOpen(false)} aria-label="Close">
                                                <X size={13} />
                                            </button>
                                        </div>
                                        <p className="vqd-pop-note">
                                            Everyone with this role gets this board as their default.
                                        </p>
                                        <div className="vqd-pop-roles">
                                            {PUBLISH_ROLES.map((r) => (
                                                <button
                                                    key={r}
                                                    type="button"
                                                    className={`vqd-chip${publishRole === r ? ' is-on' : ''}`}
                                                    aria-pressed={publishRole === r}
                                                    onClick={() => setPublishRole(r)}
                                                >
                                                    {r.replace('_', ' ')}
                                                </button>
                                            ))}
                                        </div>
                                        <label className="vqd-pop-lock">
                                            <input
                                                type="checkbox"
                                                checked={publishLock}
                                                onChange={(e) => setPublishLock(e.target.checked)}
                                            />
                                            <span>Lock it — they can’t rearrange or add cards</span>
                                        </label>
                                        <button
                                            type="button"
                                            className="vqd-btn vqd-btn--primary vqd-pop-go"
                                            disabled={publishBusy}
                                            onClick={publish}
                                        >
                                            {publishDone ? <Check size={13} /> : <Globe size={13} />}
                                            <span>{publishDone ? 'Published' : publishBusy ? 'Publishing…' : `Publish to ${publishRole.replace('_', ' ')}`}</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {!locked && (
                            <button type="button" className="vqd-btn vqd-btn--primary" onClick={() => setIsAddOpen(true)}>
                                <Plus size={14} /> <span>Add cards</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Board ── */}
                {current && cardCount === 0 ? (
                    <div className="vqd-empty">
                        <div className="vqd-empty-ic"><Info size={22} aria-hidden="true" /></div>
                        <h2 className="vqd-empty-t">No cards yet</h2>
                        <p className="vqd-empty-d">
                            Open <strong>Add cards</strong> and pick what you want to see — every card
                            shows live figures from your books.
                        </p>
                        {!locked && (
                            <button type="button" className="vqd-btn vqd-btn--primary" onClick={() => setIsAddOpen(true)}>
                                <Plus size={14} /> <span>Add cards</span>
                            </button>
                        )}
                    </div>
                ) : (
                    <div ref={gridRef} className="vqd-board">
                        {width > 0 && current && (
                            <ReactGridLayout
                                className="layout"
                                layout={layout}
                                width={width}
                                {...gridProps()}
                                isDraggable={!locked}
                                isResizable={!locked}
                                onLayoutChange={onLayoutChange}
                                draggableHandle=".vq-card-drag-handle"
                            >
                                {(current.cards || []).map((card, i) => {
                                    const def = catalogue.find((m) => m.key === card.reading_key);
                                    const Chart = getChartComponent(card.chart);
                                    // A period switched on the face but not yet
                                    // round-tripped through loadDetail.
                                    const shown = periodOverrides[card.id]
                                        ? { ...card, period: periodOverrides[card.id] }
                                        : card;

                                    return (
                                        <div key={card.id}>
                                            <DashboardCardFrame
                                                card={shown}
                                                definition={def}
                                                meta={cardMeta[card.id]}
                                                data={cardData[card.id]}
                                                settings={store?.settings}
                                                loading={cardLoaders[card.id]}
                                                error={cardErrors[card.id]}
                                                isLocked={locked}
                                                index={i}
                                                onEdit={() => setEditingCardId(card.id)}
                                                onRemove={() => removeCard(card.id)}
                                                onPeriodChange={locked ? null : changeCardPeriod}
                                            >
                                                {cardData[card.id] && Chart && (
                                                    <Chart
                                                        data={cardData[card.id]}
                                                        definition={def}
                                                        meta={cardMeta[card.id]}
                                                        settings={store?.settings}
                                                        card={shown}
                                                    />
                                                )}
                                            </DashboardCardFrame>
                                        </div>
                                    );
                                })}
                            </ReactGridLayout>
                        )}
                    </div>
                )}
            </div>

            {/* Edit one card in place. */}
            <DashboardCardEditor
                isOpen={Boolean(editingCardId)}
                card={editingCard}
                definition={catalogue.find((m) => m.key === editingCard?.reading_key)}
                accentHolder={accentHolder}
                onClose={() => setEditingCardId(null)}
                onSave={(patch) => updateCard(editingCardId, patch)}
            />

            {/* The big add-card flow: library → configure + live preview → add.
                Keyed on the open flag so every open remounts it fresh. */}
            <AddCardModal
                key={isAddOpen ? 'open' : 'closed'}
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                catalogue={catalogue}
                accentHolder={accentHolder}
                onSubmit={addCard}
            />
        </QoreShell>
    );
}

const PAGE_CSS = `
/* react-grid-layout, retuned to the law and the tokens. */
.react-grid-layout { position: relative; transition: height var(--vq-dur-2) var(--vq-ease-out); }
.react-grid-item {
    transition: all var(--vq-dur-2) var(--vq-ease-out);
    transition-property: left, top, width, height;
}
.react-grid-item.cssTransforms { transition-property: left, top; }
.react-grid-item.resizing { z-index: var(--vq-z-raised); opacity: .82; }
.react-grid-item.react-draggable-dragging {
    z-index: var(--vq-z-dropdown);
    opacity: .92;
    cursor: grabbing;
}
/* The grid item is sized by the law; the card fills it. Without this the
   wrapper react-grid-layout clones has auto height, so the card's own
   height:100% resolves against nothing and it shrinks to its content. */
.react-grid-item > div { height: 100%; }

/* The resize grip, matched to the card builder's: a corner bracket that
   appears on approach rather than a handle sitting on every card at rest. */
.react-grid-item > .react-resizable-handle {
    position: absolute;
    width: 18px; height: 18px;
    bottom: 3px; right: 3px;
    cursor: nwse-resize;
    z-index: var(--vq-z-raised);
    opacity: 0;
    transition: opacity var(--vq-dur-2) var(--vq-ease-out);
}
.react-grid-item > .react-resizable-handle::after {
    content: '';
    position: absolute;
    right: 4px; bottom: 4px;
    width: 9px; height: 9px;
    border-right: 2px solid var(--vq-text-2);
    border-bottom: 2px solid var(--vq-text-2);
    border-radius: 0 0 3px 0;
}
.react-grid-item:hover > .react-resizable-handle,
.react-grid-item:focus-within > .react-resizable-handle { opacity: .75; }
.react-grid-item > .react-resizable-handle:hover { opacity: 1; }
/* On the accent fill the bracket inverts with everything else. */
.react-grid-item:has(.vqc--accent) > .react-resizable-handle::after {
    border-color: var(--vq-on-accent-text);
}
.react-grid-item > .react-grid-placeholder,
.react-grid-placeholder {
    background: var(--vq-accent-quiet) !important;
    border: 1.5px dashed var(--vq-accent);
    border-radius: var(--vq-r-lg);
    opacity: .6;
}

/* ── Page ── */
.vqd-page { display: flex; flex-direction: column; gap: 24px; font-family: var(--vq-font-sans); }

.vqd-head { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 14px; }
.vqd-head-l { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.vqd-h1 {
    margin: 0;
    font-family: var(--vq-font-display);
    font-size: var(--vq-fs-h2);
    line-height: var(--vq-lh-h2);
    letter-spacing: var(--vq-ls-h2);
    font-weight: var(--vq-fw-semi);
    color: var(--vq-text);
}
.vqd-sub { margin: 0; display: flex; align-items: center; gap: 10px; }
.vqd-count {
    font-family: var(--vq-font-mono);
    font-size: var(--vq-fs-eyebrow);
    letter-spacing: var(--vq-ls-eyebrow);
    text-transform: uppercase;
    font-weight: var(--vq-fw-medium);
    color: var(--vq-text-3);
}
.vqd-locked, .vqd-dirty {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: var(--vq-fs-caption); color: var(--vq-text-2);
}
.vqd-dirty { color: var(--vq-warning); }

.vqd-head-r { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

.vqd-tabs {
    display: flex; align-items: center; gap: 2px;
    background: var(--vq-sunken);
    border: 1px solid var(--vq-line);
    padding: 3px;
    border-radius: var(--vq-r-lg);
}
.vqd-tab {
    padding: 5px 14px;
    border: none; border-radius: var(--vq-r-md);
    background: transparent; color: var(--vq-text-2);
    font-family: var(--vq-font-sans); font-size: var(--vq-fs-caption); font-weight: var(--vq-fw-medium);
    cursor: pointer;
    transition: background var(--vq-dur-1) var(--vq-ease-out), color var(--vq-dur-1) var(--vq-ease-out);
    white-space: nowrap;
}
.vqd-tab:hover { color: var(--vq-text); }
.vqd-tab.is-on {
    background: var(--vq-surface);
    color: var(--vq-accent-text);
    font-weight: var(--vq-fw-semi);
    box-shadow: var(--vq-elev-1);
}

.vqd-btn {
    display: inline-flex; align-items: center; gap: 6px;
    height: 34px;
    padding: 0 14px;
    border: none; border-radius: var(--vq-r-lg);
    font-family: var(--vq-font-sans); font-size: var(--vq-fs-caption); font-weight: var(--vq-fw-semi);
    cursor: pointer;
    transition: background var(--vq-dur-2) var(--vq-ease-out), color var(--vq-dur-2) var(--vq-ease-out), transform var(--vq-dur-2) var(--vq-ease-out), box-shadow var(--vq-dur-2) var(--vq-ease-out);
    white-space: nowrap;
}
.vqd-btn:disabled { opacity: .5; cursor: not-allowed; }
.vqd-btn:focus-visible { outline: none; box-shadow: var(--vq-ring-focus); }
.vqd-btn--primary { background: var(--vq-accent-fill); color: var(--vq-on-accent, #fff); box-shadow: var(--vq-glow-accent); }
.vqd-btn--primary:hover:not(:disabled) { background: var(--vq-accent-fill-hover, var(--vq-accent-fill)); transform: translateY(-1px); }
.vqd-btn--primary:active { transform: none; }
.vqd-btn--ghost { background: transparent; color: var(--vq-text-2); box-shadow: inset 0 0 0 1px var(--vq-line); }
.vqd-btn--ghost:hover { background: var(--vq-sunken); color: var(--vq-text); }

/* Publish popover */
.vqd-publish { position: relative; }
.vqd-pop {
    position: absolute;
    right: 0;
    top: calc(100% + 8px);
    width: 300px;
    z-index: var(--vq-z-popover);
    background: var(--vq-raised, var(--vq-surface));
    border: 1px solid var(--vq-line);
    border-radius: var(--vq-r-lg);
    box-shadow: var(--vq-elev-3);
    padding: 14px;
    display: flex; flex-direction: column; gap: 10px;
}
.vqd-pop-head { display: flex; align-items: center; justify-content: space-between; }
.vqd-pop-title { font-size: var(--vq-fs-small); font-weight: var(--vq-fw-semi); color: var(--vq-text); }
.vqd-pop-x {
    width: 26px; height: 26px; display: inline-flex; align-items: center; justify-content: center;
    border: none; border-radius: var(--vq-r-xs); background: transparent; color: var(--vq-text-3); cursor: pointer;
    transition: background var(--vq-dur-1) var(--vq-ease-out);
}
.vqd-pop-x:hover { background: var(--vq-sunken); color: var(--vq-text); }
.vqd-pop-note { margin: 0; font-size: var(--vq-fs-caption); line-height: var(--vq-lh-caption); color: var(--vq-text-2); }
.vqd-pop-roles { display: flex; flex-wrap: wrap; gap: 6px; }
.vqd-chip {
    height: 28px; padding: 0 11px;
    border: 1px solid var(--vq-line); border-radius: var(--vq-r-full);
    background: transparent; color: var(--vq-text-2);
    font-family: var(--vq-font-sans); font-size: var(--vq-fs-caption); font-weight: var(--vq-fw-medium);
    cursor: pointer; text-transform: capitalize;
    transition: background var(--vq-dur-1) var(--vq-ease-out), color var(--vq-dur-1) var(--vq-ease-out), border-color var(--vq-dur-1) var(--vq-ease-out);
}
.vqd-chip:hover { background: var(--vq-sunken); color: var(--vq-text); }
.vqd-chip.is-on { background: var(--vq-accent-quiet); border-color: transparent; color: var(--vq-accent-text); font-weight: var(--vq-fw-semi); }
.vqd-pop-lock { display: flex; align-items: flex-start; gap: 8px; font-size: var(--vq-fs-caption); color: var(--vq-text-2); cursor: pointer; }
.vqd-pop-lock input { accent-color: var(--vq-accent); margin-top: 2px; }
.vqd-pop-go { justify-content: center; }

/* Board + empty state */
.vqd-board { width: 100%; }
.vqd-empty {
    display: flex; flex-direction: column; align-items: center;
    gap: 8px;
    border: 1.5px dashed var(--vq-line);
    border-radius: var(--vq-r-xl);
    padding: 64px 40px;
    text-align: center;
    max-width: 480px;
    margin: 48px auto 0;
    user-select: none;
}
.vqd-empty-ic {
    width: 48px; height: 48px;
    display: flex; align-items: center; justify-content: center;
    border-radius: var(--vq-r-lg);
    background: var(--vq-sunken);
    border: 1px solid var(--vq-line);
    color: var(--vq-text-3);
    margin-bottom: 10px;
}
.vqd-empty-t {
    margin: 0;
    font-family: var(--vq-font-display);
    font-size: var(--vq-fs-h3);
    letter-spacing: var(--vq-ls-h3);
    font-weight: var(--vq-fw-semi);
    color: var(--vq-text);
}
.vqd-empty-d {
    margin: 0 0 14px;
    font-size: var(--vq-fs-small);
    line-height: var(--vq-lh-small);
    color: var(--vq-text-2);
    max-width: 36ch;
}
`;

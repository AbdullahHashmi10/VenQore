import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Check, LayoutGrid, Plus, RotateCcw, Settings2 } from 'lucide-react';

import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import WidgetCard from '@/Components/Workspace/WidgetCard';
import WidgetLibrary from '@/Components/Workspace/WidgetLibrary';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

/**
 * The New Experience dashboard — a workspace the user arranges themselves.
 *
 * ── Two renderers, deliberately ────────────────────────────────────────────
 *
 * Desktop gets react-grid-layout: a twelve-column grid with drag, snapping and
 * size presets. Phones get a plain vertical stack, and that is not a fallback —
 * it is the design.
 *
 * Dragging a card into a 3-column slot on a 375px screen produces a card too
 * small to read; free-dragging on a touch screen fights the page scroll; and a
 * resize handle at a card's corner is a target roughly the size of the gap
 * between two fingers. So on a phone, order is changed with buttons, every card
 * is full width, and the layout is the one thing that cannot break. The saved
 * layout is shared between both — reordering on a phone moves the card on the
 * desktop grid too.
 *
 * ── Data ───────────────────────────────────────────────────────────────────
 *
 * The page arrives with no figures at all. One request then asks for exactly the
 * cards on screen. Adding a card fetches that card; removing one fetches
 * nothing. The classic dashboard builds every section on every load; this one
 * does an amount of work proportional to what the user actually chose to see.
 */

/* Grid geometry. rowHeight × 2 + margin is a comfortable stat card at every
   density; the presets in WidgetRegistry are expressed in these units. */
const ROW_HEIGHT = 84;
const MARGIN = [16, 16];
const BREAKPOINTS = { lg: 1024, md: 768, sm: 0 };
const COLUMNS = { lg: 12, md: 6, sm: 1 };

let ResponsiveGrid = null;

/** Ordered top-to-bottom, then left-to-right — the reading order of the grid. */
const byPosition = (a, b) => (a.y - b.y) || (a.x - b.x);

function greeting(date = new Date()) {
    const hour = date.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
}

export default function WorkspaceDashboard({ catalog, sizePresets, layout: initialLayout, greetingName }) {
    const { props } = usePage();
    const storeSlug = props.store?.slug;

    const [layout, setLayout] = useState(initialLayout || []);
    const [editing, setEditing] = useState(false);
    const [libraryOpen, setLibraryOpen] = useState(false);
    const [widgetState, setWidgetState] = useState({});
    const [gridReady, setGridReady] = useState(Boolean(ResponsiveGrid));

    const catalogById = useMemo(
        () => Object.fromEntries(catalog.map((widget) => [widget.id, widget])),
        [catalog],
    );

    const ordered = useMemo(() => [...layout].sort(byPosition), [layout]);
    const activeIds = useMemo(() => layout.map((item) => item.widget), [layout]);

    /* ------------------------------------------------------------------ *
     * The grid engine, loaded only when it is going to be used
     * ------------------------------------------------------------------ */

    // react-grid-layout and react-resizable are a meaningful chunk of JavaScript
    // that a phone will never execute — it renders the stacked list instead.
    // Importing them lazily keeps them out of the critical path on exactly the
    // devices least able to afford it.
    useEffect(() => {
        if (ResponsiveGrid || typeof window === 'undefined') return;
        if (window.innerWidth < BREAKPOINTS.lg) return;

        let cancelled = false;

        import('react-grid-layout').then(({ Responsive, WidthProvider }) => {
            if (cancelled) return;
            ResponsiveGrid = WidthProvider(Responsive);
            setGridReady(true);
        });

        return () => { cancelled = true; };
    }, []);

    /* ------------------------------------------------------------------ *
     * Data
     * ------------------------------------------------------------------ */

    const inFlight = useRef(new Set());

    const fetchWidgets = useCallback((ids) => {
        const wanted = ids.filter((id) => !inFlight.current.has(id));
        if (!wanted.length || !storeSlug) return;

        wanted.forEach((id) => inFlight.current.add(id));

        fetch(route('store.workspace.data', { store_slug: storeSlug }), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
            },
            body: JSON.stringify({ widgets: wanted }),
        })
            .then((response) => (response.ok ? response.json() : Promise.reject(response)))
            .then((payload) => {
                setWidgetState((previous) => ({ ...previous, ...payload.widgets }));
            })
            .catch(() => {
                // Mark them failed rather than leaving skeletons spinning forever.
                setWidgetState((previous) => ({
                    ...previous,
                    ...Object.fromEntries(wanted.map((id) => [id, { ok: false, error: 'Could not load. Check your connection.' }])),
                }));
            })
            .finally(() => {
                wanted.forEach((id) => inFlight.current.delete(id));
            });
    }, [storeSlug]);

    useEffect(() => {
        const missing = activeIds.filter((id) => !(id in widgetState));
        if (missing.length) fetchWidgets(missing);
    }, [activeIds, widgetState, fetchWidgets]);

    /* ------------------------------------------------------------------ *
     * Persistence
     * ------------------------------------------------------------------ */

    const saveTimer = useRef(null);
    const [saved, setSaved] = useState(false);

    const persist = useCallback((next, { immediate = false } = {}) => {
        if (!storeSlug) return;

        clearTimeout(saveTimer.current);

        const send = () => {
            fetch(route('store.workspace.layout.save', { store_slug: storeSlug }), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ layout: next }),
            })
                .then((response) => (response.ok ? response.json() : Promise.reject(response)))
                .then((payload) => {
                    // The server rebuilds widths from the size presets and drops
                    // anything unavailable, so its answer is authoritative.
                    if (Array.isArray(payload.layout)) setLayout(payload.layout);
                    setSaved(true);
                    setTimeout(() => setSaved(false), 1800);
                })
                .catch(() => {});
        };

        // Dragging fires continuously; saving on every frame would be hundreds of
        // writes for one gesture. Leaving edit mode flushes immediately, so a
        // user who drags and closes the tab does not lose the change.
        if (immediate) send();
        else saveTimer.current = setTimeout(send, 700);
    }, [storeSlug]);

    useEffect(() => () => clearTimeout(saveTimer.current), []);

    /* ------------------------------------------------------------------ *
     * Editing
     * ------------------------------------------------------------------ */

    const applyLayout = useCallback((next) => {
        setLayout(next);
        persist(next);
    }, [persist]);

    const addWidget = (id) => {
        const widget = catalogById[id];
        if (!widget || activeIds.includes(id)) return;

        const size = widget.default_size;
        const preset = sizePresets[size] || sizePresets.small;

        // Appended below everything, which is the only placement that is always
        // correct — hunting for a gap can drop a card somewhere the user is not
        // looking, and they conclude the button did nothing.
        const bottom = layout.reduce((max, item) => Math.max(max, item.y + item.h), 0);

        applyLayout([...layout, { widget: id, x: 0, y: bottom, w: preset.w, h: preset.h, size }]);
        setLibraryOpen(false);
    };

    const removeWidget = (id) => applyLayout(layout.filter((item) => item.widget !== id));

    const resizeWidget = (id, size) => {
        const preset = sizePresets[size];
        if (!preset) return;

        applyLayout(layout.map((item) => (
            item.widget === id ? { ...item, w: preset.w, h: preset.h, size } : item
        )));
    };

    /**
     * Move a card one place in reading order.
     *
     * Implemented as a swap of grid coordinates rather than an index shuffle, so
     * the phone's up/down buttons and the desktop's drag write the same shape of
     * layout and neither has to know about the other.
     */
    const moveWidget = (id, direction) => {
        const sorted = [...layout].sort(byPosition);
        const index = sorted.findIndex((item) => item.widget === id);
        const target = index + direction;

        if (index < 0 || target < 0 || target >= sorted.length) return;

        const a = sorted[index];
        const b = sorted[target];

        applyLayout(layout.map((item) => {
            if (item.widget === a.widget) return { ...item, x: b.x, y: b.y };
            if (item.widget === b.widget) return { ...item, x: a.x, y: a.y };
            return item;
        }));
    };

    const finishEditing = () => {
        setEditing(false);
        persist(layout, { immediate: true });
    };

    const resetLayout = () => {
        if (!storeSlug) return;
        if (!window.confirm('Reset your dashboard to the default arrangement? Your cards will be replaced.')) return;

        router.post(
            route('store.workspace.layout.reset', { store_slug: storeSlug }),
            {},
            {
                preserveScroll: true,
                onSuccess: () => router.reload({ only: ['layout'] }),
            },
        );
    };

    /* ------------------------------------------------------------------ *
     * Grid plumbing
     * ------------------------------------------------------------------ */

    const gridLayouts = useMemo(() => ({
        lg: layout.map((item) => ({
            i: item.widget,
            x: item.x,
            y: item.y,
            w: item.w,
            h: item.h,
            // Below these, content clips rather than reflows. Enforced here as
            // well as by the size presets, because a drag-resize can otherwise
            // reach sizes no preset offers.
            minW: 3,
            minH: 2,
        })),
    }), [layout]);

    const onGridChange = (next) => {
        if (!editing) return;

        const positions = Object.fromEntries(next.map((item) => [item.i, item]));

        const merged = layout.map((item) => {
            const position = positions[item.widget];
            return position
                ? { ...item, x: position.x, y: position.y, w: position.w, h: position.h }
                : item;
        });

        // react-grid-layout emits on mount too. Persisting that would write a
        // layout the user never asked for on every single page view.
        const changed = merged.some((item, index) => (
            item.x !== layout[index].x || item.y !== layout[index].y
        ));

        if (changed) applyLayout(merged);
    };

    const useGrid = gridReady && ResponsiveGrid;

    /* ------------------------------------------------------------------ *
     * Render
     * ------------------------------------------------------------------ */

    const cardProps = (item, index, total) => ({
        widget: { ...catalogById[item.widget], id: item.widget, size: item.size },
        state: widgetState[item.widget],
        editing,
        onRemove: () => removeWidget(item.widget),
        onResize: (size) => resizeWidget(item.widget, size),
        onMoveUp: () => moveWidget(item.widget, -1),
        onMoveDown: () => moveWidget(item.widget, 1),
        canMoveUp: index > 0,
        canMoveDown: index < total - 1,
    });

    return (
        <OneGlanceLayout activeMenu="Dashboard" title="Dashboard" noPadding>
            <Head title="Dashboard" />

            {/* The grid library ships unthemed defaults. Rather than a second
                stylesheet, these few rules bind its two visual affordances to
                the design tokens — everything else it does is layout maths. */}
            <style>{`
                .vq-workspace .react-grid-item.react-grid-placeholder {
                    background: rgb(var(--vq-ramp-brand-500) / 0.16);
                    border: 1px dashed rgb(var(--vq-ramp-brand-500) / 0.5);
                    border-radius: var(--vq-radius-2xl);
                    opacity: 1;
                }
                .vq-workspace .react-resizable-handle {
                    opacity: 0;
                    transition: opacity var(--vq-duration-fast) var(--vq-ease-standard);
                }
                .vq-workspace.is-editing .react-resizable-handle { opacity: 0.55; }
                .vq-workspace.is-editing .react-grid-item:hover .react-resizable-handle { opacity: 1; }
            `}</style>

            <div className="mx-auto w-full max-w-page px-4 py-5 sm:px-6 lg:py-7">
                {/* ── Header ──────────────────────────────────────────────── */}
                <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
                    <div className="min-w-0">
                        <h1 className="truncate text-xl font-semibold text-ink sm:text-2xl">
                            {greeting()}{greetingName ? `, ${greetingName.split(' ')[0]}` : ''}
                        </h1>
                        <p className="mt-0.5 text-sm text-ink-muted">
                            {props.store?.name}
                            {' · '}
                            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                        </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                        {editing && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setLibraryOpen(true)}
                                    className="inline-flex min-h-control-md items-center gap-1.5 rounded-xl bg-brand-600 px-3 text-sm font-medium text-ink-inverted transition-colors hover:bg-brand-700"
                                >
                                    <Plus className="h-4 w-4" aria-hidden="true" />
                                    Add card
                                </button>
                                <button
                                    type="button"
                                    onClick={resetLayout}
                                    aria-label="Reset to default layout"
                                    className="inline-flex min-h-control-md items-center gap-1.5 rounded-xl border border-line px-3 text-sm font-medium text-ink-secondary transition-colors hover:bg-interactive-hover"
                                >
                                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                                    <span className="hidden sm:inline">Reset</span>
                                </button>
                            </>
                        )}

                        <button
                            type="button"
                            onClick={editing ? finishEditing : () => setEditing(true)}
                            className={[
                                'inline-flex min-h-control-md items-center gap-1.5 rounded-xl px-3 text-sm font-medium transition-colors',
                                editing
                                    ? 'bg-success-600 text-ink-inverted hover:bg-success-700'
                                    : 'border border-line text-ink-secondary hover:bg-interactive-hover',
                            ].join(' ')}
                        >
                            {editing
                                ? <><Check className="h-4 w-4" aria-hidden="true" />Done</>
                                : <><Settings2 className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">Edit dashboard</span><span className="sm:hidden">Edit</span></>}
                        </button>
                    </div>
                </header>

                <p className="mb-3 h-4 text-xs text-success-600" aria-live="polite">
                    {saved ? 'Layout saved' : ''}
                </p>

                {/* ── Empty ───────────────────────────────────────────────── */}
                {ordered.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-line-strong bg-surface px-6 py-14 text-center">
                        <LayoutGrid className="mx-auto h-7 w-7 text-ink-faint" aria-hidden="true" />
                        <h2 className="mt-3 text-base font-semibold text-ink">Your dashboard is empty</h2>
                        <p className="mx-auto mt-1 max-w-sm text-sm text-ink-muted">
                            Add the cards that matter to your business. You can rearrange or remove them at any time.
                        </p>
                        <button
                            type="button"
                            onClick={() => { setEditing(true); setLibraryOpen(true); }}
                            className="mt-5 inline-flex min-h-control-md items-center gap-1.5 rounded-xl bg-brand-600 px-4 text-sm font-medium text-ink-inverted hover:bg-brand-700"
                        >
                            <Plus className="h-4 w-4" aria-hidden="true" />
                            Add your first card
                        </button>
                    </div>
                )}

                {/* ── Phones and tablets: a stack, not a shrunken grid ─────── */}
                {ordered.length > 0 && (
                    <div className={`vq-workspace lg:hidden ${editing ? 'is-editing' : ''}`}>
                        <div className="space-y-4">
                            {ordered.map((item, index) => (
                                <div
                                    key={item.widget}
                                    // Tall cards keep their proportions; short ones
                                    // get a readable minimum rather than the exact
                                    // grid height, which on a phone would be cramped.
                                    style={{ minHeight: item.h >= 4 ? 320 : 168 }}
                                >
                                    <WidgetCard {...cardProps(item, index, ordered.length)} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Desktop: the twelve-column grid ─────────────────────── */}
                {ordered.length > 0 && (
                    <div className={`vq-workspace hidden lg:block ${editing ? 'is-editing' : ''}`}>
                        {useGrid ? (
                            <ResponsiveGrid
                                className="-mx-2"
                                layouts={gridLayouts}
                                breakpoints={BREAKPOINTS}
                                cols={COLUMNS}
                                rowHeight={ROW_HEIGHT}
                                margin={MARGIN}
                                containerPadding={[8, 0]}
                                isDraggable={editing}
                                isResizable={editing}
                                draggableHandle=".vq-drag-handle"
                                // Vertical compaction keeps the arrangement tidy
                                // and, more importantly, guarantees no overlap
                                // regardless of what a saved layout claims.
                                compactType="vertical"
                                preventCollision={false}
                                onDragStop={onGridChange}
                                onResizeStop={onGridChange}
                            >
                                {ordered.map((item, index) => (
                                    <div key={item.widget}>
                                        <WidgetCard {...cardProps(item, index, ordered.length)} />
                                    </div>
                                ))}
                            </ResponsiveGrid>
                        ) : (
                            // Shown for the moment before the grid module resolves.
                            // Same cards, same order, so nothing jumps when it swaps.
                            <div className="grid grid-cols-12 gap-4">
                                {ordered.map((item, index) => (
                                    <div
                                        key={item.widget}
                                        style={{
                                            gridColumn: `span ${item.w} / span ${item.w}`,
                                            minHeight: item.h * ROW_HEIGHT + (item.h - 1) * MARGIN[1],
                                        }}
                                    >
                                        <WidgetCard {...cardProps(item, index, ordered.length)} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <WidgetLibrary
                open={libraryOpen}
                catalog={catalog}
                activeIds={activeIds}
                onAdd={addWidget}
                onClose={() => setLibraryOpen(false)}
            />
        </OneGlanceLayout>
    );
}

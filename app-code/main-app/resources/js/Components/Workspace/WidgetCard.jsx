import React from 'react';
import { ChevronDown, ChevronUp, GripVertical, X } from 'lucide-react';

import { WidgetBody } from './widgets';

/**
 * The frame every dashboard card sits in.
 *
 * ── Two modes, one component ───────────────────────────────────────────────
 *
 * In normal use the card is quiet: a title, the figure, nothing else. Editing
 * controls appear only in edit mode. That split is the point of having an edit
 * mode at all — a dashboard covered in drag handles and × buttons is a dashboard
 * people are afraid to touch, and one they knock out of shape by accident.
 *
 * ── Why the drag handle is a handle and not the whole card ──────────────────
 *
 * `.vq-drag-handle` is what react-grid-layout is told to listen to. Making the
 * entire card draggable would swallow every click inside it — including the
 * links in Quick Actions and the scroll gesture in the list cards, which on a
 * touch screen is indistinguishable from the start of a drag.
 */

const SIZE_LABELS = {
    small: 'S',
    medium: 'M',
    large: 'L',
    full: 'Full',
};

export default function WidgetCard({
    widget,
    state,
    editing,
    onRemove,
    onResize,
    // Mobile reordering. On a phone there is no grid to drag within, so position
    // is changed with buttons — a real control rather than a drag target too
    // small to hit reliably.
    onMoveUp,
    onMoveDown,
    canMoveUp,
    canMoveDown,
}) {
    const sizes = widget.sizes || [];

    return (
        <article
            className={[
                'flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border bg-surface transition-shadow',
                editing
                    ? 'border-dashed border-brand-500/60 shadow-sm'
                    : 'border-line',
            ].join(' ')}
        >
            <header className="flex shrink-0 items-center gap-2 px-4 pt-3.5">
                {editing && (
                    <span
                        className="vq-drag-handle hidden cursor-grab touch-none text-ink-faint hover:text-ink-muted active:cursor-grabbing lg:block"
                        aria-hidden="true"
                    >
                        <GripVertical className="h-4 w-4" />
                    </span>
                )}

                <h3 className="min-w-0 flex-1 truncate text-2xs font-semibold uppercase tracking-wide text-ink-muted">
                    {widget.title}
                </h3>

                {editing && (
                    <div className="flex shrink-0 items-center gap-1">
                        {/* Reorder, phones only. */}
                        <button
                            type="button"
                            onClick={onMoveUp}
                            disabled={!canMoveUp}
                            aria-label={`Move ${widget.title} up`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:bg-interactive-hover disabled:opacity-30 lg:hidden"
                        >
                            <ChevronUp className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                            type="button"
                            onClick={onMoveDown}
                            disabled={!canMoveDown}
                            aria-label={`Move ${widget.title} down`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:bg-interactive-hover disabled:opacity-30 lg:hidden"
                        >
                            <ChevronDown className="h-4 w-4" aria-hidden="true" />
                        </button>

                        {/* Size presets, desktop only: on a phone every card is
                            full width by definition, so offering S/M/L there would
                            be a control that visibly does nothing. */}
                        {sizes.length > 1 && (
                            <div className="hidden items-center gap-0.5 rounded-lg bg-sunken p-0.5 lg:flex">
                                {sizes.map((size) => (
                                    <button
                                        key={size}
                                        type="button"
                                        onClick={() => onResize(size)}
                                        aria-pressed={widget.size === size}
                                        aria-label={`Set ${widget.title} to ${size}`}
                                        className={[
                                            'rounded px-1.5 py-0.5 text-2xs font-semibold transition-colors',
                                            widget.size === size
                                                ? 'bg-surface text-ink shadow-xs'
                                                : 'text-ink-muted hover:text-ink',
                                        ].join(' ')}
                                    >
                                        {SIZE_LABELS[size] || size}
                                    </button>
                                ))}
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={onRemove}
                            aria-label={`Remove ${widget.title}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:bg-danger-500/10 hover:text-danger-600"
                        >
                            <X className="h-4 w-4" aria-hidden="true" />
                        </button>
                    </div>
                )}
            </header>

            {/* min-h-0 is load-bearing: without it a flex child refuses to shrink
                below its content, and a list or chart card grows past the grid
                cell instead of scrolling inside it. */}
            <div className="min-h-0 flex-1 px-4 pb-4 pt-2">
                <WidgetBody id={widget.id} state={state} />
            </div>
        </article>
    );
}

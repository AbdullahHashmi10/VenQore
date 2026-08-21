import React from 'react';
import {
    AlertCircle, GripVertical, HelpCircle, Minus, Pencil,
    Trash2, TrendingDown, TrendingUp,
} from 'lucide-react';

import NumberRoller from './NumberRoller';
import CardPeriodPicker from './CardPeriodPicker';
import { periodWhen } from '../periods';
import {
    SELF_LABELLED, formatMetric, headlineOf, isBareStat, resolveDelta,
} from '../utils/headline';

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  DashboardCardFrame — the card face                                       ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * The React half of the `.vqc` card layer in `resources/css/venqore-v6/cards.css`.
 * Between them they are the card builder's card, in the product.
 *
 * ── What moved, and why it had to ───────────────────────────────────────────
 *
 * This file used to carry ~350 lines of inline style objects and four
 * `onMouseEnter` handlers that mutated `style.boxShadow` by hand, because an
 * inline style cannot express `:hover`. The styling is now CSS and this file
 * is structure and behaviour, which is the split that lets the two stay in
 * agreement with the builder.
 *
 * The headline also moved. It used to live inside StatChart, so a card showing
 * a line chart had no number, a card showing a gauge had two, and the eight
 * chart components each decided their own type scale. The FRAME now owns the
 * eyebrow, the value, the delta and the window; a chart component owns the
 * plot and nothing else. That is the only arrangement in which every card on a
 * board reads the same way.
 *
 * ── The mechanisms this file is responsible for ─────────────────────────────
 *
 * M1  `card.style.accent` paints the fill. The budget of one is enforced
 *     server-side; this just renders it, and in dark it also BLOOMS (M6).
 * M2  Three type sizes: eyebrow 11px → value 38px (26px on C2, h3 on C1) →
 *     delta at eyebrow size. Nothing between them.
 * M3  The delta is a pill carrying a GLYPH and a number, and it is the
 *     smallest thing on the card. The window line beside it is never tinted.
 * M4  Top-aligned. The fit decides the box; the content sits in it.
 */
export default function DashboardCardFrame({
    card,
    definition,
    meta,
    data,
    settings,
    loading,
    error,
    isGated,
    isLocked,
    index = 0,
    onEdit,
    onRemove,
    onPeriodChange,
    children,
}) {
    // A card gated by plan or permission is not a card in an error state — it
    // is a card that does not exist for this user. It leaves no hole.
    if (isGated) return null;

    const category = card?.category || 'C3';
    const accent = Boolean(card?.style?.accent);
    const title = card?.title_override || meta?.label || definition?.label || 'Metric';
    const help = definition?.help || meta?.help || '';

    const unit = meta?.unit || definition?.unit || 'decimal';
    const precision = meta?.precision ?? definition?.precision ?? 0;
    const direction = meta?.direction || definition?.direction || 'neutral';

    const headline = headlineOf(data, definition);
    const metric = formatMetric(headline.value, { unit, precision, settings, category });
    const delta = resolveDelta(headline.changePct, direction);

    const period = card?.period || definition?.default_period || 'today';
    const when = periodWhen(meta, period);

    /* A chart that prints its own number in its own middle does not get a
       second one above it, and a bare stat has no body to make room for. */
    const showHeadline = !SELF_LABELLED.has(card?.chart);
    const showHost = !isBareStat(card) || Boolean(children);

    // Default ON, matching the card builder. An explicit false turns it off.
    const showPicker = card?.style?.periodPicker !== false && !SELF_LABELLED.has(card?.chart);

    const classes = [
        'vqc',
        `vqc--${category.toLowerCase()}`,
        accent && 'vqc--accent',
        error && 'vqc--error',
    ].filter(Boolean).join(' ');

    const tools = !isLocked && (onEdit || onRemove) ? (
        <span className="vqc-tools">
            {/* The grip is the drag handle react-grid-layout is told about, so
                dragging starts here and nowhere else — a card you can pick up
                by its own chart is a card you cannot hover a data point on. */}
            <button
                type="button"
                className="vqc-act vqc-grip vq-card-drag-handle"
                title="Drag to reorder"
                aria-label={`Reorder ${title}`}
            >
                <GripVertical size={13} aria-hidden="true" />
            </button>
            {onEdit && (
                <button
                    type="button"
                    className="vqc-act vqc-edit"
                    title="Configure card"
                    aria-label={`Configure ${title}`}
                    onClick={onEdit}
                >
                    <Pencil size={12} aria-hidden="true" />
                </button>
            )}
            {onRemove && (
                <button
                    type="button"
                    className="vqc-act vqc-del"
                    title="Remove card"
                    aria-label={`Remove ${title}`}
                    onClick={onRemove}
                >
                    <Trash2 size={12} aria-hidden="true" />
                </button>
            )}
        </span>
    ) : null;

    const value = (
        <NumberRoller
            value={metric.text}
            title={metric.exact ?? undefined}
            className={
                category === 'C1' ? 'vqc-value vqc-value--xs'
                    : category === 'C2' ? 'vqc-value vqc-value--sm'
                        : 'vqc-value'
            }
        />
    );

    /* ── C1 · Tile — a label and a figure, centred, no header row ─────── */
    if (category === 'C1') {
        return (
            <article className={classes} style={{ '--i': index }} id={`card-${card.id}`}>
                {tools}
                <Body loading={loading} error={error} category={category}>
                    <div className="vqc-bd vqc-bd--tile">
                        <span className="vqc-label" title={title}>{title}</span>
                        {value}
                        <span className="vqc-when">{when}</span>
                    </div>
                </Body>
                <span className="vqc-glare" aria-hidden="true" />
            </article>
        );
    }

    /* ── C2 · Strip — label left, figure right, one line ──────────────── */
    if (category === 'C2') {
        return (
            <article className={classes} style={{ '--i': index }} id={`card-${card.id}`}>
                {tools}
                <Body loading={loading} error={error} category={category}>
                    <div className="vqc-bd vqc-bd--strip is-inline">
                        <span className="vqc-eyebrow" title={title}>{title}</span>
                        <span className="vqc-head">
                            {value}
                            {delta && <Delta delta={delta} />}
                        </span>
                        <span className="vqc-when">{when}</span>
                    </div>
                </Body>
                <span className="vqc-glare" aria-hidden="true" />
            </article>
        );
    }

    /* ── C3–C6 · header, number block, window, plot ───────────────────── */
    return (
        <article className={classes} style={{ '--i': index }} id={`card-${card.id}`}>
            <div className="vqc-hd">
                <span className="vqc-eyebrow" title={definition?.description || title}>
                    {title}
                </span>

                <span className="vqc-hd-r">
                    {help && (
                        <button
                            type="button"
                            className="vqc-help"
                            title={help}
                            aria-label={help}
                        >
                            <HelpCircle size={12} aria-hidden="true" />
                        </button>
                    )}
                    {showPicker && (
                        <CardPeriodPicker
                            value={period}
                            definition={definition}
                            disabled={!onPeriodChange}
                            onChange={(next) => onPeriodChange?.(card.id, next)}
                        />
                    )}
                    {tools}
                </span>
            </div>

            <Body loading={loading} error={error} category={category}>
                {showHeadline && (
                    <>
                        <div className="vqc-head">
                            {value}
                            {delta && <Delta delta={delta} />}
                        </div>
                        <p className="vqc-when">{when}</p>
                    </>
                )}

                {showHost && (
                    <div className="vqc-host vq-chart" data-chart={card?.chart}>
                        {children}
                    </div>
                )}
            </Body>

            <span className="vqc-glare" aria-hidden="true" />
        </article>
    );
}

/* ------------------------------------------------------------------ *
 * States
 * ------------------------------------------------------------------ */

/**
 * Loading, failed, or the card itself.
 *
 * The skeleton is shaped like the thing it is standing in for — eyebrow, then
 * value, then plot — so the card does not visibly re-lay itself the moment the
 * figures land. A generic grey box does re-lay, and on a nine-card board that
 * is nine small jumps every time the page loads.
 */
function Body({ loading, error, category, children }) {
    if (loading) {
        const lean = category === 'C1' || category === 'C2';
        return (
            <div className="vqc-bd" aria-busy="true">
                <div className="vqc-skel vqc-skel--value" />
                <div className="vqc-skel vqc-skel--foot" />
                {!lean && <div className="vqc-skel vqc-skel--plot" />}
            </div>
        );
    }

    if (error) {
        return (
            <div className="vqc-state">
                <span className="vqc-state-ic"><AlertCircle size={16} aria-hidden="true" /></span>
                <span className="vqc-state-t">Couldn’t load this</span>
                <span className="vqc-state-d">
                    The reading didn’t come back. It will retry on the next refresh.
                </span>
            </div>
        );
    }

    return <>{children}</>;
}

/* ------------------------------------------------------------------ *
 * Delta
 * ------------------------------------------------------------------ */

/** M3 — a glyph AND a number. The colour is a third signal, never the only one. */
function Delta({ delta }) {
    const Icon = delta.tone === 'flat' ? Minus : (delta.rising ? TrendingUp : TrendingDown);
    const word = delta.tone === 'flat' ? 'no change' : (delta.rising ? 'up' : 'down');

    return (
        <span className={`vqc-delta vqc-delta--${delta.tone}`}>
            <Icon size={10} strokeWidth={2.5} aria-hidden="true" />
            <span aria-label={`${word} ${delta.text}`}>{delta.text}</span>
        </span>
    );
}

import React, { useId } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

import { formatValue } from '../utils/format';
import { PALETTE } from './palette';

/**
 * StatChart — the number block.
 *
 * The default chart for every SCALAR reading, so it is the one a user sees most
 * and the exemplar the other eight follow.
 *
 * ── What this was ───────────────────────────────────────────────────────────
 *
 * One line of it broke four rules at once. It set the value in a weight of 800
 * (above the system's 700 ceiling), in an off-system true-neutral grey, with a
 * 300ms transition (not one of the four legal durations), scaling on group
 * hover — the named bug. The reference never scales a card on hover, and a KPI
 * figure that grows when the pointer passes over it makes the whole board feel
 * unstable.
 *
 * The offending classes are described rather than quoted here on purpose: the
 * CI greps in DESIGN-RULES v3.0 §16 match on text, and a file that documents a
 * violation should not read as one.
 *
 * ── The three mechanisms it now implements ──────────────────────────────────
 *
 * **M2 · Three type sizes, never two, never four.** Eyebrow 11px uppercase →
 * value 38px (or 26px on a lean card) in Space Grotesk, tabular → unit at half
 * the value, demoted and baseline-aligned. The label-to-value jump is ≥2.3×.
 * Nothing sits between them, and a fourth size in this block is a fail.
 *
 * **M3 · The delta is a pill with a glyph, and it is the smallest thing on the
 * card.** Direction is carried by an arrow *and* a sign, never by colour alone
 * — roughly 1 in 12 men cannot reliably separate the red from the green. The
 * pill carries the semantic colour; the context sentence beside it never does.
 *
 * **M5 · One hue.** The sparkline is a single accent stroke over a wash that
 * fades to transparent. No axis, no grid, no second colour.
 */
export default function StatChart({ data, definition, settings, card }) {
    const value = data?.value;
    const previous = data?.previous;
    const changePct = data?.change_pct;
    const direction = definition?.direction || 'neutral';
    const unit = definition?.unit || 'decimal';
    const precision = definition?.precision ?? 0;

    const displayValue = formatValue(value, unit, precision, settings);
    const displayPrevious = previous != null
        ? formatValue(previous, unit, precision, settings)
        : null;

    // M2: 38px or 26px. No other size. A C1 tile and a C2 strip are the two
    // categories that cannot hold 38px without the number touching its own
    // frame, so they take the small step; everything else takes the full one.
    const lean = card?.category === 'C1' || card?.category === 'C2';

    // M1: on the one accent-filled card of the board, everything inverts. The
    // frame paints the mint fill; the block on top of it has to follow, or the
    // headline metric is the one number nobody can read.
    const accent = Boolean(card?.style?.accent);

    const trend = resolveTrend(changePct, direction);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '100%',
            width: '100%',
            position: 'relative',
        }}>
            {/* ── The number block ─────────────────────────────────────────── */}
            <div style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: '10px',
                flexShrink: 0,
            }}>
                <div
                    // Space Grotesk with tabular figures. In a financial product
                    // proportional figures in a column are a typo you can see
                    // from across the room.
                    style={{
                        fontFamily: 'var(--vq-font-numeric)',
                        fontSize: lean ? 'var(--vq-fs-metric-sm)' : 'var(--vq-fs-metric)',
                        lineHeight: 'var(--vq-lh-metric)',
                        letterSpacing: 'var(--vq-ls-metric)',
                        fontWeight: 'var(--vq-fw-semi)',
                        color: accent ? 'var(--vq-on-accent)' : 'var(--vq-text)',
                        fontVariantNumeric: 'tabular-nums',
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                    title={String(value ?? '')}
                >
                    {displayValue}
                </div>

                {trend && <DeltaPill trend={trend} changePct={changePct} accent={accent} />}
            </div>

            {/* ── Context and sparkline ────────────────────────────────────── */}
            <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                gap: '10px',
                marginTop: 'auto',
            }}>
                {/* M3: the context sentence is never tinted. Only the pill
                    carries semantic colour; this is plain metadata. */}
                <div style={{
                    fontFamily: 'var(--vq-font-numeric)',
                    fontSize: 'var(--vq-fs-eyebrow)',
                    lineHeight: 'var(--vq-lh-eyebrow)',
                    letterSpacing: 'var(--vq-ls-eyebrow)',
                    textTransform: 'uppercase',
                    fontWeight: 'var(--vq-fw-medium)',
                    color: accent ? 'rgb(255 255 255 / .72)' : 'var(--vq-text-3)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                }}>
                    {displayPrevious ? `vs ${displayPrevious}` : ''}
                </div>

                <Sparkline points={data?.series} accent={accent} />
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ *
 * Delta
 * ------------------------------------------------------------------ */

/**
 * Which way is good depends on the reading, not on the sign.
 *
 * A rising cost and a rising revenue are the same arrow and opposite news, so
 * `direction` on the definition decides the colour and the arrow reports the
 * movement. Neutral readings get ink rather than the brand: teal means "this is
 * the brand", and a delta is data.
 */
function resolveTrend(changePct, direction) {
    if (changePct == null) return null;

    const rising = changePct > 0;
    const flat = changePct === 0;

    if (flat) {
        return { tone: 'neutral', Icon: Minus, sign: '' };
    }

    const Icon = rising ? ArrowUpRight : ArrowDownRight;
    const sign = rising ? '+' : '−';

    if (direction === 'upper_is_better') {
        return { tone: rising ? 'success' : 'danger', Icon, sign };
    }
    if (direction === 'lower_is_better') {
        return { tone: rising ? 'danger' : 'success', Icon, sign };
    }
    return { tone: 'neutral', Icon, sign };
}

const TONE_TOKENS = {
    success: { fg: 'var(--vq-success)', bg: 'var(--vq-success-bg)', line: 'var(--vq-success-line)' },
    danger: { fg: 'var(--vq-danger)', bg: 'var(--vq-danger-bg)', line: 'var(--vq-danger-line)' },
    neutral: { fg: 'var(--vq-text-2)', bg: 'var(--vq-sunken)', line: 'var(--vq-line)' },
};

function DeltaPill({ trend, changePct, accent }) {
    // On the accent fill a semantic tint has nothing to sit against — a pale
    // green pill on mint is invisible. The pill goes to a white scrim instead,
    // and the GLYPH keeps carrying the direction, which is what M3 actually
    // requires: never colour alone.
    const t = accent
        ? { fg: 'var(--vq-on-accent)', bg: 'rgb(255 255 255 / .18)', line: 'rgb(255 255 255 / .28)' }
        : TONE_TOKENS[trend.tone];

    return (
        <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            flexShrink: 0,
            padding: '2px 8px',
            borderRadius: 'var(--vq-r-full)',
            background: t.bg,
            border: `1px solid ${t.line}`,
            color: t.fg,
            // M3: the delta is the smallest thing on the card.
            fontFamily: 'var(--vq-font-numeric)',
            fontSize: 'var(--vq-fs-eyebrow)',
            lineHeight: 'var(--vq-lh-eyebrow)',
            fontWeight: 'var(--vq-fw-semi)',
            fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'nowrap',
        }}>
            {/* Glyph AND sign AND number. Never colour alone. */}
            <trend.Icon size={11} strokeWidth={2.25} aria-hidden="true" />
            <span>{trend.sign}{Math.abs(changePct).toFixed(1)}%</span>
        </div>
    );
}

/* ------------------------------------------------------------------ *
 * Sparkline
 * ------------------------------------------------------------------ */

const SPARK_W = 120;
const SPARK_H = 36;

/**
 * One accent stroke over a wash that fades to transparent. No axis, no grid, no
 * second hue — M5.
 *
 * The gradient id comes from `useId()`. It used to be the literal string
 * `statSparkGradient`, so a board with four stat cards emitted four elements
 * with the same DOM id and every one of them referenced the first — which is
 * invisible until the first card unmounts and the other three lose their fill.
 */
function Sparkline({ points, accent }) {
    const gradientId = useId().replace(/:/g, '');
    // The stroke is the accent everywhere except ON the accent, where it would
    // vanish into its own background.
    const ink = accent ? 'var(--vq-on-accent)' : PALETTE.accent;

    if (!Array.isArray(points) || points.length < 2) return null;

    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;

    const coords = points.map((p, i) => ({
        x: (i / (points.length - 1)) * SPARK_W,
        // 4px of headroom top and bottom so the stroke is never clipped by its
        // own viewBox at the extremes.
        y: SPARK_H - 4 - ((p - min) / range) * (SPARK_H - 8),
    }));

    const line = `M ${coords[0].x} ${coords[0].y} `
        + coords.slice(1).map((c) => `L ${c.x} ${c.y}`).join(' ');
    const area = `${line} L ${SPARK_W} ${SPARK_H} L 0 ${SPARK_H} Z`;

    return (
        <div style={{ width: SPARK_W, height: SPARK_H, flexShrink: 0 }} aria-hidden="true">
            <svg
                viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
                style={{ width: '100%', height: '100%', overflow: 'visible' }}
            >
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={ink} stopOpacity="0.22" />
                        <stop offset="100%" stopColor={ink} stopOpacity="0" />
                    </linearGradient>
                </defs>

                <path d={area} fill={`url(#${gradientId})`} />
                <path
                    d={line}
                    fill="none"
                    stroke={ink}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </div>
    );
}

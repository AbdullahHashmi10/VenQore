import React from 'react';

import { Gauge } from '@/Components/Charts/gauge';

import { EmptyPlot, useChartMotion } from './kit';

/**
 * GaugeChart — a value against its own ceiling.
 *
 * ── §11 · the track carries data ────────────────────────────────────────────
 *
 * A gauge's unfilled notches encode the remainder — "the other 32%" — so they
 * are a data mark and must clear 3:1 against the card, not the 1.5:1 a
 * decorative groove gets away with. That is `--vq-chart-track-data`, which is
 * ink-400 nudged from 2.94:1 to 3.43:1 in light and lifted to 38% white in
 * dark, where 28% measured 2.56:1.
 *
 * The old version drew its arc in a literal two-stop gradient the product does
 * not own, over a track written as a raw rgba() with a hand-written dark twin —
 * and that track failed the 3:1 floor in both modes.
 *
 * The reading is printed by the gauge itself, so the frame suppresses its own
 * headline for this chart type: "68%" twice on one card is the card telling you
 * it does not know what it is for.
 */
export default function GaugeChart({ data, definition, meta }) {
    const motion = useChartMotion();

    const raw = Number(data?.value);
    if (!Number.isFinite(raw)) return <EmptyPlot label="No reading" />;

    const unit = meta?.unit || definition?.unit || 'percentage';
    const precision = meta?.precision ?? definition?.precision ?? 0;

    /* A gauge needs a ceiling. A percentage carries its own; anything else has
       to be told, and a reading that cannot say what "full" means is not a
       gauge — it is a number, and it is clamped rather than drawn past the end
       of its own arc. */
    const ceiling = Number(data?.max ?? data?.target ?? (unit === 'percentage' ? 100 : 0));
    const pct = ceiling > 0
        ? Math.max(0, Math.min(100, (raw / ceiling) * 100))
        : Math.max(0, Math.min(100, raw));

    return (
        <Gauge
            value={pct}
            centerValue={unit === 'percentage' ? raw : pct}
            suffix="%"
            defaultLabel={meta?.label || definition?.label || ''}
            formatOptions={{ maximumFractionDigits: precision }}
            activeFill="var(--chart-1)"
            inactiveFill="var(--vq-chart-track-data)"
            /* The arc sizes itself from its WIDTH against a fixed 21/16 box and
               ignores the height it was given, so in a tall card it renders
               past the bottom of the host and gets clipped by the card's own
               overflow. .vqc-gauge drives it from the height instead. */
            className="vqc-gauge"
            enterTransition={motion.enterTransition}
        />
    );
}

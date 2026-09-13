import React, { useMemo } from 'react';
import { curveCatmullRom, curveLinear, curveStepAfter } from '@visx/curve';

import { AreaChart } from '@/Components/Charts/area-chart';
import { Area } from '@/Components/Charts/area';
import { PatternArea } from '@/Components/Charts/pattern-area';
import { PatternLines } from '@/Components/Charts/visx-pattern';
import { LineChart } from '@/Components/Charts/line-chart';
import { Line } from '@/Components/Charts/line';
import { BarChart } from '@/Components/Charts/bar-chart';
import { Bar } from '@/Components/Charts/bar';
import { BarXAxis } from '@/Components/Charts/bar-x-axis';
import { ComposedChart } from '@/Components/Charts/composed-chart';
import { SeriesBar } from '@/Components/Charts/series-bar';
import { Grid } from '@/Components/Charts/grid';
import { XAxis } from '@/Components/Charts/x-axis';
import { YAxis } from '@/Components/Charts/y-axis';
import { ChartTooltip, TooltipContent } from '@/Components/Charts/tooltip';

import { variantOf } from '../variantLaw';
import {
    EmptyPlot, GRID_PROPS, axisFormatter, isTimeAxis, padSeries, seriesColor,
    seriesList, toRows, useChartMotion, valueFormatter,
} from './kit';

/**
 * SeriesChart — line, area, bar, combined, profit-and-loss.
 *
 * ── What this replaced ──────────────────────────────────────────────────────
 *
 * A hand-rolled SVG plot on a fixed 300x110 viewBox. It stretched to whatever
 * the card was, so a wide card got wide text and a narrow one got squashed
 * text; it drew its grid lines from a literal rgba() with a hand-written dark
 * twin, and its axis labels from an off-system neutral pigment; it had no
 * tooltip, only a strip under the plot reading "Hover nodes to inspect"; and
 * its profit-and-loss gradient used a fixed DOM id, so two such cards on one
 * board both referenced the first one's gradient.
 *
 * (Those classes are described rather than quoted: the CI greps in
 * DESIGN-RULES §16 match on text, and a file explaining a violation should not
 * register as one.)
 *
 * All of that is now the vendored bklit library, which measures its own parent,
 * draws in real pixels, and resolves every colour through the variables
 * `bklit-bridge.css` maps onto V6 tokens. This file decides which plot and
 * hands it the data — nothing else.
 *
 * ── Variants ────────────────────────────────────────────────────────────────
 *
 * A chart type is not one picture. `card.style.variant` picks the look, and
 * every branch below reads it: a curve factory, a fill treatment, a dash, a
 * bar cap, a stack. The Variant Law decides which are offered — a look that
 * would render the same picture as another is never on the menu.
 *
 * The card's headline number is NOT here. The frame owns it, so every card on
 * a board states its figure the same way.
 */

/** Smooth is the reference's own curve: Catmull-Rom at alpha 0.42. */
const CURVES = {
    smooth: curveCatmullRom.alpha(0.42),
    linear: curveLinear,
    step: curveStepAfter,
};
const curveFor = (variant) => CURVES[variant] ?? CURVES.smooth;

export default function SeriesChart({ data, definition, meta, settings, card, chartType = 'line' }) {
    const motion = useChartMotion();
    const variant = variantOf(card ?? { chart: chartType });

    const unit = meta?.unit || definition?.unit || 'decimal';
    const precision = meta?.precision ?? definition?.precision ?? 0;

    /*
     * A window with nothing in it still gets a plot.
     *
     * `padSeries` extends a sparse read to a flat run across the period the
     * Reckoner resolved, so a day with no takings draws a flat line on a real
     * scale instead of an empty box. The line is honest — the value genuinely
     * did not move — and the axes still say what window and what magnitude.
     */
    const list = useMemo(
        () => padSeries(
            seriesList(data, meta?.label || definition?.label || 'Value'),
            meta,
            meta?.label || definition?.label || 'Value',
        ),
        [data, meta, definition],
    );

    /* A bar chart's x is a category even when it holds dates — bklit's BarChart
       is banded, not scaled, and asking it for a time axis gets you one bar at
       the far left. Every other chart here is scaled and needs real Dates. */
    const timeChart = chartType !== 'bar';
    const rows = useMemo(() => toRows(list, { asDate: timeChart }), [list, timeChart]);

    /*
     * Whether the x values are dates DECIDES THE CHROME, not the plot.
     *
     * A SERIES is time-based by definition, but a card can be pointed at a
     * reading whose x is a name. The shape still plots correctly (`toRows`
     * stands in positions for the missing dates), so the line is honest — but
     * a date axis and a date pill over stand-in dates would not be. When they
     * are not real, both are suppressed and the tooltip names the point
     * instead.
     */
    const realDates = timeChart && isTimeAxis(list);

    if (!rows.length) return <EmptyPlot />;

    const format = valueFormatter({ unit, precision, settings });
    const seriesRows = (point) => list.map((s, i) => ({
        color: seriesColor(i),
        label: s.name,
        value: format(point[s.key]),
    }));

    /* A date pill needs a date. Without one, the point names itself. */
    const tooltip = realDates
        ? <ChartTooltip rows={seriesRows} />
        : (
            <ChartTooltip
                showDatePill={false}
                content={({ point }) => (
                    <TooltipContent title={String(point.name ?? '')} rows={seriesRows(point)} />
                )}
            />
        );

    const xAxis = realDates ? <XAxis numTicks={4} /> : null;

    const common = {
        data: rows,
        className: 'h-full',
        aspectRatio: 'auto',
        ...motion,
    };
    const plotMargin = { top: 8, right: 8, bottom: realDates ? 24 : 6, left: 34 };

    /* ── Bars — categorical, banded ───────────────────────────────────── */
    if (chartType === 'bar') {
        /* `grouped` and `stacked` are only distinct once there is a second
           series; the Variant Law does not offer them before that. */
        const stacked = variant === 'stacked' && list.length > 1;
        const cap = variant === 'square' ? 0 : 6;
        const width = variant === 'thin' ? { barWidth: 6 } : {};

        return (
            <BarChart
                {...common}
                {...width}
                xDataKey="name"
                margin={{ top: 8, right: 4, bottom: 22, left: 4 }}
                barGap={0.3}
                stacked={stacked}
                stackGap={stacked ? 2 : 0}
            >
                <Grid {...GRID_PROPS} />
                {variant === 'pattern' && (
                    <PatternLines
                        id="vq-bar-pattern"
                        height={7}
                        width={7}
                        stroke={seriesColor(0)}
                        strokeWidth={3}
                        orientation={['diagonal']}
                    />
                )}
                {list.map((s, i) => (
                    <Bar
                        key={s.key}
                        dataKey={s.key}
                        fill={variant === 'pattern' && i === 0 ? 'url(#vq-bar-pattern)' : seriesColor(i)}
                        lineCap={cap}
                    />
                ))}
                <BarXAxis maxLabels={8} />
                <ChartTooltip
                    showDatePill={false}
                    content={({ point }) => (
                        <TooltipContent title={String(point.name ?? '')} rows={seriesRows(point)} />
                    )}
                />
            </BarChart>
        );
    }

    /* ── Combined — columns and lines over one time axis ──────────────────
       Which series takes which role is the variant's whole job here. */
    if (chartType === 'composed') {
        const curve = curveFor('smooth');
        const thin = variant === 'thin-columns';

        /* `bar-trend` is the single-series read: the same figures as columns
           and again as their own smoothed line. Every other look needs a
           second series, which the Variant Law enforces. */
        const roleOf = (i) => {
            if (variant === 'bar-trend') return i === 0 ? 'bar' : 'line';
            if (variant === 'bar-two-lines') return i === 0 ? 'bar' : 'line';
            if (variant === 'area-bar') return i === 0 ? 'area' : 'bar';
            if (variant === 'stacked-line') return i < 2 ? 'bar' : 'line';
            return i === 0 ? 'bar' : i === 1 ? 'area' : 'line';
        };

        /* Areas wash underneath, bars sit on them, lines read on top —
           otherwise a later area fill paints over earlier columns. */
        const Z = { area: 0, bar: 1, line: 2 };
        const ordered = list
            .map((s, i) => ({ s, i }))
            .sort((a, b) => Z[roleOf(a.i)] - Z[roleOf(b.i)]);

        return (
            <ComposedChart
                {...common}
                xDataKey="date"
                aspectRatio="2 / 1"
                barGap={0}
                margin={{ top: 8, right: 8, bottom: realDates ? 40 : 8, left: 8 }}
                maxBarSize={thin ? 10 : 32}
            >
                <Grid horizontal />
                {variant === 'pattern' && (
                    <PatternLines
                        id="vq-composed-pattern"
                        height={7}
                        width={7}
                        stroke={seriesColor(1)}
                        strokeWidth={3}
                        orientation={['diagonal']}
                    />
                )}
                {ordered.map(({ s, i }) => {
                    const role = roleOf(i);
                    if (role === 'bar') {
                        return (
                            <SeriesBar
                                key={s.key}
                                dataKey={s.key}
                                fill={variant === 'pattern' && i === 1
                                    ? 'url(#vq-composed-pattern)'
                                    : (i === 1 ? 'var(--chart-3)' : seriesColor(i))}
                                radius={thin ? 2 : 4}
                            />
                        );
                    }
                    if (role === 'area') {
                        return (
                            <Area
                                key={s.key}
                                dataKey={s.key}
                                curve={curveCatmullRom.alpha(0.42)}
                                fill={i === 0 ? 'var(--chart-4)' : seriesColor(i)}
                                stroke={i === 0 ? 'var(--chart-4)' : seriesColor(i)}
                                fillOpacity={0.32}
                                gradientToOpacity={0}
                                strokeWidth={2}
                            />
                        );
                    }
                    return (
                        <Line
                            key={s.key}
                            dataKey={s.key}
                            curve={curveCatmullRom.alpha(0.42)}
                            stroke={i === 2 ? 'var(--chart-1)' : seriesColor(i)}
                            strokeWidth={2.5}
                        />
                    );
                })}
                {/* One series drawn twice: columns for the level, a line for
                    the direction. Only meaningful on its own. */}
                {variant === 'bar-trend' && list.length === 1 && (
                    <Line
                        dataKey={list[0].key}
                        curve={curveCatmullRom.alpha(0.42)}
                        stroke="var(--chart-1)"
                        strokeWidth={2.5}
                    />
                )}
                {realDates ? <XAxis numTicks={8} /> : null}
                <YAxis formatValue={axisFormatter()} numTicks={4} />
                <ChartTooltip showCrosshair={false} rows={seriesRows} />
            </ComposedChart>
        );
    }

    /* ── Profit and loss — a signed line with zero drawn ──────────────────
       Polarity has to be visible as a position, not only as a colour: the
       highlighted zero row is what makes "below the line" mean something to a
       reader who cannot separate the red from the green. The sign is also on
       the card's own figure, in parentheses. */
    if (chartType === 'profit_loss_line') {
        const zeroGrid = (
            <Grid
                {...GRID_PROPS}
                highlightRowValues={[0]}
                highlightRowStroke="var(--vq-chart-axis)"
                highlightRowStrokeDasharray="0"
            />
        );

        /* Diverging columns read the sign as mass rather than position. */
        if (variant === 'bars') {
            return (
                <ComposedChart {...common} xDataKey="date" margin={plotMargin}>
                    {zeroGrid}
                    {list.map((s, i) => (
                        <SeriesBar key={s.key} dataKey={s.key} fill={seriesColor(i)} radius={3} />
                    ))}
                    {xAxis}
                    <YAxis formatValue={axisFormatter()} numTicks={4} />
                    {tooltip}
                </ComposedChart>
            );
        }

        return (
            <LineChart {...common} xDataKey="date" margin={plotMargin}>
                {zeroGrid}
                {list.map((s, i) => (
                    <Line
                        key={s.key}
                        dataKey={s.key}
                        curve={curveFor('smooth')}
                        stroke={seriesColor(i)}
                        strokeWidth={2.5}
                        /* `line` strips the wash back to the stroke and its
                           points; `split` keeps the filled read. */
                        showMarkers={variant === 'line' && rows.length <= 14}
                    />
                ))}
                {xAxis}
                <YAxis formatValue={axisFormatter()} numTicks={4} />
                {tooltip}
            </LineChart>
        );
    }

    /* ── Area — a wash under the stroke ───────────────────────────────── */
    if (chartType === 'area') {
        const curve = curveFor(variant === 'step' ? 'step' : 'smooth');
        const solid = variant === 'solid';
        const bare = variant === 'nofill';
        const pattern = variant === 'pattern';

        return (
            <AreaChart {...common} xDataKey="date" margin={plotMargin}>
                <Grid {...GRID_PROPS} />
                {pattern && (
                    <PatternLines
                        id="vq-area-pattern"
                        height={7}
                        width={7}
                        stroke={seriesColor(0)}
                        strokeWidth={3}
                        orientation={['diagonal']}
                    />
                )}
                {pattern && (
                    <PatternArea dataKey={list[0].key} fill="url(#vq-area-pattern)" curve={curve} />
                )}
                {list.map((s, i) => (
                    <Area
                        key={s.key}
                        dataKey={s.key}
                        curve={curve}
                        fill={seriesColor(i)}
                        stroke={seriesColor(i)}
                        /* Pattern draws its own fill above; this Area is then
                           only the stroke over it. */
                        fillOpacity={bare || (pattern && i === 0) ? 0 : (solid ? 0.4 : 0.22)}
                        gradientToOpacity={solid ? 0.28 : 0}
                        strokeWidth={2}
                    />
                ))}
                {xAxis}
                <YAxis formatValue={axisFormatter()} numTicks={4} />
                {tooltip}
            </AreaChart>
        );
    }

    /* ── Line — the default, and `live_line` and `scatter` fall back to it
       because neither is legal for any Reckoner shape; they exist only so a
       card already holding one still renders. ────────────────────────────── */
    const curve = curveFor(variant === 'step' ? 'step' : variant === 'linear' ? 'linear' : 'smooth');
    const heavy = variant === 'thick';

    return (
        <LineChart {...common} xDataKey="date" margin={plotMargin}>
            <Grid {...GRID_PROPS} />
            {list.map((s, i) => (
                <Line
                    key={s.key}
                    dataKey={s.key}
                    curve={curve}
                    stroke={seriesColor(i)}
                    strokeWidth={heavy ? 3.5 : 2.5}
                    /* A dashed tail says "this part is projection, or the
                       window is still filling" without a second colour. */
                    dashArray={variant === 'dashtail' ? '6 5' : undefined}
                    dashFromIndex={variant === 'dashtail'
                        ? Math.max(0, rows.length - 4)
                        : undefined}
                    showMarkers={variant === 'dots' || rows.length <= 12}
                />
            ))}
            {xAxis}
            <YAxis formatValue={axisFormatter()} numTicks={4} />
            {tooltip}
        </LineChart>
    );
}

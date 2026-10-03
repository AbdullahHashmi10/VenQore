import React, { useId, useMemo, useState } from 'react';
import { curveLinear, curveMonotoneX, curveStepAfter } from '@visx/curve';

import { AreaChart } from '@/Components/Charts/area-chart';
import { Area } from '@/Components/Charts/area';
import { LineChart } from '@/Components/Charts/line-chart';
import { Line } from '@/Components/Charts/line';
import { ComposedChart } from '@/Components/Charts/composed-chart';
import { SeriesBar } from '@/Components/Charts/series-bar';
import { BarChart } from '@/Components/Charts/bar-chart';
import { Bar } from '@/Components/Charts/bar';
import { BarXAxis } from '@/Components/Charts/bar-x-axis';
import { BarYAxis } from '@/Components/Charts/bar-y-axis';
import { Grid } from '@/Components/Charts/grid';
import { XAxis } from '@/Components/Charts/x-axis';
import { YAxis } from '@/Components/Charts/y-axis';
import { ChartTooltip } from '@/Components/Charts/tooltip';
import { PatternArea } from '@/Components/Charts/pattern-area';
import { PatternLines } from '@/Components/Charts/visx-pattern';
import { Gauge } from '@/Components/Charts/gauge';
import { RingChart } from '@/Components/Charts/ring-chart';
import { Ring } from '@/Components/Charts/ring';
import { RingCenter } from '@/Components/Charts/ring-center';
import { PieChart } from '@/Components/Charts/pie-chart';
import { PieSlice } from '@/Components/Charts/pie-slice';
import { PieCenter } from '@/Components/Charts/pie-center';
import { RadarChart } from '@/Components/Charts/radar-chart';
import { RadarArea } from '@/Components/Charts/radar-area';
import { RadarGrid } from '@/Components/Charts/radar-grid';
import { RadarAxis } from '@/Components/Charts/radar-axis';
import { RadarLabels } from '@/Components/Charts/radar-labels';
import { AreaChartLoading } from '@/Components/Charts/area-chart-loading';
import { LineChartLoading } from '@/Components/Charts/line-chart-loading';
import { BarChartLoading } from '@/Components/Charts/bar-chart-loading';

import { formatValue, formatDelta } from './envelope';

/* ══════════════════════════════════════════════════════════════════════════
   CardChart — the plot area of a dashboard card.

   One renderer per family, all built on the vendored BKLIT components so
   hover crosshairs, tooltips, legend dimming and enter animations behave the
   same on every card. The board and the editor preview both mount this
   component with the same props, so what the editor shows is what the board
   shows.

   Props
     card    { family, variant, legend, goal:{target}, link }
     series  [{ env, label, key }]  — primary first, then compared readings
     width / height — the measured plot box in CSS pixels
     enter   — play the entry animation (false on re-mounts of the same card)
     reduced — prefers-reduced-motion
   ══════════════════════════════════════════════════════════════════════════ */

const PALETTE = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)',
  'var(--vq-series-5)', 'var(--vq-series-6)', 'var(--vq-series-7)', 'var(--vq-series-8)'];
export const seriesColor = (i) => PALETTE[i] ?? 'var(--vq-text-3)';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function bucketLabel(date, grain) {
  if (!(date instanceof Date)) return String(date);
  if (grain === 'month') return `${MONTHS[date.getMonth()]} ${String(date.getFullYear()).slice(2)}`;
  if (grain === 'hour') return `${String(date.getHours()).padStart(2, '0')}:00`;
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

function motionProps(enter, reduced) {
  const on = enter && !reduced;
  return {
    animate: on,
    duration: on ? 520 : 0,
    transition: on ? { type: 'tween', duration: 0.52, ease: [0.22, 1, 0.36, 1] } : { duration: 0 },
  };
}

/* ── shared states ─────────────────────────────────────────────────────── */

const STATE_COPY = {
  loading: ['Loading', ''],
  forbidden: ['Access restricted', 'You do not have permission to see this reading.'],
  locked: ['Module not active', 'Enable this feature in Settings to see it here.'],
  unavailable: ['Not available yet', ''],
  reconciling: ['Being verified', 'This figure is held back until it matches your accounts.'],
  error: ['Could not load', ''],
  empty: ['No activity in this period', 'A verified empty result — nothing was recorded.'],
  idle: ['Waiting for data', ''],
};

export function CardState({ state, message, family, height, reduced, compact }) {
  if (state === 'loading') return <LoadingPlot family={family} height={height} reduced={reduced} />;
  const [title, fallback] = STATE_COPY[state] || ['Unavailable', ''];
  return (
    <div className={`vqcc-state is-${state} ${compact ? 'is-compact' : ''}`} role="status">
      <span className="vqcc-state-ic" aria-hidden="true">
        {state === 'locked' || state === 'forbidden'
          ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
          : state === 'empty'
            ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7" /><path d="M10 12h4" /></svg>
            : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>}
      </span>
      <b>{title}</b>
      {!compact && (message || fallback) ? <span>{message || fallback}</span> : null}
    </div>
  );
}

function LoadingPlot({ family, height, reduced }) {
  const shared = { className: 'h-full', aspectRatio: 'auto', margin: { top: 8, right: 8, bottom: 8, left: 8 } };
  let plot;
  if (reduced) plot = <div className="vqcc-skeleton"><span /><span /><span /></div>;
  else if (family === 'bar' || family === 'composed' || family === 'records') plot = <BarChartLoading {...shared} />;
  else if (family === 'line') plot = <LineChartLoading {...shared} label="" loadingStyle="pulse" />;
  else if (family === 'area') plot = <AreaChartLoading {...shared} label="" loadingStyle="sweep" />;
  else plot = <div className="vqcc-skeleton is-round"><span /></div>;
  return <div className="vqcc-loading" style={{ height }} role="status" aria-label="Loading">{plot}</div>;
}

/* ── the dispatcher ────────────────────────────────────────────────────── */

export default function CardChart({ card, series, width, height, enter = true, reduced = false, currency = 'Rs' }) {
  const primary = series?.[0]?.env;
  if (!primary || width < 40 || height < 24) return null;

  const family = card.family;
  const compact = height < 90 || width < 180;
  if (primary.state !== 'ready') {
    return <CardState state={primary.state} message={primary.message} family={family}
      height={height} reduced={reduced} compact={compact} />;
  }

  const common = { card, series, width, height, enter, reduced, currency };
  switch (family) {
    case 'area':
    case 'line': return <TimePlot {...common} />;
    case 'composed': return <ComposedPlot {...common} />;
    case 'bar': return <BarPlot {...common} />;
    case 'pie': return <PiePlot {...common} />;
    case 'ring': return <RingPlot {...common} />;
    case 'gauge': return <GaugePlot {...common} />;
    case 'radar': return <RadarPlot {...common} />;
    case 'heatmap': return <HeatmapPlot {...common} />;
    case 'records': return <RecordsPlot {...common} />;
    case 'status': return <StatusPlot {...common} />;
    case 'number': return <NumberPlot {...common} />;
    default: return null;
  }
}

/* ── time series: area / line ──────────────────────────────────────────── */

function useAxisMargins(width, unit, currency) {
  const small = width < 340;
  const left = unit === 'currency' ? (small ? 46 : 54) : (small ? 34 : 42);
  return { top: 14, right: 14, bottom: 26, left, small };
}

function curveOf(variant) {
  if (variant === 'step') return curveStepAfter;
  if (variant === 'straight') return curveLinear;
  return curveMonotoneX;
}

function needsMore(env, family) {
  const n = env.series?.length || 0;
  if (n >= 2) return null;
  return n === 1
    ? 'Only one reading in this period so far — the trend appears from the second bucket. Try a longer period.'
    : `This reading has no time history to draw as a ${family === 'bar' ? 'column' : family} chart.`;
}

function TimePlot({ card, series, width, height, enter, reduced, currency }) {
  const uid = useId().replace(/:/g, '');
  const env = series[0].env;
  const sparse = needsMore(env, card.family);
  const unit = env.unit;
  const m = useAxisMargins(width, unit, currency);
  const mo = motionProps(enter, reduced);

  const data = useMemo(() => mergeSeries(series), [series]);
  if (sparse) return <CardState state="empty" message={sparse} height={height} compact={height < 90} />;

  const v = card.variant;
  const curve = curveOf(v);
  const keys = series.map((_, i) => `s${i}`);
  const fmtFull = (x) => formatValue(x, unit, { currency });
  const fmtShort = (x) => formatValue(x, unit, { currency, compact: true });
  const C = card.family === 'area' ? AreaChart : LineChart;
  const showLegend = series.length > 1 && height >= 140;
  const plotH = showLegend ? height - 26 : height;
  const fewPoints = data.length <= 4;
  const dashFrom = v === 'dashed-tail' && data.length > 2 ? data.length - 2 : undefined;

  return (
    <div className="vqcc-plot" style={{ height }}>
      <div style={{ height: plotH }}>
        <C data={data} className="h-full" aspectRatio="auto" margin={m}
          animationDuration={mo.duration} enterTransition={mo.transition}>
          <Grid horizontal vertical={false} strokeDasharray="3 5" numTicksRows={plotH < 140 ? 3 : 4} />
          {card.family === 'area' && v === 'pattern' && (
            <PatternLines id={`p${uid}`} height={7} width={7} stroke={seriesColor(0)} strokeWidth={1} orientation={['diagonal']} />
          )}
          {card.family === 'area' && v === 'pattern' && (
            <PatternArea dataKey="s0" fill={`url(#p${uid})`} curve={curve} />
          )}
          {keys.map((k, i) => card.family === 'area'
            ? <Area key={k} dataKey={k} fill={seriesColor(i)} stroke={seriesColor(i)}
                fillOpacity={v === 'pattern' ? 0 : (v === 'soft' ? 0.22 : 0.34)} gradientToOpacity={0.02}
                showLine={v !== 'soft'} fadeEdges={v === 'fade'} curve={curve}
                showMarkers={v === 'markers' || fewPoints} animate={mo.animate} />
            : <Line key={k} dataKey={k} stroke={seriesColor(i)} strokeWidth={2.25} curve={curve}
                showMarkers={v === 'markers' || fewPoints} dashFromIndex={i === 0 ? dashFrom : undefined}
                animate={mo.animate} />)}
          <XAxis numTicks={m.small ? 3 : 5} />
          <YAxis numTicks={plotH < 140 ? 3 : 4} formatValue={fmtShort} />
          <ChartTooltip dotVariant="ring"
            rows={(p) => keys.map((k, i) => ({ label: series[i].label, value: fmtFull(p[k]), color: seriesColor(i) }))} />
        </C>
      </div>
      {showLegend && <InlineLegend items={series.map((s, i) => ({ label: s.label, color: seriesColor(i) }))} />}
      {dashFrom !== undefined && height >= 160 && (
        <p className="vqcc-foot">Dashed: the current bucket is still open.</p>
      )}
    </div>
  );
}

/** Align several envelopes on their dates → [{date, s0, s1, …}]. */
export function mergeSeries(series) {
  const map = new Map();
  series.forEach((s, i) => {
    (s.env.series || []).forEach(p => {
      const k = p.date.getTime();
      if (!map.has(k)) map.set(k, { date: p.date });
      map.get(k)[`s${i}`] = p.value ?? 0;
    });
  });
  const rows = [...map.values()].sort((a, b) => a.date - b.date);
  rows.forEach(r => series.forEach((_, i) => { if (r[`s${i}`] === undefined) r[`s${i}`] = 0; }));
  return rows;
}

function InlineLegend({ items, hover, onHover }) {
  return (
    <div className="vqcc-inline-legend">
      {items.map((it, i) => (
        <button type="button" key={it.label + i}
          className={hover != null && hover !== i ? 'is-dim' : ''}
          onMouseEnter={() => onHover?.(i)} onMouseLeave={() => onHover?.(null)}
          onFocus={() => onHover?.(i)} onBlur={() => onHover?.(null)}>
          <i style={{ background: it.color }} />{it.label}
        </button>
      ))}
    </div>
  );
}

/* ── composed ──────────────────────────────────────────────────────────── */

function ComposedPlot({ card, series, width, height, enter, reduced, currency }) {
  const env = series[0].env;
  const sparse = needsMore(env, 'composed');
  const m = useAxisMargins(width, env.unit, currency);
  const mo = motionProps(enter, reduced);
  const data = useMemo(() => mergeSeries(series), [series]);
  if (series.length < 2) return <CardState state="empty" message="A combo chart compares two readings — add a second reading in the editor." height={height} />;
  if (sparse) return <CardState state="empty" message={sparse} height={height} />;
  const v = card.variant;
  const keys = series.map((_, i) => `s${i}`);
  const fmtFull = (x) => formatValue(x, env.unit, { currency });
  const plotH = height - 26;
  const barKeys = v === 'columns-line' ? [keys[0]] : keys;
  const lineKeys = v === 'columns-line' ? keys.slice(1) : [];
  return (
    <div className="vqcc-plot" style={{ height }}>
      <div style={{ height: plotH }}>
        <ComposedChart data={data} className="h-full" aspectRatio="auto" margin={m}
          stacked={v === 'stacked'} barGap={3}
          animationDuration={mo.duration} enterTransition={mo.transition}>
          <Grid horizontal vertical={false} strokeDasharray="3 5" numTicksRows={3} />
          {barKeys.map(k => <SeriesBar key={k} dataKey={k} fill={seriesColor(keys.indexOf(k))} radius={3} animate={mo.animate} />)}
          {lineKeys.map(k => <Line key={k} dataKey={k} stroke={seriesColor(keys.indexOf(k))} strokeWidth={2.25} curve={curveMonotoneX} animate={mo.animate} />)}
          <XAxis numTicks={m.small ? 3 : 5} />
          <YAxis numTicks={3} formatValue={(x) => formatValue(x, env.unit, { currency, compact: true })} />
          <ChartTooltip dotVariant="ring"
            rows={(p) => keys.map((k, i) => ({ label: series[i].label, value: fmtFull(p[k]), color: seriesColor(i) }))} />
        </ComposedChart>
      </div>
      <InlineLegend items={series.map((s, i) => ({ label: s.label, color: seriesColor(i) }))} />
    </div>
  );
}

/* ── bars: time buckets, or categories ─────────────────────────────────── */

const MAX_BARS = 12;

function BarPlot({ card, series, width, height, enter, reduced, currency }) {
  const uid = useId().replace(/:/g, '');
  const env = series[0].env;
  const mo = motionProps(enter, reduced);
  const v = card.variant;
  const horizontal = v === 'horizontal';

  const { data, note } = useMemo(() => {
    if (env.parts && env.parts.length) {
      const sorted = [...env.parts].sort((a, b) => b.value - a.value);
      const roomRows = horizontal ? Math.max(2, Math.floor((height - 28) / 30)) : Math.max(2, Math.floor(width / 64));
      const cap = Math.min(MAX_BARS, roomRows);
      const shown = sorted.slice(0, cap);
      return {
        data: shown.map(p => ({ name: p.label, value: p.value })),
        note: sorted.length > shown.length ? `Top ${shown.length} of ${sorted.length}` : '',
      };
    }
    if (env.series && env.series.length) {
      const pts = env.series;
      const cap = Math.max(4, Math.min(31, Math.floor(width / 18)));
      const shown = pts.slice(-cap);
      return {
        data: shown.map(p => ({ name: bucketLabel(p.date, env.grain), value: p.value ?? 0 })),
        note: pts.length > shown.length ? `Last ${shown.length} of ${pts.length}` : '',
      };
    }
    return { data: [], note: '' };
  }, [env, width, height, horizontal]);

  if (!data.length) return <CardState state="empty" message="Nothing to compare in this period." height={height} />;

  const fmtFull = (x) => formatValue(x, env.unit, { currency });
  const fmtShort = (x) => formatValue(x, env.unit, { currency, compact: true });
  const longest = Math.max(...data.map(d => String(d.name).length));
  const left = horizontal ? Math.min(Math.round(width * 0.38), Math.max(56, longest * 6.4 + 10)) : (width < 340 ? 44 : 52);
  const plotH = note ? height - 20 : height;
  return (
    <div className="vqcc-plot" style={{ height }}>
      <div style={{ height: plotH }}>
        <BarChart data={data} xDataKey="name" className="h-full" aspectRatio="auto"
          orientation={horizontal ? 'horizontal' : 'vertical'}
          margin={{ top: 12, right: horizontal ? 18 : 12, bottom: horizontal ? 8 : 28, left }}
          animationDuration={mo.duration} enterTransition={mo.transition}>
          <Grid horizontal={!horizontal} vertical={horizontal} strokeDasharray="3 5" numTicksRows={3} numTicksColumns={3} />
          {v === 'pattern' && <PatternLines id={`b${uid}`} width={7} height={7} stroke={seriesColor(0)} strokeWidth={2} orientation={['diagonal']} />}
          <Bar dataKey="value" fill={v === 'pattern' ? `url(#b${uid})` : seriesColor(0)} stroke={seriesColor(0)}
            lineCap={v === 'square' ? 'butt' : 'round'} animate={mo.animate} />
          {horizontal ? <BarYAxis maxLabels={data.length} /> : <><BarXAxis maxLabels={Math.max(3, Math.floor(width / 70))} /><YAxis numTicks={3} formatValue={fmtShort} /></>}
          <ChartTooltip showDatePill={false}
            rows={(p) => [{ label: String(p.name), value: fmtFull(p.value), color: seriesColor(0) }]} />
        </BarChart>
      </div>
      {note && <p className="vqcc-foot">{note}</p>}
    </div>
  );
}

/* ── pie / donut ───────────────────────────────────────────────────────── */

const MAX_SLICES = 6;

export function foldParts(parts, max = MAX_SLICES) {
  const sorted = [...parts].filter(p => p.value > 0).sort((a, b) => b.value - a.value);
  if (sorted.length <= max) return sorted;
  const head = sorted.slice(0, max - 1);
  const rest = sorted.slice(max - 1).reduce((a, p) => a + p.value, 0);
  return [...head, { label: `Other (${sorted.length - max + 1})`, value: rest }];
}

function legendLayout(width, height, count, wantLegend) {
  if (!wantLegend || count === 0) return { mode: 'none', dial: Math.min(width, height) };
  const side = width >= 340 && width >= height * 1.25;
  if (side) return { mode: 'side', dial: Math.min(height, width * 0.5) };
  const rows = Math.min(count, Math.floor((height * 0.38) / 24));
  if (rows < 2) return { mode: 'none', dial: Math.min(width, height) };
  return { mode: 'below', dial: Math.min(width, height - rows * 24 - 8), rows };
}

function PiePlot({ card, series, width, height, enter, reduced, currency }) {
  const uid = useId().replace(/:/g, '');
  const env = series[0].env;
  const mo = motionProps(enter, reduced);
  const [hover, setHover] = useState(null);
  const parts = useMemo(() => foldParts(env.parts || []), [env]);
  if ((env.parts || []).some(p => p.value < 0)) {
    return <CardState state="empty" message="Some values are negative, so they cannot be slices of one whole. Show this as bars instead." height={height} />;
  }
  if (!parts.length) return <CardState state="empty" message="Nothing to divide up in this period." height={height} />;
  const v = card.variant;
  const lay = legendLayout(width, height, parts.length, card.legend !== false);
  const size = Math.max(90, Math.floor(lay.dial - 4));
  const donut = v !== 'solid';
  const data = parts.map((p, i) => ({ label: p.label, value: p.value, color: seriesColor(i) }));
  const total = parts.reduce((a, p) => a + p.value, 0);
  const legend = lay.mode !== 'none' && (
    <ValueLegend items={data.slice(0, lay.mode === 'below' ? lay.rows : data.length)} total={total}
      unit={env.unit} currency={currency} hover={hover} onHover={setHover} />
  );
  return (
    <div className={`vqcc-radial is-${lay.mode}`} style={{ height }}>
      <div className="vqcc-dial" style={{ width: size, height: v === 'half' ? size / 2 + 12 : size }}>
        <PieChart data={data} size={size} innerRadius={donut ? size * 0.3 : 0} padAngle={0.03} cornerRadius={4}
          hoveredIndex={hover} onHoverChange={setHover}
          startAngle={v === 'half' ? -Math.PI / 2 : 0} endAngle={v === 'half' ? Math.PI / 2 : Math.PI * 2}          enterTransition={mo.transition} enterStaggerScale={mo.animate ? 1 : 0}>
          {v === 'pattern' && <PatternLines id={`s${uid}`} width={8} height={8} stroke={seriesColor(0)} strokeWidth={2} orientation={['diagonal']} />}
          {data.map((d, i) => (
            <PieSlice key={d.label} index={i} animate={mo.animate}
              fill={v === 'pattern' && i === 0 ? `url(#s${uid})` : undefined}
              hoverEffect={v === 'grow' ? 'grow' : 'translate'} />
          ))}
          {donut && size >= 120 && (
            <PieCenter className="vqcc-center" valueClassName="vqcc-center-value" labelClassName="vqcc-center-label"
              defaultLabel="Total" prefix={env.unit === 'currency' ? `${currency} ` : ''}
              formatOptions={{ notation: 'compact', maximumFractionDigits: 1 }} />
          )}
        </PieChart>
      </div>
      {legend}
    </div>
  );
}

function ValueLegend({ items, total, unit, currency, hover, onHover, progress }) {
  return (
    <div className="vqcc-legend" role="list">
      {items.map((d, i) => {
        const pct = progress ? (d.maxValue > 0 ? (d.value / d.maxValue) * 100 : null)
          : (total > 0 ? (d.value / total) * 100 : null);
        return (
          <button type="button" role="listitem" key={d.label + i}
            className={`vqcc-legend-row ${hover != null && hover !== i ? 'is-dim' : ''}`}
            onMouseEnter={() => onHover?.(i)} onMouseLeave={() => onHover?.(null)}
            onFocus={() => onHover?.(i)} onBlur={() => onHover?.(null)}
            title={`${d.label}: ${formatValue(d.value, unit, { currency })}`}>
            <i style={{ background: d.color }} />
            <span className="vqcc-legend-label">{d.label}</span>
            <strong>{formatValue(d.value, unit, { currency, compact: true })}</strong>
            {pct !== null && <small>{pct >= 10 ? Math.round(pct) : pct.toFixed(1)}%</small>}
          </button>
        );
      })}
    </div>
  );
}

/* ── ring (progress toward a goal) ─────────────────────────────────────── */

export function goalOf(card, env) {
  const target = Number(card.goal?.target);
  if (Number.isFinite(target) && target > 0) return { target, kind: 'goal' };
  if (env.unit === 'percent') return { target: 100, kind: 'percent' };
  return null;
}

function RingPlot({ card, series, width, height, enter, reduced, currency }) {
  const env = series[0].env;
  const mo = motionProps(enter, reduced);
  const [hover, setHover] = useState(null);
  const goal = goalOf(card, env);
  if (!goal) return <CardState state="empty" message="Set a goal for this card to show progress toward it." height={height} />;
  if (env.value === null) return <CardState state="empty" message="No value in this period." height={height} />;
  const v = card.variant;
  const half = v === 'half', tq = v === 'three-quarter';
  const avail = Math.min(width, half ? height * 2 - 24 : height - (card.legend ? 0 : 4));
  const size = Math.max(96, Math.floor(avail));
  const label = goal.kind === 'goal' ? 'of goal' : '';
  const data = [{ label: series[0].label || 'Actual', value: Math.max(0, env.value), maxValue: goal.target, color: seriesColor(0) }];
  const pct = goal.target > 0 ? (env.value / goal.target) * 100 : 0;
  /* 0 rad is twelve o'clock, clockwise: half is a rainbow, three-quarter
     leaves its gap at the bottom, full starts at the top. */
  const [startAngle, endAngle] = half ? [-Math.PI / 2, Math.PI / 2]
    : tq ? [-Math.PI * 0.75, Math.PI * 0.75] : [0, Math.PI * 2];
  return (
    <div className="vqcc-radial is-ring" style={{ height }}>
      <div className="vqcc-dial" style={{ width: size, height: half ? size / 2 + 18 : size }}>
        <RingChart data={data} size={size} strokeWidth={Math.max(10, Math.round(size * 0.085))} ringGap={6}
          baseInnerRadius={size * 0.3} startAngle={startAngle} endAngle={endAngle}
          hoveredIndex={hover} onHoverChange={setHover}
          enterTransition={mo.transition} enterStaggerScale={mo.animate ? 1 : 0}>
          <Ring index={0} animate={mo.animate} lineCap={v === 'butt' ? 'butt' : 'round'} />
          <RingCenter className="vqcc-center" valueClassName="vqcc-center-value" labelClassName="vqcc-center-label"
            defaultLabel={label || 'Now'} prefix={env.unit === 'currency' ? `${currency} ` : ''}
            suffix={env.unit === 'percent' ? '%' : ''}
            formatOptions={{ notation: 'compact', maximumFractionDigits: 1 }} />
        </RingChart>
      </div>
      <p className="vqcc-goal-line">
        <strong>{Math.round(pct)}%</strong>
        {goal.kind === 'goal'
          ? <> of {formatValue(goal.target, env.unit, { currency, compact: true })} · {pct >= 100
              ? `${formatValue(env.value - goal.target, env.unit, { currency, compact: true })} above goal`
              : `${formatValue(goal.target - env.value, env.unit, { currency, compact: true })} to go`}</>
          : null}
      </p>
    </div>
  );
}

/* ── gauge ─────────────────────────────────────────────────────────────── */

function GaugePlot({ card, series, width, height, enter, reduced, currency }) {
  const env = series[0].env;
  const mo = motionProps(enter, reduced);
  const goal = goalOf(card, env);
  if (!goal) return <CardState state="empty" message="Set a goal for this card to place it on a scale." height={height} />;
  if (env.value === null) return <CardState state="empty" message="No value in this period." height={height} />;
  const v = card.variant;
  const pct = goal.target > 0 ? (env.value / goal.target) * 100 : 0;
  const shown = Math.max(0, Math.min(100, pct));
  const linear = v === 'linear';
  const gh = linear ? Math.min(110, height - 22) : Math.min(height - 22, width * 0.62);
  return (
    <div className="vqcc-radial is-gauge" style={{ height }}>
      <Gauge orientation={linear ? 'linear' : 'arc'} value={shown} centerValue={Math.round(pct)} suffix="%"
        defaultLabel={goal.kind === 'goal' ? 'of goal' : ''} height={Math.max(70, gh)} width={Math.max(120, width - 8)}
        totalNotches={v === 'dense' ? 90 : 48} useGradient={v === 'gradient'}
        activeGradient={['var(--chart-1)', 'var(--chart-2)']} activeFill="var(--chart-1)"
        inactiveFill="var(--chart-segment-background, var(--vq-sunken))"
        enterTransition={mo.transition} enterStaggerScale={mo.animate ? 1 : 0} />
      {goal.kind === 'goal' && height >= 120 && (
        <p className="vqcc-goal-line">
          {formatValue(env.value, env.unit, { currency, compact: true })} of {formatValue(goal.target, env.unit, { currency, compact: true })}
          {pct > 100 ? ' · above goal' : ''}
        </p>
      )}
    </div>
  );
}

/* ── radar ─────────────────────────────────────────────────────────────── */

function RadarPlot({ card, series, width, height, enter, reduced }) {
  const env = series[0].env;
  const mo = motionProps(enter, reduced);
  const parts = useMemo(() => foldParts(env.parts || [], 8), [env]);
  if (parts.length < 3) return <CardState state="empty" message="A radar needs at least three categories with values." height={height} />;
  const max = Math.max(...parts.map(p => Math.abs(p.value))) || 1;
  const metrics = parts.map((p, i) => ({ key: `m${i}`, label: p.label }));
  const data = [{ label: series[0].label, color: seriesColor(0),
    values: Object.fromEntries(parts.map((p, i) => [`m${i}`, Math.round((Math.max(0, p.value) / max) * 100)])) }];
  const size = Math.max(120, Math.min(width, height) - 4);
  const v = card.variant;
  return (
    <div className="vqcc-radial" style={{ height }}>
      <RadarChart data={data} metrics={metrics} size={size} margin={Math.min(56, size * 0.2)} animate={mo.animate} enterTransition={mo.transition}>
        <RadarGrid />
        <RadarAxis />
        <RadarArea index={0} color={seriesColor(0)} showPoints={v === 'points'} showGlow={false}
          className={v === 'outline' ? 'vqcc-radar-outline' : ''} />
        <RadarLabels offset={14} fontSize={11} />
      </RadarChart>
    </div>
  );
}

/* ── heatmap (weekday × hour) ──────────────────────────────────────────── */

function HeatmapPlot({ card, series, width, height, currency }) {
  const env = series[0].env;
  const [hover, setHover] = useState(null);
  const m = env.matrix;
  if (!m || !m.length) return <CardState state="empty" message="No activity to map in this period." height={height} />;
  const rows = m.length, cols = Math.max(...m.map(r => r.length));
  const max = Math.max(...m.flat()) || 1;
  const gap = card.variant === 'spaced' ? 4 : 2;
  const labelW = 30, axisH = 16;
  const cell = Math.max(4, Math.min((width - labelW - gap * cols) / cols, (height - axisH - 20 - gap * rows) / rows));
  const radius = card.variant === 'square' ? 1 : Math.min(4, cell / 3);
  const rowNames = rows === 7 ? DOW : m.map((_, i) => String(i + 1));
  const level = (val) => (val <= 0 ? 0 : Math.min(4, Math.ceil((val / max) * 4)));
  return (
    <div className="vqcc-heat" style={{ height }} onMouseLeave={() => setHover(null)}>
      <svg width={labelW + cols * (cell + gap)} height={rows * (cell + gap) + axisH} role="img"
        aria-label={`${series[0].label} by ${rows === 7 ? 'weekday and hour' : 'row and column'}`}>
        {m.map((row, r) => (
          <g key={r} transform={`translate(0 ${r * (cell + gap)})`}>
            <text x={labelW - 6} y={cell / 2 + 4} textAnchor="end" className="vqcc-axis-text">{rowNames[r]}</text>
            {row.map((val, c) => (
              <rect key={c} x={labelW + c * (cell + gap)} y={0} width={cell} height={cell} rx={radius}
                className={`vqcc-heat-cell lv-${level(val)} ${hover && (hover.r !== r || hover.c !== c) ? 'is-dim' : ''}`}
                onMouseEnter={() => setHover({ r, c, val })} />
            ))}
          </g>
        ))}
        {cols === 24 && [0, 6, 12, 18].map(h => (
          <text key={h} x={labelW + h * (cell + gap)} y={rows * (cell + gap) + 12} className="vqcc-axis-text">{`${String(h).padStart(2, '0')}:00`}</text>
        ))}
      </svg>
      <p className="vqcc-foot" aria-live="polite">
        {hover
          ? `${rowNames[hover.r]} ${cols === 24 ? `${String(hover.c).padStart(2, '0')}:00` : `#${hover.c + 1}`} · ${formatValue(hover.val, env.unit, { currency })}`
          : 'Darker cells are busier'}
      </p>
    </div>
  );
}

/* ── records ───────────────────────────────────────────────────────────── */

function RecordsPlot({ card, series, width, height, currency }) {
  const env = series[0].env;
  const rows = env.rows || [];
  if (!rows.length) return <CardState state="empty" message="Nothing to list in this period." height={height} />;
  const v = card.variant;
  const rowH = v === 'feed' ? 44 : 34;
  const footH = 26;
  const fit = Math.max(1, Math.floor((height - footH) / rowH));
  const total = Math.max(env.rowCount || rows.length, rows.length);
  const shown = rows.slice(0, fit);
  const more = total - shown.length;
  const max = Math.max(...shown.map(r => Math.abs(r.amount || 0))) || 1;
  const wide = width >= 360;
  return (
    <div className="vqcc-records" style={{ height }}>
      <ol className={`vqcc-rows is-${v}`}>
        {shown.map((r, i) => (
          <li key={r.id + i} className="vqcc-row" style={{ height: rowH }} title={r.label}>
            {v === 'feed' ? <span className="vqcc-feed-dot" /> : <span className="vqcc-rank">{i + 1}</span>}
            <span className="vqcc-row-main">
              <span className="vqcc-row-label">{r.label}</span>
              {(v === 'feed' || wide) && r.sub ? <small>{String(r.sub)}</small> : null}
              {v === 'ranked' && r.amount !== null && (
                <span className="vqcc-row-bar"><i style={{ width: `${Math.max(2, (Math.abs(r.amount) / max) * 100)}%` }} /></span>
              )}
            </span>
            {r.amount !== null && <strong className="vqcc-row-val">{formatValue(r.amount, env.unit, { currency, compact: !wide })}</strong>}
          </li>
        ))}
      </ol>
      <div className="vqcc-records-foot">
        <span>{more > 0 ? `${shown.length} of ${total}` : `${total} ${total === 1 ? 'item' : 'items'}`}</span>
        {card.link && more > 0 && <a href={card.link}>View all →</a>}
      </div>
    </div>
  );
}

/* ── status ────────────────────────────────────────────────────────────── */

function StatusPlot({ series, height }) {
  const env = series[0].env;
  const ok = env.status ? env.status.ok : env.value === 1;
  return (
    <div className={`vqcc-status ${ok ? 'is-ok' : 'is-bad'}`} style={{ height }}>
      <span className="vqcc-status-chip">{ok ? 'All good' : 'Needs attention'}</span>
      {env.status?.message && height >= 70 ? <small>{env.status.message}</small> : null}
    </div>
  );
}

/* ── number interiors ──────────────────────────────────────────────────── */

function NumberPlot({ card, series, width, height, currency }) {
  const env = series[0].env;
  const v = card.variant;
  if (v === 'progress') {
    const goal = goalOf(card, env);
    if (!goal) return <p className="vqcc-note">Set a goal to show progress.</p>;
    const pct = goal.target > 0 ? ((env.value || 0) / goal.target) * 100 : 0;
    return (
      <div className="vqcc-progress" style={{ maxHeight: height }}>
        <div className="vqcc-progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100}
          aria-valuenow={Math.round(Math.min(100, pct))}>
          <i style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
        </div>
        <p>
          <strong>{Math.round(pct)}%</strong> of {formatValue(goal.target, env.unit, { currency, compact: true })}
          {height >= 44 ? (pct >= 100 ? ' · goal reached' : ` · ${formatValue(goal.target - (env.value || 0), env.unit, { currency, compact: true })} to go`) : ''}
        </p>
      </div>
    );
  }
  if (v === 'comparison') {
    if (env.previous === null) return <p className="vqcc-note">Previous period not available for comparison.</p>;
    const cur = env.value || 0, prev = env.previous;
    const max = Math.max(Math.abs(cur), Math.abs(prev)) || 1;
    const diff = cur - prev;
    if (height < 56) {
      return <p className="vqcc-note">Previous {formatValue(prev, env.unit, { currency, compact: true })} · {diff >= 0 ? '+' : '−'}{formatValue(Math.abs(diff), env.unit, { currency, compact: true })}</p>;
    }
    return (
      <div className="vqcc-compare">
        {[['This period', cur, 0], [env.compareLabel || 'Previous period', prev, 1]].map(([l, val, i]) => (
          <div key={l} className="vqcc-compare-row">
            <span>{l}</span>
            <span className="vqcc-compare-track"><i style={{ width: `${(Math.abs(val) / max) * 100}%`, background: i ? 'var(--chart-segment-background, var(--vq-line))' : seriesColor(0) }} /></span>
            <strong>{formatValue(val, env.unit, { currency, compact: width < 300 })}</strong>
          </div>
        ))}
        {env.deltaPct !== null && height >= 96 && (
          <p className="vqcc-note">{diff >= 0 ? 'Up' : 'Down'} {formatValue(Math.abs(diff), env.unit, { currency })} ({formatDelta(env.deltaPct)})</p>
        )}
      </div>
    );
  }
  return null;
}

/* ══════════════════════════════════════════════════════════════════════════
   Card presentation registry — families, variants and what each needs.

   A card is `metric × compatible family × variant`. The metric (reading key)
   never changes when the family changes; this file only decides which
   families a reading can honestly be drawn as, and why the others cannot.

   Mirrored on the server by App\Reckoner\CardPresentation, which validates
   every saved family/variant. Keep the two lists in step.
   ══════════════════════════════════════════════════════════════════════════ */

/** Every family the customer editor can offer, in display order. */
export const FAMILIES = {
  number: {
    label: 'Number',
    blurb: 'One clear figure',
    variants: [
      { id: 'value', label: 'Value' },
      { id: 'comparison', label: 'Vs last period' },
      { id: 'progress', label: 'Progress to goal' },
    ],
  },
  area: {
    label: 'Area',
    blurb: 'Volume over time',
    variants: [
      { id: 'gradient', label: 'Gradient' },
      { id: 'soft', label: 'Soft fill' },
      { id: 'step', label: 'Stepped' },
      { id: 'fade', label: 'Faded edges' },
      { id: 'pattern', label: 'Hatched' },
      { id: 'markers', label: 'With points' },
    ],
  },
  line: {
    label: 'Line',
    blurb: 'Direction over time',
    variants: [
      { id: 'smooth', label: 'Smooth' },
      { id: 'straight', label: 'Straight' },
      { id: 'step', label: 'Stepped' },
      { id: 'markers', label: 'With points' },
      { id: 'dashed-tail', label: 'Dashed today' },
    ],
  },
  bar: {
    label: 'Bars',
    blurb: 'Compare buckets or items',
    variants: [
      { id: 'vertical', label: 'Columns' },
      { id: 'horizontal', label: 'Horizontal' },
      { id: 'square', label: 'Square ends' },
      { id: 'pattern', label: 'Hatched' },
    ],
  },
  composed: {
    label: 'Combo',
    blurb: 'Two readings, one chart',
    variants: [
      { id: 'columns-line', label: 'Columns + line' },
      { id: 'grouped', label: 'Grouped' },
      { id: 'stacked', label: 'Stacked' },
    ],
  },
  pie: {
    label: 'Donut',
    blurb: 'Parts of one whole',
    variants: [
      { id: 'donut', label: 'Donut' },
      { id: 'solid', label: 'Pie' },
      { id: 'half', label: 'Half' },
      { id: 'grow', label: 'Grow on hover' },
      { id: 'pattern', label: 'Hatched lead' },
    ],
  },
  ring: {
    label: 'Ring',
    blurb: 'Progress toward a goal',
    variants: [
      { id: 'full', label: 'Full' },
      { id: 'three-quarter', label: 'Three-quarter' },
      { id: 'half', label: 'Half' },
      { id: 'butt', label: 'Flat ends' },
    ],
  },
  gauge: {
    label: 'Gauge',
    blurb: 'Where it sits on a scale',
    variants: [
      { id: 'arc', label: 'Arc' },
      { id: 'gradient', label: 'Gradient arc' },
      { id: 'dense', label: 'Fine notches' },
      { id: 'linear', label: 'Bar' },
    ],
  },
  radar: {
    label: 'Radar',
    blurb: 'Shape across categories',
    variants: [
      { id: 'filled', label: 'Filled' },
      { id: 'outline', label: 'Outline' },
      { id: 'points', label: 'With points' },
    ],
  },
  funnel: {
    label: 'Funnel',
    blurb: 'Ranked stages',
    variants: [
      { id: 'vertical', label: 'Vertical' },
      { id: 'horizontal', label: 'Horizontal' },
      { id: 'straight', label: 'Straight edges' },
      { id: 'gradient', label: 'Gradient' },
      { id: 'grouped-labels', label: 'Grouped labels' },
    ],
  },
  scatter: {
    label: 'Scatter',
    blurb: 'Every reading as a dot',
    variants: [
      { id: 'dots', label: 'Dots' },
      { id: 'rings', label: 'Rings' },
      { id: 'gradient', label: 'Gradient' },
    ],
  },
  sankey: {
    label: 'Sankey',
    blurb: 'Where the total flows',
    variants: [
      { id: 'gradient', label: 'Gradient' },
      { id: 'solid', label: 'Solid' },
      { id: 'no-labels', label: 'No labels' },
    ],
  },
  sunburst: {
    label: 'Sunburst',
    blurb: 'Rings of one whole',
    variants: [
      { id: 'drilldown', label: 'Drill down' },
      { id: 'labeled', label: 'Labelled' },
    ],
  },
  live: {
    label: 'Live line',
    blurb: 'Latest points, pulsing',
    variants: [
      { id: 'filled', label: 'Filled' },
      { id: 'line-only', label: 'Line only' },
      { id: 'momentum', label: 'Momentum colours' },
    ],
  },
  heatmap: {
    label: 'Heatmap',
    blurb: 'Busy and quiet times',
    variants: [
      { id: 'rounded', label: 'Rounded' },
      { id: 'square', label: 'Square' },
      { id: 'spaced', label: 'Spaced' },
    ],
  },
  records: {
    label: 'List',
    blurb: 'The rows themselves',
    variants: [
      { id: 'table', label: 'Table' },
      { id: 'ranked', label: 'Ranked bars' },
      { id: 'feed', label: 'Activity feed' },
    ],
  },
  status: {
    label: 'Status',
    blurb: 'Pass or attention',
    variants: [{ id: 'chip', label: 'Chip' }],
  },
};

export const FAMILY_ORDER = Object.keys(FAMILIES);

/* Families whose BKLIT implementation exists but which no production reading
   can feed today (no stage cohorts, paired observations, flows, hierarchy or
   genuine live stream). They live in the development showcase only. */
export const SHOWCASE_ONLY = {};

/* ── shape → data kind ─────────────────────────────────────────────────── */
const KIND_OF_SHAPE = {
  STAT: 'scalar', SCALAR: 'scalar',
  TREND: 'series', SERIES: 'series', MULTI_SERIES: 'series',
  BREAKDOWN: 'breakdown',
  LIST: 'records', RANKING: 'records', TABLE: 'records', FEED: 'records',
  GAUGE: 'gauge',
  HEATMAP: 'heatmap',
  STATUS: 'status',
};

/** The data kind a reading produces, from its catalogue shape. */
export function kindOf(reading) {
  const shape = String(reading?.shape || '').toUpperCase();
  return KIND_OF_SHAPE[shape] || 'scalar';
}

/* ── legacy chart keys → family/variant ─────────────────────────────────── */
const LEGACY_FAMILY = {
  stat: 'number', sparkline: 'area', pl: 'line', profit_loss_line: 'line',
  live_line: 'live', table: 'records', list: 'records', feed: 'records',
  ranking: 'records',
  choropleth: 'records', treemap: 'pie', trend: 'area', breakdown: 'pie',
};
const LEGACY_VARIANT = {
  area: { solid: 'soft', nofill: 'soft', stacked: 'gradient' },
  line: { linear: 'straight', dots: 'markers', dashtail: 'dashed-tail', thick: 'smooth' },
  bar: { rounded: 'vertical', thin: 'vertical', grouped: 'vertical', stacked: 'vertical', solid: 'horizontal' },
  pie: { exploded: 'grow' },
  ring: { concentric: 'full', single: 'full', thick: 'butt' },
  gauge: { notch: 'arc', full: 'arc', standard: 'arc' },
  radar: { dots: 'points' },
  records: { rows: 'table', bars: 'ranked', rank: 'ranked', dots: 'feed', live: 'feed', standard: 'table' },
  number: { number: 'value', spark: 'value', delta: 'comparison', plain: 'value' },
  heatmap: { dots: 'rounded' },
};

/** Map any stored chart/variant pair (old or new) onto a known family/variant. */
export function normalizePresentation(chart, variant) {
  let family = FAMILIES[chart] ? chart : (LEGACY_FAMILY[chart] || null);
  if (!family) return { family: null, variant: null };
  let v = variant;
  if (chart === 'feed' && family === 'records') v = 'feed';
  if (chart === 'sparkline' && family === 'area') v = 'soft';
  if (chart === 'pl' || chart === 'profit_loss_line') v = 'smooth';
  const known = FAMILIES[family].variants.map(x => x.id);
  if (!known.includes(v)) v = (LEGACY_VARIANT[family] || {})[v] || known[0];
  return { family, variant: v };
}

export function defaultVariant(family) {
  return FAMILIES[family]?.variants[0]?.id || null;
}

export function variantLabel(family, variant) {
  return FAMILIES[family]?.variants.find(v => v.id === variant)?.label || variant;
}

/* ── capability ─────────────────────────────────────────────────────────── */

/**
 * What a reading can be drawn as.
 *
 * ctx: {
 *   seriesAvailable  — the reading has (or has a companion with) a time series
 *   seriesCount      — how many series the card carries (1 + extra keys)
 *   hasGoal          — a positive target is set on the card
 *   supportsComparison — the server can compute a previous-period value
 * }
 *
 * Returns [{ family, enabled, reason, variants: [{id,label,enabled,reason}] }].
 */
export function capabilitiesFor(reading, ctx = {}) {
  const kind = kindOf(reading);
  const unit = reading?.unit || 'currency';
  const percent = unit === 'percent';
  const series = !!ctx.seriesAvailable;
  const nSeries = Math.max(1, ctx.seriesCount || 1);
  const goal = !!ctx.hasGoal;
  const comparison = ctx.supportsComparison !== false;

  const off = (reason) => ({ enabled: false, reason });
  const on = { enabled: true, reason: '' };

  const goalReason = 'Set a goal below to measure progress against it.';
  const noSeries = 'This reading only has a total for the period — there is no day-by-day history to draw.';

  const rules = {
    scalar: {
      number: on,
      area: series ? on : off(noSeries),
      line: series ? on : off(noSeries),
      bar: series ? on : off(noSeries),
      scatter: series ? on : off(noSeries),
      live: series ? on : off(noSeries),
      gauge: (percent || goal) ? on : off(goalReason),
      ring: (percent || goal) ? on : off(goalReason),
    },
    series: {
      area: on, line: on, bar: on, scatter: on, live: on,
      composed: nSeries >= 2 ? on : off('Add a second reading to compare (Data section).'),
      number: on,
      gauge: goal ? on : off(goalReason),
      ring: goal ? on : off(goalReason),
    },
    breakdown: {
      pie: unit === 'percent' ? off('Percentages of different things do not add up to one whole.') : on,
      bar: on,
      radar: on,
      funnel: on,
      sankey: on,
      sunburst: on,
      records: on,
      number: on,
    },
    records: {
      records: on,
      bar: on,
      funnel: on,
    },
    gauge: {
      gauge: on, ring: on, number: on,
    },
    heatmap: {
      heatmap: on, number: on,
    },
    status: {
      status: on,
    },
  }[kind] || { number: on };

  const variantRule = (family, id) => {
    if (family === 'number' && id === 'comparison' && !comparison)
      return off('This reading has no previous-period comparison.');
    if (family === 'number' && id === 'progress' && !goal && !percent)
      return off(goalReason);
    if (family === 'records' && id === 'ranked' && kind !== 'records' && kind !== 'breakdown')
      return off('Ranked bars need a list of items.');
    return on;
  };

  return FAMILY_ORDER
    .filter(f => rules[f])
    .map(f => ({
      family: f,
      label: FAMILIES[f].label,
      blurb: FAMILIES[f].blurb,
      ...rules[f],
      variants: FAMILIES[f].variants.map(v => ({ ...v, ...variantRule(f, v.id) })),
    }));
}

/** The family a freshly added reading should start as. */
export function defaultFamilyFor(reading, ctx = {}) {
  const kind = kindOf(reading);
  const caps = capabilitiesFor(reading, ctx).filter(c => c.enabled);
  const prefer = {
    scalar: ctx.seriesAvailable ? ['area', 'number'] : ['number'],
    series: ['area', 'line'],
    breakdown: ['pie', 'bar'],
    records: ['records'],
    gauge: ['gauge', 'ring'],
    heatmap: ['heatmap'],
    status: ['status'],
  }[kind] || ['number'];
  const fam = prefer.find(f => caps.some(c => c.family === f)) || caps[0]?.family || 'number';
  let variant = defaultVariant(fam);
  if (fam === 'number' && ctx.supportsComparison !== false) variant = 'comparison';
  if (fam === 'pie') variant = 'donut';
  return { family: fam, variant };
}

/** Is `family/variant` legal for the reading in this context? */
export function isLegal(reading, family, variant, ctx = {}) {
  const cap = capabilitiesFor(reading, ctx).find(c => c.family === family);
  if (!cap || !cap.enabled) return false;
  const v = cap.variants.find(x => x.id === variant);
  return !!(v && v.enabled);
}

/** Families that draw their own headline (no number block above the plot). */
export const SELF_LABELLED = new Set(['ring', 'gauge', 'records', 'status', 'heatmap']);
/** Families that plot time on the x axis. */
export const TIME_FAMILIES = new Set(['area', 'line', 'composed', 'scatter', 'live']);

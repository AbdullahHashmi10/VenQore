/* ══════════════════════════════════════════════════════════════════════════
   Data envelope — the one shape every card renderer reads.

   The Reckoner answers in several dialects (`data.value`, `data.series`,
   `data.points`, `data.segments`, `data.items`, `data.matrix`, top-level
   `series`/`segments`/`rows`). This adapter translates exactly what came back
   and nothing more:

   · a failed or forbidden read is never turned into 0;
   · a scalar is never padded into a fake flat history;
   · a missing bucket inside an observed flow window IS zero (no sales that
     day), and is filled only for period-aware flow readings — a balance or
     an as-of reading keeps its gaps;
   · comparison deltas are derived from a real previous value, never typed.
   ══════════════════════════════════════════════════════════════════════════ */

const num = (v) => (v === null || v === undefined || v === '' ? null : (Number.isFinite(Number(v)) ? Number(v) : null));

/** Envelope states, in the order a person should see them explained. */
export const STATES = ['loading', 'forbidden', 'locked', 'unavailable', 'reconciling', 'error', 'empty', 'idle', 'ready'];

/**
 * @param {object|null} live     the Reckoner item for this card, or null
 * @param {object}      reading  catalogue entry ({unit, shape, period_aware,…})
 * @param {object}      opts     { pending:boolean, companion: item|null }
 */
/* The server refuses to show a figure its own cross-check disputes. Say which
   two numbers disagree, in plain words, instead of a vague "will update". */
const CHECK_WORDS = {
  revenue_ties_to_ledger: ['Sales', 'ledger revenue'],
  cogs_ties_to_ledger: ['Cost of sales', 'ledger'],
  stock_value_control: ['Stock value', 'ledger stock account'],
  receivables_control: ['Customer dues', 'ledger'],
  payables_control: ['Supplier dues', 'ledger'],
  tax_control: ['Tax', 'ledger'],
  returns_tie_to_ledger: ['Returns', 'ledger'],
};
function explainDisagreement(msg) {
  const m = /^(\w+) FAILED: .*?=\s*(-?[\d.]+),.*?=\s*(-?[\d.]+),\s*Diff=\s*(-?[\d.]+)/.exec(msg || '');
  const base = 'This figure is held back until it matches your accounts.';
  if (!m) return base;
  const f = n => Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 });
  return `${base} Right now they are ${f(m[4])} apart.`;
}

export function toEnvelope(live, reading = {}, opts = {}) {
  const unit = live?.unit || reading?.unit || 'currency';
  const base = {
    state: 'idle', message: '', unit,
    precision: Number.isFinite(Number(live?.precision)) ? Number(live.precision) : (reading?.precision ?? 2),
    value: null, previous: null, deltaPct: null, compareLabel: '',
    series: null, seriesSource: null, grain: null, filled: false,
    parts: null, total: null,
    rows: null, rowCount: 0, truncated: false,
    matrix: null,
    status: null,
    numerator: null, denominator: null,
    period: live?.period || null,
    asOf: live?.asOf || live?.meta?.computed_at || null,
    freshness: live?.meta?.freshness || null,
  };

  if (!live) {
    return { ...base, state: opts.pending ? 'loading' : 'idle', message: opts.pending ? 'Loading…' : 'Waiting for data.' };
  }

  const status = String(live.status || (live.ok === false ? 'error' : 'ok'));
  const code = live.error?.code || '';
  const msg = live.error?.message || '';

  if (status === 'forbidden' || code === 'forbidden' || code === 'permission_denied') {
    return { ...base, state: 'forbidden', message: 'You do not have access to this reading.' };
  }
  if (['locked', 'plan_locked', 'module_locked'].includes(status) || code === 'plan_locked' || code === 'module_locked') {
    return { ...base, state: 'locked', message: msg || 'This module is not active for your business.' };
  }
  if (status === 'unavailable') {
    return { ...base, state: 'unavailable', message: msg || 'Not available yet.' };
  }
  if (live.ok === false || status === 'error') {
    const reconciling = code === 'books_disagree' || /Invariant failure:|_control|_ledger|FAILED:|reconcil/i.test(msg);
    return {
      ...base,
      state: reconciling ? 'reconciling' : 'error',
      message: reconciling ? explainDisagreement(msg) : (msg || 'This reading could not be loaded.'),
    };
  }

  const data = live.data;
  const ver = live.meta?.verification;
  const verification = ver && ver.status === 'mismatch' ? {
    difference: Number.isFinite(Number(ver.difference)) ? Number(ver.difference) : null,
    check: ver.check || null,
    message: ver.message || '',
  } : null;
  const d = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
  const env = { ...base, verification };

  /* ── headline value ─────────────────────────────────────────────────── */
  if (typeof data === 'number') env.value = data;
  else env.value = num(live.value) ?? num(d.value) ?? num(d.current) ?? num(d.total);

  /* ── comparison — only ever from a real previous value ─────────────── */
  const prev = num(d.previous) ?? num(d.comparison?.previous) ?? num(live.delta?.value);
  if (prev !== null) env.previous = prev;
  if (env.value !== null && prev !== null && prev !== 0) {
    env.deltaPct = ((env.value - prev) / Math.abs(prev)) * 100;
  } else {
    env.deltaPct = null;              /* zero or missing denominator: no % */
  }
  env.compareLabel = d.compare_label || live.delta?.basis || live.period?.compare_label || '';

  /* ── series ─────────────────────────────────────────────────────────── */
  const rawSeries = pickSeries(live, d);
  let seriesItem = live;
  let src = rawSeries ? 'native' : null;
  let points = rawSeries;
  if (!points && opts.companion && opts.companion.ok !== false) {
    const cd = opts.companion.data && typeof opts.companion.data === 'object' ? opts.companion.data : {};
    points = pickSeries(opts.companion, cd);
    if (points) { src = 'companion'; seriesItem = opts.companion; }
  }
  if (points) {
    const grain = grainOf(seriesItem?.data?.granularity, points);
    let series = points.map(parsePoint).filter(Boolean).sort((a, b) => a.date - b.date);
    const flow = reading?.period_aware !== false && (unit === 'currency' || unit === 'count');
    const window = seriesItem?.period || live.period;
    if (flow && window?.from && window?.to && series.length) {
      const filled = fillFlowGaps(series, window.from, window.to, grain);
      env.filled = filled.length !== series.length;
      series = filled;
    }
    env.series = series;
    env.seriesSource = src;
    env.grain = grain;
  }

  /* ── parts (breakdown) ──────────────────────────────────────────────── */
  const segs = d.segments || d.slices || live.segments || null;
  if (Array.isArray(segs)) {
    env.parts = segs.map((s, i) => ({
      label: String(s.label ?? s.name ?? `Item ${i + 1}`),
      value: num(s.value ?? s.amount ?? s.total) ?? 0,
    }));
    env.total = num(d.total) ?? env.parts.reduce((a, p) => a + p.value, 0);
    if (env.value === null) env.value = env.total;
  }

  /* ── rows (lists / rankings / feeds) ────────────────────────────────── */
  const rows = d.items || d.rows || live.rows?.items || null;
  if (Array.isArray(rows)) {
    env.rows = rows.map(normaliseRow);
    env.rowCount = num(d.count) ?? env.rows.length;
    env.truncated = !!(d.truncated || live.rows?.truncated);
    /* a ranked list can also be read as parts when it carries amounts */
    if (!env.parts && env.rows.length && env.rows.every(r => r.amount !== null)) {
      env.parts = env.rows.map(r => ({ label: r.label, value: r.amount }));
    }
  }

  /* ── matrix (heatmap) ───────────────────────────────────────────────── */
  if (d.matrix) env.matrix = normaliseMatrix(d.matrix);
  else if (reading && String(reading.shape).toUpperCase() === 'HEATMAP' && Array.isArray(rows)) {
    env.matrix = normaliseMatrix(rows);
  }

  /* ── status ─────────────────────────────────────────────────────────── */
  if (d.status === 'ok' || d.status === 'fail') {
    env.status = { ok: d.status === 'ok', message: d.message || '' };
  }

  /* ── gauge numerator/denominator ────────────────────────────────────── */
  env.numerator = num(d.numerator);
  env.denominator = num(d.denominator);

  const hasAnything = env.value !== null || (env.series && env.series.length)
    || (env.parts && env.parts.length) || (env.rows && env.rows.length)
    || env.matrix || env.status;
  env.state = (status === 'empty' || live.meta?.empty === true) && !hasAnything ? 'empty'
    : hasAnything ? 'ready' : 'empty';
  if (env.state === 'empty') env.message = 'No activity recorded in this period.';
  return env;
}

function pickSeries(item, d) {
  const s = d.series || d.points || item?.series || null;
  if (Array.isArray(s) && s.length) return s;
  if (s && typeof s === 'object' && !Array.isArray(s)) {
    const entries = Object.entries(s);
    if (entries.length) return entries.map(([k, v]) => ({ date: k, value: v }));
  }
  return null;
}

/** A point in any of the Reckoner's spellings → {date: Date, value: number|null}. */
export function parsePoint(pt) {
  if (pt === null || pt === undefined) return null;
  const raw = pt.date ?? pt.x ?? pt.t ?? pt.bucket ?? pt.label;
  const value = num(pt.value ?? pt.y ?? pt.amount ?? pt.total);
  const date = parseDate(raw);
  if (!date) return null;
  return { date, value };
}

export function parseDate(raw) {
  if (raw instanceof Date) return Number.isNaN(raw.getTime()) ? null : raw;
  if (raw === null || raw === undefined) return null;
  const s = String(raw);
  let m;
  if ((m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2})(?::(\d{2}))?)?/.exec(s))) {
    return new Date(+m[1], +m[2] - 1, +m[3], m[4] ? +m[4] : 0, m[5] ? +m[5] : 0);
  }
  if ((m = /^(\d{4})-(\d{2})$/.exec(s))) return new Date(+m[1], +m[2] - 1, 1);
  if ((m = /^(\d{4})-W(\d{2})$/.exec(s))) {
    const d = new Date(+m[1], 0, 1 + (+m[2] - 1) * 7);
    return d;
  }
  if ((m = /^(\d{1,2})$/.exec(s))) {                 /* an hour of today */
    const d = new Date(); d.setHours(+m[1], 0, 0, 0); return d;
  }
  const t = Date.parse(s);
  return Number.isNaN(t) ? null : new Date(t);
}

function grainOf(declared, points) {
  const g = String(declared || '').toLowerCase();
  if (g.startsWith('hour')) return 'hour';
  if (g.startsWith('month')) return 'month';
  if (g.startsWith('week')) return 'week';
  if (g.startsWith('day') || g === 'daily') return 'day';
  const sample = String(points[0]?.date ?? points[0]?.x ?? '');
  if (/^\d{4}-\d{2}$/.test(sample)) return 'month';
  if (/^\d{1,2}$/.test(sample) || /T\d{2}|\d{2}:\d{2}/.test(sample)) return 'hour';
  return 'day';
}

/** Zero-fill missing buckets of a flow inside its observed window. */
export function fillFlowGaps(series, from, to, grain) {
  const start = parseDate(from), end = parseDate(to);
  if (!start || !end || end < start) return series;
  if (grain !== 'day' && grain !== 'month') return series;
  const key = (d) => grain === 'month'
    ? `${d.getFullYear()}-${d.getMonth()}`
    : `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const have = new Map(series.map(p => [key(p.date), p]));
  const out = [];
  const cur = new Date(start.getFullYear(), start.getMonth(), grain === 'month' ? 1 : start.getDate());
  const today = new Date();
  /* never fill the future — a month-to-date window ends today */
  const stop = end > today ? today : end;
  let guard = 0;
  while (cur <= stop && guard++ < 400) {
    const k = key(cur);
    out.push(have.get(k) || { date: new Date(cur), value: 0 });
    if (grain === 'month') cur.setMonth(cur.getMonth() + 1);
    else cur.setDate(cur.getDate() + 1);
  }
  /* keep any observed point outside the computed window rather than drop it */
  series.forEach(p => { if (!out.some(o => key(o.date) === key(p.date))) out.push(p); });
  return out.sort((a, b) => a.date - b.date);
}

function normaliseRow(r, i) {
  const o = r && typeof r === 'object' ? r : { value: r };
  const label = o.name ?? o.label ?? o.title ?? o.customer ?? o.product ?? o.party ?? o.reference ?? o.description ?? `Item ${i + 1}`;
  const amountRaw = o.amount ?? o.value ?? o.total ?? o.total_amount ?? o.net_revenue ?? o.revenue ?? o.balance ?? o.qty ?? o.count ?? null;
  return {
    id: o.id ?? o.uuid ?? `${i}`,
    label: String(label),
    sub: o.sub ?? o.sku ?? o.phone ?? o.date ?? o.time ?? o.status ?? null,
    amount: num(amountRaw),
    raw: o,
  };
}

function normaliseMatrix(m) {
  if (Array.isArray(m) && m.length && Array.isArray(m[0])) {
    return m.map(row => row.map(c => num(c && typeof c === 'object' ? c.value : c) ?? 0));
  }
  if (Array.isArray(m)) {
    /* [{weekday|day, hour, value|count}] → 7 × 24 */
    const grid = Array.from({ length: 7 }, () => new Array(24).fill(0));
    let any = false;
    m.forEach(c => {
      const d = num(c.weekday ?? c.day ?? c.dow ?? c.row);
      const h = num(c.hour ?? c.col ?? c.h);
      const v = num(c.value ?? c.count ?? c.total ?? c.amount) ?? 0;
      if (d !== null && h !== null && d >= 0 && d < 7 && h >= 0 && h < 24) { grid[d][h] += v; any = true; }
    });
    return any ? grid : null;
  }
  if (m && typeof m === 'object') {
    const rows = Object.values(m).map(r => (Array.isArray(r) ? r : Object.values(r || {})).map(c => num(c) ?? 0));
    return rows.length ? rows : null;
  }
  return null;
}

/* ── formatting ─────────────────────────────────────────────────────────── */

export function formatValue(v, unit, { compact = false, currency = 'Rs', precision } = {}) {
  if (v === null || v === undefined || !Number.isFinite(Number(v))) return '—';
  const n = Number(v);
  const abs = Math.abs(n);
  const sign = n < 0 ? '−' : '';
  if (unit === 'percent') return `${sign}${abs.toFixed(abs >= 100 ? 0 : 1)}%`;
  if (unit === 'days') return `${sign}${abs.toFixed(abs >= 10 ? 0 : 1)} d`;
  if (unit === 'hours' || unit === 'hour') return `${sign}${abs.toFixed(1)} h`;
  if (unit === 'minutes') return `${sign}${Math.round(abs)} min`;
  if (unit === 'ratio') return `${sign}${abs.toFixed(2)}×`;
  const body = compact ? compactNumber(abs) : groupNumber(abs, unit === 'currency' ? (precision ?? 0) : 0);
  return unit === 'currency' ? `${sign}${currency} ${body}` : `${sign}${body}`;
}

export function compactNumber(abs) {
  if (abs >= 1e9) return trim(abs / 1e9) + 'B';
  if (abs >= 1e6) return trim(abs / 1e6) + 'M';
  if (abs >= 1e3) return trim(abs / 1e3) + 'K';
  return String(Math.round(abs));
}
const trim = (x) => (x >= 100 ? Math.round(x).toString() : x.toFixed(1).replace(/\.0$/, ''));
function groupNumber(abs, digits) {
  return abs.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: digits });
}

export function formatDelta(pct) {
  if (pct === null || pct === undefined || !Number.isFinite(pct)) return '';
  const a = Math.abs(pct);
  return `${a >= 100 ? Math.round(a) : a.toFixed(1)}%`;
}

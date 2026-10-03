import { describe, it, expect } from 'vitest';
import { GRID, rowsToPx, colsToPx, colWidth, resolveSpan, minSize } from '../Dashboard/cards/geometry';
import { FAMILIES, normalizePresentation, capabilitiesFor, isLegal } from '../Dashboard/cards/families';
import { toEnvelope, formatDelta } from '../Dashboard/cards/envelope';

describe('card geometry', () => {
  it('uses the 12 col / 64px / 24px law', () => {
    expect(GRID).toMatchObject({ cols: 12, unit: 64, gutter: 24 });
    expect(rowsToPx(1)).toBe(64);
    expect(rowsToPx(3)).toBe(3 * 64 + 2 * 24);
    expect(rowsToPx(0)).toBe(0);
  });
  it('columns plus gutters fill the board exactly', () => {
    const cw = colWidth(1200);
    expect(colsToPx(12, cw)).toBeCloseTo(1200, 5);
  });
  it('never returns a span below the family floor or outside the grid', () => {
    for (const fam of Object.keys(FAMILIES)) {
      const v = FAMILIES[fam].variants?.[0]?.id;
      const r = resolveSpan({ w: 1, h: 1 }, fam, v);
      const [mw, mh] = minSize(fam, v);
      expect(r.w).toBeGreaterThanOrEqual(mw);
      expect(r.h).toBeGreaterThanOrEqual(mh);
      expect(r.w).toBeLessThanOrEqual(GRID.cols);
      expect(r.h).toBeLessThanOrEqual(GRID.maxRows);
      expect(Number.isInteger(r.w) && Number.isInteger(r.h)).toBe(true);
    }
  });
});

describe('families', () => {
  it('translates legacy chart keys into a family', () => {
    const p = normalizePresentation('stat');
    expect(FAMILIES[p.family]).toBeTruthy();
  });
  it('does not offer a time chart for a reading with no history', () => {
    const caps = capabilitiesFor({ shape: 'scalar', kind: 'scalar' }, { seriesAvailable: false });
    const area = caps.find?.(c => c.family === 'area') ?? caps.area;
    expect(area?.legal ?? area?.enabled ?? false).toBeFalsy();
    expect(isLegal({ shape: 'scalar' }, 'area', undefined, { seriesAvailable: false })).toBe(false);
  });
});

describe('envelope honesty', () => {
  it('a failed read is an error state, never zero', () => {
    const env = toEnvelope({ status: 'error' }, { shape: 'scalar' });
    expect(['error', 'unavailable']).toContain(env.state);
    expect(env.value ?? null).toBeNull();
  });
  it('no delta without a previous value', () => {
    expect(formatDelta(null)).toBeFalsy();
  });
});

describe('ledger disagreement', () => {
  it('names the two numbers that differ', () => {
    const env = toEnvelope({ ok: false, status: 'error', error: { code: 'books_disagree', message: 'revenue_ties_to_ledger FAILED: Sales=1200.5, GL=1000, Diff=200.5' } }, { shape: 'scalar' });
    expect(env.state).toBe('reconciling');
    expect(env.message).toMatch(/held back/);
    expect(env.message).toMatch(/200\.5/);
    expect(env.value).toBeNull();
  });
});

describe('all chart families are available where the data honestly allows', () => {
  const on = (reading, ctx) => capabilitiesFor(reading, ctx).filter(c => c.enabled).map(c => c.family);
  it('a breakdown can be a funnel, sankey or sunburst', () => {
    const f = on({ shape: 'BREAKDOWN', unit: 'currency' }, {});
    ['pie', 'funnel', 'sankey', 'sunburst'].forEach(x => expect(f).toContain(x));
  });
  it('a series can be scatter or live line; a lone total cannot', () => {
    const s = on({ shape: 'TREND', unit: 'currency' }, { seriesAvailable: true });
    expect(s).toContain('scatter'); expect(s).toContain('live');
    expect(on({ shape: 'STAT', unit: 'currency' }, { seriesAvailable: false })).not.toContain('scatter');
  });
});

describe('ledger cross-check no longer hides the figure', () => {
  it('keeps the value and carries the disagreement as a flag', () => {
    const env = toEnvelope({ ok: true, status: 'ok', data: { value: 5000 }, meta: { verification: { status: 'mismatch', difference: 200.5, check: 'revenue_ties_to_ledger', message: 'x' } } }, { shape: 'scalar', unit: 'currency' });
    expect(env.state).toBe('ready');
    expect(env.value).toBe(5000);
    expect(env.verification.difference).toBe(200.5);
  });
});

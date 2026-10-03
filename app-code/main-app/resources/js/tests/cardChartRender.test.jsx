// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeAll } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import CardChart from '../Dashboard/cards/CardChart';
import { FAMILIES } from '../Dashboard/cards/families';

beforeAll(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get() { return 640; } });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get() { return 320; } });
  Element.prototype.getBoundingClientRect = function () { return { width: 640, height: 320, top: 0, left: 0, right: 640, bottom: 320, x: 0, y: 0, toJSON() {} }; };
  globalThis.matchMedia = globalThis.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }));
});

const day = (i) => new Date(2026, 8, 20 + i);
const env = {
  state: 'ready', unit: 'currency', precision: 0, value: 6838, previous: 5000, deltaPct: 36.7, message: '', grain: 'day', filled: false,
  series: Array.from({ length: 9 }, (_, i) => ({ date: day(i), value: 1000 + ((i * 377) % 900) })),
  parts: [{ label: 'Cash', value: 4000 }, { label: 'Card', value: 2500 }, { label: 'Credit', value: 900 }, { label: 'Other', value: 300 }],
  total: 7700,
  rows: [{ label: 'A', amount: 4000, cells: [] }, { label: 'B', amount: 2500, cells: [] }],
  rowCount: 2,
  matrix: Array.from({ length: 7 }, (_, d) => Array.from({ length: 24 }, (_, h) => (d * h) % 9)),
  status: { ok: true, message: 'All good' },
};

describe('every chart family renders without throwing', () => {
  Object.entries(FAMILIES).forEach(([family, def]) => {
    def.variants.forEach(v => {
      it(`${family} / ${v.id}`, async () => {
        const host = document.createElement('div');
        document.body.appendChild(host);
        const root = createRoot(host);
        const errors = [];
        const origErr = console.error; console.error = (...a) => { errors.push(a.join(' ')); };
        await act(async () => {
          root.render(<CardChart card={{ id: 't', family, variant: v.id, legend: true, goal: { target: 9000 } }}
            series={[{ env, label: 'Revenue', key: 'core.revenue' }]} width={640} height={320} enter={false} reduced currency="Rs" />);
        });
        console.error = origErr;
        const fatal = errors.filter(e => /Error|Cannot|undefined|is not/.test(e) && !/act\(|not wrapped|ReactDOMTestUtils/.test(e));
        expect(fatal).toEqual([]);
        if (!(family === 'number' && v.id === 'value')) expect(host.innerHTML.length).toBeGreaterThan(20);
        await act(async () => { root.unmount(); });
      });
    });
  });
});

describe('awkward but real series shapes do not blank the card', () => {
  const variants = {
    negatives: Array.from({ length: 7 }, (_, i) => ({ date: day(i), value: (i % 2 ? -1 : 1) * (200 + i * 90) })),
    allZero: Array.from({ length: 7 }, (_, i) => ({ date: day(i), value: 0 })),
    withNulls: Array.from({ length: 7 }, (_, i) => ({ date: day(i), value: i % 3 ? null : 500 })),
    flat: Array.from({ length: 7 }, (_, i) => ({ date: day(i), value: 750 })),
  };
  Object.entries(variants).forEach(([name, series]) => {
    ['area', 'line', 'bar', 'scatter', 'live', 'composed'].forEach(family => {
      it(`${family} with ${name}`, async () => {
        const host = document.createElement('div'); document.body.appendChild(host);
        const root = createRoot(host);
        const errors = [];
        const origErr = console.error; console.error = (...a) => { errors.push(a.join(' ')); };
        const e = { ...env, series };
        await act(async () => {
          root.render(<CardChart card={{ id: 't', family, variant: FAMILIES[family].variants[0].id, legend: true }}
            series={[{ env: e, label: 'Profit', key: 'core.profit_trend' }, { env: e, label: 'B', key: 'x' }]} width={640} height={320} enter={false} reduced currency="Rs" />);
        });
        console.error = origErr;
        expect(errors.filter(x => /Error|Cannot|undefined|is not|NaN/.test(x) && !/act\(|not wrapped/.test(x))).toEqual([]);
        expect(host.innerHTML.length).toBeGreaterThan(20);
        await act(async () => { root.unmount(); });
      });
    });
  });
});

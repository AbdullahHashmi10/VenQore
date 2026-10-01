import { describe, it, expect } from 'vitest';
import {
  valuesForPure,
  headlineOfPure,
  buildPartsPure,
} from '../Dashboard/utils/reckonerCardHelpers.js';

describe('reckonerCardHelpers — valuesFor, headlineOf, buildParts', () => {
  describe('headlineOfPure', () => {
    it('returns "—" and reason when live status is unavailable', () => {
      const card = { key: 'core.revenue', period: 'Month' };
      const live = {
        status: 'unavailable',
        error: { message: 'This metric is not implemented yet.' },
      };
      const reading = { key: 'core.revenue', unit: 'currency', label: 'Revenue' };

      const res = headlineOfPure(card, live, reading);
      expect(res.value).toBe('—');
      expect(res.valueCompact).toBe('—');
      expect(res.when).toBe('This metric is not implemented yet.');
    });

    it('returns "—" when live data is missing or last value is null', () => {
      const card = { key: 'core.revenue', period: 'Month' };
      const live = { ok: true, status: 'ok', data: null };
      const reading = { key: 'core.revenue', unit: 'currency', label: 'Revenue' };

      const res = headlineOfPure(card, live, reading);
      expect(res.value).toBe('—');
    });

    it('returns formatted value when live data has a valid number', () => {
      const card = { key: 'core.revenue', period: 'Month' };
      const live = { ok: true, status: 'ok', data: { value: 7700 } };
      const reading = { key: 'core.revenue', unit: 'currency', label: 'Revenue' };

      const res = headlineOfPure(card, live, reading);
      expect(res.value).toContain('7,700');
    });
  });

  describe('buildPartsPure', () => {
    it('returns empty parts array with no fake segment names when data is missing', () => {
      const live = null;
      const reading = { key: 'sales.payment_breakdown', unit: 'currency' };

      const res = buildPartsPure(live, reading);
      expect(res.parts).toEqual([]);
      expect(res.total).toBe(0);
      expect(res.unit).toBe('currency');
    });

    it('returns empty parts when live data is unavailable', () => {
      const live = { status: 'unavailable', error: { message: 'Not available' } };
      const reading = { key: 'sales.payment_breakdown', unit: 'currency' };

      const res = buildPartsPure(live, reading);
      expect(res.parts).toEqual([]);
      expect(res.total).toBe(0);
    });

    it('returns sorted slices from real live data without inventing names', () => {
      const live = {
        ok: true,
        status: 'ok',
        data: {
          slices: [
            { name: 'Counter Cash', value: 2000 },
            { name: 'Bank Transfer', value: 5000 },
          ],
          total: 7000,
        },
      };
      const reading = { key: 'sales.payment_breakdown', unit: 'currency' };

      const res = buildPartsPure(live, reading);
      expect(res.parts).toHaveLength(2);
      expect(res.parts[0].name).toBe('Bank Transfer');
      expect(res.parts[0].value).toBe(5000);
      expect(res.parts[1].name).toBe('Counter Cash');
      expect(res.parts[1].value).toBe(2000);
      expect(res.total).toBe(7000);
    });
  });

  describe('valuesForPure', () => {
    it('does NOT interpolate linearly across missing points', () => {
      // Series has only 2 points for a 7-day period
      const live = {
        ok: true,
        status: 'ok',
        data: {
          points: [
            { t: '2026-08-01', y: 100 },
            { t: '2026-08-07', y: 700 },
          ],
        },
      };

      const times = [
        new Date('2026-08-01T00:00:00'),
        new Date('2026-08-02T00:00:00'),
        new Date('2026-08-03T00:00:00'),
        new Date('2026-08-04T00:00:00'),
        new Date('2026-08-05T00:00:00'),
        new Date('2026-08-06T00:00:00'),
        new Date('2026-08-07T00:00:00'),
      ];

      const res = valuesForPure(live, 'Week', 'currency', times, 'day');
      expect(res).toHaveLength(7);
      expect(res[0]).toBe(100);
      // Missing days should be 0, never linearly interpolated (e.g. 200, 300, 400...)
      expect(res[1]).toBe(0);
      expect(res[2]).toBe(0);
      expect(res[3]).toBe(0);
      expect(res[4]).toBe(0);
      expect(res[5]).toBe(0);
      expect(res[6]).toBe(700);
    });

    it('Year period shows 12 monthly buckets matching server timestamps', () => {
      const live = {
        ok: true,
        status: 'ok',
        data: {
          points: [
            { t: '2026-01-15T00:00:00', y: 1000 },
            { t: '2026-02-15T00:00:00', y: 2000 },
            { t: '2026-03-15T00:00:00', y: 3000 },
          ],
        },
      };

      const times = [];
      for (let m = 0; m < 12; m++) {
        times.push(new Date(2026, m, 1));
      }

      const res = valuesForPure(live, 'Year', 'currency', times, 'month');
      expect(res).toHaveLength(12);
      expect(res[0]).toBe(1000); // Jan
      expect(res[1]).toBe(2000); // Feb
      expect(res[2]).toBe(3000); // Mar
      expect(res[3]).toBe(0);    // Apr (no data)
    });

    it('returns array of zeros when live is unavailable or empty', () => {
      const live = { status: 'unavailable' };
      const times = [new Date(), new Date()];
      const res = valuesForPure(live, 'Week', 'currency', times, 'day');
      expect(res).toEqual([0, 0]);
    });
  });
});

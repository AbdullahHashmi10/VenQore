/** UTC noon per day so x positions and labels stay stable across time zones. */
const DAY_MS = 86_400_000;
const START_MS = Date.UTC(2024, 0, 1, 12, 0, 0);

export const COMPOSED_DEMO_DAY_COUNT = 30;

function isoDay(i: number): string {
  return new Date(START_MS + i * DAY_MS).toISOString();
}

/** One slow cycle across the window + light ripples (readable, not “ECG” noise). */
function smoothCycle(i: number, phase: number): number {
  const u = i / (COMPOSED_DEMO_DAY_COUNT - 1);
  return Math.sin(u * Math.PI * 2 + phase);
}

/** Daily rows: units (bars), revenue + runRate (line / area) — gentle variation. */
export const composedDemoData = Array.from(
  { length: COMPOSED_DEMO_DAY_COUNT },
  (_, i) => {
    const units = Math.round(
      46 +
        14 * smoothCycle(i, 0.35) +
        6 * Math.sin(i / 14) +
        (i / COMPOSED_DEMO_DAY_COUNT) * 10
    );
    const revenue = Math.round(
      96 +
        11 * smoothCycle(i, 1.05) +
        5 * Math.sin(i / 17) +
        (i / COMPOSED_DEMO_DAY_COUNT) * 18
    );
    const runRate = Math.round(
      82 +
        9 * smoothCycle(i, 1.9) +
        5 * Math.cos(i / 16) +
        (i / COMPOSED_DEMO_DAY_COUNT) * 8
    );
    return {
      date: isoDay(i),
      units: Math.max(18, Math.min(95, units)),
      revenue: Math.max(72, Math.min(155, revenue)),
      runRate: Math.max(62, Math.min(118, runRate)),
    };
  }
);

/** Same timeline: two stack segments + revenue (smooth totals). */
export const composedStackedData = Array.from(
  { length: COMPOSED_DEMO_DAY_COUNT },
  (_, i) => {
    const direct = Math.round(
      18 + 8 * smoothCycle(i, 0.2) + 4 * Math.sin(i / 12)
    );
    const partner = Math.round(
      14 + 6 * smoothCycle(i, 1.4) + 3 * Math.cos(i / 13)
    );
    const revenue = Math.round(
      96 +
        11 * smoothCycle(i, 1.05) +
        5 * Math.sin(i / 17) +
        (i / COMPOSED_DEMO_DAY_COUNT) * 18
    );
    return {
      date: isoDay(i),
      direct: Math.max(8, Math.min(42, direct)),
      partner: Math.max(8, Math.min(36, partner)),
      revenue: Math.max(72, Math.min(155, revenue)),
    };
  }
);

/** Desktop / mobile / installs with correlated, smoothed motion. */
export const composedTriSeriesData = Array.from(
  { length: COMPOSED_DEMO_DAY_COUNT },
  (_, i) => {
    const desktop = Math.round(
      178 +
        32 * smoothCycle(i, 0.5) +
        10 * Math.sin(i / 15) +
        (i / COMPOSED_DEMO_DAY_COUNT) * 14
    );
    const mobile = Math.round(
      88 + 22 * smoothCycle(i, 1.2) + 8 * Math.cos(i / 14)
    );
    const installs = Math.round(
      (desktop + mobile) * (0.102 + 0.012 * Math.sin(i / 20))
    );
    return {
      date: isoDay(i),
      desktop: Math.max(120, Math.min(260, desktop)),
      mobile: Math.max(55, Math.min(145, mobile)),
      installs: Math.max(18, Math.min(48, installs)),
    };
  }
);

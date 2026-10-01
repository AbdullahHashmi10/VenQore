import { scaleLinear } from "@visx/scale";
import type { LineConfig } from "./chart-context";
import { type ChartPhase, Y_DOMAIN_TWEEN_SKIP_THRESHOLD } from "./chart-phase";
import { groupLinesByYAxisId, normalizeYAxisId } from "./y-axis-scales";

export type YDomain = [number, number];

/** Apply visx `nice()` to raw domain endpoints for stable grid ticks. */
export function niceYDomain(domain: YDomain): YDomain {
  /*
   * A flat series has a zero-span domain, and `nice()` on [0, 0] returns
   * [0, 0] — a scale with no range, which renders the line at an undefined
   * position and an axis with no ticks. That is the state every card is in on
   * a day with no takings: the figure reads "Rs 0.00" and the plot is blank,
   * which looks broken rather than quiet.
   *
   * A constant reading is still a reading. Give it a scale to sit on, so the
   * line draws flat and the axis states what flat means.
   */
  const [lo, hi] = domain;
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return [0, 1];

  if (lo === hi) {
    // Zero sits on the floor of its own scale; any other constant is centred.
    const span = Math.abs(lo) > 0 ? Math.abs(lo) : 1;
    const padded: YDomain =
      lo === 0 ? [0, span] : [lo - span * 0.5, hi + span * 0.5];
    const flat = scaleLinear({ domain: padded, range: [0, 1], nice: true });
    const flatDomain = flat.domain();
    return [flatDomain[0] ?? padded[0], flatDomain[1] ?? padded[1]];
  }

  const scale = scaleLinear({ domain, range: [0, 1], nice: true });
  const niceDomain = scale.domain();
  return [niceDomain[0] ?? domain[0], niceDomain[1] ?? domain[1]];
}

/**
 * Skip Y tween when both endpoints move less than the threshold relative to span.
 * When in doubt callers should tween — beauty wins over micro-optimization.
 */
export function shouldTweenYDomain(from: YDomain, to: YDomain): boolean {
  const span = Math.max(
    Math.abs(to[1] - to[0]),
    Math.abs(from[1] - from[0]),
    1
  );
  const deltaMin = Math.abs(to[0] - from[0]) / span;
  const deltaMax = Math.abs(to[1] - from[1]) / span;
  return (
    deltaMin >= Y_DOMAIN_TWEEN_SKIP_THRESHOLD ||
    deltaMax >= Y_DOMAIN_TWEEN_SKIP_THRESHOLD
  );
}

/** Phases where the chart shows loading chrome (shimmer, pulse, label). */
export function isLoadingChromePhase(phase: ChartPhase): boolean {
  return phase === "loading" || phase === "revealingLoading";
}

/** Phases where grid lines use loading stroke styling (muted / dashed chrome). */
export function isLoadingGridChromePhase(phase: ChartPhase): boolean {
  return (
    phase === "loading" || phase === "exiting" || phase === "gridTweenLoading"
  );
}

/** Phases where Y-domain tween runs after the series has exited. */
export function isYDomainTweenPhase(phase: ChartPhase): boolean {
  return phase === "gridTweenLoading" || phase === "gridTweenReady";
}

/** Phases where {@link ReferenceArea} bands are shown (fade in/out on transitions). */
export function isReferenceAreaVisiblePhase(phase: ChartPhase): boolean {
  return (
    phase === "ready" || phase === "revealing" || phase === "gridTweenReady"
  );
}

export function resolveAnimatedYDestinationDomains(
  chartPhase: ChartPhase,
  skeletonByAxis: Record<string, YDomain>,
  targetByAxis: Record<string, YDomain>
): Record<string, YDomain> {
  switch (chartPhase) {
    case "loading":
    case "exiting":
    case "gridTweenLoading":
      return skeletonByAxis;
    case "exitingReady":
    case "gridTweenReady":
    case "revealing":
    case "ready":
      return targetByAxis;
    default:
      return targetByAxis;
  }
}

export function computeYDomainsByAxis({
  lines,
  resolveDomain,
}: {
  lines: LineConfig[];
  resolveDomain: (dataKeys: string[]) => YDomain;
}): Record<string, YDomain> {
  const groups = groupLinesByYAxisId(lines);
  const domains: Record<string, YDomain> = {};

  for (const [axisId, axisLines] of groups) {
    const dataKeys = axisLines.map((line) => line.dataKey);
    domains[normalizeYAxisId(axisId)] = niceYDomain(resolveDomain(dataKeys));
  }

  if (!domains.left) {
    domains.left = niceYDomain([0, 100]);
  }

  return domains;
}

/** Merge domain maps, normalizing axis ids to strings. */
export function mergeYDomainRecords(
  ...records: Record<string, YDomain>[]
): Record<string, YDomain> {
  const merged: Record<string, YDomain> = {};
  for (const record of records) {
    for (const [axisId, domain] of Object.entries(record)) {
      merged[normalizeYAxisId(axisId)] = domain;
    }
  }
  return merged;
}

export function domainsEqual(
  left: Record<string, YDomain>,
  right: Record<string, YDomain>
): boolean {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) {
    return false;
  }

  for (const axisId of leftKeys) {
    const from = left[axisId];
    const to = right[axisId];
    if (!(from && to) || from[0] !== to[0] || from[1] !== to[1]) {
      return false;
    }
  }

  return true;
}

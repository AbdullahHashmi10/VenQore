import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useContext, createContext, useMemo, useId, useEffect, useState, useCallback, useRef, memo, isValidElement, Children, Fragment as Fragment$1, cloneElement, useLayoutEffect } from "react";
import { usePage, Head, Link } from "@inertiajs/react";
import { u as useTermText } from "./terms-DwYjlWsV.js";
import { curveMonotoneX, curveNatural, curveCatmullRom } from "@visx/curve";
import { ParentSize } from "@visx/responsive";
import { c as cn } from "./utils-H80jjgLf.js";
import { AreaClosed, LinePath } from "@visx/shape";
import { scaleLinear, scaleTime } from "@visx/scale";
import { motion, useMotionValue, useTransform, animate, useReducedMotion, useSpring } from "motion/react";
import { line } from "d3-shape";
import { bisector, extent } from "d3-array";
import { localPoint } from "@visx/event";
import { GridRows, GridColumns } from "@visx/grid";
import { createPortal } from "react-dom";
import { v as vq } from "./runtime-DwSFgQZq.js";
import "clsx";
import "tailwind-merge";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "lucide-react";
import "dexie";
import "@headlessui/react";
function resolveFadeSides(fade) {
  if (fade === false) {
    return { left: false, right: false, any: false };
  }
  if (fade === "left") {
    return { left: true, right: false, any: true };
  }
  if (fade === "right") {
    return { left: false, right: true, any: true };
  }
  return { left: true, right: true, any: true };
}
function fadeGradientStops(sides) {
  return [
    { offset: "0%", opacity: sides.left ? 0 : 1 },
    { offset: "15%", opacity: 1 },
    { offset: "85%", opacity: 1 },
    { offset: "100%", opacity: sides.right ? 0 : 1 }
  ];
}
function viewportFadeGradientAttrs(innerWidth) {
  return {
    gradientUnits: "userSpaceOnUse",
    x1: 0,
    x2: innerWidth,
    y1: 0,
    y2: 0
  };
}
function AreaGradientDefs({
  gradientId,
  strokeGradientId,
  edgeMaskId,
  edgeGradientId,
  fill,
  fillOpacity,
  gradientToOpacity,
  gradientSpan = 1,
  resolvedStroke,
  isPatternFill,
  fadeEdges,
  innerWidth,
  innerHeight
}) {
  const sides = resolveFadeSides(fadeEdges);
  const strokeStops = sides.any ? fadeGradientStops(sides) : null;
  const showEdgeMask = sides.any && !isPatternFill;
  const edgeStops = showEdgeMask ? fadeGradientStops(sides) : null;
  const span = Math.min(1, Math.max(0.01, gradientSpan));
  const midOffset = `${span * 100}%`;
  return /* @__PURE__ */ jsxs("defs", { children: [
    isPatternFill ? null : /* @__PURE__ */ jsxs("linearGradient", { id: gradientId, x1: "0%", x2: "0%", y1: "0%", y2: "100%", children: [
      /* @__PURE__ */ jsx(
        "stop",
        {
          offset: "0%",
          style: { stopColor: fill, stopOpacity: fillOpacity }
        }
      ),
      /* @__PURE__ */ jsx(
        "stop",
        {
          offset: midOffset,
          style: { stopColor: fill, stopOpacity: gradientToOpacity }
        }
      ),
      span < 1 ? /* @__PURE__ */ jsx(
        "stop",
        {
          offset: "100%",
          style: { stopColor: fill, stopOpacity: gradientToOpacity }
        }
      ) : null
    ] }),
    strokeStops ? /* @__PURE__ */ jsx(
      "linearGradient",
      {
        id: strokeGradientId,
        ...viewportFadeGradientAttrs(innerWidth),
        children: strokeStops.map((stop) => /* @__PURE__ */ jsx(
          "stop",
          {
            offset: stop.offset,
            style: { stopColor: resolvedStroke, stopOpacity: stop.opacity }
          },
          stop.offset
        ))
      }
    ) : null,
    edgeStops ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(
        "linearGradient",
        {
          id: edgeGradientId,
          ...viewportFadeGradientAttrs(innerWidth),
          children: edgeStops.map((stop) => /* @__PURE__ */ jsx(
            "stop",
            {
              offset: stop.offset,
              style: { stopColor: "white", stopOpacity: stop.opacity }
            },
            stop.offset
          ))
        }
      ),
      /* @__PURE__ */ jsx("mask", { id: edgeMaskId, children: /* @__PURE__ */ jsx(
        "rect",
        {
          fill: `url(#${edgeGradientId})`,
          height: innerHeight,
          width: innerWidth,
          x: "0",
          y: "0"
        }
      ) })
    ] }) : null
  ] });
}
const DEFAULT_Y_AXIS_ID = "left";
function normalizeYAxisId(id) {
  if (id == null || id === "") {
    return DEFAULT_Y_AXIS_ID;
  }
  return String(id);
}
function groupLinesByYAxisId(lines) {
  const groups = /* @__PURE__ */ new Map();
  for (const line2 of lines) {
    const axisId = normalizeYAxisId(line2.yAxisId);
    const bucket = groups.get(axisId) ?? [];
    bucket.push(line2);
    groups.set(axisId, bucket);
  }
  return groups;
}
function getPrimaryYScale(yScales, fallback) {
  const primary = yScales[DEFAULT_Y_AXIS_ID];
  if (primary) {
    return primary;
  }
  const first = Object.values(yScales)[0];
  return first ?? fallback;
}
function buildYScalesFromDomains({
  lines,
  innerHeight,
  domainsByAxis
}) {
  const groups = groupLinesByYAxisId(lines);
  const scales = {};
  for (const [axisId] of groups) {
    const domain = domainsByAxis[axisId] ?? domainsByAxis[DEFAULT_Y_AXIS_ID] ?? [0, 100];
    scales[axisId] = scaleLinear({
      range: [innerHeight, 0],
      domain
    });
  }
  if (!scales[DEFAULT_Y_AXIS_ID]) {
    scales[DEFAULT_Y_AXIS_ID] = scaleLinear({
      range: [innerHeight, 0],
      domain: domainsByAxis[DEFAULT_Y_AXIS_ID] ?? [0, 100]
    });
  }
  return scales;
}
const chartCssVars = {
  background: "var(--chart-background)",
  foreground: "var(--chart-foreground)",
  foregroundMuted: "var(--chart-foreground-muted)",
  linePrimary: "var(--chart-line-primary)",
  crosshair: "var(--chart-crosshair)",
  grid: "var(--chart-grid)",
  tooltipBackground: "var(--chart-tooltip-background)"
};
const defaultScatterColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)"
];
const ChartStableContext = createContext(null);
const ChartHoverContext = createContext(null);
function ChartProvider({
  children,
  value
}) {
  const stable = useMemo(
    () => ({
      data: value.data,
      renderData: value.renderData,
      xScale: value.xScale,
      yScale: value.yScale,
      yScales: value.yScales,
      width: value.width,
      height: value.height,
      innerWidth: value.innerWidth,
      innerHeight: value.innerHeight,
      margin: value.margin,
      columnWidth: value.columnWidth,
      containerRef: value.containerRef,
      lines: value.lines,
      referenceAreas: value.referenceAreas,
      chartPhase: value.chartPhase,
      chartStatus: value.chartStatus,
      loadingLabel: value.loadingLabel,
      yDomainTweenDuration: value.yDomainTweenDuration,
      yDomainSkeletonByAxis: value.yDomainSkeletonByAxis,
      yDomainTargetByAxis: value.yDomainTargetByAxis,
      isLoaded: value.isLoaded,
      animationDuration: value.animationDuration,
      animationEasing: value.animationEasing,
      enterTransition: value.enterTransition,
      revealEpoch: value.revealEpoch,
      notifyLoadingPulseComplete: value.notifyLoadingPulseComplete,
      xAccessor: value.xAccessor,
      dateLabels: value.dateLabels,
      xDomain: value.xDomain,
      xDomainSlotCount: value.xDomainSlotCount,
      barScale: value.barScale,
      bandWidth: value.bandWidth,
      barXAccessor: value.barXAccessor,
      orientation: value.orientation,
      stacked: value.stacked,
      stackOffsets: value.stackOffsets,
      composedBarDataKeys: value.composedBarDataKeys,
      composedBarSize: value.composedBarSize,
      composedMaxBarSize: value.composedMaxBarSize,
      composedBarGap: value.composedBarGap,
      composedStacked: value.composedStacked,
      composedStackOffsets: value.composedStackOffsets,
      composedStackGap: value.composedStackGap
    }),
    [
      value.data,
      value.renderData,
      value.xScale,
      value.yScale,
      value.yScales,
      value.width,
      value.height,
      value.innerWidth,
      value.innerHeight,
      value.margin,
      value.columnWidth,
      value.containerRef,
      value.lines,
      value.referenceAreas,
      value.chartPhase,
      value.chartStatus,
      value.loadingLabel,
      value.yDomainTweenDuration,
      value.yDomainSkeletonByAxis,
      value.yDomainTargetByAxis,
      value.isLoaded,
      value.animationDuration,
      value.animationEasing,
      value.enterTransition,
      value.revealEpoch,
      value.notifyLoadingPulseComplete,
      value.xAccessor,
      value.dateLabels,
      value.xDomain,
      value.xDomainSlotCount,
      value.barScale,
      value.bandWidth,
      value.barXAccessor,
      value.orientation,
      value.stacked,
      value.stackOffsets,
      value.composedBarDataKeys,
      value.composedBarSize,
      value.composedMaxBarSize,
      value.composedBarGap,
      value.composedStacked,
      value.composedStackOffsets,
      value.composedStackGap
    ]
  );
  const hover = useMemo(
    () => ({
      tooltipData: value.tooltipData,
      setTooltipData: value.setTooltipData,
      selection: value.selection,
      clearSelection: value.clearSelection,
      hoveredBarIndex: value.hoveredBarIndex,
      setHoveredBarIndex: value.setHoveredBarIndex,
      hoveredCandleIndex: value.hoveredCandleIndex,
      setHoveredCandleIndex: value.setHoveredCandleIndex
    }),
    [
      value.tooltipData,
      value.setTooltipData,
      value.selection,
      value.clearSelection,
      value.hoveredBarIndex,
      value.setHoveredBarIndex,
      value.hoveredCandleIndex,
      value.setHoveredCandleIndex
    ]
  );
  return /* @__PURE__ */ jsx(ChartStableContext.Provider, { value: stable, children: /* @__PURE__ */ jsx(ChartHoverContext.Provider, { value: hover, children }) });
}
function useChartStable() {
  const context = useContext(ChartStableContext);
  if (!context) {
    throw new Error(
      "useChartStable must be used within a ChartProvider. Make sure your component is wrapped in <LineChart>, <AreaChart>, <BarChart>, or <ComposedChart>."
    );
  }
  return context;
}
function useYScale(yAxisId) {
  const { yScales, yScale } = useChartStable();
  const id = yAxisId == null || yAxisId === "" ? DEFAULT_Y_AXIS_ID : String(yAxisId);
  return yScales[id] ?? yScale;
}
function useChartHover() {
  const context = useContext(ChartHoverContext);
  if (!context) {
    throw new Error(
      "useChartHover must be used within a ChartProvider. Make sure your component is wrapped in <LineChart>, <AreaChart>, <BarChart>, or <ComposedChart>."
    );
  }
  return context;
}
function useChart() {
  const stable = useChartStable();
  const hover = useChartHover();
  return { ...stable, ...hover };
}
const LINE_LOADING_PULSE_CYCLE_S = 2.2;
const LINE_LOADING_LOOP_PAUSE_MS = 280;
const LOADING_LABEL_EXIT_S = 0.45;
const LINE_LOADING_PULSE_EASE = [0.85, 0, 0.15, 1];
const CLIP_PADDING = 10;
function resolveLineLoadingPulseMode(phase) {
  switch (phase) {
    case "loading":
      return "loop";
    case "exiting":
      return "exit";
    case "revealingLoading":
      return "enter";
    default:
      return null;
  }
}
function useGrowExitClip(innerWidth, mode, loopEpoch, onComplete) {
  const progress = useMotionValue(0);
  const paddedFullWidth = innerWidth + CLIP_PADDING * 2;
  const rightEdge = innerWidth + CLIP_PADDING;
  const clipWidth = useTransform(progress, (p) => {
    if (p <= 0.5) {
      return p / 0.5 * paddedFullWidth;
    }
    const shrink = (p - 0.5) / 0.5;
    return (1 - shrink) * paddedFullWidth;
  });
  const clipX = useTransform(progress, (p) => {
    if (p <= 0.5) {
      return -CLIP_PADDING;
    }
    const shrink = (p - 0.5) / 0.5;
    return rightEdge - (1 - shrink) * paddedFullWidth;
  });
  useEffect(() => {
    if (innerWidth <= 0) {
      return;
    }
    const halfCycleS = LINE_LOADING_PULSE_CYCLE_S / 2;
    let cancelled = false;
    let controls;
    const finish = () => {
      if (!cancelled) {
        onComplete?.();
      }
    };
    const runShrink = (from) => {
      const shrinkDuration = halfCycleS * ((1 - from) / 0.5);
      controls = animate(progress, 1, {
        duration: Math.max(shrinkDuration, 0.01),
        ease: [...LINE_LOADING_PULSE_EASE],
        onComplete: finish
      });
    };
    if (mode === "loop") {
      progress.set(0);
      controls = animate(progress, 1, {
        duration: LINE_LOADING_PULSE_CYCLE_S,
        ease: [...LINE_LOADING_PULSE_EASE],
        onComplete: finish
      });
      return () => {
        cancelled = true;
        controls?.stop();
      };
    }
    if (mode === "exit") {
      const current = progress.get();
      if (current < 0.5) {
        const growDuration = halfCycleS * ((0.5 - current) / 0.5);
        controls = animate(progress, 0.5, {
          duration: Math.max(growDuration, 0.01),
          ease: [...LINE_LOADING_PULSE_EASE],
          onComplete: () => {
            if (!cancelled) {
              runShrink(0.5);
            }
          }
        });
      } else {
        runShrink(current);
      }
      return () => {
        cancelled = true;
        controls?.stop();
      };
    }
    if (mode === "enter") {
      progress.set(0);
      controls = animate(progress, 0.5, {
        duration: halfCycleS,
        ease: [...LINE_LOADING_PULSE_EASE],
        onComplete: finish
      });
      return () => {
        cancelled = true;
        controls?.stop();
      };
    }
  }, [innerWidth, loopEpoch, mode, onComplete, progress]);
  return { clipX, clipWidth };
}
function LineLoadingPulseStroke({
  pathD,
  mode = "loop",
  loopEpoch = 0,
  stroke = chartCssVars.foreground,
  strokeOpacity = 0.5,
  strokeWidth = 2.5,
  onCycleComplete
}) {
  const { innerWidth, innerHeight } = useChartStable();
  const reactId = useId();
  const clipPathId = `line-loading-clip-${reactId}`;
  const gradientId = `line-loading-gradient-${reactId}`;
  const fadeStops = fadeGradientStops(resolveFadeSides(true));
  const clipHeight = innerHeight + CLIP_PADDING * 2;
  const { clipX, clipWidth } = useGrowExitClip(
    innerWidth,
    mode,
    loopEpoch,
    onCycleComplete
  );
  if (innerWidth <= 0) {
    return null;
  }
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("defs", { children: [
      /* @__PURE__ */ jsx("clipPath", { id: clipPathId, children: /* @__PURE__ */ jsx(
        motion.rect,
        {
          height: clipHeight,
          style: { width: clipWidth, x: clipX },
          y: -CLIP_PADDING
        }
      ) }),
      /* @__PURE__ */ jsx(
        "linearGradient",
        {
          id: gradientId,
          ...viewportFadeGradientAttrs(innerWidth),
          children: fadeStops.map((stop) => /* @__PURE__ */ jsx(
            "stop",
            {
              offset: stop.offset,
              stopColor: stroke,
              stopOpacity: stop.opacity
            },
            stop.offset
          ))
        }
      )
    ] }),
    /* @__PURE__ */ jsx(
      "path",
      {
        clipPath: `url(#${clipPathId})`,
        d: pathD,
        fill: "none",
        opacity: strokeOpacity,
        stroke: `url(#${gradientId})`,
        strokeLinecap: "round",
        strokeWidth
      }
    )
  ] });
}
LineLoadingPulseStroke.displayName = "LineLoadingPulseStroke";
const DEFAULT_SWEEP_DURATION_S = 2;
const SWEEP_START_X = -1;
const SWEEP_END_X = 2;
const SWEEP_ANGLE_DEG = 25;
const HEIGHT_MIN_PCT = 20;
const HEIGHT_MAX_PCT = 80;
const DEFAULT_POINT_COUNT = 14;
const LINE_STROKE_OPACITY = 0.55;
const AREA_FILL_TOP_OPACITY = 0.18;
const AREA_FILL_BOTTOM_OPACITY = 0.02;
function hashFract(n) {
  const x = Math.sin(n) * 43758.5453;
  return x - Math.floor(x);
}
function getSkeletonHeights(count, seed = 0, min = HEIGHT_MIN_PCT, max = HEIGHT_MAX_PCT) {
  const range = max - min;
  return Array.from(
    { length: count },
    (_, i) => min + Math.floor(hashFract((i + 1) * 12.9898 + seed) * range)
  );
}
function generateEasedGradientStops(steps = 17, minOpacity = 0.05, maxOpacity = 0.9) {
  return Array.from({ length: steps }, (_, i) => {
    const t = i / (steps - 1);
    const eased = Math.sin(t * Math.PI) ** 2;
    const opacity = minOpacity + eased * (maxOpacity - minOpacity);
    return {
      offset: `${(t * 100).toFixed(0)}%`,
      opacity: Number(opacity.toFixed(3))
    };
  });
}
function LoadingSweepMask({
  chartId,
  width,
  height,
  durationSeconds,
  onSweepComplete
}) {
  const gradientStops = useMemo(() => generateEasedGradientStops(), []);
  const lastXRef = useRef(SWEEP_START_X);
  const handleUpdate = useCallback(
    (latest) => {
      const xValue = typeof latest.x === "number" ? latest.x : SWEEP_START_X;
      if (xValue >= 1 && lastXRef.current < 1) {
        onSweepComplete();
      }
      lastXRef.current = xValue;
    },
    [onSweepComplete]
  );
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("linearGradient", { id: `${chartId}-grad`, x1: "0", x2: "1", y1: "0", y2: "0", children: gradientStops.map(({ offset, opacity }) => /* @__PURE__ */ jsx(
      "stop",
      {
        offset,
        stopColor: "white",
        stopOpacity: opacity
      },
      offset
    )) }),
    /* @__PURE__ */ jsx(
      "pattern",
      {
        height: "1",
        id: `${chartId}-pattern`,
        patternContentUnits: "objectBoundingBox",
        patternTransform: `rotate(${SWEEP_ANGLE_DEG})`,
        patternUnits: "objectBoundingBox",
        width: 3,
        x: "0",
        y: "0",
        children: /* @__PURE__ */ jsx(
          motion.rect,
          {
            animate: { x: SWEEP_END_X },
            fill: `url(#${chartId}-grad)`,
            height: "1",
            initial: { x: SWEEP_START_X },
            onUpdate: handleUpdate,
            transition: {
              duration: durationSeconds,
              ease: "linear",
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "loop"
            },
            width: "1",
            y: "0"
          }
        )
      }
    ),
    /* @__PURE__ */ jsx("mask", { id: `${chartId}-mask`, maskUnits: "userSpaceOnUse", children: /* @__PURE__ */ jsx("rect", { fill: `url(#${chartId}-pattern)`, height, width }) })
  ] });
}
function LineLoadingSweep({
  curve,
  withArea = false,
  mode = "loop",
  onTransitionComplete,
  stroke = chartCssVars.foreground,
  strokeOpacity = LINE_STROKE_OPACITY,
  strokeWidth = 2,
  pointCount = DEFAULT_POINT_COUNT,
  durationSeconds = DEFAULT_SWEEP_DURATION_S
}) {
  const { innerWidth, innerHeight } = useChartStable();
  const reduceMotion = useReducedMotion();
  const reactId = useId();
  const chartId = `line-sweep-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const isLoop = mode === "loop";
  const [tick, setTick] = useState(0);
  const onSweepComplete = useCallback(() => {
    if (isLoop) {
      setTick((prev) => prev + 1);
    }
  }, [isLoop]);
  const heights = useMemo(
    () => getSkeletonHeights(pointCount, tick),
    [pointCount, tick]
  );
  useEffect(() => {
    if (reduceMotion && !isLoop) {
      onTransitionComplete?.();
    }
  }, [reduceMotion, isLoop, onTransitionComplete]);
  if (innerWidth <= 0 || innerHeight <= 0 || heights.length < 2) {
    return null;
  }
  const xScale = scaleLinear({
    domain: [0, heights.length - 1],
    range: [0, innerWidth]
  });
  const yScale = scaleLinear({ domain: [0, 100], range: [innerHeight, 0] });
  const points = heights.map((value, index) => ({ index, value }));
  const getX = (d) => xScale(d.index);
  const getY = (d) => yScale(d.value);
  const silhouette = /* @__PURE__ */ jsxs(Fragment, { children: [
    withArea ? /* @__PURE__ */ jsx(
      AreaClosed,
      {
        curve,
        data: points,
        fill: `url(#${chartId}-area)`,
        x: getX,
        y: getY,
        yScale
      }
    ) : null,
    /* @__PURE__ */ jsx(
      LinePath,
      {
        curve,
        data: points,
        fill: "none",
        stroke,
        strokeLinecap: "round",
        strokeOpacity,
        strokeWidth,
        x: getX,
        y: getY
      }
    )
  ] });
  const areaGradient = withArea ? /* @__PURE__ */ jsxs("linearGradient", { id: `${chartId}-area`, x1: "0", x2: "0", y1: "0", y2: "1", children: [
    /* @__PURE__ */ jsx(
      "stop",
      {
        offset: "0%",
        stopColor: stroke,
        stopOpacity: AREA_FILL_TOP_OPACITY
      }
    ),
    /* @__PURE__ */ jsx(
      "stop",
      {
        offset: "100%",
        stopColor: stroke,
        stopOpacity: AREA_FILL_BOTTOM_OPACITY
      }
    )
  ] }) : null;
  if (reduceMotion) {
    return /* @__PURE__ */ jsxs(Fragment, { children: [
      areaGradient ? /* @__PURE__ */ jsx("defs", { children: areaGradient }) : null,
      silhouette
    ] });
  }
  const maskUrl = `url(#${chartId}-mask)`;
  const defs = /* @__PURE__ */ jsxs("defs", { children: [
    areaGradient,
    /* @__PURE__ */ jsx(
      LoadingSweepMask,
      {
        chartId,
        durationSeconds,
        height: innerHeight,
        onSweepComplete,
        width: innerWidth
      }
    )
  ] });
  if (isLoop) {
    return /* @__PURE__ */ jsxs(Fragment, { children: [
      defs,
      /* @__PURE__ */ jsx("g", { mask: maskUrl, children: silhouette })
    ] });
  }
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    defs,
    /* @__PURE__ */ jsx(
      motion.g,
      {
        animate: { opacity: mode === "exit" ? 0 : 1 },
        initial: { opacity: mode === "exit" ? 1 : 0 },
        mask: maskUrl,
        onAnimationComplete: onTransitionComplete,
        transition: {
          duration: LOADING_LABEL_EXIT_S,
          ease: [...LINE_LOADING_PULSE_EASE]
        },
        children: silhouette
      }
    )
  ] });
}
LineLoadingSweep.displayName = "LineLoadingSweep";
const EMPTY_METRICS = { pathD: null, pathLength: 0 };
function usePathStrokeMetrics(pathRef, deps) {
  const [metrics, setMetrics] = useState(EMPTY_METRICS);
  useEffect(() => {
    const path = pathRef.current;
    if (!path) {
      return;
    }
    const d = path.getAttribute("d");
    const len = d ? path.getTotalLength() : 0;
    setMetrics(
      (prev) => prev.pathD === d && prev.pathLength === len ? prev : { pathD: d, pathLength: len }
    );
  }, deps);
  return metrics;
}
function resolveDashTailBounds(dashFromIndex, dataLength) {
  return dashFromIndex != null && dashFromIndex >= 0 && dashFromIndex < dataLength - 1;
}
function resolveDashStartX(data, dashFromIndex, xScale, xAccessor) {
  const dashFromPoint = data[dashFromIndex];
  if (!dashFromPoint) {
    return 0;
  }
  return xScale(xAccessor(dashFromPoint)) ?? 0;
}
function DashTailStroke({
  pathD,
  pathLength,
  dashStartLength,
  dashStartX,
  innerWidth,
  innerHeight,
  stroke,
  strokeWidth,
  dashArray
}) {
  const clipPathId = useId().replace(/:/g, "");
  if (!pathD || pathLength <= 0 || dashStartLength >= pathLength) {
    return null;
  }
  const pad = strokeWidth * 2;
  const tailWidth = Math.max(0, innerWidth - dashStartX + pad);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsx("clipPath", { id: clipPathId, children: /* @__PURE__ */ jsx(
      "rect",
      {
        height: innerHeight + pad,
        width: tailWidth,
        x: dashStartX - strokeWidth,
        y: -strokeWidth
      }
    ) }) }),
    /* @__PURE__ */ jsx(
      "path",
      {
        d: pathD,
        fill: "none",
        stroke,
        strokeDasharray: `${dashStartLength} ${Math.max(1, pathLength - dashStartLength)}`,
        strokeLinecap: "round",
        strokeWidth
      }
    ),
    /* @__PURE__ */ jsx(
      "path",
      {
        clipPath: `url(#${clipPathId})`,
        d: pathD,
        fill: "none",
        stroke,
        strokeDasharray: dashArray,
        strokeLinecap: "round",
        strokeWidth
      }
    )
  ] });
}
function SeriesDashTailOverlayImpl({
  dashFromIndex,
  dashArray,
  data,
  pathD,
  pathLength,
  innerWidth,
  innerHeight,
  stroke,
  strokeWidth,
  xScale,
  xAccessor
}) {
  const hasDashTail = resolveDashTailBounds(dashFromIndex, data.length);
  const dashStartX = useMemo(() => {
    if (!hasDashTail || dashFromIndex == null) {
      return 0;
    }
    return resolveDashStartX(data, dashFromIndex, xScale, xAccessor);
  }, [hasDashTail, dashFromIndex, data, xScale, xAccessor]);
  const dashStartLength = useMemo(() => {
    if (!hasDashTail || dashFromIndex == null || pathLength <= 0) {
      return 0;
    }
    return dashFromIndex / Math.max(1, data.length - 1) * pathLength;
  }, [hasDashTail, dashFromIndex, data.length, pathLength]);
  if (!hasDashTail || dashFromIndex == null || pathLength <= 0) {
    return null;
  }
  return /* @__PURE__ */ jsx(
    DashTailStroke,
    {
      dashArray,
      dashStartLength,
      dashStartX,
      innerHeight,
      innerWidth,
      pathD,
      pathLength,
      stroke,
      strokeWidth
    }
  );
}
const SeriesDashTailOverlay = memo(SeriesDashTailOverlayImpl);
function HighlightSegment({
  pathRef,
  visible,
  stroke,
  strokeWidth,
  height,
  x,
  width
}) {
  const clipId = useId();
  if (!(visible && pathRef.current)) {
    return null;
  }
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsx("clipPath", { id: clipId, children: /* @__PURE__ */ jsx(motion.rect, { height, width, x, y: 0 }) }) }),
    /* @__PURE__ */ jsx(
      motion.path,
      {
        animate: { opacity: 1 },
        clipPath: `url(#${clipId})`,
        d: pathRef.current.getAttribute("d") || "",
        exit: { opacity: 0 },
        fill: "none",
        initial: { opacity: 0 },
        stroke,
        strokeLinecap: "round",
        strokeWidth,
        transition: { duration: 0.4, ease: "easeInOut" }
      }
    )
  ] });
}
HighlightSegment.displayName = "HighlightSegment";
const DEFAULT_CHART_CONFIG = {
  tooltipSpring: { stiffness: 300, damping: 30 },
  tooltipBoxSpring: { stiffness: 100, damping: 20 },
  highlightSpring: { stiffness: 180, damping: 28 }
};
const ChartConfigContext = createContext(null);
function useChartConfig() {
  return useContext(ChartConfigContext) ?? DEFAULT_CHART_CONFIG;
}
const DEFAULT_TOOLTIP_BOX_DAMPING = DEFAULT_CHART_CONFIG.tooltipBoxSpring.damping;
function resolveTooltipBoxMotion(damping) {
  if (damping === 0) {
    return {
      animate: false,
      springConfig: DEFAULT_CHART_CONFIG.tooltipBoxSpring
    };
  }
  const effectiveDamping = damping ?? DEFAULT_TOOLTIP_BOX_DAMPING;
  let stiffness = DEFAULT_CHART_CONFIG.tooltipBoxSpring.stiffness;
  if (effectiveDamping < DEFAULT_TOOLTIP_BOX_DAMPING) {
    const t = (DEFAULT_TOOLTIP_BOX_DAMPING - effectiveDamping) / DEFAULT_TOOLTIP_BOX_DAMPING;
    stiffness += t * 400;
  } else if (effectiveDamping > DEFAULT_TOOLTIP_BOX_DAMPING) {
    const t = (effectiveDamping - DEFAULT_TOOLTIP_BOX_DAMPING) / (100 - DEFAULT_TOOLTIP_BOX_DAMPING);
    stiffness -= t * 85;
  }
  return {
    animate: true,
    springConfig: {
      stiffness: Math.max(12, Math.round(stiffness)),
      damping: effectiveDamping
    }
  };
}
const INACTIVE_SEGMENT = {
  x: 0,
  width: 0,
  isActive: false
};
function computeSegmentBounds(data, xScale, xAccessor, tooltipData, selection) {
  if (data.length === 0) {
    return INACTIVE_SEGMENT;
  }
  if (selection?.active) {
    const x = Math.min(selection.startX, selection.endX);
    const width = Math.abs(selection.endX - selection.startX);
    return { x, width, isActive: true };
  }
  if (!tooltipData) {
    return INACTIVE_SEGMENT;
  }
  const idx = tooltipData.index;
  const startIdx = Math.max(0, idx - 1);
  const endIdx = Math.min(data.length - 1, idx + 1);
  const startPoint = data[startIdx];
  const endPoint = data[endIdx];
  if (!(startPoint && endPoint)) {
    return INACTIVE_SEGMENT;
  }
  const startX = xScale(xAccessor(startPoint)) ?? 0;
  const endX = xScale(xAccessor(endPoint)) ?? 0;
  return { x: startX, width: Math.max(0, endX - startX), isActive: true };
}
function useHighlightSegment({
  enabled = true
} = {}) {
  const { data, xScale, xAccessor } = useChartStable();
  const { tooltipData, selection } = useChartHover();
  const { highlightSpring } = useChartConfig();
  const bounds = useMemo(
    () => enabled ? computeSegmentBounds(data, xScale, xAccessor, tooltipData, selection) : INACTIVE_SEGMENT,
    [enabled, data, xScale, xAccessor, tooltipData, selection]
  );
  const xSpring = useSpring(0, highlightSpring);
  const widthSpring = useSpring(0, highlightSpring);
  const wasActive = useRef(false);
  if (bounds.isActive && !wasActive.current) {
    xSpring.jump(bounds.x);
    widthSpring.jump(bounds.width);
  } else {
    xSpring.set(bounds.x);
    widthSpring.set(bounds.width);
  }
  wasActive.current = bounds.isActive;
  return { xSpring, widthSpring, isActive: bounds.isActive };
}
function SeriesHighlightLayer({
  enabled,
  height,
  pathRef,
  stroke,
  strokeWidth
}) {
  const { isLoaded } = useChartStable();
  const { xSpring, widthSpring, isActive } = useHighlightSegment({ enabled });
  return /* @__PURE__ */ jsx(
    HighlightSegment,
    {
      height,
      pathRef,
      stroke,
      strokeWidth,
      visible: enabled && isActive && isLoaded,
      width: widthSpring,
      x: xSpring
    }
  );
}
SeriesHighlightLayer.displayName = "SeriesHighlightLayer";
const ChartLegendHoverContext = createContext(null);
function useChartLegendHover() {
  const context = useContext(ChartLegendHoverContext);
  return context ?? {
    hoveredIndex: null,
    setHoveredIndex: () => {
    }
  };
}
function SeriesHoverDim({
  enabled = true,
  dimOpacity = 0.5,
  durationSec = 0.4,
  seriesIndex,
  children
}) {
  const { tooltipData, selection } = useChartHover();
  const { hoveredIndex: legendHoveredIndex } = useChartLegendHover();
  const isChartHovering = tooltipData !== null || selection?.active === true;
  const isLegendDimmed = legendHoveredIndex !== null && seriesIndex !== void 0 && legendHoveredIndex !== seriesIndex;
  const opacity = enabled && (isChartHovering || isLegendDimmed) ? dimOpacity : 1;
  return /* @__PURE__ */ jsx(
    motion.g,
    {
      animate: { opacity },
      initial: { opacity: 1 },
      transition: { duration: durationSec, ease: "easeInOut" },
      children
    }
  );
}
SeriesHoverDim.displayName = "SeriesHoverDim";
const DEFAULT_ANIMATION_EASING = "cubic-bezier(0.85, 0, 0.15, 1)";
const DEFAULT_ANIMATION_DURATION_MS = 1100;
const DEFAULT_CHART_ENTER_TRANSITION = {
  type: "tween",
  duration: DEFAULT_ANIMATION_DURATION_MS / 1e3,
  ease: [0.85, 0, 0.15, 1]
};
function clipRevealTransition(enterTransition) {
  if (enterTransition?.type === "tween") {
    return {
      ...enterTransition,
      ease: enterTransition.ease ?? DEFAULT_CHART_ENTER_TRANSITION.ease
    };
  }
  const duration = typeof enterTransition?.duration === "number" ? enterTransition.duration : DEFAULT_ANIMATION_DURATION_MS / 1e3;
  return {
    type: "tween",
    duration,
    ease: DEFAULT_CHART_ENTER_TRANSITION.ease
  };
}
function MarkerCircles({
  fill,
  stroke,
  strokeWidth,
  ringGap,
  outlineWidth,
  outlineColor,
  radius
}) {
  const resolvedStroke = stroke ?? fill ?? "currentColor";
  const resolvedOutlineColor = outlineColor ?? resolvedStroke;
  const ringOuter = strokeWidth > 0 ? radius + ringGap + strokeWidth : radius;
  const outlineRadius = outlineWidth > 0 ? ringOuter + outlineWidth / 2 : 0;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    outlineWidth > 0 ? /* @__PURE__ */ jsx(
      "circle",
      {
        cx: 0,
        cy: 0,
        fill: "none",
        r: outlineRadius,
        stroke: resolvedOutlineColor,
        strokeWidth: outlineWidth
      }
    ) : null,
    /* @__PURE__ */ jsx("circle", { cx: 0, cy: 0, fill, r: radius }),
    strokeWidth > 0 ? /* @__PURE__ */ jsx(
      "circle",
      {
        cx: 0,
        cy: 0,
        fill: "none",
        r: radius + ringGap + strokeWidth / 2,
        stroke: resolvedStroke,
        strokeWidth
      }
    ) : null
  ] });
}
const StaticSeriesPointMarker = memo(function StaticSeriesPointMarker2({
  cx,
  cy,
  scale = 1,
  fill,
  stroke,
  strokeWidth = 2,
  ringGap = 2,
  outlineWidth = 0,
  outlineColor,
  radius = 5
}) {
  return /* @__PURE__ */ jsx("g", { transform: `translate(${cx}, ${cy}) scale(${scale})`, children: /* @__PURE__ */ jsx(
    MarkerCircles,
    {
      fill,
      outlineColor,
      outlineWidth,
      radius,
      ringGap,
      stroke,
      strokeWidth
    }
  ) });
});
function SeriesPointMarker({
  dataKey,
  index,
  cx,
  cy,
  enterBlur = 2,
  revealDelay,
  revealEpoch,
  enterDuration,
  fill,
  stroke,
  strokeWidth = 2,
  ringGap = 2,
  outlineWidth = 0,
  outlineColor,
  radius = 5
}) {
  const variants = {
    hidden: {
      opacity: 0,
      filter: `blur(${enterBlur}px)`,
      scale: 1
    },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      scale: 1,
      transition: {
        delay: revealDelay,
        duration: enterDuration,
        ease: DEFAULT_CHART_ENTER_TRANSITION.ease
      }
    }
  };
  return /* @__PURE__ */ jsx("g", { transform: `translate(${cx}, ${cy})`, children: /* @__PURE__ */ jsx(
    motion.g,
    {
      animate: "visible",
      initial: "hidden",
      variants,
      children: /* @__PURE__ */ jsx(
        MarkerCircles,
        {
          fill,
          outlineColor,
          outlineWidth,
          radius,
          ringGap,
          stroke,
          strokeWidth
        }
      )
    },
    `${dataKey}-${index}-${revealEpoch}`
  ) });
}
function getSeriesMarkerVisualExtent(style) {
  const radius = style.radius ?? 5;
  const strokeWidth = style.strokeWidth ?? 2;
  const ringGap = style.ringGap ?? 2;
  const outlineWidth = style.outlineWidth ?? 0;
  const showActiveHighlight = style.showActiveHighlight ?? true;
  const ring = strokeWidth > 0 ? ringGap + strokeWidth : 0;
  const outline = outlineWidth > 0 ? outlineWidth : 0;
  const highlightPad = showActiveHighlight ? radius * 0.35 : 0;
  return radius + ring + outline + highlightPad + 2;
}
function SeriesMarkers({
  dataKey,
  fill,
  stroke,
  strokeWidth = 2,
  ringGap = 2,
  outlineWidth = 0,
  outlineColor,
  radius = 5,
  animate: animate2 = true,
  fadeOnHover = true,
  inactiveOpacity = 0.5,
  inactiveBlur = 2,
  enterBlur = 2,
  showActiveHighlight = true
}) {
  const {
    data,
    xScale,
    innerWidth,
    enterTransition,
    animationDuration,
    revealEpoch,
    isLoaded,
    xAccessor,
    lines
  } = useChartStable();
  const seriesIndex = useMemo(() => {
    const index = lines.findIndex((line2) => line2.dataKey === dataKey);
    return index >= 0 ? index : 0;
  }, [lines, dataKey]);
  const seriesConfig = lines[seriesIndex];
  const yScale = useYScale(seriesConfig?.yAxisId);
  const seriesColor = defaultScatterColors[seriesIndex % defaultScatterColors.length] ?? defaultScatterColors[0];
  const resolvedFill = fill ?? seriesConfig?.stroke ?? seriesColor;
  const resolvedStroke = stroke ?? resolvedFill;
  const visualExtent = useMemo(
    () => getSeriesMarkerVisualExtent({
      radius,
      strokeWidth,
      ringGap,
      outlineWidth,
      showActiveHighlight
    }),
    [radius, strokeWidth, ringGap, outlineWidth, showActiveHighlight]
  );
  const revealDurationSec = clipRevealTransition(enterTransition).duration ?? animationDuration / 1e3;
  const enterDuration = 0.5;
  const isRevealing = animate2 && !isLoaded;
  const getY = useCallback(
    (d) => {
      const value = d[dataKey];
      return typeof value === "number" ? yScale(value) ?? 0 : null;
    },
    [dataKey, yScale]
  );
  const points = useMemo(
    () => data.flatMap((d, index) => {
      const cy = getY(d);
      if (cy === null) {
        return [];
      }
      const cx = xScale(xAccessor(d)) ?? 0;
      const leadingEdge = Math.max(0, cx - visualExtent);
      const revealDelay = innerWidth > 0 && isRevealing ? leadingEdge / innerWidth * revealDurationSec : 0;
      return [{ index, cx, cy, revealDelay }];
    }),
    [
      data,
      getY,
      xScale,
      xAccessor,
      innerWidth,
      isRevealing,
      revealDurationSec,
      visualExtent
    ]
  );
  const markerStyle = useMemo(
    () => ({
      fill: resolvedFill,
      stroke: resolvedStroke,
      strokeWidth,
      ringGap,
      outlineWidth,
      outlineColor,
      radius
    }),
    [
      resolvedFill,
      resolvedStroke,
      strokeWidth,
      ringGap,
      outlineWidth,
      outlineColor,
      radius
    ]
  );
  if (isRevealing) {
    return /* @__PURE__ */ jsx("g", { children: points.map((point) => /* @__PURE__ */ jsx(
      SeriesPointMarker,
      {
        cx: point.cx,
        cy: point.cy,
        dataKey,
        enterBlur,
        enterDuration,
        index: point.index,
        revealDelay: point.revealDelay,
        revealEpoch: revealEpoch ?? 0,
        ...markerStyle
      },
      `${dataKey}-${point.index}`
    )) });
  }
  const baseMarkers = points.map((point) => /* @__PURE__ */ jsx(
    StaticSeriesPointMarker,
    {
      cx: point.cx,
      cy: point.cy,
      ...markerStyle
    },
    `${dataKey}-${point.index}`
  ));
  const activeScale = showActiveHighlight ? 1.35 : 1;
  return /* @__PURE__ */ jsxs("g", { children: [
    /* @__PURE__ */ jsx(
      SeriesMarkersDimWrapper,
      {
        enabled: fadeOnHover,
        inactiveBlur,
        inactiveOpacity,
        seriesIndex,
        children: baseMarkers
      }
    ),
    /* @__PURE__ */ jsx(
      SeriesMarkersActiveHighlight,
      {
        activeScale,
        enabled: fadeOnHover,
        markerStyle,
        points
      }
    )
  ] });
}
SeriesMarkers.displayName = "SeriesMarkers";
function SeriesMarkersDimWrapper({
  enabled,
  inactiveOpacity,
  inactiveBlur,
  seriesIndex,
  children
}) {
  const { tooltipData } = useChartHover();
  const { hoveredIndex: legendHoveredIndex } = useChartLegendHover();
  const isLegendDimmed = legendHoveredIndex !== null && legendHoveredIndex !== seriesIndex;
  const dimBase = enabled && (tooltipData !== null || isLegendDimmed);
  return /* @__PURE__ */ jsx(
    "g",
    {
      opacity: dimBase ? inactiveOpacity : 1,
      style: {
        transition: "opacity 0.15s ease-in-out, filter 0.15s ease-in-out",
        filter: dimBase && inactiveBlur > 0 ? `blur(${inactiveBlur}px)` : "none"
      },
      children
    }
  );
}
function SeriesMarkersActiveHighlight({
  enabled,
  points,
  markerStyle,
  activeScale
}) {
  const { tooltipData } = useChartHover();
  if (!enabled || tooltipData === null) {
    return null;
  }
  const activePoint = points.find((point) => point.index === tooltipData.index);
  if (!activePoint) {
    return null;
  }
  return /* @__PURE__ */ jsx(
    StaticSeriesPointMarker,
    {
      cx: activePoint.cx,
      cy: activePoint.cy,
      scale: activeScale,
      ...markerStyle
    }
  );
}
function useAreaLoadingPulseState(chartPhase, loading, loadingPulseMode, notifyLoadingPulseComplete) {
  const phasePulseMode = resolveLineLoadingPulseMode(chartPhase);
  const pulseMode = loading === false ? null : loadingPulseMode ?? (loading === true ? "loop" : phasePulseMode);
  const showLoadingPulse = pulseMode != null;
  const showSeriesContent = chartPhase === "revealing" || chartPhase === "ready" || chartPhase === "exitingReady";
  const [pulseEpoch, setPulseEpoch] = useState(0);
  const handleLoadingPulseComplete = useCallback(() => {
    if (pulseMode === "loop") {
      window.setTimeout(() => {
        setPulseEpoch((epoch) => epoch + 1);
      }, LINE_LOADING_LOOP_PAUSE_MS);
      return;
    }
    notifyLoadingPulseComplete?.();
  }, [notifyLoadingPulseComplete, pulseMode]);
  return {
    handleLoadingPulseComplete,
    pulseMode,
    pulseEpoch,
    showLoadingPulse,
    showSeriesContent
  };
}
function Area({
  dataKey,
  yAxisId,
  fill = chartCssVars.linePrimary,
  fillOpacity = 0.4,
  stroke,
  strokeWidth = 2,
  curve = curveMonotoneX,
  animate: animate2 = true,
  showLine = true,
  showHighlight = true,
  gradientToOpacity = 0,
  gradientSpan = 1,
  fadeEdges = false,
  showMarkers = false,
  markers,
  dashFromIndex,
  dashArray = "6,4",
  loading,
  loadingStroke = chartCssVars.foreground,
  loadingStrokeOpacity = 0.5,
  loadingPulseMode,
  loadingStyle = "pulse"
}) {
  const {
    data,
    renderData,
    xScale,
    innerHeight,
    innerWidth,
    xAccessor,
    lines,
    chartPhase,
    notifyLoadingPulseComplete
  } = useChartStable();
  const yScale = useYScale(yAxisId);
  const {
    handleLoadingPulseComplete,
    pulseMode,
    pulseEpoch,
    showLoadingPulse,
    showSeriesContent
  } = useAreaLoadingPulseState(
    chartPhase,
    loading,
    loadingPulseMode,
    notifyLoadingPulseComplete
  );
  const seriesIndex = useMemo(() => {
    const index = lines.findIndex((line2) => line2.dataKey === dataKey);
    return index >= 0 ? index : 0;
  }, [lines, dataKey]);
  const pathRef = useRef(null);
  const { pathLength, pathD } = usePathStrokeMetrics(pathRef, [
    renderData,
    innerWidth,
    dashFromIndex,
    showLine,
    showSeriesContent,
    showLoadingPulse
  ]);
  const uniqueId = useId();
  const gradientId = `area-gradient-${dataKey}-${uniqueId}`;
  const strokeGradientId = `area-stroke-gradient-${dataKey}-${uniqueId}`;
  const edgeMaskId = `area-edge-mask-${dataKey}-${uniqueId}`;
  const edgeGradientId = `${edgeMaskId}-gradient`;
  const isPatternFill = fill.startsWith("url(");
  const showAreaFill = isPatternFill || fillOpacity > 0;
  const areaFill = isPatternFill ? fill : `url(#${gradientId})`;
  const resolvedStroke = stroke || (isPatternFill ? chartCssVars.linePrimary : fill);
  const getY = useCallback(
    (d) => {
      const value = d[dataKey];
      return typeof value === "number" ? yScale(value) ?? 0 : 0;
    },
    [dataKey, yScale]
  );
  const hasDashTail = resolveDashTailBounds(dashFromIndex, data.length);
  const fadeSides = resolveFadeSides(fadeEdges);
  const useViewportEdgeFade = fadeSides.any && !isPatternFill;
  let strokePaint = resolvedStroke;
  if (!useViewportEdgeFade && fadeSides.any) {
    strokePaint = `url(#${strokeGradientId})`;
  }
  const highlightEnabled = showHighlight && showLine && !showLoadingPulse && showSeriesContent;
  const showSeriesStroke = showSeriesContent && showLine;
  let visibleStroke = "transparent";
  if (showSeriesStroke && !hasDashTail) {
    visibleStroke = strokePaint;
  }
  const shouldMeasurePath = showLine && (showSeriesContent || showLoadingPulse);
  const seriesLayers = /* @__PURE__ */ jsxs(Fragment, { children: [
    showSeriesContent && showAreaFill ? /* @__PURE__ */ jsx(
      AreaClosed,
      {
        curve,
        data: renderData,
        fill: areaFill,
        x: (d) => xScale(xAccessor(d)) ?? 0,
        y: getY,
        yScale
      }
    ) : null,
    shouldMeasurePath ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(
        LinePath,
        {
          curve,
          data: renderData,
          innerRef: pathRef,
          stroke: visibleStroke,
          strokeLinecap: "round",
          strokeWidth,
          x: (d) => xScale(xAccessor(d)) ?? 0,
          y: getY
        }
      ),
      showSeriesStroke ? /* @__PURE__ */ jsx(
        SeriesDashTailOverlay,
        {
          dashArray,
          dashFromIndex,
          data,
          innerHeight,
          innerWidth,
          pathD,
          pathLength,
          stroke: strokePaint,
          strokeWidth,
          xAccessor,
          xScale
        }
      ) : null
    ] }) : null
  ] });
  const sweepLoading = showLoadingPulse && innerWidth > 0 && loadingStyle === "sweep";
  const pulseLoading = showLoadingPulse && innerWidth > 0 && !sweepLoading;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      AreaGradientDefs,
      {
        edgeGradientId,
        edgeMaskId,
        fadeEdges,
        fill,
        fillOpacity,
        gradientId,
        gradientSpan,
        gradientToOpacity,
        innerHeight,
        innerWidth,
        isPatternFill,
        resolvedStroke,
        strokeGradientId
      }
    ),
    /* @__PURE__ */ jsx(
      SeriesHoverDim,
      {
        dimOpacity: 0.6,
        enabled: showHighlight,
        seriesIndex,
        children: useViewportEdgeFade ? /* @__PURE__ */ jsx("g", { mask: `url(#${edgeMaskId})`, children: seriesLayers }) : seriesLayers
      }
    ),
    /* @__PURE__ */ jsx(
      SeriesHighlightLayer,
      {
        enabled: highlightEnabled,
        height: innerHeight,
        pathRef,
        stroke: resolvedStroke,
        strokeWidth
      }
    ),
    showMarkers && showSeriesContent ? /* @__PURE__ */ jsx(
      SeriesMarkers,
      {
        animate: animate2,
        dataKey,
        ...markers,
        fill: markers?.fill ?? resolvedStroke,
        stroke: markers?.stroke ?? markers?.fill ?? resolvedStroke
      }
    ) : null,
    sweepLoading ? /* @__PURE__ */ jsx(
      LineLoadingSweep,
      {
        curve,
        mode: pulseMode ?? "loop",
        onTransitionComplete: handleLoadingPulseComplete,
        stroke: loadingStroke,
        strokeOpacity: loadingStrokeOpacity,
        strokeWidth,
        withArea: true
      },
      "loading-sweep"
    ) : null,
    pulseLoading && pathD ? /* @__PURE__ */ jsx(
      LineLoadingPulseStroke,
      {
        loopEpoch: pulseEpoch,
        mode: pulseMode ?? void 0,
        onCycleComplete: handleLoadingPulseComplete,
        pathD,
        stroke: loadingStroke,
        strokeOpacity: loadingStrokeOpacity,
        strokeWidth
      },
      "loading-pulse"
    ) : null
  ] });
}
Area.displayName = "Area";
function computeSeriesPathPoints(data, xAccessor, xScale, yScale, dataKey) {
  return data.map((datum, index) => {
    const xValue = xAccessor(datum);
    const yValue = datum[dataKey];
    return {
      x: xScale(xValue) ?? 0,
      y: typeof yValue === "number" ? yScale(yValue) ?? 0 : 0,
      key: String(xValue.getTime?.() ?? index)
    };
  });
}
function interpolateSeriesPathPoints(from, to, progress) {
  if (progress >= 1) {
    return to;
  }
  if (progress <= 0) {
    return from.length > 0 ? from : to;
  }
  const fromByKey = new Map(from.map((point) => [point.key, point]));
  return to.map((target, index) => {
    const source = fromByKey.get(target.key);
    if (source) {
      return {
        key: target.key,
        x: source.x + (target.x - source.x) * progress,
        y: source.y + (target.y - source.y) * progress
      };
    }
    const previousTarget = index > 0 ? to[index - 1] : void 0;
    const previousSource = previousTarget ? fromByKey.get(previousTarget.key) : void 0;
    const nextTarget = index < to.length - 1 ? to[index + 1] : void 0;
    const nextSource = nextTarget ? fromByKey.get(nextTarget.key) : void 0;
    const anchor = previousSource ?? nextSource ?? from[0] ?? target;
    return {
      key: target.key,
      x: anchor.x + (target.x - anchor.x) * progress,
      y: anchor.y + (target.y - anchor.y) * progress
    };
  });
}
function seriesPathFromPoints(points, curve) {
  if (points.length === 0) {
    return "";
  }
  const generator = line().x((point) => point.x).y((point) => point.y).curve(curve);
  return generator(points) ?? "";
}
function seriesPathTransitionSignature({
  renderData,
  xAccessor,
  dataKey,
  innerWidth,
  xDomainMin,
  xDomainMax
}) {
  const values = renderData.map((datum) => {
    const xValue = xAccessor(datum);
    const yValue = datum[dataKey];
    return `${xValue.getTime()}:${typeof yValue === "number" ? yValue : ""}`;
  });
  return `${innerWidth}|${xDomainMin}|${xDomainMax}|${values.join(",")}`;
}
function useAnimatedSeriesPath({
  renderData,
  xAccessor,
  xScale,
  yScale,
  dataKey,
  curve,
  chartPhase,
  durationMs,
  innerWidth,
  enabled
}) {
  const reducedMotion = useReducedMotion();
  const [animatedPoints, setAnimatedPoints] = useState(null);
  const displayedPointsRef = useRef(null);
  const animatingRef = useRef(false);
  const xScaleDomain = useMemo(() => {
    const scaleWithDomain = xScale;
    return scaleWithDomain.domain?.() ?? [/* @__PURE__ */ new Date(0), /* @__PURE__ */ new Date(0)];
  }, [xScale]);
  const transitionSignature = useMemo(
    () => seriesPathTransitionSignature({
      renderData,
      xAccessor,
      dataKey,
      innerWidth,
      xDomainMin: xScaleDomain[0]?.getTime?.() ?? 0,
      xDomainMax: xScaleDomain[1]?.getTime?.() ?? 0
    }),
    [renderData, xAccessor, dataKey, innerWidth, xScaleDomain]
  );
  const targetPoints = useMemo(
    () => computeSeriesPathPoints(renderData, xAccessor, xScale, yScale, dataKey),
    [renderData, xAccessor, xScale, yScale, dataKey]
  );
  const prevTransitionSignatureRef = useRef(transitionSignature);
  useEffect(() => {
    if (!animatingRef.current) {
      displayedPointsRef.current = targetPoints;
    }
  }, [targetPoints]);
  useEffect(() => {
    const shouldAnimate = enabled && !reducedMotion && chartPhase === "ready" && durationMs > 0 && renderData.length > 0;
    if (!shouldAnimate) {
      animatingRef.current = false;
      setAnimatedPoints(null);
      displayedPointsRef.current = targetPoints;
      prevTransitionSignatureRef.current = transitionSignature;
      return;
    }
    if (prevTransitionSignatureRef.current === transitionSignature) {
      return;
    }
    prevTransitionSignatureRef.current = transitionSignature;
    const fromPoints = displayedPointsRef.current ?? targetPoints;
    if (fromPoints.length === 0) {
      displayedPointsRef.current = targetPoints;
      return;
    }
    animatingRef.current = true;
    const fromSnapshot = fromPoints;
    const control = animate(0, 1, {
      duration: durationMs / 1e3,
      ease: [...LINE_LOADING_PULSE_EASE],
      onUpdate: (progress) => {
        const currentTarget = computeSeriesPathPoints(
          renderData,
          xAccessor,
          xScale,
          yScale,
          dataKey
        );
        const next = interpolateSeriesPathPoints(
          fromSnapshot,
          currentTarget,
          progress
        );
        displayedPointsRef.current = next;
        setAnimatedPoints(next);
      },
      onComplete: () => {
        animatingRef.current = false;
        displayedPointsRef.current = targetPoints;
        setAnimatedPoints(null);
      }
    });
    return () => {
      control.stop();
      animatingRef.current = false;
    };
  }, [
    transitionSignature,
    chartPhase,
    durationMs,
    enabled,
    reducedMotion,
    renderData,
    xAccessor,
    xScale,
    yScale,
    dataKey,
    targetPoints
  ]);
  const activePoints = animatedPoints ?? targetPoints;
  const pathD = useMemo(
    () => seriesPathFromPoints(activePoints, curve),
    [activePoints, curve]
  );
  return {
    pathD,
    isPathAnimating: animatedPoints != null
  };
}
function LineSeriesStroke({
  animatedPathD,
  curve,
  getY,
  pathRef,
  renderData,
  strokeWidth,
  useDataTransitionPath,
  visibleStroke,
  xAccessor,
  xScale
}) {
  if (useDataTransitionPath && animatedPathD) {
    return /* @__PURE__ */ jsx(
      "path",
      {
        d: animatedPathD,
        fill: "none",
        ref: pathRef,
        stroke: visibleStroke,
        strokeLinecap: "round",
        strokeWidth
      }
    );
  }
  return /* @__PURE__ */ jsx(
    LinePath,
    {
      curve,
      data: renderData,
      innerRef: pathRef,
      stroke: visibleStroke,
      strokeLinecap: "round",
      strokeWidth,
      x: (d) => xScale(xAccessor(d)) ?? 0,
      y: getY
    }
  );
}
function LineLoadingOverlays({
  curve,
  handleLoadingPulseComplete,
  innerWidth,
  loadingStroke,
  loadingStrokeOpacity,
  loadingStyle,
  pathD,
  pulseEpoch,
  pulseMode,
  showLoadingPulse,
  strokeWidth
}) {
  const sweepLoading = showLoadingPulse && innerWidth > 0 && loadingStyle === "sweep";
  const pulseLoading = showLoadingPulse && innerWidth > 0 && !sweepLoading;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    sweepLoading ? /* @__PURE__ */ jsx(
      LineLoadingSweep,
      {
        curve,
        mode: pulseMode ?? "loop",
        onTransitionComplete: handleLoadingPulseComplete,
        stroke: loadingStroke,
        strokeOpacity: loadingStrokeOpacity,
        strokeWidth
      },
      "loading-sweep"
    ) : null,
    pulseLoading && pathD ? /* @__PURE__ */ jsx(
      LineLoadingPulseStroke,
      {
        loopEpoch: pulseEpoch,
        mode: pulseMode ?? void 0,
        onCycleComplete: handleLoadingPulseComplete,
        pathD,
        stroke: loadingStroke,
        strokeOpacity: loadingStrokeOpacity,
        strokeWidth
      },
      "loading-pulse"
    ) : null
  ] });
}
function Line({
  dataKey,
  yAxisId,
  stroke = chartCssVars.linePrimary,
  strokeWidth = 2.5,
  curve = curveNatural,
  animate: animate2 = true,
  fadeEdges = true,
  showHighlight = true,
  showMarkers = false,
  markers,
  dashFromIndex,
  dashArray = "6,4",
  loading,
  loadingStroke = chartCssVars.foreground,
  loadingStrokeOpacity = 0.5,
  loadingPulseMode,
  onLoadingPulseCycleComplete,
  loadingStyle = "pulse"
}) {
  const {
    data,
    renderData,
    xScale,
    innerHeight,
    innerWidth,
    xAccessor,
    lines,
    chartPhase,
    notifyLoadingPulseComplete,
    yDomainTweenDuration
  } = useChartStable();
  const yScale = useYScale(yAxisId);
  const useDataTransitionPath = animate2 && chartPhase === "ready";
  const { pathD: animatedPathD } = useAnimatedSeriesPath({
    chartPhase,
    curve,
    dataKey,
    durationMs: yDomainTweenDuration,
    enabled: useDataTransitionPath,
    innerWidth,
    renderData,
    xAccessor,
    xScale,
    yScale
  });
  const phasePulseMode = resolveLineLoadingPulseMode(chartPhase);
  const pulseMode = loading === false ? null : loadingPulseMode ?? (loading === true ? "loop" : phasePulseMode);
  const showLoadingPulse = pulseMode != null;
  const [pulseEpoch, setPulseEpoch] = useState(0);
  const effectiveShowHighlight = showHighlight && !showLoadingPulse;
  const handleLoadingPulseComplete = useCallback(() => {
    onLoadingPulseCycleComplete?.();
    if (pulseMode === "loop") {
      window.setTimeout(() => {
        setPulseEpoch((epoch) => epoch + 1);
      }, LINE_LOADING_LOOP_PAUSE_MS);
      return;
    }
    notifyLoadingPulseComplete?.();
  }, [notifyLoadingPulseComplete, onLoadingPulseCycleComplete, pulseMode]);
  const seriesIndex = useMemo(() => {
    const index = lines.findIndex((line2) => line2.dataKey === dataKey);
    return index >= 0 ? index : 0;
  }, [lines, dataKey]);
  const pathRef = useRef(null);
  const { pathLength, pathD } = usePathStrokeMetrics(pathRef, [
    renderData,
    innerWidth,
    dashFromIndex,
    animate2,
    useDataTransitionPath ? animatedPathD : null
  ]);
  const reactId = useId();
  const gradientId = `line-gradient-${dataKey}-${reactId}`;
  const getY = useCallback(
    (d) => {
      const value = d[dataKey];
      return typeof value === "number" ? yScale(value) ?? 0 : 0;
    },
    [dataKey, yScale]
  );
  const hasDashTail = resolveDashTailBounds(dashFromIndex, data.length);
  const fadeSides = resolveFadeSides(fadeEdges);
  const lineStroke = fadeSides.any ? `url(#${gradientId})` : stroke;
  const fadeStops = fadeSides.any ? fadeGradientStops(fadeSides) : null;
  const showSeriesStroke = chartPhase === "revealing" || chartPhase === "ready" || chartPhase === "exitingReady";
  let visibleStroke = "transparent";
  if (showSeriesStroke && !hasDashTail) {
    visibleStroke = lineStroke;
  }
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    fadeStops ? /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsx(
      "linearGradient",
      {
        id: gradientId,
        ...viewportFadeGradientAttrs(innerWidth),
        children: fadeStops.map((stop) => /* @__PURE__ */ jsx(
          "stop",
          {
            offset: stop.offset,
            style: { stopColor: stroke, stopOpacity: stop.opacity }
          },
          stop.offset
        ))
      }
    ) }) : null,
    /* @__PURE__ */ jsxs(
      SeriesHoverDim,
      {
        dimOpacity: 0.3,
        enabled: effectiveShowHighlight,
        seriesIndex,
        children: [
          /* @__PURE__ */ jsx(
            LineSeriesStroke,
            {
              animatedPathD,
              curve,
              getY,
              pathRef,
              renderData,
              strokeWidth,
              useDataTransitionPath,
              visibleStroke,
              xAccessor,
              xScale
            }
          ),
          /* @__PURE__ */ jsx(
            SeriesDashTailOverlay,
            {
              dashArray,
              dashFromIndex,
              data,
              innerHeight,
              innerWidth,
              pathD,
              pathLength,
              stroke: lineStroke,
              strokeWidth,
              xAccessor,
              xScale
            }
          )
        ]
      }
    ),
    showMarkers ? /* @__PURE__ */ jsx(
      SeriesMarkers,
      {
        animate: animate2,
        dataKey,
        ...markers,
        fill: markers?.fill ?? stroke,
        stroke: markers?.stroke ?? markers?.fill ?? stroke
      }
    ) : null,
    /* @__PURE__ */ jsx(
      SeriesHighlightLayer,
      {
        enabled: effectiveShowHighlight,
        height: innerHeight,
        pathRef,
        stroke,
        strokeWidth
      }
    ),
    /* @__PURE__ */ jsx(
      LineLoadingOverlays,
      {
        curve,
        handleLoadingPulseComplete,
        innerWidth,
        loadingStroke,
        loadingStrokeOpacity,
        loadingStyle,
        pathD,
        pulseEpoch,
        pulseMode,
        showLoadingPulse,
        strokeWidth
      }
    )
  ] });
}
Line.displayName = "Line";
function transitionWithDelay(transition, delaySeconds, fallback = DEFAULT_CHART_ENTER_TRANSITION) {
  const base = transition ?? fallback;
  return { ...base, delay: delaySeconds };
}
function computeSeriesBarWidth(input) {
  const {
    innerWidth,
    dataLength,
    columnWidth,
    seriesCount,
    composedBarSize,
    composedMaxBarSize,
    composedBarGap = 4,
    stacked = false
  } = input;
  const gap = composedBarGap;
  const groupCount = stacked ? 1 : Math.max(1, seriesCount);
  let slot = columnWidth;
  if (slot <= 0) {
    slot = dataLength < 2 ? innerWidth : innerWidth / (dataLength - 1);
  }
  let width = composedBarSize ?? Math.min(slot * 0.88, composedMaxBarSize ?? Number.POSITIVE_INFINITY);
  if (composedMaxBarSize != null) {
    width = Math.min(width, composedMaxBarSize);
  }
  if (groupCount > 1) {
    const maxGroup = slot * 0.92;
    const needed = groupCount * width + (groupCount - 1) * gap;
    if (needed > maxGroup && maxGroup > 0) {
      width = Math.max(4, (maxGroup - (groupCount - 1) * gap) / groupCount);
    }
  }
  return Math.max(2, width);
}
function computeSeriesBarRevealClipPadding(input) {
  const { barWidth, seriesCount, gap = 4, stacked = false } = input;
  if (stacked || seriesCount <= 1) {
    return Math.ceil(barWidth / 2);
  }
  const groupWidth = seriesCount * barWidth + (seriesCount - 1) * gap;
  return Math.ceil(groupWidth / 2);
}
function computeSeriesBarLayout(input) {
  const {
    stacked,
    composedStackOffsets,
    rowIndex,
    dataKey,
    value,
    yScale,
    innerHeight,
    xCenter,
    barWidth,
    seriesCount,
    gap,
    seriesIndex,
    stackGap,
    isLastSeries,
    radius
  } = input;
  if (stacked && composedStackOffsets) {
    const offset = composedStackOffsets.get(rowIndex)?.get(dataKey) ?? 0;
    const valuePos = yScale(value) ?? 0;
    let barHeight = innerHeight - valuePos;
    const offsetY = yScale(offset) ?? innerHeight;
    const gapOffset = seriesIndex * stackGap;
    const valueY2 = offsetY - barHeight - gapOffset;
    if (!isLastSeries && stackGap > 0) {
      barHeight = Math.max(0, barHeight - stackGap);
    }
    const barLeft = xCenter - barWidth / 2;
    const applyRounding = stackGap > 0 || isLastSeries;
    return {
      barLeft,
      barHeight,
      effectiveRadius: applyRounding ? radius : 0,
      valueY: valueY2
    };
  }
  const groupWidth = seriesCount * barWidth + (seriesCount > 1 ? (seriesCount - 1) * gap : 0);
  const valueY = yScale(value) ?? innerHeight;
  return {
    barLeft: xCenter - groupWidth / 2 + seriesIndex * (barWidth + gap),
    barHeight: innerHeight - valueY,
    effectiveRadius: radius,
    valueY
  };
}
function SeriesBar({
  dataKey,
  fill = chartCssVars.linePrimary,
  radius = 0,
  animate: animate2 = true,
  fadedOpacity = 0.3
}) {
  const {
    data,
    xScale,
    yScale,
    xAccessor,
    innerHeight,
    innerWidth,
    columnWidth,
    isLoaded,
    animationDuration,
    enterTransition,
    revealEpoch = 0,
    barScale,
    composedBarDataKeys,
    composedBarSize,
    composedMaxBarSize,
    composedBarGap,
    composedStacked,
    composedStackOffsets,
    composedStackGap,
    tooltipData
  } = useChart();
  const barKeys = useMemo(() => {
    if (composedBarDataKeys && composedBarDataKeys.length > 0) {
      return composedBarDataKeys;
    }
    return [dataKey];
  }, [composedBarDataKeys, dataKey]);
  const seriesIndex = useMemo(() => {
    const idx = barKeys.indexOf(dataKey);
    return idx >= 0 ? idx : 0;
  }, [barKeys, dataKey]);
  const n = barKeys.length;
  const gap = composedBarGap ?? 4;
  const stackGap = composedStackGap ?? 0;
  const stacked = Boolean(composedStacked) && composedStackOffsets != null && composedBarDataKeys != null && composedBarDataKeys.length > 0;
  const isLastSeries = seriesIndex === n - 1;
  const barWidth = useMemo(
    () => computeSeriesBarWidth({
      innerWidth,
      dataLength: data.length,
      columnWidth,
      seriesCount: n,
      composedBarSize,
      composedMaxBarSize,
      composedBarGap: gap,
      stacked
    }),
    [
      columnWidth,
      composedBarSize,
      composedMaxBarSize,
      data.length,
      gap,
      innerWidth,
      n,
      stacked
    ]
  );
  const totalAnimDuration = animationDuration || 1100;
  const staggerSpread = totalAnimDuration * 0.4;
  const calculatedStaggerDelay = data.length > 1 ? staggerSpread / 1e3 / data.length : 0;
  const { hoveredIndex: legendHoveredIndex } = useChartLegendHover();
  const isLegendDimmed = legendHoveredIndex !== null && legendHoveredIndex !== seriesIndex;
  const hoveredIndex = tooltipData?.index ?? null;
  if (barScale) {
    console.warn(
      "SeriesBar is for time-based ComposedChart / LineChart context. Use Bar inside BarChart for categorical x."
    );
    return null;
  }
  return /* @__PURE__ */ jsx("g", { className: "series-bar", children: data.map((d, i) => {
    const value = d[dataKey];
    if (typeof value !== "number") {
      return null;
    }
    const xCenter = xScale(xAccessor(d)) ?? 0;
    const { barLeft, valueY, barHeight, effectiveRadius } = computeSeriesBarLayout({
      stacked,
      composedStackOffsets,
      rowIndex: i,
      dataKey,
      value,
      yScale,
      innerHeight,
      xCenter,
      barWidth,
      seriesCount: n,
      gap,
      seriesIndex,
      stackGap,
      isLastSeries,
      radius
    });
    const categoryLabel = String(xAccessor(d).getTime());
    const isFaded = hoveredIndex !== null && hoveredIndex !== i || isLegendDimmed;
    if (animate2 && !isLoaded) {
      return /* @__PURE__ */ jsx(
        SeriesBarRect,
        {
          barHeight,
          barWidth,
          calculatedStaggerDelay,
          enterTransition,
          fadedOpacity,
          fill,
          index: i,
          innerHeight,
          isFaded,
          radius: effectiveRadius,
          revealEpoch,
          x: barLeft,
          y: valueY
        },
        `${dataKey}-${categoryLabel}-${revealEpoch}`
      );
    }
    return /* @__PURE__ */ jsx(
      motion.rect,
      {
        animate: { opacity: isFaded ? fadedOpacity : 1 },
        fill,
        height: barHeight,
        rx: effectiveRadius,
        ry: effectiveRadius,
        transition: { opacity: { duration: 0.12 } },
        width: barWidth,
        x: barLeft,
        y: valueY
      },
      `${dataKey}-${categoryLabel}`
    );
  }) });
}
SeriesBar.displayName = "SeriesBar";
function SeriesBarRect({
  x,
  y,
  barWidth,
  barHeight,
  fill,
  radius,
  index,
  innerHeight,
  calculatedStaggerDelay,
  enterTransition,
  revealEpoch,
  isFaded,
  fadedOpacity
}) {
  const enterAnim = transitionWithDelay(
    enterTransition,
    index * calculatedStaggerDelay
  );
  return /* @__PURE__ */ jsx(
    motion.rect,
    {
      animate: {
        height: barHeight,
        y,
        opacity: isFaded ? fadedOpacity : 1
      },
      fill,
      initial: { height: 0, y: innerHeight, opacity: 1 },
      rx: radius,
      ry: radius,
      transition: enterAnim,
      width: barWidth,
      x
    },
    `series-bar-${index}-${revealEpoch}`
  );
}
const CHART_CLIP_PASSTHROUGH = "__chartClipPassthrough";
function isChartClipPassthrough(type) {
  return typeof type === "function" && type[CHART_CLIP_PASSTHROUGH] === true;
}
function resolveChartChildElement(child) {
  if (isChartClipPassthrough(child.type)) {
    const inner = child.props.children;
    if (isValidElement(inner)) {
      return resolveChartChildElement(inner);
    }
  }
  return child;
}
const CLIP_EXCLUDED_COMPONENT_NAMES = /* @__PURE__ */ new Set([
  "Background",
  "Grid",
  "XAxis",
  "YAxis",
  "BarXAxis",
  "BarYAxis",
  "LiveXAxis",
  "LiveYAxis"
]);
const UNDERLAY_COMPONENT_NAMES = /* @__PURE__ */ new Set(["ReferenceArea", "BarColumnTrack"]);
function isPostOverlayComponent(child) {
  const childType = child.type;
  if (childType.__isChartMarkers || childType.__isPostOverlay) {
    return true;
  }
  const componentName = typeof child.type === "function" ? childType.displayName || childType.name || "" : "";
  return componentName === "ChartMarkers" || componentName === "MarkerGroup" || componentName === "ChartBrush";
}
function isUnderlayComponent(child) {
  const childType = child.type;
  const componentName = typeof child.type === "function" ? childType.displayName || childType.name || "" : "";
  return UNDERLAY_COMPONENT_NAMES.has(componentName);
}
function isClipExcludedComponent(child) {
  const childType = child.type;
  const componentName = typeof child.type === "function" ? childType.displayName || childType.name || "" : "";
  return CLIP_EXCLUDED_COMPONENT_NAMES.has(componentName);
}
function getChartChildComponentName(child) {
  const childType = child.type;
  return typeof child.type === "function" ? childType.displayName || childType.name || "" : "";
}
const VISX_PATTERN_COMPONENT_NAMES = /* @__PURE__ */ new Set([
  "Lines",
  "Circles",
  "Waves",
  "Hexagons",
  "Path",
  "Pattern"
]);
function isPatternDefComponent(child) {
  const name = getChartChildComponentName(child);
  return name.includes("Pattern") || VISX_PATTERN_COMPONENT_NAMES.has(name);
}
function isGradientDefComponent(child) {
  const name = getChartChildComponentName(child);
  return name.includes("Gradient") || name === "LinearGradient" || name === "RadialGradient";
}
const shortDateFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric"
});
const weekdayDateFmt = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric"
});
const intFmt = new Intl.NumberFormat("en-US").format;
const DEFAULT_CHART_STATUS = "ready";
const DEFAULT_Y_DOMAIN_TWEEN_MS = 500;
const Y_DOMAIN_TWEEN_SKIP_THRESHOLD = 0.02;
function resolveRestingChartPhase(status) {
  return status === "loading" ? "loading" : "ready";
}
function isChartInteractionPhase(phase) {
  return phase === "ready";
}
function ChartRevealClip({
  clipPathId,
  height,
  targetWidth,
  enterTransition,
  revealEpoch,
  padding = 0,
  animating = true,
  mode = "reveal",
  onComplete
}) {
  const transition = clipRevealTransition(enterTransition);
  const paddedWidth = Math.max(0, targetWidth + padding * 2);
  const paddedHeight = height + padding * 2;
  if (!animating) {
    return /* @__PURE__ */ jsx("clipPath", { id: clipPathId, children: /* @__PURE__ */ jsx(
      "rect",
      {
        height: paddedHeight,
        width: paddedWidth,
        x: -padding,
        y: -padding
      }
    ) });
  }
  if (mode === "conceal") {
    const rightEdge = -padding + paddedWidth;
    return /* @__PURE__ */ jsx("clipPath", { id: clipPathId, children: /* @__PURE__ */ jsx(
      motion.rect,
      {
        animate: { width: 0, x: rightEdge },
        height: paddedHeight,
        initial: { width: paddedWidth, x: -padding },
        onAnimationComplete: () => onComplete?.(),
        transition,
        y: -padding
      },
      `conceal-${revealEpoch}`
    ) });
  }
  return /* @__PURE__ */ jsx("clipPath", { id: clipPathId, children: /* @__PURE__ */ jsx(
    motion.rect,
    {
      animate: { width: paddedWidth },
      height: paddedHeight,
      initial: { width: 0 },
      transition,
      width: paddedWidth,
      x: -padding,
      y: -padding
    },
    `reveal-${revealEpoch}`
  ) });
}
function decimateTimeSeries(data, maxPoints, valueKeys = []) {
  const len = data.length;
  if (maxPoints >= len || maxPoints < 3) {
    return data;
  }
  const getY = (point, index) => {
    if (valueKeys.length === 0) {
      for (const val of Object.values(point)) {
        if (typeof val === "number") {
          return val;
        }
      }
      return index;
    }
    let sum = 0;
    let count = 0;
    for (const key of valueKeys) {
      const val = point[key];
      if (typeof val === "number") {
        sum += val;
        count++;
      }
    }
    return count > 0 ? sum / count : index;
  };
  const sampled = [data[0]];
  const bucketSize = (len - 2) / (maxPoints - 2);
  let previousIndex = 0;
  for (let i = 0; i < maxPoints - 2; i++) {
    const rangeStart = Math.floor((i + 1) * bucketSize) + 1;
    const rangeEnd = Math.min(Math.floor((i + 2) * bucketSize) + 1, len - 1);
    const nextRangeStart = Math.floor((i + 2) * bucketSize) + 1;
    const nextRangeEnd = Math.min(Math.floor((i + 3) * bucketSize) + 1, len);
    const nextCount = Math.max(0, nextRangeEnd - nextRangeStart);
    let avgX = len - 1;
    let avgY = getY(data[len - 1], len - 1);
    if (nextCount > 0) {
      avgX = 0;
      avgY = 0;
      for (let j = nextRangeStart; j < nextRangeEnd; j++) {
        avgX += j;
        avgY += getY(data[j], j);
      }
      avgX /= nextCount;
      avgY /= nextCount;
    }
    const pointA = data[previousIndex];
    const ax = previousIndex;
    const ay = getY(pointA, previousIndex);
    let maxArea = -1;
    let maxIndex = rangeStart;
    for (let j = rangeStart; j < rangeEnd; j++) {
      const area = Math.abs(
        (ax - avgX) * (getY(data[j], j) - ay) - (ax - j) * (avgY - ay)
      ) * 0.5;
      if (area > maxArea) {
        maxArea = area;
        maxIndex = j;
      }
    }
    sampled.push(data[maxIndex]);
    previousIndex = maxIndex;
  }
  sampled.push(data[len - 1]);
  return sampled;
}
function maxRenderPointsForWidth(innerWidth) {
  return Math.max(64, Math.ceil(innerWidth * 1.5));
}
function filterDataByXDomain(data, xDomain, xAccessor) {
  const start = xDomain[0].getTime();
  const end = xDomain[1].getTime();
  const minTime = Math.min(start, end);
  const maxTime = Math.max(start, end);
  return data.filter((d) => {
    const time = xAccessor(d).getTime();
    return time >= minTime && time <= maxTime;
  });
}
const DEFAULT_SKELETON_DATA_KEY = "value";
const DEFAULT_SKELETON_POINT_COUNT = 7;
function generateChartSkeletonData(options = {}) {
  const dataKey = options.dataKey ?? DEFAULT_SKELETON_DATA_KEY;
  const pointCount = options.pointCount ?? DEFAULT_SKELETON_POINT_COUNT;
  const baseDate = options.baseDate ?? /* @__PURE__ */ new Date("2025-01-01");
  return Array.from({ length: pointCount }, (_, index) => {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() + index);
    return {
      date,
      [dataKey]: Math.round(110 + Math.sin(index * 1.15) * 36 + index * 9)
    };
  });
}
function generateChartSkeletonFromTarget(targetData, dataKey) {
  return targetData.map((row, index) => ({
    ...row,
    [dataKey]: Math.round(95 + Math.sin(index * 1.05) * 28 + index * 7)
  }));
}
function projectionValueExtents(paths) {
  let minValue = Number.POSITIVE_INFINITY;
  let maxValue = Number.NEGATIVE_INFINITY;
  for (const path of paths) {
    for (const point of path) {
      if (point.value < minValue) {
        minValue = point.value;
      }
      if (point.value > maxValue) {
        maxValue = point.value;
      }
    }
  }
  if (minValue === Number.POSITIVE_INFINITY) {
    return null;
  }
  return { minValue, maxValue };
}
function projectionDateExtents(paths) {
  let minTime = Number.POSITIVE_INFINITY;
  let maxTime = Number.NEGATIVE_INFINITY;
  for (const path of paths) {
    for (const point of path) {
      const time = point.date.getTime();
      if (time < minTime) {
        minTime = time;
      }
      if (time > maxTime) {
        maxTime = time;
      }
    }
  }
  if (minTime === Number.POSITIVE_INFINITY) {
    return null;
  }
  return { minTime, maxTime };
}
function getChildComponentName$2(child) {
  const childType = child.type;
  return typeof child.type === "function" ? childType.displayName || childType.name || "" : "";
}
function isProjectionLineElement(child) {
  return getChildComponentName$2(child) === "ProjectionLine";
}
function normalizeProjectionData(data) {
  if (!data?.length) {
    return [];
  }
  return data.map((point) => ({
    date: point.date instanceof Date ? point.date : new Date(point.date),
    value: point.value
  }));
}
function extractProjectionLineConfigs(children) {
  const configs = [];
  const visit = (node) => {
    Children.forEach(node, (child) => {
      if (!isValidElement(child)) {
        return;
      }
      if (child.type === Fragment$1) {
        visit(child.props.children);
        return;
      }
      if (isProjectionLineElement(child)) {
        const props = child.props;
        const data = normalizeProjectionData(props?.data);
        if (data.length >= 2) {
          configs.push({
            yAxisId: normalizeYAxisId(props?.yAxisId),
            data
          });
        }
        return;
      }
      if (isChartClipPassthrough(child.type)) {
        visit(child.props.children);
        return;
      }
      const childProps = child.props;
      if (childProps?.children) {
        visit(childProps.children);
      }
    });
  };
  visit(children);
  return configs;
}
function mergeProjectionYDomain(domain, configs, yAxisId) {
  const paths = configs.filter((config) => config.yAxisId === yAxisId).map((config) => config.data);
  const extents = projectionValueExtents(paths);
  if (!extents) {
    return domain;
  }
  const [min, max] = domain;
  const nextMin = Math.min(min, extents.minValue);
  const nextMax = Math.max(max, extents.maxValue);
  if (nextMin >= 0 && min >= 0) {
    return [0, nextMax <= 0 ? 100 : nextMax * 1.1];
  }
  const padding = (nextMax - nextMin) * 0.05 || 1;
  return [nextMin - padding, nextMax + padding];
}
function mergeProjectionXDomainMax(maxTime, configs) {
  const paths = configs.map((config) => config.data);
  const extents = projectionDateExtents(paths);
  if (!extents) {
    return maxTime;
  }
  return Math.max(maxTime, extents.maxTime);
}
function getChildComponentName$1(child) {
  const childType = child.type;
  return typeof child.type === "function" ? childType.displayName || childType.name || "" : "";
}
function isReferenceAreaElement(child) {
  return getChildComponentName$1(child) === "ReferenceArea";
}
function extractReferenceAreaConfigs(children) {
  const configs = [];
  const visit = (node) => {
    Children.forEach(node, (child) => {
      if (!isValidElement(child)) {
        return;
      }
      if (isReferenceAreaElement(child)) {
        const props = child.props;
        if (props) {
          configs.push({
            yAxisId: normalizeYAxisId(props.yAxisId),
            y1: props.y1,
            y2: props.y2,
            axisLabelColor: props.axisLabelColor
          });
        }
        return;
      }
      const childProps = child.props;
      if (childProps?.children) {
        visit(childProps.children);
      }
    });
  };
  visit(children);
  return configs;
}
const ReferenceAreaRegistrationContext = createContext(null);
const StaticChartPreviewContext = createContext(false);
function useStaticChartPreview() {
  return useContext(StaticChartPreviewContext);
}
function niceYDomain(domain) {
  const [lo, hi] = domain;
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return [0, 1];
  if (lo === hi) {
    const span = Math.abs(lo) > 0 ? Math.abs(lo) : 1;
    const padded = lo === 0 ? [0, span] : [lo - span * 0.5, hi + span * 0.5];
    const flat = scaleLinear({ domain: padded, range: [0, 1], nice: true });
    const flatDomain = flat.domain();
    return [flatDomain[0] ?? padded[0], flatDomain[1] ?? padded[1]];
  }
  const scale = scaleLinear({ domain, range: [0, 1], nice: true });
  const niceDomain = scale.domain();
  return [niceDomain[0] ?? domain[0], niceDomain[1] ?? domain[1]];
}
function shouldTweenYDomain(from, to) {
  const span = Math.max(
    Math.abs(to[1] - to[0]),
    Math.abs(from[1] - from[0]),
    1
  );
  const deltaMin = Math.abs(to[0] - from[0]) / span;
  const deltaMax = Math.abs(to[1] - from[1]) / span;
  return deltaMin >= Y_DOMAIN_TWEEN_SKIP_THRESHOLD || deltaMax >= Y_DOMAIN_TWEEN_SKIP_THRESHOLD;
}
function isLoadingChromePhase(phase) {
  return phase === "loading" || phase === "revealingLoading";
}
function isLoadingGridChromePhase(phase) {
  return phase === "loading" || phase === "exiting" || phase === "gridTweenLoading";
}
function isYDomainTweenPhase(phase) {
  return phase === "gridTweenLoading" || phase === "gridTweenReady";
}
function resolveAnimatedYDestinationDomains(chartPhase, skeletonByAxis, targetByAxis) {
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
function computeYDomainsByAxis({
  lines,
  resolveDomain
}) {
  const groups = groupLinesByYAxisId(lines);
  const domains = {};
  for (const [axisId, axisLines] of groups) {
    const dataKeys = axisLines.map((line2) => line2.dataKey);
    domains[normalizeYAxisId(axisId)] = niceYDomain(resolveDomain(dataKeys));
  }
  if (!domains.left) {
    domains.left = niceYDomain([0, 100]);
  }
  return domains;
}
function domainsEqual(left, right) {
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
function lerpDomain(from, to, progress) {
  return [
    from[0] + (to[0] - from[0]) * progress,
    from[1] + (to[1] - from[1]) * progress
  ];
}
function snapDomains(domains, setAnimatedByAxis, animatedRef) {
  if (domainsEqual(animatedRef.current, domains)) {
    return;
  }
  setAnimatedByAxis(domains);
  animatedRef.current = domains;
}
function tweenDomains({
  destination,
  durationMs,
  enabled,
  reducedMotion,
  animatedRef,
  setAnimatedByAxis,
  onSettled
}) {
  if (domainsEqual(animatedRef.current, destination)) {
    onSettled?.();
    return;
  }
  if (!enabled || reducedMotion) {
    snapDomains(destination, setAnimatedByAxis, animatedRef);
    onSettled?.();
    return;
  }
  const axisIds = Object.keys(destination);
  const fromSnapshot = animatedRef.current;
  let needsTween = false;
  for (const axisId of axisIds) {
    const from = fromSnapshot[axisId] ?? destination[axisId] ?? [0, 100];
    const to = destination[axisId] ?? from;
    if (shouldTweenYDomain(from, to)) {
      needsTween = true;
      break;
    }
  }
  if (!needsTween) {
    snapDomains(destination, setAnimatedByAxis, animatedRef);
    onSettled?.();
    return;
  }
  const fromByAxis = {};
  for (const axisId of axisIds) {
    fromByAxis[axisId] = fromSnapshot[axisId] ?? destination[axisId] ?? [0, 100];
  }
  const control = animate(0, 1, {
    duration: durationMs / 1e3,
    ease: [...LINE_LOADING_PULSE_EASE],
    onUpdate: (progress) => {
      const next = {};
      for (const axisId of axisIds) {
        const from = fromByAxis[axisId] ?? destination[axisId] ?? [0, 100];
        const to = destination[axisId] ?? from;
        next[axisId] = shouldTweenYDomain(from, to) ? lerpDomain(from, to, progress) : to;
      }
      animatedRef.current = next;
      setAnimatedByAxis(next);
    },
    onComplete: () => {
      snapDomains(destination, setAnimatedByAxis, animatedRef);
      onSettled?.();
    }
  });
  return control;
}
function useAnimatedYDomains({
  enabled,
  durationMs,
  chartPhase,
  skeletonByAxis,
  targetByAxis,
  onSettled,
  tweenOnTargetChange = false
}) {
  const reducedMotion = useReducedMotion();
  const destinationByAxis = resolveAnimatedYDestinationDomains(
    chartPhase,
    skeletonByAxis,
    targetByAxis
  );
  const destinationRef = useRef(destinationByAxis);
  destinationRef.current = destinationByAxis;
  const skeletonRef = useRef(skeletonByAxis);
  skeletonRef.current = skeletonByAxis;
  const targetRef = useRef(targetByAxis);
  targetRef.current = targetByAxis;
  const [animatedByAxis, setAnimatedByAxis] = useState(destinationByAxis);
  const animatedRef = useRef(animatedByAxis);
  const prevPhaseRef = useRef(chartPhase);
  const onSettledRef = useRef(onSettled);
  onSettledRef.current = onSettled;
  useEffect(() => {
    animatedRef.current = animatedByAxis;
  }, [animatedByAxis]);
  useEffect(() => {
    if (prevPhaseRef.current === chartPhase) {
      return;
    }
    prevPhaseRef.current = chartPhase;
    const settle = () => {
      onSettledRef.current?.();
    };
    if (chartPhase === "exiting") {
      snapDomains(skeletonRef.current, setAnimatedByAxis, animatedRef);
      return;
    }
    if (chartPhase === "exitingReady") {
      snapDomains(targetRef.current, setAnimatedByAxis, animatedRef);
      return;
    }
    if (chartPhase === "loading") {
      snapDomains(skeletonRef.current, setAnimatedByAxis, animatedRef);
      return;
    }
    if (chartPhase === "revealing" || chartPhase === "ready") {
      snapDomains(targetRef.current, setAnimatedByAxis, animatedRef);
      return;
    }
    if (!isYDomainTweenPhase(chartPhase)) {
      return;
    }
    const control = tweenDomains({
      destination: destinationRef.current,
      durationMs,
      enabled,
      reducedMotion,
      animatedRef,
      setAnimatedByAxis,
      onSettled: settle
    });
    return () => control?.stop();
  }, [chartPhase, durationMs, enabled, reducedMotion]);
  const targetSignature = JSON.stringify(targetByAxis);
  const prevTargetSignatureRef = useRef(targetSignature);
  useEffect(() => {
    const inLivePhase = chartPhase === "ready" || chartPhase === "revealing";
    if (!inLivePhase) {
      prevTargetSignatureRef.current = targetSignature;
      return;
    }
    if (prevTargetSignatureRef.current === targetSignature) {
      return;
    }
    prevTargetSignatureRef.current = targetSignature;
    if (tweenOnTargetChange && chartPhase === "ready") {
      const control = tweenDomains({
        destination: targetRef.current,
        durationMs,
        enabled,
        reducedMotion,
        animatedRef,
        setAnimatedByAxis,
        onSettled: () => onSettledRef.current?.()
      });
      return () => control?.stop();
    }
    snapDomains(targetRef.current, setAnimatedByAxis, animatedRef);
  }, [
    chartPhase,
    durationMs,
    enabled,
    reducedMotion,
    targetSignature,
    tweenOnTargetChange
  ]);
  return animatedByAxis;
}
function defaultDedupeKey(tooltip) {
  if (typeof tooltip === "object" && tooltip !== null && "index" in tooltip && typeof tooltip.index === "number") {
    const { index, x } = tooltip;
    if (typeof x === "number") {
      return `${index}:${Math.round(x)}`;
    }
    return String(index);
  }
  return JSON.stringify(tooltip);
}
function useScheduledTooltip() {
  const [tooltipData, setTooltipData] = useState(null);
  const lastKeyRef = useRef(null);
  const pendingRef = useRef(null);
  const rafRef = useRef(null);
  const pendingKeyRef = useRef(null);
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);
  const commitTooltip = useCallback((tooltip, dedupeKey) => {
    if (dedupeKey === lastKeyRef.current) {
      return;
    }
    lastKeyRef.current = dedupeKey;
    setTooltipData(tooltip);
  }, []);
  const scheduleTooltip = useCallback(
    (tooltip, dedupeKey) => {
      const key = dedupeKey ?? defaultDedupeKey(tooltip);
      pendingRef.current = tooltip;
      pendingKeyRef.current = key;
      if (key === lastKeyRef.current) {
        return;
      }
      if (rafRef.current !== null) {
        return;
      }
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const next = pendingRef.current;
        const nextKey = pendingKeyRef.current;
        if (next && nextKey) {
          commitTooltip(next, nextKey);
        }
      });
    },
    [commitTooltip]
  );
  const clearTooltip = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    pendingRef.current = null;
    pendingKeyRef.current = null;
    lastKeyRef.current = null;
    setTooltipData(null);
  }, []);
  const resetTooltipDedupe = useCallback(() => {
    lastKeyRef.current = null;
  }, []);
  return {
    tooltipData,
    setTooltipData,
    scheduleTooltip,
    clearTooltip,
    resetTooltipDedupe
  };
}
function useChartInteraction({
  xScale,
  yScale,
  yScales,
  data,
  lines,
  margin,
  xAccessor,
  bisectDate,
  canInteract
}) {
  const [selection, setSelection] = useState(null);
  const {
    tooltipData,
    setTooltipData,
    scheduleTooltip,
    clearTooltip,
    resetTooltipDedupe
  } = useScheduledTooltip();
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const lastHoveredXRef = useRef(null);
  const resolveTooltipFromX = useCallback(
    (pixelX) => {
      const x0 = xScale.invert(pixelX);
      const index = bisectDate(data, x0, 1);
      const d0 = data[index - 1];
      const d1 = data[index];
      if (!d0) {
        return null;
      }
      let d = d0;
      let finalIndex = index - 1;
      if (d1) {
        const d0Time = xAccessor(d0).getTime();
        const d1Time = xAccessor(d1).getTime();
        if (x0.getTime() - d0Time > d1Time - x0.getTime()) {
          d = d1;
          finalIndex = index;
        }
      }
      const yPositions = {};
      for (const line2 of lines) {
        const value = d[line2.dataKey];
        if (typeof value === "number") {
          const axisScale = yScales[normalizeYAxisId(line2.yAxisId)] ?? yScale;
          yPositions[line2.dataKey] = axisScale(value) ?? 0;
        }
      }
      return {
        point: d,
        index: finalIndex,
        x: xScale(xAccessor(d)) ?? 0,
        yPositions
      };
    },
    [xScale, yScale, yScales, data, lines, xAccessor, bisectDate]
  );
  const resolveIndexFromX = useCallback(
    (pixelX) => {
      const x0 = xScale.invert(pixelX);
      const index = bisectDate(data, x0, 1);
      const d0 = data[index - 1];
      const d1 = data[index];
      if (!d0) {
        return 0;
      }
      if (d1) {
        const d0Time = xAccessor(d0).getTime();
        const d1Time = xAccessor(d1).getTime();
        if (x0.getTime() - d0Time > d1Time - x0.getTime()) {
          return index;
        }
      }
      return index - 1;
    },
    [xScale, data, xAccessor, bisectDate]
  );
  const getChartX = useCallback(
    (event, touchIndex = 0) => {
      let point = null;
      if ("touches" in event) {
        const touch = event.touches[touchIndex];
        if (!touch) {
          return null;
        }
        const svg = event.currentTarget.ownerSVGElement;
        if (!svg) {
          return null;
        }
        point = localPoint(svg, touch);
      } else {
        point = localPoint(event);
      }
      if (!point) {
        return null;
      }
      return point.x - margin.left;
    },
    [margin.left]
  );
  const handleMouseMove = useCallback(
    (event) => {
      const chartX = getChartX(event);
      if (chartX === null) {
        return;
      }
      if (isDraggingRef.current) {
        const startX = Math.min(dragStartXRef.current, chartX);
        const endX = Math.max(dragStartXRef.current, chartX);
        setSelection({
          startX,
          endX,
          startIndex: resolveIndexFromX(startX),
          endIndex: resolveIndexFromX(endX),
          active: true
        });
        return;
      }
      lastHoveredXRef.current = chartX;
      const tooltip = resolveTooltipFromX(chartX);
      if (tooltip) {
        scheduleTooltip(tooltip);
      }
    },
    [getChartX, resolveTooltipFromX, resolveIndexFromX, scheduleTooltip]
  );
  const handleMouseLeave = useCallback(() => {
    lastHoveredXRef.current = null;
    clearTooltip();
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
    }
    setSelection(null);
  }, [clearTooltip]);
  const handleMouseDown = useCallback(
    (event) => {
      const chartX = getChartX(event);
      if (chartX === null) {
        return;
      }
      isDraggingRef.current = true;
      dragStartXRef.current = chartX;
      clearTooltip();
      setSelection(null);
    },
    [getChartX, clearTooltip]
  );
  const handleMouseUp = useCallback(() => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
    }
    setSelection(null);
  }, []);
  const handleTouchStart = useCallback(
    (event) => {
      if (event.touches.length === 1) {
        event.preventDefault();
        const chartX = getChartX(event, 0);
        if (chartX === null) {
          return;
        }
        lastHoveredXRef.current = chartX;
        const tooltip = resolveTooltipFromX(chartX);
        if (tooltip) {
          scheduleTooltip(tooltip);
        }
      } else if (event.touches.length === 2) {
        event.preventDefault();
        resetTooltipDedupe();
        clearTooltip();
        const x0 = getChartX(event, 0);
        const x1 = getChartX(event, 1);
        if (x0 === null || x1 === null) {
          return;
        }
        const startX = Math.min(x0, x1);
        const endX = Math.max(x0, x1);
        setSelection({
          startX,
          endX,
          startIndex: resolveIndexFromX(startX),
          endIndex: resolveIndexFromX(endX),
          active: true
        });
      }
    },
    [
      getChartX,
      resolveTooltipFromX,
      resolveIndexFromX,
      scheduleTooltip,
      resetTooltipDedupe,
      clearTooltip
    ]
  );
  const handleTouchMove = useCallback(
    (event) => {
      if (event.touches.length === 1) {
        event.preventDefault();
        const chartX = getChartX(event, 0);
        if (chartX === null) {
          return;
        }
        lastHoveredXRef.current = chartX;
        const tooltip = resolveTooltipFromX(chartX);
        if (tooltip) {
          scheduleTooltip(tooltip);
        }
      } else if (event.touches.length === 2) {
        event.preventDefault();
        const x0 = getChartX(event, 0);
        const x1 = getChartX(event, 1);
        if (x0 === null || x1 === null) {
          return;
        }
        const startX = Math.min(x0, x1);
        const endX = Math.max(x0, x1);
        setSelection({
          startX,
          endX,
          startIndex: resolveIndexFromX(startX),
          endIndex: resolveIndexFromX(endX),
          active: true
        });
      }
    },
    [getChartX, resolveTooltipFromX, resolveIndexFromX, scheduleTooltip]
  );
  const handleTouchEnd = useCallback(() => {
    clearTooltip();
    setSelection(null);
  }, [clearTooltip]);
  const clearSelection = useCallback(() => {
    setSelection(null);
  }, []);
  useEffect(() => {
    if (!canInteract || lastHoveredXRef.current === null) {
      return;
    }
    const tooltip = resolveTooltipFromX(lastHoveredXRef.current);
    if (tooltip) {
      scheduleTooltip(tooltip, `${tooltip.index}:${Math.round(tooltip.x)}`);
      return;
    }
    clearTooltip();
  }, [canInteract, clearTooltip, resolveTooltipFromX, scheduleTooltip]);
  const interactionHandlers = canInteract ? {
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave,
    onMouseDown: handleMouseDown,
    onMouseUp: handleMouseUp,
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd
  } : {};
  const interactionStyle = {
    cursor: canInteract ? "crosshair" : "default",
    touchAction: "none"
  };
  return {
    tooltipData,
    setTooltipData,
    selection,
    clearSelection,
    interactionHandlers,
    interactionStyle
  };
}
function useChartPhaseOrchestrator({
  chartStatus,
  targetData,
  skeletonData,
  animationDuration,
  yDomainTweenDuration,
  revealSignature = "",
  skipEnterReveal = false
}) {
  const [chartPhase, setChartPhase] = useState(
    () => resolveRestingChartPhase(chartStatus)
  );
  const [plotData, setPlotData] = useState(
    () => chartStatus === "loading" ? skeletonData : targetData
  );
  const [revealEpoch, setRevealEpoch] = useState(0);
  const [concealEpoch, setConcealEpoch] = useState(0);
  const [isLoaded, setIsLoaded] = useState(() => chartStatus === "ready");
  const prevStatusRef = useRef(chartStatus);
  const phaseRef = useRef(chartPhase);
  phaseRef.current = chartPhase;
  useEffect(() => {
    const prevStatus = prevStatusRef.current;
    if (prevStatus === chartStatus) {
      return;
    }
    prevStatusRef.current = chartStatus;
    if (chartStatus === "ready" && prevStatus === "loading") {
      setIsLoaded(false);
      if (animationDuration <= 0) {
        if (yDomainTweenDuration <= 0) {
          setPlotData(targetData);
          setChartPhase("revealing");
        } else {
          setChartPhase("gridTweenReady");
        }
      } else {
        setChartPhase("exiting");
      }
      return;
    }
    if (chartStatus === "loading" && prevStatus === "ready") {
      setIsLoaded(false);
      if (animationDuration <= 0) {
        if (yDomainTweenDuration <= 0) {
          setPlotData(skeletonData);
          setChartPhase("loading");
        } else {
          setChartPhase("gridTweenLoading");
        }
      } else {
        setConcealEpoch((epoch) => epoch + 1);
        setChartPhase("exitingReady");
      }
    }
  }, [
    animationDuration,
    chartStatus,
    skeletonData,
    targetData,
    yDomainTweenDuration
  ]);
  useEffect(() => {
    if (skipEnterReveal) {
      return;
    }
    if (chartStatus !== "ready") {
      return;
    }
    if (phaseRef.current !== "ready") {
      return;
    }
    setChartPhase("revealing");
    setIsLoaded(false);
  }, [animationDuration, chartStatus, revealSignature, skipEnterReveal]);
  useEffect(() => {
    switch (chartPhase) {
      case "loading":
        if (chartStatus === "loading") {
          setPlotData(skeletonData);
        }
        break;
      case "exiting":
        setPlotData(skeletonData);
        break;
      case "exitingReady":
      case "gridTweenLoading":
      case "gridTweenReady":
      case "revealing":
      case "ready":
        setPlotData(targetData);
        break;
    }
  }, [chartPhase, chartStatus, skeletonData, targetData]);
  const notifyLoadingPulseComplete = useCallback(() => {
    if (phaseRef.current !== "exiting") {
      return;
    }
    setChartPhase("gridTweenReady");
  }, []);
  const notifyRevealConcealComplete = useCallback(() => {
    if (phaseRef.current !== "exitingReady") {
      return;
    }
    setChartPhase("gridTweenLoading");
  }, []);
  const notifyYDomainTweenComplete = useCallback(() => {
    if (phaseRef.current === "gridTweenLoading") {
      setChartPhase("loading");
      return;
    }
    if (phaseRef.current === "gridTweenReady") {
      setChartPhase("revealing");
    }
  }, []);
  useEffect(() => {
    if (chartPhase !== "revealing") {
      return;
    }
    setRevealEpoch((epoch) => epoch + 1);
    if (animationDuration <= 0) {
      setChartPhase("ready");
      setIsLoaded(true);
      return;
    }
    const timer = window.setTimeout(() => {
      setChartPhase("ready");
      setIsLoaded(true);
    }, animationDuration);
    return () => window.clearTimeout(timer);
  }, [animationDuration, chartPhase]);
  return {
    chartPhase,
    plotData,
    revealEpoch,
    concealEpoch,
    isLoaded,
    notifyLoadingPulseComplete,
    notifyRevealConcealComplete,
    notifyYDomainTweenComplete
  };
}
function collectNumericExtents(data, dataKeys) {
  let minValue = Number.POSITIVE_INFINITY;
  let maxValue = Number.NEGATIVE_INFINITY;
  for (const d of data) {
    for (const key of dataKeys) {
      const value = d[key];
      if (typeof value === "number") {
        if (value < minValue) {
          minValue = value;
        }
        if (value > maxValue) {
          maxValue = value;
        }
      }
    }
  }
  if (minValue === Number.POSITIVE_INFINITY) {
    return { minValue: 0, maxValue: 100 };
  }
  return { minValue, maxValue };
}
function resolveTimeSeriesYDomain(data, dataKeys, yScaleDomainMax) {
  if (yScaleDomainMax != null && yScaleDomainMax > 0) {
    return [0, yScaleDomainMax * 1.1];
  }
  const { minValue, maxValue } = collectNumericExtents(data, dataKeys);
  if (minValue >= 0) {
    const top = maxValue <= 0 ? 100 : maxValue * 1.1;
    return [0, top];
  }
  const padding = (maxValue - minValue) * 0.05 || 1;
  return [minValue - padding, maxValue + padding];
}
function ensureChildKey(child, index) {
  if (child.key != null) {
    return child;
  }
  return cloneElement(child, { key: `chart-child-${index}` });
}
function TimeSeriesChartInner(props) {
  const { width, height } = props;
  if (width < 10 || height < 10) {
    return null;
  }
  return /* @__PURE__ */ jsx(TimeSeriesChartCore, { ...props });
}
const TimeSeriesChartCore = memo(function TimeSeriesChartCore2({
  width,
  height,
  data,
  xDataKey,
  margin,
  animationDuration,
  animationEasing = DEFAULT_ANIMATION_EASING,
  enterTransition,
  revealSignature = "",
  children,
  containerRef,
  lines,
  clipPathId,
  composedBarDataKeys,
  composedBarSize,
  composedMaxBarSize,
  composedBarGap,
  composedStacked,
  composedStackOffsets,
  composedStackGap,
  yScaleDomainMax,
  chartStatus = DEFAULT_CHART_STATUS,
  loadingLabel,
  yDomainTween = true,
  yDomainTweenDuration = DEFAULT_Y_DOMAIN_TWEEN_MS,
  xDomain,
  xDomainSlotCount,
  tweenYDomainOnXDomainChange = false,
  onPhaseChange
}) {
  const staticPreview = useStaticChartPreview();
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const resolveYDomain = useCallback(
    (sourceData, dataKeys) => {
      const axisGroups = groupLinesByYAxisId(lines);
      const usesDefaultOnly = axisGroups.size === 1 && axisGroups.has(DEFAULT_Y_AXIS_ID);
      const domainMax = usesDefaultOnly && yScaleDomainMax != null ? yScaleDomainMax : void 0;
      return resolveTimeSeriesYDomain(sourceData, dataKeys, domainMax);
    },
    [lines, yScaleDomainMax]
  );
  const skeletonData = useMemo(() => {
    const primaryKey = lines[0]?.dataKey ?? "value";
    if (data.length === 0) {
      return generateChartSkeletonData({ dataKey: primaryKey });
    }
    return generateChartSkeletonFromTarget(data, primaryKey);
  }, [data, lines]);
  const {
    chartPhase,
    plotData,
    revealEpoch,
    concealEpoch,
    isLoaded,
    notifyLoadingPulseComplete,
    notifyRevealConcealComplete,
    notifyYDomainTweenComplete
  } = useChartPhaseOrchestrator({
    animationDuration,
    chartStatus,
    revealSignature,
    skeletonData,
    skipEnterReveal: staticPreview,
    targetData: data,
    yDomainTweenDuration
  });
  useEffect(() => {
    onPhaseChange?.(chartPhase);
  }, [chartPhase, onPhaseChange]);
  const xAccessor = useCallback(
    (d) => {
      const value = d[xDataKey];
      return value instanceof Date ? value : new Date(value);
    },
    [xDataKey]
  );
  const bisectDate = useMemo(
    () => bisector((d) => xAccessor(d)).left,
    [xAccessor]
  );
  const visiblePlotData = useMemo(() => {
    if (!xDomain) {
      return plotData;
    }
    return filterDataByXDomain(plotData, xDomain, xAccessor);
  }, [plotData, xDomain, xAccessor]);
  const projectionConfigs = useMemo(
    () => extractProjectionLineConfigs(children),
    [children]
  );
  const xScale = useMemo(() => {
    const minTime = xDomain ? xDomain[0].getTime() : extent(plotData, (d) => xAccessor(d).getTime())[0] ?? 0;
    let maxTime = xDomain ? xDomain[1].getTime() : extent(plotData, (d) => xAccessor(d).getTime())[1] ?? minTime;
    if (!xDomain) {
      maxTime = mergeProjectionXDomainMax(maxTime, projectionConfigs);
    }
    return scaleTime({
      range: [0, innerWidth],
      domain: [minTime, maxTime]
    });
  }, [innerWidth, plotData, projectionConfigs, xAccessor, xDomain]);
  const seriesSourceData = xDomain ? plotData : visiblePlotData;
  const renderData = useMemo(() => {
    const valueKeys = lines.map((line2) => line2.dataKey);
    return decimateTimeSeries(
      seriesSourceData,
      maxRenderPointsForWidth(innerWidth),
      valueKeys
    );
  }, [seriesSourceData, innerWidth, lines]);
  const columnWidth = useMemo(() => {
    const slotCount = xDomain && xDomainSlotCount != null ? xDomainSlotCount : visiblePlotData.length;
    if (slotCount < 2) {
      return 0;
    }
    return innerWidth / (slotCount - 1);
  }, [innerWidth, visiblePlotData.length, xDomain, xDomainSlotCount]);
  const yDomainSkeletonByAxis = useMemo(
    () => computeYDomainsByAxis({
      lines,
      resolveDomain: (dataKeys) => resolveYDomain(skeletonData, dataKeys)
    }),
    [lines, resolveYDomain, skeletonData]
  );
  const yDomainTargetByAxis = useMemo(() => {
    const base = computeYDomainsByAxis({
      lines,
      resolveDomain: (dataKeys) => resolveYDomain(xDomain ? visiblePlotData : data, dataKeys)
    });
    if (projectionConfigs.length === 0) {
      return base;
    }
    const merged = { ...base };
    for (const axisId of Object.keys(base)) {
      merged[axisId] = mergeProjectionYDomain(
        base[axisId] ?? [0, 100],
        projectionConfigs,
        axisId
      );
    }
    for (const config of projectionConfigs) {
      if (!merged[config.yAxisId]) {
        merged[config.yAxisId] = mergeProjectionYDomain(
          [0, 100],
          projectionConfigs,
          config.yAxisId
        );
      }
    }
    return merged;
  }, [
    data,
    lines,
    projectionConfigs,
    resolveYDomain,
    visiblePlotData,
    xDomain
  ]);
  const animatedYDomainsByAxis = useAnimatedYDomains({
    chartPhase,
    durationMs: yDomainTweenDuration,
    enabled: yDomainTween,
    onSettled: notifyYDomainTweenComplete,
    skeletonByAxis: yDomainSkeletonByAxis,
    targetByAxis: yDomainTargetByAxis,
    tweenOnTargetChange: yDomainTween || tweenYDomainOnXDomainChange && xDomain != null
  });
  const yDomainsForScales = animatedYDomainsByAxis;
  const yScales = useMemo(
    () => buildYScalesFromDomains({
      domainsByAxis: yDomainsForScales,
      innerHeight,
      lines
    }),
    [yDomainsForScales, innerHeight, lines]
  );
  const yScale = getPrimaryYScale(
    yScales,
    scaleLinear({ range: [innerHeight, 0], domain: [0, 100], nice: true })
  );
  const dateLabels = useMemo(
    () => visiblePlotData.map((d) => shortDateFmt.format(xAccessor(d))),
    [visiblePlotData, xAccessor]
  );
  const canInteract = isLoaded && isChartInteractionPhase(chartPhase);
  const {
    tooltipData,
    setTooltipData,
    selection,
    clearSelection,
    interactionHandlers,
    interactionStyle
  } = useChartInteraction({
    bisectDate,
    canInteract,
    data: visiblePlotData,
    lines,
    margin,
    xAccessor,
    xScale,
    yScale,
    yScales
  });
  const defsChildren = [];
  const clipExcludedChildren = [];
  const underlayChildren = [];
  const preOverlayChildren = [];
  const postOverlayChildren = [];
  Children.forEach(children, (child, index) => {
    if (!isValidElement(child)) {
      return;
    }
    const keyedChild = ensureChildKey(child, index);
    const resolvedChild = resolveChartChildElement(keyedChild);
    if (isGradientDefComponent(resolvedChild)) {
      defsChildren.push(resolvedChild);
    } else if (isPatternDefComponent(resolvedChild)) {
      preOverlayChildren.push(resolvedChild);
    } else if (isPostOverlayComponent(resolvedChild)) {
      postOverlayChildren.push(resolvedChild);
    } else if (isClipExcludedComponent(resolvedChild)) {
      clipExcludedChildren.push(resolvedChild);
    } else if (isUnderlayComponent(resolvedChild)) {
      underlayChildren.push(resolvedChild);
    } else {
      preOverlayChildren.push(resolvedChild);
    }
  });
  const [registeredReferenceAreas, setRegisteredReferenceAreas] = useState(
    () => /* @__PURE__ */ new Map()
  );
  const registerReferenceArea = useCallback(
    (id, config) => {
      setRegisteredReferenceAreas((prev) => {
        const existing = prev.get(id);
        if (existing && existing.yAxisId === config.yAxisId && existing.y1 === config.y1 && existing.y2 === config.y2 && existing.axisLabelColor === config.axisLabelColor) {
          return prev;
        }
        const next = new Map(prev);
        next.set(id, config);
        return next;
      });
    },
    []
  );
  const unregisterReferenceArea = useCallback((id) => {
    setRegisteredReferenceAreas((prev) => {
      if (!prev.has(id)) {
        return prev;
      }
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);
  const referenceAreaRegistration = useMemo(
    () => ({ registerReferenceArea, unregisterReferenceArea }),
    [registerReferenceArea, unregisterReferenceArea]
  );
  const referenceAreas = useMemo(() => {
    const extracted = extractReferenceAreaConfigs(children);
    const registered = [...registeredReferenceAreas.values()];
    if (registered.length === 0) {
      return extracted;
    }
    if (extracted.length === 0) {
      return registered;
    }
    return [...extracted, ...registered];
  }, [children, registeredReferenceAreas]);
  const contextValue = useMemo(
    () => ({
      data: visiblePlotData,
      renderData,
      xScale,
      yScale,
      yScales,
      width,
      height,
      innerWidth,
      innerHeight,
      margin,
      columnWidth,
      tooltipData,
      setTooltipData,
      containerRef,
      lines,
      referenceAreas,
      chartPhase,
      chartStatus,
      loadingLabel,
      yDomainTweenDuration,
      yDomainSkeletonByAxis,
      yDomainTargetByAxis,
      isLoaded,
      animationDuration,
      animationEasing,
      enterTransition,
      revealEpoch,
      notifyLoadingPulseComplete,
      xAccessor,
      dateLabels,
      xDomain,
      xDomainSlotCount,
      selection,
      clearSelection,
      composedBarDataKeys,
      composedBarSize,
      composedMaxBarSize,
      composedBarGap,
      composedStacked,
      composedStackOffsets,
      composedStackGap
    }),
    [
      visiblePlotData,
      renderData,
      xScale,
      yScale,
      yScales,
      width,
      height,
      innerWidth,
      innerHeight,
      margin,
      columnWidth,
      tooltipData,
      setTooltipData,
      containerRef,
      lines,
      referenceAreas,
      chartPhase,
      chartStatus,
      loadingLabel,
      yDomainTweenDuration,
      yDomainSkeletonByAxis,
      yDomainTargetByAxis,
      isLoaded,
      animationDuration,
      animationEasing,
      enterTransition,
      revealEpoch,
      notifyLoadingPulseComplete,
      xAccessor,
      dateLabels,
      xDomain,
      xDomainSlotCount,
      selection,
      clearSelection,
      composedBarDataKeys,
      composedBarSize,
      composedMaxBarSize,
      composedBarGap,
      composedStacked,
      composedStackOffsets,
      composedStackGap
    ]
  );
  const useClipReveal = !staticPreview && renderData.length > 1 && innerWidth > 0 && animationDuration > 0;
  const isRevealAnimating = chartPhase === "revealing";
  const isRevealConcealing = chartPhase === "exitingReady" && animationDuration > 0;
  const effectiveEnterTransition = enterTransition ?? {
    ...DEFAULT_CHART_ENTER_TRANSITION,
    duration: animationDuration / 1e3
  };
  const revealClipPadding = useMemo(() => {
    if (!composedBarDataKeys?.length) {
      return 0;
    }
    const barWidth = computeSeriesBarWidth({
      columnWidth,
      composedBarGap,
      composedBarSize,
      composedMaxBarSize,
      dataLength: plotData.length,
      innerWidth,
      seriesCount: composedBarDataKeys.length,
      stacked: composedStacked
    });
    return computeSeriesBarRevealClipPadding({
      barWidth,
      gap: composedBarGap,
      seriesCount: composedBarDataKeys.length,
      stacked: composedStacked
    });
  }, [
    columnWidth,
    composedBarDataKeys,
    composedBarGap,
    composedBarSize,
    composedMaxBarSize,
    composedStacked,
    innerWidth,
    plotData.length
  ]);
  return /* @__PURE__ */ jsx(
    ReferenceAreaRegistrationContext.Provider,
    {
      value: referenceAreaRegistration,
      children: /* @__PURE__ */ jsx(ChartProvider, { value: contextValue, children: /* @__PURE__ */ jsxs("svg", { "aria-hidden": "true", height, width, children: [
        /* @__PURE__ */ jsxs("defs", { children: [
          defsChildren,
          useClipReveal ? /* @__PURE__ */ jsx(
            ChartRevealClip,
            {
              animating: isRevealAnimating || isRevealConcealing,
              clipPathId,
              enterTransition: effectiveEnterTransition,
              height: innerHeight + 20,
              mode: isRevealConcealing ? "conceal" : "reveal",
              onComplete: isRevealConcealing ? notifyRevealConcealComplete : void 0,
              padding: revealClipPadding,
              revealEpoch: isRevealConcealing ? concealEpoch : revealEpoch,
              targetWidth: innerWidth
            }
          ) : null
        ] }),
        /* @__PURE__ */ jsx("rect", { fill: "transparent", height, width, x: 0, y: 0 }),
        /* @__PURE__ */ jsxs(
          "g",
          {
            ...interactionHandlers,
            style: interactionStyle,
            transform: `translate(${margin.left},${margin.top})`,
            children: [
              /* @__PURE__ */ jsx(
                "rect",
                {
                  fill: "transparent",
                  height: innerHeight,
                  width: innerWidth,
                  x: 0,
                  y: 0
                }
              ),
              clipExcludedChildren,
              underlayChildren,
              useClipReveal ? /* @__PURE__ */ jsx("g", { clipPath: `url(#${clipPathId})`, children: preOverlayChildren }) : preOverlayChildren,
              postOverlayChildren
            ]
          }
        )
      ] }) })
    }
  );
});
const DEFAULT_MARGIN = { top: 40, right: 40, bottom: 40, left: 40 };
function getChildComponentName(child) {
  const childType = child.type;
  return typeof child.type === "function" ? childType.displayName || childType.name || "" : "";
}
function upsertLineConfig(lines, config) {
  const index = lines.findIndex((line2) => line2.dataKey === config.dataKey);
  if (index === -1) {
    lines.push(config);
    return;
  }
  lines[index] = config;
}
function tryAppendSeriesBar(child, lines, barDataKeys) {
  const name = getChildComponentName(child);
  if (!(child.type === SeriesBar || name === "SeriesBar")) {
    return false;
  }
  const props = child.props;
  if (!props.dataKey) {
    return true;
  }
  barDataKeys.push(props.dataKey);
  upsertLineConfig(lines, {
    dataKey: props.dataKey,
    stroke: props.stroke || props.fill || "var(--chart-line-primary)",
    strokeWidth: 0
  });
  return true;
}
function tryAppendLine(child, lines) {
  const name = getChildComponentName(child);
  if (!(child.type === Line || name === "Line")) {
    return false;
  }
  const props = child.props;
  if (props.dataKey) {
    upsertLineConfig(lines, {
      dataKey: props.dataKey,
      stroke: props.stroke || "var(--chart-line-primary)",
      strokeWidth: props.strokeWidth ?? 2.5,
      yAxisId: props.yAxisId
    });
  }
  return true;
}
function tryAppendArea(child, lines) {
  const name = getChildComponentName(child);
  if (!(child.type === Area || name === "Area")) {
    return false;
  }
  const props = child.props;
  if (props.dataKey) {
    upsertLineConfig(lines, {
      dataKey: props.dataKey,
      stroke: props.stroke || props.fill || "var(--chart-line-primary)",
      strokeWidth: props.strokeWidth ?? 2,
      yAxisId: props.yAxisId
    });
  }
  return true;
}
function extractComposedSeries(children) {
  const lines = [];
  const barDataKeys = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) {
      return;
    }
    if (tryAppendSeriesBar(child, lines, barDataKeys)) {
      return;
    }
    if (tryAppendLine(child, lines)) {
      return;
    }
    tryAppendArea(child, lines);
  });
  return { lines, barDataKeys };
}
function computeComposedYScaleDomainMax(data, lines, barDataKeys) {
  const barSet = new Set(barDataKeys);
  let max = 0;
  for (const d of data) {
    let barSum = 0;
    for (const k of barDataKeys) {
      const v = d[k];
      if (typeof v === "number") {
        barSum += v;
      }
    }
    let rowMaxOther = 0;
    for (const line2 of lines) {
      if (barSet.has(line2.dataKey)) {
        continue;
      }
      const v = d[line2.dataKey];
      if (typeof v === "number") {
        rowMaxOther = Math.max(rowMaxOther, v);
      }
    }
    max = Math.max(max, barSum, rowMaxOther);
  }
  return max > 0 ? max : void 0;
}
function ChartInner({
  width,
  height,
  data,
  xDataKey,
  margin,
  animationDuration,
  animationEasing,
  enterTransition,
  revealSignature,
  children,
  containerRef,
  barSize,
  maxBarSize,
  barGap,
  stacked = false,
  stackGap = 0,
  onPhaseChange
}) {
  const { lines, barDataKeys } = useMemo(
    () => extractComposedSeries(children),
    [children]
  );
  const composedStackOffsets = useMemo(() => {
    if (!(stacked && barDataKeys.length > 0)) {
      return void 0;
    }
    const offsets = /* @__PURE__ */ new Map();
    for (let i = 0; i < data.length; i++) {
      const d = data[i];
      if (!d) {
        continue;
      }
      const pointOffsets = /* @__PURE__ */ new Map();
      let cumulative = 0;
      for (const key of barDataKeys) {
        pointOffsets.set(key, cumulative);
        const v = d[key];
        if (typeof v === "number") {
          cumulative += v;
        }
      }
      offsets.set(i, pointOffsets);
    }
    return offsets;
  }, [data, barDataKeys, stacked]);
  const yScaleDomainMax = useMemo(
    () => stacked && barDataKeys.length > 0 ? computeComposedYScaleDomainMax(data, lines, barDataKeys) : void 0,
    [data, lines, barDataKeys, stacked]
  );
  return /* @__PURE__ */ jsx(
    TimeSeriesChartInner,
    {
      animationDuration,
      animationEasing,
      clipPathId: "composed-chart-grow-clip",
      composedBarDataKeys: barDataKeys.length > 0 ? barDataKeys : void 0,
      composedBarGap: barGap,
      composedBarSize: barSize,
      composedMaxBarSize: maxBarSize,
      composedStacked: stacked,
      composedStackGap: stackGap,
      composedStackOffsets,
      containerRef,
      data,
      enterTransition,
      height,
      lines,
      margin,
      onPhaseChange,
      revealSignature,
      width,
      xDataKey,
      yScaleDomainMax,
      children
    }
  );
}
function ComposedChart({
  data,
  xDataKey = "date",
  margin: marginProp,
  animationDuration = 1100,
  animationEasing,
  enterTransition,
  revealSignature,
  aspectRatio = "2 / 1",
  className = "",
  children,
  barSize,
  maxBarSize,
  barGap = 4,
  stacked = false,
  stackGap = 0,
  onPhaseChange
}) {
  const containerRef = useRef(null);
  const margin = { ...DEFAULT_MARGIN, ...marginProp };
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: cn("relative w-full", className),
      ref: containerRef,
      style: { aspectRatio, touchAction: "none" },
      children: /* @__PURE__ */ jsx(ParentSize, { debounceTime: 10, children: ({ width, height }) => /* @__PURE__ */ jsx(
        ChartInner,
        {
          animationDuration,
          animationEasing,
          barGap,
          barSize,
          containerRef,
          data,
          enterTransition,
          height,
          margin,
          maxBarSize,
          onPhaseChange,
          revealSignature,
          stacked,
          stackGap,
          width,
          xDataKey,
          children
        }
      ) })
    }
  );
}
ComposedChart.displayName = "ComposedChart";
function useGridShimmer({
  innerWidth,
  shimmer,
  shimmerLength,
  shimmerSpeed,
  shimmerSync,
  active,
  oneShot = false
}) {
  const progress = useMotionValue(0);
  const reducedMotion = useReducedMotion();
  const shimmerCycleS = LINE_LOADING_PULSE_CYCLE_S / Math.max(shimmerSpeed, 0.1);
  const shimmerEnabled = active && shimmer && reducedMotion !== true && innerWidth > 0;
  useEffect(() => {
    if (!shimmerEnabled) {
      return;
    }
    let cancelled = false;
    let timeoutId;
    let controls;
    const runSyncedCycle = () => {
      if (cancelled) {
        return;
      }
      progress.set(0);
      controls = animate(progress, 1, {
        duration: shimmerCycleS,
        ease: [...LINE_LOADING_PULSE_EASE],
        onComplete: () => {
          if (cancelled) {
            return;
          }
          timeoutId = window.setTimeout(
            runSyncedCycle,
            LINE_LOADING_LOOP_PAUSE_MS
          );
        }
      });
    };
    if (shimmerSync && oneShot) {
      progress.set(0);
      controls = animate(progress, 1, {
        duration: shimmerCycleS / 2,
        ease: [...LINE_LOADING_PULSE_EASE]
      });
      return () => controls?.stop();
    }
    if (shimmerSync) {
      runSyncedCycle();
      return () => {
        cancelled = true;
        controls?.stop();
        if (timeoutId !== void 0) {
          window.clearTimeout(timeoutId);
        }
      };
    }
    progress.set(0);
    controls = animate(progress, 1, {
      duration: shimmerCycleS,
      repeat: Number.POSITIVE_INFINITY,
      ease: [...LINE_LOADING_PULSE_EASE]
    });
    return () => controls?.stop();
  }, [oneShot, progress, shimmerCycleS, shimmerEnabled, shimmerSync]);
  const shimmerX = useTransform(
    progress,
    (value) => -shimmerLength + value * (innerWidth + shimmerLength * 2)
  );
  const shimmerTransform = useTransform(shimmerX, (x) => `translate(${x}, 0)`);
  return { shimmerEnabled, shimmerTransform };
}
const DEFAULT_SHIMMER_LENGTH_PX = 140;
const DEFAULT_SHIMMER_SPEED = 1;
const DEFAULT_SHIMMER_STROKE = "color-mix(in oklch, var(--foreground) 68%, transparent)";
function hideEdgeTicks(ticks, hideEdgeLines) {
  if (!hideEdgeLines || ticks.length <= 2) {
    return ticks;
  }
  return ticks.slice(1, -1);
}
function resolveRowTickValues(options) {
  const { hideHorizontalEdgeLines, numTicksRows, rowTickValues, yScale } = options;
  const ticks = rowTickValues ?? (yScale.ticks ? yScale.ticks(numTicksRows) : []);
  const filtered = hideEdgeTicks(ticks, hideHorizontalEdgeLines);
  if (filtered === ticks && !rowTickValues && !hideHorizontalEdgeLines) {
    return void 0;
  }
  return filtered.length > 0 ? filtered : void 0;
}
function Grid({
  horizontal = true,
  vertical = false,
  numTicksRows = 5,
  numTicksColumns = 10,
  rowTickValues,
  stroke = chartCssVars.grid,
  loadingStroke,
  strokeOpacity = 1,
  strokeWidth = 1,
  strokeDasharray = "4,4",
  highlightRowValues,
  highlightRowStroke = chartCssVars.foregroundMuted,
  highlightRowStrokeOpacity = 1,
  highlightRowStrokeWidth = 1,
  highlightRowStrokeDasharray = "0",
  fadeHorizontal = true,
  fadeVertical = false,
  hideHorizontalEdgeLines = false,
  hideVerticalEdgeLines = false,
  yAxisId,
  shimmer = false,
  shimmerStroke = DEFAULT_SHIMMER_STROKE,
  shimmerLength = DEFAULT_SHIMMER_LENGTH_PX,
  shimmerSpeed = DEFAULT_SHIMMER_SPEED,
  shimmerSync = false
}) {
  const { xScale, innerWidth, innerHeight, orientation, barScale, chartPhase } = useChartStable();
  const yScale = useYScale(yAxisId);
  const shimmerActive = shimmer && isLoadingChromePhase(chartPhase);
  const gridStroke = isLoadingGridChromePhase(chartPhase) && loadingStroke != null ? loadingStroke : stroke;
  const { shimmerEnabled, shimmerTransform } = useGridShimmer({
    innerWidth,
    shimmer,
    shimmerLength,
    shimmerSpeed,
    shimmerSync,
    active: shimmerActive
  });
  const isHorizontalBarChart = orientation === "horizontal" && barScale;
  const columnScale = isHorizontalBarChart ? yScale : xScale;
  const rowTickValuesResolved = resolveRowTickValues({
    hideHorizontalEdgeLines,
    numTicksRows,
    rowTickValues,
    yScale
  });
  const columnTickValuesResolved = vertical && columnScale && typeof columnScale === "function" && hideVerticalEdgeLines ? (() => {
    const ticks = columnScale.ticks?.(numTicksColumns) ?? [];
    const filtered = hideEdgeTicks(ticks, true);
    return filtered.length > 0 ? filtered : void 0;
  })() : void 0;
  const uniqueId = useId();
  const hMaskId = `grid-rows-fade-${uniqueId}`;
  const hGradientId = `${hMaskId}-gradient`;
  const shimmerGradientId = `grid-shimmer-${uniqueId}`;
  const vMaskId = `grid-cols-fade-${uniqueId}`;
  const vGradientId = `${vMaskId}-gradient`;
  const horizontalFadeMask = fadeHorizontal ? `url(#${hMaskId})` : void 0;
  return /* @__PURE__ */ jsxs("g", { className: "chart-grid", children: [
    horizontal && fadeHorizontal && /* @__PURE__ */ jsxs("defs", { children: [
      /* @__PURE__ */ jsxs("linearGradient", { id: hGradientId, x1: "0%", x2: "100%", y1: "0%", y2: "0%", children: [
        /* @__PURE__ */ jsx("stop", { offset: "0%", style: { stopColor: "white", stopOpacity: 0 } }),
        /* @__PURE__ */ jsx("stop", { offset: "10%", style: { stopColor: "white", stopOpacity: 1 } }),
        /* @__PURE__ */ jsx("stop", { offset: "90%", style: { stopColor: "white", stopOpacity: 1 } }),
        /* @__PURE__ */ jsx(
          "stop",
          {
            offset: "100%",
            style: { stopColor: "white", stopOpacity: 0 }
          }
        )
      ] }),
      /* @__PURE__ */ jsx("mask", { id: hMaskId, children: /* @__PURE__ */ jsx(
        "rect",
        {
          fill: `url(#${hGradientId})`,
          height: innerHeight,
          width: innerWidth,
          x: "0",
          y: "0"
        }
      ) })
    ] }),
    horizontal && shimmerEnabled ? /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs(
      motion.linearGradient,
      {
        gradientTransform: shimmerTransform,
        gradientUnits: "userSpaceOnUse",
        id: shimmerGradientId,
        x1: 0,
        x2: shimmerLength,
        y1: 0,
        y2: 0,
        children: [
          /* @__PURE__ */ jsx("stop", { offset: "0%", stopColor: shimmerStroke, stopOpacity: 0 }),
          /* @__PURE__ */ jsx("stop", { offset: "35%", stopColor: shimmerStroke, stopOpacity: 0.45 }),
          /* @__PURE__ */ jsx("stop", { offset: "50%", stopColor: shimmerStroke, stopOpacity: 1 }),
          /* @__PURE__ */ jsx("stop", { offset: "65%", stopColor: shimmerStroke, stopOpacity: 0.45 }),
          /* @__PURE__ */ jsx("stop", { offset: "100%", stopColor: shimmerStroke, stopOpacity: 0 })
        ]
      }
    ) }) : null,
    vertical && fadeVertical && /* @__PURE__ */ jsxs("defs", { children: [
      /* @__PURE__ */ jsxs("linearGradient", { id: vGradientId, x1: "0%", x2: "0%", y1: "0%", y2: "100%", children: [
        /* @__PURE__ */ jsx("stop", { offset: "0%", style: { stopColor: "white", stopOpacity: 0 } }),
        /* @__PURE__ */ jsx("stop", { offset: "10%", style: { stopColor: "white", stopOpacity: 1 } }),
        /* @__PURE__ */ jsx("stop", { offset: "90%", style: { stopColor: "white", stopOpacity: 1 } }),
        /* @__PURE__ */ jsx(
          "stop",
          {
            offset: "100%",
            style: { stopColor: "white", stopOpacity: 0 }
          }
        )
      ] }),
      /* @__PURE__ */ jsx("mask", { id: vMaskId, children: /* @__PURE__ */ jsx(
        "rect",
        {
          fill: `url(#${vGradientId})`,
          height: innerHeight,
          width: innerWidth,
          x: "0",
          y: "0"
        }
      ) })
    ] }),
    horizontal && /* @__PURE__ */ jsxs("g", { mask: horizontalFadeMask, children: [
      /* @__PURE__ */ jsx(
        GridRows,
        {
          numTicks: rowTickValuesResolved ? void 0 : numTicksRows,
          scale: yScale,
          stroke: gridStroke,
          strokeDasharray,
          strokeOpacity,
          strokeWidth,
          tickValues: rowTickValuesResolved,
          width: innerWidth
        }
      ),
      shimmerEnabled ? /* @__PURE__ */ jsx(
        GridRows,
        {
          numTicks: rowTickValuesResolved ? void 0 : numTicksRows,
          scale: yScale,
          stroke: `url(#${shimmerGradientId})`,
          strokeDasharray,
          strokeOpacity: 1,
          strokeWidth,
          tickValues: rowTickValuesResolved,
          width: innerWidth
        }
      ) : null
    ] }),
    horizontal && highlightRowValues && highlightRowValues.length > 0 ? /* @__PURE__ */ jsx("g", { className: "chart-grid-highlight-rows", children: highlightRowValues.map((value) => {
      const y = yScale(value);
      if (y == null || !Number.isFinite(y)) {
        return null;
      }
      return /* @__PURE__ */ jsx(
        "line",
        {
          stroke: highlightRowStroke,
          strokeDasharray: highlightRowStrokeDasharray,
          strokeOpacity: highlightRowStrokeOpacity,
          strokeWidth: highlightRowStrokeWidth,
          x1: 0,
          x2: innerWidth,
          y1: y,
          y2: y
        },
        value
      );
    }) }) : null,
    vertical && columnScale && typeof columnScale === "function" && /* @__PURE__ */ jsx("g", { mask: fadeVertical ? `url(#${vMaskId})` : void 0, children: /* @__PURE__ */ jsx(
      GridColumns,
      {
        height: innerHeight,
        numTicks: columnTickValuesResolved ? void 0 : numTicksColumns,
        scale: columnScale,
        stroke,
        strokeDasharray,
        strokeOpacity,
        strokeWidth,
        tickValues: columnTickValuesResolved
      }
    ) })
  ] });
}
Grid.displayName = "Grid";
const TICKER_ITEM_HEIGHT = 24;
const COMPACT_TICKER_THRESHOLD = 60;
const DateTickerCompact = memo(function DateTickerCompact2({
  currentIndex,
  labels
}) {
  const label = labels[currentIndex] ?? labels[0] ?? "";
  return /* @__PURE__ */ jsx("div", { className: "overflow-hidden rounded-full bg-chart-tooltip-background px-4 py-1 text-chart-tooltip-foreground shadow-lg", children: /* @__PURE__ */ jsx("div", { className: "flex h-6 items-center justify-center", children: /* @__PURE__ */ jsx("span", { className: "whitespace-nowrap font-medium text-sm", children: label }) }) });
});
const DateTickerInner = memo(function DateTickerInner2({
  currentIndex,
  labels
}) {
  const parsedLabels = useMemo(() => {
    return labels.map((label, index) => {
      const parts = label.split(" ");
      const month = parts[0] || "";
      const day = parts[1] || "";
      return { month, day, full: label, key: `${label}::${index}` };
    });
  }, [labels]);
  const monthSegments = useMemo(() => {
    const segments = [];
    parsedLabels.forEach((label, index) => {
      const prev = segments.at(-1);
      if (!prev || prev.month !== label.month) {
        segments.push({
          month: label.month,
          key: `${label.month}-${index}`,
          startIndex: index
        });
      }
    });
    return segments;
  }, [parsedLabels]);
  const currentMonthIndex = useMemo(() => {
    if (currentIndex < 0 || currentIndex >= parsedLabels.length) {
      return 0;
    }
    for (let i = monthSegments.length - 1; i >= 0; i--) {
      const segment = monthSegments[i];
      if (segment && segment.startIndex <= currentIndex) {
        return i;
      }
    }
    return 0;
  }, [currentIndex, parsedLabels.length, monthSegments]);
  const prevMonthIndexRef = useRef(-1);
  const dayY = useSpring(0, { stiffness: 400, damping: 35 });
  const monthY = useSpring(0, { stiffness: 400, damping: 35 });
  dayY.set(-currentIndex * TICKER_ITEM_HEIGHT);
  if (currentMonthIndex >= 0) {
    const isFirstRender = prevMonthIndexRef.current === -1;
    const monthChanged = prevMonthIndexRef.current !== currentMonthIndex;
    if (isFirstRender || monthChanged) {
      monthY.set(-currentMonthIndex * TICKER_ITEM_HEIGHT);
      prevMonthIndexRef.current = currentMonthIndex;
    }
  }
  return /* @__PURE__ */ jsx("div", { className: "overflow-hidden rounded-full bg-chart-tooltip-background px-4 py-1 text-chart-tooltip-foreground shadow-lg", children: /* @__PURE__ */ jsx("div", { className: "relative h-6 overflow-hidden", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-1", children: [
    /* @__PURE__ */ jsx("div", { className: "relative h-6 overflow-hidden", children: /* @__PURE__ */ jsx(motion.div, { className: "flex flex-col", style: { y: monthY }, children: monthSegments.map((segment) => /* @__PURE__ */ jsx(
      "div",
      {
        className: "flex h-6 shrink-0 items-center justify-center",
        children: /* @__PURE__ */ jsx("span", { className: "whitespace-nowrap font-medium text-sm", children: segment.month })
      },
      segment.key
    )) }) }),
    /* @__PURE__ */ jsx("div", { className: "relative h-6 overflow-hidden", children: /* @__PURE__ */ jsx(motion.div, { className: "flex flex-col", style: { y: dayY }, children: parsedLabels.map((label) => /* @__PURE__ */ jsx(
      "div",
      {
        className: "flex h-6 shrink-0 items-center justify-center",
        children: /* @__PURE__ */ jsx("span", { className: "whitespace-nowrap font-medium text-sm", children: label.day })
      },
      label.key
    )) }) })
  ] }) }) });
});
function DateTicker({ currentIndex, labels, visible }) {
  if (!visible || labels.length === 0) {
    return null;
  }
  if (labels.length > COMPACT_TICKER_THRESHOLD) {
    return /* @__PURE__ */ jsx(DateTickerCompact, { currentIndex, labels });
  }
  return /* @__PURE__ */ jsx(DateTickerInner, { currentIndex, labels });
}
DateTicker.displayName = "DateTicker";
function TooltipBox(props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const container = props.containerRef.current;
  if (!(mounted && container)) {
    return null;
  }
  if (!props.visible) {
    return null;
  }
  return /* @__PURE__ */ jsx(TooltipBoxInner, { ...props, container });
}
function TooltipBoxInner({
  x,
  y,
  containerWidth,
  containerHeight,
  offset = 16,
  className = "",
  children,
  left: leftOverride,
  top: topOverride,
  flipped: flippedOverride,
  springConfig,
  animate: animate2 = true,
  entrance = true,
  panelStyle,
  backgroundColor = chartCssVars.tooltipBackground,
  container
}) {
  const { tooltipBoxSpring } = useChartConfig();
  const effectiveSpring = springConfig ?? tooltipBoxSpring;
  const tooltipRef = useRef(null);
  const tooltipWidthRef = useRef(180);
  const tooltipHeightRef = useRef(80);
  const [staticPosition, setStaticPosition] = useState({ left: x, top: y });
  const tw = tooltipWidthRef.current;
  const th = tooltipHeightRef.current;
  const shouldFlipX = x + tw + offset > containerWidth;
  const targetX = shouldFlipX ? x - offset - tw : x + offset;
  const targetY = Math.max(
    offset,
    Math.min(y - th / 2, containerHeight - th - offset)
  );
  const animatedLeft = useSpring(targetX, effectiveSpring);
  const animatedTop = useSpring(targetY, effectiveSpring);
  if (animate2 && leftOverride === void 0) {
    animatedLeft.set(targetX);
  }
  if (animate2 && topOverride === void 0) {
    animatedTop.set(targetY);
  }
  useLayoutEffect(() => {
    if (!tooltipRef.current) {
      return;
    }
    const el = tooltipRef.current;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    if (w > 0) {
      tooltipWidthRef.current = w;
    }
    if (h > 0) {
      tooltipHeightRef.current = h;
    }
    const w2 = tooltipWidthRef.current;
    const h2 = tooltipHeightRef.current;
    const flip = x + w2 + offset > containerWidth;
    const tx = flip ? x - offset - w2 : x + offset;
    const ty = Math.max(
      offset,
      Math.min(y - h2 / 2, containerHeight - h2 - offset)
    );
    if (!animate2) {
      setStaticPosition({ left: tx, top: ty });
      return;
    }
    if (leftOverride === void 0) {
      animatedLeft.set(tx);
    }
    if (topOverride === void 0) {
      animatedTop.set(ty);
    }
  }, [
    x,
    y,
    containerWidth,
    containerHeight,
    offset,
    leftOverride,
    topOverride,
    animate2,
    animatedLeft,
    animatedTop
  ]);
  const prevFlipRef = useRef(shouldFlipX);
  const [flipKey, setFlipKey] = useState(0);
  useEffect(() => {
    if (prevFlipRef.current !== shouldFlipX) {
      setFlipKey((k) => k + 1);
      prevFlipRef.current = shouldFlipX;
    }
  }, [shouldFlipX]);
  const finalLeft = animate2 ? leftOverride ?? animatedLeft : staticPosition.left;
  const finalTop = animate2 ? topOverride ?? animatedTop : staticPosition.top;
  const isFlipped = flippedOverride ?? shouldFlipX;
  const transformOrigin = isFlipped ? "right top" : "left top";
  const panelClassName = cn(
    "min-w-[140px] overflow-hidden rounded-lg text-chart-tooltip-foreground shadow-lg",
    panelStyle?.backgroundColor === void 0 && backgroundColor === chartCssVars.tooltipBackground && "bg-chart-tooltip-background",
    panelStyle?.backdropFilter === void 0 && "backdrop-blur-md"
  );
  const panelStyleResolved = {
    transformOrigin,
    ...panelStyle?.backgroundColor === void 0 && {
      backgroundColor
    },
    ...panelStyle
  };
  if (!entrance) {
    return createPortal(
      /* @__PURE__ */ jsx(
        "div",
        {
          className: cn("pointer-events-none absolute z-50", className),
          ref: tooltipRef,
          style: { left: staticPosition.left, top: staticPosition.top },
          children: /* @__PURE__ */ jsx("div", { className: panelClassName, style: panelStyleResolved, children })
        }
      ),
      container
    );
  }
  return createPortal(
    /* @__PURE__ */ jsx(
      motion.div,
      {
        animate: { opacity: 1 },
        className: cn("pointer-events-none absolute z-50", className),
        exit: { opacity: 0 },
        initial: { opacity: 0 },
        ref: tooltipRef,
        style: { left: finalLeft, top: finalTop },
        transition: { duration: 0.1 },
        children: /* @__PURE__ */ jsx(
          motion.div,
          {
            animate: { scale: 1, opacity: 1, x: 0 },
            className: panelClassName,
            initial: { scale: 0.85, opacity: 0, x: isFlipped ? 20 : -20 },
            style: panelStyleResolved,
            transition: { type: "spring", stiffness: 300, damping: 25 },
            children
          },
          flipKey
        )
      }
    ),
    container
  );
}
TooltipBox.displayName = "TooltipBox";
function TooltipContent({ title, rows, children }) {
  return /* @__PURE__ */ jsx("div", { className: "overflow-hidden", children: /* @__PURE__ */ jsxs("div", { className: "px-3 py-2.5", children: [
    title && /* @__PURE__ */ jsx("div", { className: "mb-2 text-left font-medium text-chart-tooltip-foreground text-xs", children: title }),
    /* @__PURE__ */ jsx("div", { className: "space-y-1.5", children: rows.map((row) => /* @__PURE__ */ jsxs(
      "div",
      {
        className: "flex items-center justify-between gap-4",
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(
              "span",
              {
                className: "h-2.5 w-2.5 shrink-0 rounded-full",
                style: { backgroundColor: row.color }
              }
            ),
            /* @__PURE__ */ jsx("span", { className: "text-chart-tooltip-muted text-sm", children: row.label })
          ] }),
          /* @__PURE__ */ jsx("span", { className: "font-medium text-chart-tooltip-foreground text-sm tabular-nums", children: typeof row.value === "number" ? intFmt(row.value) : row.value })
        ]
      },
      `${row.label}-${row.color}`
    )) }),
    children && /* @__PURE__ */ jsx("div", { className: "mt-2 transition-opacity duration-normal ease-out", children })
  ] }) });
}
TooltipContent.displayName = "TooltipContent";
function ringCornerRadius(halfExtent, cornerRadiusFraction) {
  const side = halfExtent * 2;
  return side * Math.max(0, Math.min(0.5, cornerRadiusFraction));
}
function AnimatedRingDot({
  x,
  y,
  halfExtent,
  cornerRadiusFraction,
  fill,
  stroke,
  strokeWidth,
  springConfig
}) {
  const { tooltipSpring } = useChartConfig();
  const effectiveSpring = springConfig ?? tooltipSpring;
  const animatedX = useSpring(x, effectiveSpring);
  const animatedY = useSpring(y, effectiveSpring);
  const side = halfExtent * 2;
  const rx = ringCornerRadius(halfExtent, cornerRadiusFraction);
  const rectX = useTransform(animatedX, (value) => value - halfExtent);
  const rectY = useTransform(animatedY, (value) => value - halfExtent);
  animatedX.set(x);
  animatedY.set(y);
  return /* @__PURE__ */ jsx(
    motion.rect,
    {
      fill,
      height: side,
      rx,
      ry: rx,
      stroke,
      strokeWidth,
      width: side,
      x: rectX,
      y: rectY
    }
  );
}
function TooltipDot({
  x,
  y,
  visible,
  color,
  size = 5,
  strokeColor = chartCssVars.background,
  strokeWidth = 2,
  variant = "dot",
  cornerRadiusFraction = 0.25,
  springConfig,
  animate: animate2 = true
}) {
  const { tooltipSpring } = useChartConfig();
  const effectiveSpring = springConfig ?? tooltipSpring;
  const animatedX = useSpring(x, effectiveSpring);
  const animatedY = useSpring(y, effectiveSpring);
  const isRing = variant === "ring";
  const fill = isRing ? "transparent" : color;
  const stroke = isRing ? color : strokeColor;
  const effectiveStrokeWidth = isRing ? strokeWidth ?? 1.5 : strokeWidth;
  if (animate2 && !isRing) {
    animatedX.set(x);
    animatedY.set(y);
  }
  if (!visible) {
    return null;
  }
  if (isRing) {
    if (animate2) {
      return /* @__PURE__ */ jsx(
        AnimatedRingDot,
        {
          cornerRadiusFraction,
          fill,
          halfExtent: size,
          springConfig,
          stroke,
          strokeWidth: effectiveStrokeWidth,
          x,
          y
        }
      );
    }
    const side = size * 2;
    const rx = ringCornerRadius(size, cornerRadiusFraction);
    return /* @__PURE__ */ jsx(
      "rect",
      {
        fill,
        height: side,
        rx,
        ry: rx,
        stroke,
        strokeWidth: effectiveStrokeWidth,
        width: side,
        x: x - size,
        y: y - size
      }
    );
  }
  if (!animate2) {
    return /* @__PURE__ */ jsx(
      "circle",
      {
        cx: x,
        cy: y,
        fill,
        r: size,
        stroke,
        strokeWidth: effectiveStrokeWidth
      }
    );
  }
  return /* @__PURE__ */ jsx(
    motion.circle,
    {
      cx: animatedX,
      cy: animatedY,
      fill,
      r: size,
      stroke,
      strokeWidth: effectiveStrokeWidth
    }
  );
}
TooltipDot.displayName = "TooltipDot";
function resolveVerticalFadeSides(fade) {
  if (fade === false || fade === "none") {
    return { top: false, bottom: false, any: false };
  }
  if (fade === true || fade === "both") {
    return { top: true, bottom: true, any: true };
  }
  if (fade === "top") {
    return { top: true, bottom: false, any: true };
  }
  return { top: false, bottom: true, any: true };
}
function indicatorFadeGradientStops(sides, fadeLengthPercent = 10) {
  const fade = Math.min(40, Math.max(2, fadeLengthPercent));
  const innerEnd = 100 - fade;
  if (!sides.any) {
    return [{ offset: "0%", opacity: 1 }];
  }
  if (sides.top && sides.bottom) {
    return [
      { offset: "0%", opacity: 0 },
      { offset: `${fade}%`, opacity: 1 },
      { offset: "50%", opacity: 1 },
      { offset: `${innerEnd}%`, opacity: 1 },
      { offset: "100%", opacity: 0 }
    ];
  }
  if (sides.top) {
    return [
      { offset: "0%", opacity: 0 },
      { offset: `${fade}%`, opacity: 1 },
      { offset: "100%", opacity: 1 }
    ];
  }
  return [
    { offset: "0%", opacity: 1 },
    { offset: `${innerEnd}%`, opacity: 1 },
    { offset: "100%", opacity: 0 }
  ];
}
function resolveWidth(width) {
  if (typeof width === "number") {
    return width;
  }
  switch (width) {
    case "line":
      return 1;
    case "thin":
      return 2;
    case "medium":
      return 4;
    case "thick":
      return 8;
    default:
      return 1;
  }
}
function TooltipIndicator(props) {
  if (!props.visible) {
    return null;
  }
  return /* @__PURE__ */ jsx(TooltipIndicatorInner, { ...props });
}
function TooltipIndicatorInner({
  x,
  visible,
  height,
  width = "line",
  span,
  columnWidth,
  colorEdge = chartCssVars.crosshair,
  colorMid = chartCssVars.crosshair,
  fadeEdges = "both",
  fadeLength = 10,
  animate: animate2 = true,
  gradientId = "tooltip-indicator-gradient",
  springConfig,
  strokeDasharray
}) {
  const { tooltipSpring } = useChartConfig();
  const effectiveSpring = springConfig ?? tooltipSpring;
  const pixelWidth = span !== void 0 && columnWidth !== void 0 ? span * columnWidth : resolveWidth(width);
  const rectX = x - pixelWidth / 2;
  const lineX = x;
  const animatedX = useSpring(rectX, effectiveSpring);
  const animatedLineX = useSpring(lineX, effectiveSpring);
  if (animate2) {
    animatedX.set(rectX);
    animatedLineX.set(lineX);
  }
  useEffect(() => {
    animatedX.set(rectX);
    animatedLineX.set(lineX);
  }, [animatedLineX, animatedX, lineX, rectX, visible]);
  const indicatorFill = colorMid || colorEdge;
  const fadeSides = resolveVerticalFadeSides(fadeEdges);
  const dashed = Boolean(strokeDasharray);
  if (dashed) {
    const strokeWidth = Math.max(1, pixelWidth);
    return animate2 ? /* @__PURE__ */ jsx(
      motion.line,
      {
        stroke: indicatorFill,
        strokeDasharray,
        strokeWidth,
        x1: animatedLineX,
        x2: animatedLineX,
        y1: 0,
        y2: height
      }
    ) : /* @__PURE__ */ jsx(
      "line",
      {
        stroke: indicatorFill,
        strokeDasharray,
        strokeWidth,
        x1: lineX,
        x2: lineX,
        y1: 0,
        y2: height
      }
    );
  }
  if (!fadeSides.any) {
    return animate2 ? /* @__PURE__ */ jsx(
      motion.rect,
      {
        fill: indicatorFill,
        height,
        width: pixelWidth,
        x: animatedX,
        y: 0
      }
    ) : /* @__PURE__ */ jsx(
      "rect",
      {
        fill: indicatorFill,
        height,
        width: pixelWidth,
        x: rectX,
        y: 0
      }
    );
  }
  const fadeStops = indicatorFadeGradientStops(fadeSides, fadeLength);
  return /* @__PURE__ */ jsxs("g", { children: [
    /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsx("linearGradient", { id: gradientId, x1: "0%", x2: "0%", y1: "0%", y2: "100%", children: fadeStops.map((stop) => /* @__PURE__ */ jsx(
      "stop",
      {
        offset: stop.offset,
        style: { stopColor: indicatorFill, stopOpacity: stop.opacity }
      },
      stop.offset
    )) }) }),
    animate2 ? /* @__PURE__ */ jsx(
      motion.rect,
      {
        fill: `url(#${gradientId})`,
        height,
        width: pixelWidth,
        x: animatedX,
        y: 0
      }
    ) : /* @__PURE__ */ jsx(
      "rect",
      {
        fill: `url(#${gradientId})`,
        height,
        width: pixelWidth,
        x: rectX,
        y: 0
      }
    )
  ] });
}
TooltipIndicator.displayName = "TooltipIndicator";
const ChartTooltipInner = memo(function ChartTooltipInner2({
  showDatePill = true,
  showCrosshair = true,
  showDots = true,
  dotVariant = "dot",
  dotSize = 5,
  dotRadiusFraction,
  dotScale = 1,
  dotStrokeWidth,
  indicatorColor: indicatorColorProp,
  content,
  rows: rowsRenderer,
  dotColor: dotColorProp,
  children,
  className = "",
  container,
  springConfig,
  matchCrosshair = false,
  damping,
  indicatorDasharray,
  indicatorFadeEdges,
  indicatorFadeLength,
  boxSpringConfig,
  panelStyle,
  backgroundColor
}) {
  const {
    tooltipData,
    width,
    height,
    innerHeight,
    margin,
    columnWidth,
    lines,
    xAccessor,
    dateLabels,
    containerRef,
    orientation,
    barXAccessor,
    bandWidth,
    squareSnap
  } = useChart();
  const { tooltipSpring } = useChartConfig();
  const isHorizontal = orientation === "horizontal";
  const discreteInteraction = dateLabels.length > 60;
  const resolvedDotSize = useMemo(() => {
    if (dotVariant !== "ring" || !bandWidth || lines.length === 0) {
      return dotSize * dotScale;
    }
    const seriesCount = lines.length;
    const gap = squareSnap?.groupGap ?? (seriesCount > 1 ? 4 : 0);
    const squareSize = (bandWidth - gap * (seriesCount - 1)) / seriesCount;
    return squareSize / 2 * dotScale;
  }, [
    bandWidth,
    dotScale,
    dotSize,
    dotVariant,
    lines.length,
    squareSnap?.groupGap
  ]);
  const boxMotion = useMemo(() => {
    if (boxSpringConfig) {
      return {
        animate: !discreteInteraction,
        springConfig: boxSpringConfig
      };
    }
    if (matchCrosshair) {
      return {
        animate: !discreteInteraction,
        springConfig: springConfig ?? tooltipSpring
      };
    }
    return resolveTooltipBoxMotion(damping);
  }, [
    boxSpringConfig,
    damping,
    discreteInteraction,
    matchCrosshair,
    springConfig,
    tooltipSpring
  ]);
  const visible = tooltipData !== null;
  const x = tooltipData?.x ?? 0;
  const xWithMargin = x + margin.left;
  const firstLineDataKey = lines[0]?.dataKey;
  const firstLineY = firstLineDataKey ? tooltipData?.yPositions[firstLineDataKey] ?? 0 : 0;
  const yWithMargin = firstLineY + margin.top;
  const tooltipRows = useMemo(() => {
    if (!tooltipData) {
      return [];
    }
    if (rowsRenderer) {
      return rowsRenderer(tooltipData.point);
    }
    return lines.map((line2) => ({
      color: line2.stroke,
      label: line2.dataKey,
      value: tooltipData.point[line2.dataKey] ?? 0
    }));
  }, [tooltipData, lines, rowsRenderer]);
  const resolveDotColor = useMemo(() => {
    return (line2, index) => {
      if (rowsRenderer && tooltipRows[index]?.color) {
        return tooltipRows[index].color;
      }
      if (dotColorProp != null) {
        if (typeof dotColorProp === "function" && tooltipData) {
          return dotColorProp(tooltipData.point, line2);
        }
        if (typeof dotColorProp === "string") {
          return dotColorProp;
        }
      }
      return line2.stroke;
    };
  }, [dotColorProp, rowsRenderer, tooltipData, tooltipRows]);
  const indicatorColor = useMemo(() => {
    if (indicatorColorProp == null) {
      return chartCssVars.crosshair;
    }
    if (typeof indicatorColorProp === "function") {
      return tooltipData ? indicatorColorProp(tooltipData.point) : chartCssVars.crosshair;
    }
    return indicatorColorProp;
  }, [indicatorColorProp, tooltipData]);
  const title = useMemo(() => {
    if (!tooltipData) {
      return void 0;
    }
    if (barXAccessor) {
      return barXAccessor(tooltipData.point);
    }
    return weekdayDateFmt.format(xAccessor(tooltipData.point));
  }, [tooltipData, barXAccessor, xAccessor]);
  const tooltipContent = /* @__PURE__ */ jsxs(Fragment, { children: [
    showCrosshair && /* @__PURE__ */ jsx(
      "svg",
      {
        "aria-hidden": "true",
        className: "pointer-events-none absolute inset-0",
        height: "100%",
        width: "100%",
        children: /* @__PURE__ */ jsx("g", { transform: `translate(${margin.left},${margin.top})`, children: /* @__PURE__ */ jsx(
          TooltipIndicator,
          {
            animate: !discreteInteraction,
            colorEdge: indicatorColor,
            colorMid: indicatorColor,
            columnWidth,
            fadeEdges: indicatorDasharray ? "none" : indicatorFadeEdges ?? "both",
            fadeLength: indicatorFadeLength,
            height: innerHeight,
            springConfig,
            strokeDasharray: indicatorDasharray,
            visible,
            width: "line",
            x
          }
        ) })
      }
    ),
    showDots && visible && !isHorizontal && /* @__PURE__ */ jsx(
      "svg",
      {
        "aria-hidden": "true",
        className: "pointer-events-none absolute inset-0",
        height: "100%",
        width: "100%",
        children: /* @__PURE__ */ jsx("g", { transform: `translate(${margin.left},${margin.top})`, children: lines.map((line2, index) => /* @__PURE__ */ jsx(
          TooltipDot,
          {
            color: resolveDotColor(line2, index),
            cornerRadiusFraction: dotVariant === "ring" ? dotRadiusFraction : void 0,
            size: resolvedDotSize,
            springConfig,
            strokeColor: chartCssVars.background,
            strokeWidth: dotVariant === "ring" ? dotStrokeWidth : void 0,
            variant: dotVariant,
            visible,
            x: tooltipData?.xPositions?.[line2.dataKey] ?? x,
            y: tooltipData?.yPositions[line2.dataKey] ?? 0
          },
          line2.dataKey
        )) })
      }
    ),
    /* @__PURE__ */ jsx(
      TooltipBox,
      {
        animate: boxMotion.animate,
        backgroundColor,
        className,
        containerHeight: height,
        containerRef,
        containerWidth: width,
        panelStyle,
        springConfig: boxMotion.springConfig,
        top: isHorizontal ? void 0 : margin.top,
        visible,
        x: xWithMargin,
        y: isHorizontal ? yWithMargin : margin.top,
        children: content && tooltipData ? content({
          point: tooltipData.point,
          index: tooltipData.index
        }) : !content && /* @__PURE__ */ jsx(TooltipContent, { rows: tooltipRows, title, children })
      }
    ),
    /* @__PURE__ */ jsx(
      DatePillTracker,
      {
        currentIndex: tooltipData?.index ?? 0,
        discreteInteraction,
        enabled: showDatePill && !isHorizontal,
        labels: dateLabels,
        springConfig,
        visible,
        xWithMargin
      }
    )
  ] });
  return createPortal(tooltipContent, container);
});
function ChartTooltip(props) {
  const { containerRef } = useChartStable();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const container = containerRef.current;
  if (!(mounted && container)) {
    return null;
  }
  return /* @__PURE__ */ jsx(ChartTooltipInner, { ...props, container });
}
ChartTooltip.displayName = "ChartTooltip";
function DatePillTracker(props) {
  if (!(props.enabled && props.visible && props.labels.length > 0)) {
    return null;
  }
  return /* @__PURE__ */ jsx(DatePillTrackerInner, { ...props });
}
function DatePillTrackerInner({
  labels,
  currentIndex,
  xWithMargin,
  discreteInteraction,
  springConfig,
  visible
}) {
  const { tooltipSpring } = useChartConfig();
  const effectiveSpring = springConfig ?? tooltipSpring;
  const animatedX = useSpring(xWithMargin, effectiveSpring);
  if (!discreteInteraction) {
    animatedX.set(xWithMargin);
  }
  useEffect(() => {
    animatedX.set(xWithMargin);
  }, [animatedX, visible]);
  return /* @__PURE__ */ jsx(
    motion.div,
    {
      className: "pointer-events-none absolute z-50",
      style: {
        left: discreteInteraction ? xWithMargin : animatedX,
        transform: "translateX(-50%)",
        bottom: 4
      },
      children: /* @__PURE__ */ jsx(
        DateTicker,
        {
          currentIndex,
          labels,
          visible
        }
      )
    }
  );
}
const X_AXIS_POSITION_TWEEN_MS = DEFAULT_Y_DOMAIN_TWEEN_MS;
function XAxisLabel({
  label,
  x,
  crosshairX,
  hoveredLabel,
  isHovering,
  tickerHalfWidth,
  animatePosition
}) {
  const fadeBuffer = 20;
  const fadeRadius = tickerHalfWidth + fadeBuffer;
  let opacity = 1;
  if (isHovering && crosshairX !== null) {
    const distance = Math.abs(x - crosshairX);
    if (distance < tickerHalfWidth) {
      opacity = 0;
    } else if (hoveredLabel && label === hoveredLabel) {
      opacity = 0;
    } else if (distance < fadeRadius) {
      opacity = (distance - tickerHalfWidth) / fadeBuffer;
    }
  }
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: "absolute",
      style: {
        left: x,
        bottom: 12,
        width: 0,
        display: "flex",
        justifyContent: "center",
        transition: animatePosition ? `left ${X_AXIS_POSITION_TWEEN_MS}ms cubic-bezier(${LINE_LOADING_PULSE_EASE.join(", ")})` : void 0
      },
      children: /* @__PURE__ */ jsx(
        "span",
        {
          className: cn("whitespace-nowrap text-chart-label text-xs"),
          style: {
            opacity,
            transition: "opacity 0.4s ease-in-out"
          },
          children: label
        }
      )
    }
  );
}
const MAX_GAP_LAYOUTS = 400;
function binomial(n, k) {
  if (k < 0 || k > n) {
    return 0;
  }
  let result = 1;
  for (let i = 0; i < k; i++) {
    result = result * (n - i) / (i + 1);
  }
  return result;
}
function composePositiveSum(sum, parts) {
  if (parts === 1) {
    return sum >= 1 ? [[sum]] : [];
  }
  const layouts = [];
  for (let gap = 1; gap <= sum - (parts - 1); gap++) {
    for (const tail of composePositiveSum(sum - gap, parts - 1)) {
      layouts.push([gap, ...tail]);
    }
  }
  return layouts;
}
function gapsToIndices(gaps) {
  const indices = [0];
  let position = 0;
  for (const gap of gaps) {
    position += gap;
    indices.push(position);
  }
  return indices;
}
function indicesForTickCount(length, tickCount) {
  const span = length - 1;
  if (span <= 0) {
    return [0];
  }
  const rawIndices = Array.from(
    { length: tickCount },
    (_, index) => Math.round(index / (tickCount - 1) * span)
  );
  const indices = [...new Set(rawIndices)].sort((a, b) => a - b);
  if (indices[0] !== 0) {
    indices.unshift(0);
  }
  if (indices.at(-1) !== span) {
    indices.push(span);
  }
  return [...new Set(indices)].sort((a, b) => a - b);
}
function allIndexLayouts(length, tickCount) {
  const span = length - 1;
  if (span <= 0) {
    return [[0]];
  }
  const gapCount = tickCount - 1;
  if (gapCount <= 0) {
    return [[0]];
  }
  const layoutCount = binomial(span - 1, gapCount - 1);
  if (layoutCount > MAX_GAP_LAYOUTS) {
    return [indicesForTickCount(length, tickCount)];
  }
  return composePositiveSum(span, gapCount).map(gapsToIndices);
}
function dedupeIndicesByLabel(indices, data, dateLabels, xAccessor) {
  const seenLabels = /* @__PURE__ */ new Set();
  const deduped = [];
  for (const index of indices) {
    const point = data[index];
    if (!point) {
      continue;
    }
    const label = dateLabels[index] ?? shortDateFmt.format(xAccessor(point));
    if (seenLabels.has(label)) {
      continue;
    }
    seenLabels.add(label);
    deduped.push(index);
  }
  return deduped;
}
function indexGaps(indices) {
  const gaps = [];
  for (let i = 1; i < indices.length; i++) {
    const current = indices[i];
    const previous = indices[i - 1];
    if (current == null || previous == null) {
      continue;
    }
    gaps.push(current - previous);
  }
  return gaps;
}
function smallestGapEdgePreference(indices) {
  const gaps = indexGaps(indices);
  const smallestGap = Math.min(...gaps);
  const smallestGapIndex = gaps.indexOf(smallestGap);
  if (smallestGapIndex === gaps.length - 1) {
    return 0;
  }
  if (smallestGapIndex === 0) {
    return 1;
  }
  return 2;
}
function scoreTickLayout(indices, resolveXPx, targetCount) {
  if (indices.length < 2) {
    return {
      score: Number.POSITIVE_INFINITY,
      symmetryPenalty: Number.POSITIVE_INFINITY,
      countDistance: Number.POSITIVE_INFINITY,
      edgePreference: Number.POSITIVE_INFINITY
    };
  }
  const pixelGaps = [];
  for (let i = 1; i < indices.length; i++) {
    const current = indices[i];
    const previous = indices[i - 1];
    if (current == null || previous == null) {
      continue;
    }
    pixelGaps.push(resolveXPx(current) - resolveXPx(previous));
  }
  const minGap = Math.min(...pixelGaps);
  const maxGap = Math.max(...pixelGaps);
  const meanGap = pixelGaps.reduce((sum, gap) => sum + gap, 0) / pixelGaps.length;
  const spreadRatio = meanGap > 0 ? (maxGap - minGap) / meanGap : maxGap - minGap;
  const countDistance = Math.abs(indices.length - targetCount);
  const gaps = indexGaps(indices);
  const smallestGap = Math.min(...gaps);
  const smallestGapIndex = gaps.indexOf(smallestGap);
  const interiorPenalty = smallestGapIndex > 0 && smallestGapIndex < gaps.length - 1 ? 0.08 : 0;
  const symmetryPenalty = gaps.reduce((penalty, gap, index) => {
    return penalty + Math.abs(gap - (gaps.at(-1 - index) ?? gap));
  }, 0) / gaps.length;
  return {
    score: spreadRatio + 0.1 * countDistance + interiorPenalty + symmetryPenalty * 0.02,
    symmetryPenalty,
    countDistance,
    edgePreference: smallestGapEdgePreference(indices)
  };
}
function isBetterTickLayout(next, best, nextCountDistance, bestCountDistance) {
  if (next.score < best.score - 1e-6) {
    return true;
  }
  if (Math.abs(next.score - best.score) > 1e-6) {
    return false;
  }
  if (nextCountDistance < bestCountDistance) {
    return true;
  }
  if (nextCountDistance > bestCountDistance) {
    return false;
  }
  if (next.symmetryPenalty < best.symmetryPenalty - 1e-6) {
    return true;
  }
  if (next.symmetryPenalty > best.symmetryPenalty + 1e-6) {
    return false;
  }
  return next.edgePreference < best.edgePreference;
}
function selectEvenlySpacedIndices(length, targetCount, options) {
  if (length <= 0) {
    return [];
  }
  if (length === 1) {
    return [0];
  }
  if (length <= targetCount) {
    return Array.from({ length }, (_, index) => index);
  }
  const resolveXPx = options?.resolveXPx ?? ((index) => index);
  const minCount = Math.max(2, targetCount - 1);
  const maxCount = Math.min(length, targetCount + 1);
  let bestIndices = indicesForTickCount(length, targetCount);
  let bestScore = scoreTickLayout(bestIndices, resolveXPx, targetCount);
  let bestCountDistance = bestScore.countDistance;
  for (let tickCount = minCount; tickCount <= maxCount; tickCount++) {
    for (const rawIndices of allIndexLayouts(length, tickCount)) {
      const indices = options?.data && options.dateLabels && options.xAccessor ? dedupeIndicesByLabel(
        rawIndices,
        options.data,
        options.dateLabels,
        options.xAccessor
      ) : rawIndices;
      if (indices.length < 2) {
        continue;
      }
      const layoutScore = scoreTickLayout(indices, resolveXPx, targetCount);
      const countDistance = Math.abs(indices.length - targetCount);
      if (isBetterTickLayout(
        layoutScore,
        bestScore,
        countDistance,
        bestCountDistance
      )) {
        bestIndices = indices;
        bestScore = layoutScore;
        bestCountDistance = countDistance;
      }
    }
  }
  return bestIndices;
}
function buildDataAlignedTicks({
  data,
  dateLabels,
  marginLeft,
  targetTickCount,
  xAccessor,
  xScale
}) {
  const seenLabels = /* @__PURE__ */ new Set();
  const ticks = [];
  const resolveXPx = (index) => {
    const point = data[index];
    if (!point) {
      return index;
    }
    return xScale(xAccessor(point)) ?? 0;
  };
  for (const index of selectEvenlySpacedIndices(data.length, targetTickCount, {
    data,
    dateLabels,
    resolveXPx,
    xAccessor
  })) {
    const point = data[index];
    if (!point) {
      continue;
    }
    const date = xAccessor(point);
    const label = dateLabels[index] ?? shortDateFmt.format(date);
    if (seenLabels.has(label)) {
      continue;
    }
    seenLabels.add(label);
    ticks.push({
      date,
      label,
      x: (xScale(date) ?? 0) + marginLeft
    });
  }
  return ticks;
}
function buildDomainTicks({
  marginLeft,
  numTicks,
  xScale
}) {
  const domain = xScale.domain();
  const startDate = domain[0];
  const endDate = domain[1];
  if (!(startDate && endDate)) {
    return [];
  }
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();
  const timeRange = endTime - startTime;
  const tickCount = Math.max(2, numTicks);
  const seenLabels = /* @__PURE__ */ new Set();
  const ticks = [];
  for (let i = 0; i < tickCount; i++) {
    const t = i / (tickCount - 1);
    const date = new Date(startTime + t * timeRange);
    const label = shortDateFmt.format(date);
    if (seenLabels.has(label)) {
      continue;
    }
    seenLabels.add(label);
    ticks.push({
      date,
      label,
      x: (xScale(date) ?? 0) + marginLeft
    });
  }
  return ticks;
}
function domainExtendsPastData(data, xAccessor, xScale) {
  if (data.length === 0) {
    return false;
  }
  const domainEnd = xScale.domain()[1];
  const lastPoint = data.at(-1);
  if (!(domainEnd && lastPoint)) {
    return false;
  }
  return domainEnd.getTime() > xAccessor(lastPoint).getTime();
}
function appendProjectionTailTicks(ticks, data, xAccessor, xScale, marginLeft, maxExtraTicks) {
  if (data.length === 0 || maxExtraTicks <= 0) {
    return ticks;
  }
  const lastPoint = data.at(-1);
  const domainEnd = xScale.domain()[1];
  if (!(lastPoint && domainEnd)) {
    return ticks;
  }
  const lastDate = xAccessor(lastPoint);
  const startTime = lastDate.getTime();
  const endTime = domainEnd.getTime();
  if (endTime <= startTime) {
    return ticks;
  }
  const seenLabels = new Set(ticks.map((tick) => tick.label));
  const extras = [];
  const extraCount = Math.min(maxExtraTicks, 3);
  for (let i = 1; i <= extraCount; i++) {
    const date = new Date(
      startTime + i / (extraCount + 1) * (endTime - startTime)
    );
    const label = shortDateFmt.format(date);
    if (seenLabels.has(label)) {
      continue;
    }
    seenLabels.add(label);
    extras.push({
      date,
      label,
      x: (xScale(date) ?? 0) + marginLeft
    });
  }
  const endLabel = shortDateFmt.format(domainEnd);
  if (!seenLabels.has(endLabel)) {
    extras.push({
      date: domainEnd,
      label: endLabel,
      x: (xScale(domainEnd) ?? 0) + marginLeft
    });
  }
  if (extras.length === 0) {
    return ticks;
  }
  return [...ticks, ...extras].sort((a, b) => a.x - b.x);
}
function XAxis(props) {
  const { containerRef } = useChartStable();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const container = containerRef.current;
  if (!(mounted && container)) {
    return null;
  }
  return /* @__PURE__ */ jsx(XAxisInner, { ...props, container });
}
const XAxisInner = memo(function XAxisInner2({
  numTicks = 5,
  tickerHalfWidth = 50,
  tickMode = "data",
  container
}) {
  const { xScale, margin, tooltipData, data, xAccessor, dateLabels, xDomain } = useChart();
  const labelsToShow = useMemo(() => {
    const projectionExtendsScale = tickMode === "data" && domainExtendsPastData(data, xAccessor, xScale);
    if (tickMode === "domain") {
      return buildDomainTicks({
        marginLeft: margin.left,
        numTicks,
        xScale
      });
    }
    if (projectionExtendsScale && xDomain == null) {
      return buildDomainTicks({
        marginLeft: margin.left,
        numTicks,
        xScale
      });
    }
    const dataTicks = buildDataAlignedTicks({
      data,
      dateLabels,
      marginLeft: margin.left,
      targetTickCount: numTicks,
      xAccessor,
      xScale
    });
    if (projectionExtendsScale && xDomain != null) {
      return appendProjectionTailTicks(
        dataTicks,
        data,
        xAccessor,
        xScale,
        margin.left,
        Math.max(1, numTicks - dataTicks.length + 1)
      );
    }
    return dataTicks;
  }, [
    tickMode,
    xDomain,
    data,
    dateLabels,
    xAccessor,
    xScale,
    margin.left,
    numTicks
  ]);
  const isHovering = tooltipData !== null;
  const crosshairX = tooltipData ? tooltipData.x + margin.left : null;
  const hoveredLabel = isHovering && tooltipData ? dateLabels[tooltipData.index] ?? shortDateFmt.format(xAccessor(tooltipData.point)) : null;
  return createPortal(
    /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute inset-0", children: labelsToShow.map((item) => /* @__PURE__ */ jsx(
      XAxisLabel,
      {
        animatePosition: xDomain == null,
        crosshairX,
        hoveredLabel,
        isHovering,
        label: item.label,
        tickerHalfWidth,
        x: item.x
      },
      `${item.date.getTime()}-${item.x}`
    )) }),
    container
  );
});
XAxis.displayName = "XAxis";
function useMoney(currency) {
  return useMemo(() => {
    const symbol = currency?.symbol || "Rs";
    return (value, { compact = false } = {}) => {
      const number = Number(value ?? 0);
      if (!Number.isFinite(number)) return `${symbol} 0`;
      const body = compact && Math.abs(number) >= 1e3 ? `${Math.round(number / 100) / 10}k` : Math.round(number).toLocaleString("en-IN");
      return `${symbol} ${body}`;
    };
  }, [currency?.symbol]);
}
const dayLabel = (date = /* @__PURE__ */ new Date()) => date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
function greeting(date = /* @__PURE__ */ new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
function RevenueChart({ points }) {
  const defaultPoints = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const day = i + 1;
      const wave = Math.sin((day - 4) * (2 * Math.PI / 24));
      const revenue = 9e3 + wave * 2200 + Math.cos(day * 0.1) * 800;
      const barRevenue = revenue * 0.55 + Math.sin(day) * 200;
      const profit = revenue * 0.32 + Math.cos(day) * 100;
      return {
        date: new Date(2026, 0, day),
        revenue: Math.round(revenue),
        units: Math.round(barRevenue),
        runRate: Math.round(profit)
      };
    });
  }, []);
  const activePoints = useMemo(() => {
    if (Array.isArray(points) && points.length >= 2) {
      return points.map((p, idx) => {
        const day = idx + 1;
        return {
          date: new Date(2026, 0, day),
          revenue: Number(p.revenue) || 0,
          units: (Number(p.revenue) || 0) * 0.55,
          runRate: Number(p.profit) || 0
        };
      });
    }
    return defaultPoints;
  }, [points, defaultPoints]);
  return (
    /* Clip wrapper — maxHeight clips the bottom x-axis overflow without
       affecting ParentSize's ResizeObserver width measurement */
    /* @__PURE__ */ jsx("div", { style: { width: "100%", marginTop: 14, maxHeight: 210, overflow: "hidden" }, children: /* @__PURE__ */ jsxs(
      ComposedChart,
      {
        margin: { top: 6, right: 6, bottom: 36, left: 6 },
        data: activePoints,
        xDataKey: "date",
        aspectRatio: "3.6 / 1",
        barGap: 2,
        maxBarSize: 26,
        children: [
          /* @__PURE__ */ jsx(Grid, { horizontal: true }),
          /* @__PURE__ */ jsx(SeriesBar, { dataKey: "units", fill: "var(--chart-4)", fillOpacity: 0.85, radius: 3 }),
          /* @__PURE__ */ jsx(Area, { dataKey: "runRate", curve: curveCatmullRom.alpha(0.42), fill: "var(--chart-3)", fillOpacity: 0.18, stroke: "var(--chart-3)", strokeWidth: 1.5 }),
          /* @__PURE__ */ jsx(Line, { dataKey: "revenue", curve: curveCatmullRom.alpha(0.42), stroke: "#0e6b4f", strokeWidth: 2.5 }),
          /* @__PURE__ */ jsx(ChartTooltip, { showCrosshair: false }),
          /* @__PURE__ */ jsx(XAxis, { numTicks: 6 })
        ]
      }
    ) })
  );
}
function StatCard({ label, value, footnote, tone = "muted", href }) {
  const colours = { muted: "#8b877a", good: "#0e6b4f", warn: "#b4600a" };
  const content = /* @__PURE__ */ jsxs(
    "div",
    {
      style: {
        background: "#fff",
        border: "1px solid #e6e3da",
        borderRadius: 14,
        padding: "16px 18px",
        height: "100%",
        transition: "border-color 0.15s ease"
      },
      className: "hover:border-line-strong",
      children: [
        /* @__PURE__ */ jsx("div", { style: { font: "400 12px 'Instrument Sans',sans-serif", color: "#8b877a" }, children: label }),
        /* @__PURE__ */ jsx(
          "div",
          {
            style: {
              font: "500 22px 'Instrument Sans',sans-serif",
              color: "#16150f",
              marginTop: 5,
              letterSpacing: "-.02em"
            },
            children: value
          }
        ),
        footnote && /* @__PURE__ */ jsx("div", { style: { font: "400 11.5px 'Instrument Sans',sans-serif", color: colours[tone], marginTop: 4 }, children: footnote })
      ]
    }
  );
  return href ? /* @__PURE__ */ jsx(Link, { href, className: "block no-underline", children: content }) : content;
}
function Panel({ title, action, actionHref, children }) {
  return /* @__PURE__ */ jsxs("div", { style: { background: "#fff", border: "1px solid #e6e3da", borderRadius: 14, padding: "18px 20px" }, children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsx("span", { style: { font: "500 13.5px 'Instrument Sans',sans-serif", color: "#16150f" }, children: title }),
      action && (actionHref ? /* @__PURE__ */ jsx(Link, { href: actionHref, style: { font: "500 12px 'Instrument Sans',sans-serif", color: "#8b877a" }, className: "hover:underline", children: action }) : /* @__PURE__ */ jsx("span", { style: { font: "500 12px 'Instrument Sans',sans-serif", color: "#8b877a" }, children: action }))
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-3.5 flex flex-col gap-3", children })
  ] });
}
const RAIL_ITEMS = [
  { id: "overview", name: "Overview", routeName: "store.next-dashboard", path: "/next-dashboard", iconD: "M2.2 2.2h4.6v4.6H2.2zM9.2 2.2h4.6v4.6H9.2zM2.2 9.2h4.6v4.6H2.2zM9.2 9.2h4.6v4.6H9.2z" },
  { id: "dashboard", name: "Home", routeName: "store.dashboard", path: "/dashboard", iconD: "M2.5 6.5L8 2.5l5.5 4v6.2a.8.8 0 01-.8.8H3.3a.8.8 0 01-.8-.8z" },
  { id: "pos", name: "POS & Sales", routeName: "store.pos", path: "/pos", iconD: "M2.5 3h2l1.6 7.2h6.2l1.2-5H5" },
  { id: "stock", name: "Products & Stock", routeName: "store.products.index", path: "/products", iconD: "M2.6 5.4L8 2.6l5.4 2.8v5.2L8 13.4 2.6 10.6z" },
  { id: "parties", name: "Parties & Customers", routeName: "store.customers.index", path: "/customers", iconD: "M2.2 13c.5-2.2 2-3.4 3.8-3.4S9.3 10.8 9.8 13" },
  { id: "reports", name: "Reports & Analytics", routeName: "store.reports.index", path: "/reports", iconD: "M2.4 11.4l3.4-4 2.6 2.4 5.2-6" }
];
function FullyFunctionalNextDashboard(props) {
  const tt = useTermText();
  const pageProps = usePage()?.props || {};
  const store = props.store || pageProps.store || {};
  const auth = props.auth || pageProps.auth || {};
  const storeSlug = store.slug || "demo-store";
  const displayStoreName = store.name || "My Business Store";
  const displayGreetingName = auth.user?.name || "Aisha";
  const currencyObj = props.currency || store.currency || { symbol: store.currency_symbol || "Rs" };
  const [period, setPeriod] = useState("Month");
  const [searchOpen, setSearchOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [cashModalOpen, setCashModalOpen] = useState(null);
  const [cashAmount, setCashAmount] = useState("");
  const [cashNote, setCashNote] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);
  const [clientGreeting, setClientGreeting] = useState(null);
  const [clientDayLabel, setClientDayLabel] = useState(null);
  useEffect(() => {
    const now = /* @__PURE__ */ new Date();
    setClientGreeting(greeting(now));
    setClientDayLabel(dayLabel(now));
  }, []);
  const money = useMoney(currencyObj);
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  const safeRoute = (routeName, fallbackPath = "#") => {
    try {
      if (typeof route === "function" && routeName) {
        return route(routeName, { store_slug: storeSlug });
      }
    } catch (e) {
    }
    return `/s/${storeSlug}${fallbackPath}`;
  };
  const revenueVal = props.performance?.revenue ?? 14382;
  const marginVal = props.performance?.grossProfit ?? 1428;
  const cashVal = props.cashAccounts?.[0]?.balance ?? 5922;
  const toReceiveVal = props.outstanding?.toReceive ?? 8460;
  const toPayVal = props.outstanding?.toPay ?? 0;
  const stockVal = props.inventoryValue ?? 73346;
  const netProfitVal = props.netProfit?.amount ?? 1428;
  const initials = displayGreetingName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const handleCashSubmit = (e) => {
    e.preventDefault();
    alert(`Recorded ${cashModalOpen === "in" ? "Money In" : "Money Out"} of ${money(cashAmount || 0)} ${cashNote ? `(${cashNote})` : ""}`);
    setCashModalOpen(null);
    setCashAmount("");
    setCashNote("");
  };
  return /* @__PURE__ */ jsxs("div", { style: { minHeight: "100vh", background: vq.slate[50], fontFamily: "'Instrument Sans', system-ui, sans-serif" }, children: [
    /* @__PURE__ */ jsx(Head, { title: "Overview — VenQore OS" }),
    !isMounted ? /* @__PURE__ */ jsx("div", { style: { minHeight: "100vh", background: vq.slate[50] }, "aria-hidden": "true" }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("style", { children: `
                :root {
                    --chart-background: #ffffff;
                    --chart-foreground: #16150f;
                    --chart-foreground-muted: #8b877a;
                    --chart-grid: #efece4;
                    --chart-tooltip-background: #16150f;
                    --chart-1: #16150f;
                    --chart-3: #8b877a;
                    --chart-4: #c2beb0;
                }
                @media (max-width: 900px) {
                    #vq-hero-grid { grid-template-columns: minmax(0,1fr) !important; }
                    #vq-stat-grid { grid-template-columns: repeat(2,minmax(0,1fr)) !important; }
                    #vq-more-grid { grid-template-columns: minmax(0,1fr) !important; }
                    #vq-canvas    { padding: 18px 16px 32px !important; }
                }
` }),
      /* @__PURE__ */ jsxs(
        "div",
        {
          className: "flex items-center gap-5 px-4 sm:px-7",
          style: {
            padding: "14px 28px",
            background: "rgba(255,255,255,.86)",
            borderBottom: "1px solid #e6e3da",
            backdropFilter: "blur(8px)",
            position: "sticky",
            top: 0,
            zIndex: 20
          },
          children: [
            /* @__PURE__ */ jsxs(Link, { href: safeRoute("store.settings", "/settings"), className: "flex items-center gap-2.5 no-underline", children: [
              /* @__PURE__ */ jsx(
                "div",
                {
                  className: "flex items-center justify-center",
                  style: {
                    width: 26,
                    height: 26,
                    borderRadius: 8,
                    background: "#16150f",
                    color: "#fff",
                    font: "600 12px 'Instrument Sans',sans-serif"
                  },
                  children: displayStoreName[0].toUpperCase()
                }
              ),
              /* @__PURE__ */ jsx(
                "span",
                {
                  className: "hidden truncate sm:block",
                  style: { font: "600 14px 'Instrument Sans',sans-serif", color: "#16150f", maxWidth: 220 },
                  children: displayStoreName
                }
              ),
              /* @__PURE__ */ jsx("svg", { width: "10", height: "10", viewBox: "0 0 10 10", fill: "none", stroke: "#8b877a", strokeWidth: "1.4", children: /* @__PURE__ */ jsx("path", { d: "M2 4l3 3 3-3" }) })
            ] }),
            /* @__PURE__ */ jsxs(
              "div",
              {
                onClick: () => setSearchOpen(true),
                className: "hidden flex-1 items-center gap-2.5 cursor-pointer md:flex",
                style: {
                  maxWidth: 420,
                  height: 34,
                  padding: "0 12px",
                  borderRadius: 9,
                  background: "#efedE7",
                  border: "1px solid #e6e3da"
                },
                children: [
                  /* @__PURE__ */ jsxs("svg", { width: "14", height: "14", viewBox: "0 0 14 14", fill: "none", stroke: "#9a9689", strokeWidth: "1.5", children: [
                    /* @__PURE__ */ jsx("circle", { cx: "6.2", cy: "6.2", r: "4.2" }),
                    /* @__PURE__ */ jsx("path", { d: "M9.4 9.4L12.5 12.5" })
                  ] }),
                  /* @__PURE__ */ jsx("span", { style: { font: "400 13px 'Instrument Sans',sans-serif", color: "#9a9689" }, children: tt("Search invoices, products, people") }),
                  /* @__PURE__ */ jsx("span", { style: { marginLeft: "auto", font: "400 10.5px ui-monospace,monospace", color: "#b3af9f" }, children: "⌘K" })
                ]
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "ml-auto flex items-center gap-3.5", children: [
              /* @__PURE__ */ jsx(
                Link,
                {
                  href: safeRoute("store.billing", "/billing"),
                  style: { font: "500 11.5px 'Instrument Sans',sans-serif", color: "#8a6a12", background: "#fbf3dc", borderRadius: 99, padding: "5px 11px" },
                  className: "no-underline hover:opacity-80",
                  children: "14 days left"
                }
              ),
              /* @__PURE__ */ jsx(Link, { href: safeRoute("store.notifications", "/notifications"), className: "text-ink-secondary hover:text-ink", children: /* @__PURE__ */ jsxs("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", stroke: "#5f5c52", strokeWidth: "1.4", children: [
                /* @__PURE__ */ jsx("path", { d: "M8 2.5a3.6 3.6 0 013.6 3.6c0 3 1.2 4.2 1.2 4.2H3.2s1.2-1.2 1.2-4.2A3.6 3.6 0 018 2.5z" }),
                /* @__PURE__ */ jsx("path", { d: "M6.6 12.6a1.5 1.5 0 002.8 0" })
              ] }) }),
              /* @__PURE__ */ jsx(
                Link,
                {
                  href: safeRoute("store.staff", "/staff"),
                  className: "flex items-center justify-center no-underline",
                  style: {
                    width: 28,
                    height: 28,
                    borderRadius: 99,
                    background: "#dfe7e2",
                    border: "1px solid #cdd8d2",
                    font: "600 11px 'Instrument Sans',sans-serif",
                    color: "#0e6b4f"
                  },
                  children: initials
                }
              )
            ] })
          ]
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "flex items-stretch", children: [
        /* @__PURE__ */ jsxs(
          "div",
          {
            className: "hidden flex-none flex-col items-center gap-1.5 sm:flex",
            style: {
              width: 60,
              background: "#f0eee8",
              borderRight: "1px solid #e6e3da",
              padding: "16px 0",
              minHeight: "calc(100vh - 63px)"
            },
            children: [
              RAIL_ITEMS.map((item, index) => {
                const href = safeRoute(item.routeName, item.path);
                const active = index === 0;
                return /* @__PURE__ */ jsx(
                  Link,
                  {
                    href,
                    title: item.name,
                    className: "flex items-center justify-center transition-all",
                    style: {
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      background: active ? "#16150f" : "transparent"
                    },
                    children: /* @__PURE__ */ jsx(
                      "svg",
                      {
                        width: "15",
                        height: "15",
                        viewBox: "0 0 16 16",
                        fill: "none",
                        stroke: active ? "#fff" : "#7d7a6e",
                        strokeWidth: "1.5",
                        children: /* @__PURE__ */ jsx("path", { d: item.iconD })
                      }
                    )
                  },
                  item.id
                );
              }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => setSheetOpen(true),
                  title: "Add Card / Customise",
                  className: "flex items-center justify-center transition-all hover:border-line-strong hover:text-ink",
                  style: {
                    marginTop: "auto",
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    border: "1px dashed #cfcbbd",
                    color: "#a9a596",
                    font: "400 15px 'Instrument Sans',sans-serif",
                    background: "transparent"
                  },
                  children: "+"
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ jsxs("div", { id: "vq-canvas", className: "min-w-0 flex-1", style: { padding: "26px 30px 40px" }, children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-5 flex flex-wrap items-end justify-between gap-3", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx(
                "div",
                {
                  style: {
                    font: "400 12px ui-monospace,monospace",
                    color: "#9a9689",
                    letterSpacing: ".06em",
                    textTransform: "uppercase"
                  },
                  children: clientDayLabel
                }
              ),
              /* @__PURE__ */ jsxs(
                "h1",
                {
                  style: {
                    margin: "5px 0 0",
                    font: "500 27px/1.15 'Instrument Sans',sans-serif",
                    color: "#16150f",
                    letterSpacing: "-.02em"
                  },
                  children: [
                    clientGreeting && `${clientGreeting},`,
                    displayGreetingName.split(" ")[0]
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsx(
                Link,
                {
                  href: safeRoute("store.purchases.create", "/purchases/create"),
                  style: {
                    height: 36,
                    padding: "0 15px",
                    borderRadius: 9,
                    border: "1px solid #e0ddd2",
                    background: "#fff",
                    color: "#16150f",
                    font: "500 13px 'Instrument Sans',sans-serif",
                    display: "flex",
                    alignItems: "center"
                  },
                  className: "no-underline hover:bg-interactive-hover",
                  children: "New purchase"
                }
              ),
              /* @__PURE__ */ jsx(
                Link,
                {
                  href: safeRoute("store.pos", "/pos"),
                  style: {
                    height: 36,
                    padding: "0 16px",
                    borderRadius: 9,
                    background: "#16150f",
                    color: "#fff",
                    font: "500 13px 'Instrument Sans',sans-serif",
                    display: "flex",
                    alignItems: "center"
                  },
                  className: "no-underline hover:bg-interactive-hover",
                  children: "New sale"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { id: "vq-hero-grid", className: "grid gap-4", style: { gridTemplateColumns: "minmax(0,1fr) 320px" }, children: [
            /* @__PURE__ */ jsxs(
              "div",
              {
                className: "min-w-0",
                style: { background: "#fff", border: "1px solid #e6e3da", borderRadius: 16, padding: "22px 24px 12px" },
                children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("div", { style: { font: "400 12.5px 'Instrument Sans',sans-serif", color: "#8b877a" }, children: "Revenue this month" }),
                      /* @__PURE__ */ jsxs("div", { className: "mt-1.5 flex items-baseline gap-3", children: [
                        /* @__PURE__ */ jsx(
                          "span",
                          {
                            style: {
                              font: "500 38px/1 'Instrument Sans',sans-serif",
                              color: "#16150f",
                              letterSpacing: "-.03em"
                            },
                            children: money(revenueVal)
                          }
                        ),
                        /* @__PURE__ */ jsx(
                          "span",
                          {
                            style: {
                              font: "500 12.5px 'Instrument Sans',sans-serif",
                              color: "#0e6b4f",
                              background: vq.emerald[100],
                              borderRadius: 99,
                              padding: "4px 9px"
                            },
                            children: "+18.4%"
                          }
                        )
                      ] }),
                      /* @__PURE__ */ jsxs(
                        "div",
                        {
                          className: "mt-2 flex gap-4",
                          style: { font: "400 12.5px 'Instrument Sans',sans-serif", color: "#6f6c61" },
                          children: [
                            /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5", children: [
                              /* @__PURE__ */ jsx("span", { style: { width: 7, height: 7, borderRadius: 99, background: "#16150f" } }),
                              "Sales"
                            ] }),
                            /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5", children: [
                              /* @__PURE__ */ jsx("span", { style: { width: 7, height: 7, borderRadius: 99, background: "#8fbfa9" } }),
                              "Gross profit ",
                              money(marginVal)
                            ] })
                          ]
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsx("div", { className: "flex gap-0.5", style: { padding: 3, borderRadius: 9, background: "#f1efe9" }, children: ["Today", "Month", "Year"].map((label) => /* @__PURE__ */ jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => setPeriod(label),
                        style: {
                          padding: "6px 12px",
                          borderRadius: 7,
                          background: period === label ? "#fff" : "transparent",
                          boxShadow: period === label ? "0 1px 2px rgba(0,0,0,.07)" : "none",
                          font: "500 12px 'Instrument Sans',sans-serif",
                          color: period === label ? "#16150f" : "#8b877a"
                        },
                        children: label
                      },
                      label
                    )) })
                  ] }),
                  /* @__PURE__ */ jsx(RevenueChart, { points: props.salesData, currencySymbol: currencyObj.symbol || "Rs" })
                ]
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3", children: [
              /* @__PURE__ */ jsxs("div", { style: { background: "#16150f", borderRadius: 16, padding: "20px 22px", color: "#fff" }, children: [
                /* @__PURE__ */ jsx("div", { style: { font: "400 12.5px 'Instrument Sans',sans-serif", color: "rgba(255,255,255,.55)" }, children: "Cash in hand" }),
                /* @__PURE__ */ jsx(
                  "div",
                  {
                    style: {
                      font: "500 30px/1 'Instrument Sans',sans-serif",
                      marginTop: 7,
                      letterSpacing: "-.03em"
                    },
                    children: money(cashVal)
                  }
                ),
                /* @__PURE__ */ jsxs("div", { className: "mt-4 flex gap-2", children: [
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => setCashModalOpen("in"),
                      style: {
                        flex: 1,
                        height: 36,
                        borderRadius: 9,
                        border: "none",
                        background: "rgba(255,255,255,.12)",
                        color: "#fff",
                        font: "500 12.5px 'Instrument Sans',sans-serif",
                        cursor: "pointer"
                      },
                      className: "hover:bg-white/20",
                      children: "Money in"
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => setCashModalOpen("out"),
                      style: {
                        flex: 1,
                        height: 36,
                        borderRadius: 9,
                        border: "none",
                        background: "rgba(255,255,255,.12)",
                        color: "#fff",
                        font: "500 12.5px 'Instrument Sans',sans-serif",
                        cursor: "pointer"
                      },
                      className: "hover:bg-white/20",
                      children: "Money out"
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxs(
                "div",
                {
                  className: "flex-1",
                  style: { background: "#fff", border: "1px solid #e6e3da", borderRadius: 16, padding: "18px 20px" },
                  children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                      /* @__PURE__ */ jsx("span", { style: { font: "500 13.5px 'Instrument Sans',sans-serif", color: "#16150f" }, children: "Needs you today" }),
                      /* @__PURE__ */ jsx(
                        "span",
                        {
                          style: {
                            font: "500 11px ui-monospace,monospace",
                            color: "#a8321e",
                            background: vq.red[100],
                            borderRadius: 99,
                            padding: "3px 8px"
                          },
                          children: "3"
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "mt-3.5 flex flex-col gap-3", children: [
                      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5", children: [
                        /* @__PURE__ */ jsx("span", { style: { width: 6, height: 6, borderRadius: 99, background: "#a8321e", flex: "none" } }),
                        /* @__PURE__ */ jsx("span", { className: "flex-1 truncate", style: { font: "400 13px 'Instrument Sans',sans-serif", color: "#3c3a33" }, children: "BMC out of stock" }),
                        /* @__PURE__ */ jsx(Link, { href: safeRoute("store.products.index", "/products"), style: { font: "500 12px 'Instrument Sans',sans-serif", color: "#0e6b4f" }, className: "no-underline hover:underline", children: tt("Order") })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5", children: [
                        /* @__PURE__ */ jsx("span", { style: { width: 6, height: 6, borderRadius: 99, background: "#b4600a", flex: "none" } }),
                        /* @__PURE__ */ jsx("span", { className: "flex-1 truncate", style: { font: "400 13px 'Instrument Sans',sans-serif", color: "#3c3a33" }, children: "Rs 8,460 overdue" }),
                        /* @__PURE__ */ jsx(Link, { href: safeRoute("store.customers.index", "/customers"), style: { font: "500 12px 'Instrument Sans',sans-serif", color: "#0e6b4f" }, className: "no-underline hover:underline", children: "Remind" })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5", children: [
                        /* @__PURE__ */ jsx("span", { style: { width: 6, height: 6, borderRadius: 99, background: "#b4600a", flex: "none" } }),
                        /* @__PURE__ */ jsx("span", { className: "flex-1 truncate", style: { font: "400 13px 'Instrument Sans',sans-serif", color: "#3c3a33" }, children: "2 invoices unsent" }),
                        /* @__PURE__ */ jsx(Link, { href: safeRoute("store.pos", "/pos"), style: { font: "500 12px 'Instrument Sans',sans-serif", color: "#0e6b4f" }, className: "no-underline hover:underline", children: "Send" })
                      ] })
                    ] })
                  ]
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { id: "vq-stat-grid", className: "mt-3 grid gap-3", style: { gridTemplateColumns: "repeat(4,minmax(0,1fr))" }, children: [
            /* @__PURE__ */ jsx(
              StatCard,
              {
                label: "To receive",
                value: money(toReceiveVal),
                footnote: tt("4 customers · 2 overdue"),
                tone: "warn",
                href: safeRoute("store.customers.index", "/customers")
              }
            ),
            /* @__PURE__ */ jsx(
              StatCard,
              {
                label: "To pay",
                value: money(toPayVal),
                footnote: "All settled",
                href: safeRoute("store.purchases.index", "/purchases")
              }
            ),
            /* @__PURE__ */ jsx(
              StatCard,
              {
                label: "Stock value",
                value: money(stockVal),
                footnote: "128 items",
                href: safeRoute("store.products.index", "/products")
              }
            ),
            /* @__PURE__ */ jsx(
              StatCard,
              {
                label: "Net profit",
                value: money(netProfitVal),
                footnote: "Healthy margin",
                tone: "good",
                href: safeRoute("store.reports.index", "/reports")
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", style: { margin: "26px 0 14px" }, children: [
            /* @__PURE__ */ jsx(
              "span",
              {
                style: {
                  font: "400 11.5px ui-monospace,monospace",
                  color: "#a9a596",
                  letterSpacing: ".08em",
                  textTransform: "uppercase"
                },
                children: "More on your day"
              }
            ),
            /* @__PURE__ */ jsx("span", { style: { flex: 1, height: 1, background: "#e3e0d7" } })
          ] }),
          /* @__PURE__ */ jsxs("div", { id: "vq-more-grid", className: "grid gap-3", style: { gridTemplateColumns: "repeat(2,minmax(0,1fr))" }, children: [
            /* @__PURE__ */ jsx(Panel, { title: tt("Top products"), action: "This month", actionHref: safeRoute("store.products.index", "/products"), children: [
              { name: "Cumfrey", val: 14382 },
              { name: "BMC", val: 3120 },
              { name: "Vitamix 40g", val: 990 }
            ].map((p, i) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("span", { style: { width: 28, height: 28, borderRadius: 8, background: "#f1efe9", flex: "none" } }),
              /* @__PURE__ */ jsx("span", { className: "flex-1 truncate", style: { font: "400 13px 'Instrument Sans',sans-serif", color: "#3c3a33" }, children: p.name }),
              /* @__PURE__ */ jsx("span", { style: { font: "500 13px 'Instrument Sans',sans-serif", color: "#16150f" }, children: money(p.val) })
            ] }, i)) }),
            /* @__PURE__ */ jsx(Panel, { title: "Recent activity", action: "View all", actionHref: safeRoute("store.reports.index", "/reports"), children: [
              { time: "09:12", text: "Sale · Cumfrey ×17", amount: "+Rs 14,382", tone: "#0e6b4f" },
              { time: "08:40", text: "Purchase · Supplier A", amount: "−Rs 12,954", tone: "#16150f" },
              { time: "Yest.", text: "Payment received", amount: "+Rs 2,400", tone: "#0e6b4f" }
            ].map((item, i) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("span", { style: { font: "400 11px ui-monospace,monospace", color: "#a9a596" }, children: item.time }),
              /* @__PURE__ */ jsx("span", { className: "flex-1 truncate", style: { font: "400 13px 'Instrument Sans',sans-serif", color: "#3c3a33" }, children: item.text }),
              /* @__PURE__ */ jsx("span", { style: { font: "500 13px 'Instrument Sans',sans-serif", color: item.tone }, children: item.amount })
            ] }, i)) })
          ] }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: () => setSheetOpen(true),
              className: "w-full text-left transition-all hover:border-line-strong",
              style: {
                marginTop: 12,
                height: 88,
                border: "1px dashed #d3cfc1",
                borderRadius: 14,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                background: "rgba(255,255,255,.4)",
                cursor: "pointer"
              },
              children: [
                /* @__PURE__ */ jsx("span", { style: { font: "400 20px 'Instrument Sans',sans-serif", color: "#8b877a", lineHeight: 1 }, children: "+" }),
                /* @__PURE__ */ jsx("span", { style: { font: "500 13.5px 'Instrument Sans',sans-serif", color: "#6f6c61" }, children: tt("Add a card — cash flow, GST, staff, AI opportunities and 12 more") })
              ]
            }
          )
        ] })
      ] }),
      searchOpen && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/40 backdrop-blur-sm", onClick: () => setSearchOpen(false), children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-line", onClick: (e) => e.stopPropagation(), children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 px-4 py-3 border-b border-line", children: [
          /* @__PURE__ */ jsxs("svg", { width: "16", height: "16", viewBox: "0 0 14 14", fill: "none", stroke: "#9a9689", strokeWidth: "1.5", children: [
            /* @__PURE__ */ jsx("circle", { cx: "6.2", cy: "6.2", r: "4.2" }),
            /* @__PURE__ */ jsx("path", { d: "M9.4 9.4L12.5 12.5" })
          ] }),
          /* @__PURE__ */ jsx(
            "input",
            {
              autoFocus: true,
              type: "text",
              placeholder: tt("Search invoices, products, customers..."),
              value: searchQuery,
              onChange: (e) => setSearchQuery(e.target.value),
              className: "w-full bg-transparent outline-none text-ink placeholder:text-ink-faint font-sans text-sm"
            }
          ),
          /* @__PURE__ */ jsx("button", { onClick: () => setSearchOpen(false), className: "text-xs text-ink-muted hover:text-ink", children: "ESC" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "p-3 max-h-80 overflow-y-auto flex flex-col gap-1 text-xs", children: [
          /* @__PURE__ */ jsx("div", { className: "text-1xs font-mono text-ink-muted uppercase tracking-wider px-2 py-1", children: "Quick Actions" }),
          /* @__PURE__ */ jsxs(Link, { href: safeRoute("store.pos", "/pos"), className: "flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-interactive-hover text-ink no-underline", children: [
            /* @__PURE__ */ jsx("span", { className: "w-2 h-2 rounded-full bg-emerald-600" }),
            "Open POS & New Sale"
          ] }),
          /* @__PURE__ */ jsxs(Link, { href: safeRoute("store.purchases.create", "/purchases/create"), className: "flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-interactive-hover text-ink no-underline", children: [
            /* @__PURE__ */ jsx("span", { className: "w-2 h-2 rounded-full bg-amber-600" }),
            "Record New Purchase"
          ] }),
          /* @__PURE__ */ jsxs(Link, { href: safeRoute("store.products.index", "/products"), className: "flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-interactive-hover text-ink no-underline", children: [
            /* @__PURE__ */ jsx("span", { className: "w-2 h-2 rounded-full bg-blue-600" }),
            tt("Manage Products & Inventory")
          ] })
        ] })
      ] }) }),
      cashModalOpen && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm", onClick: () => setCashModalOpen(null), children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-line", onClick: (e) => e.stopPropagation(), children: [
        /* @__PURE__ */ jsxs("h3", { className: "font-semibold text-lg text-ink mb-1", children: [
          "Record ",
          cashModalOpen === "in" ? "Money In (Receipt)" : "Money Out (Expense)"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted mb-4", children: "Adjust main cash till balance directly." }),
        /* @__PURE__ */ jsxs("form", { onSubmit: handleCashSubmit, className: "flex flex-col gap-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("label", { className: "text-xs font-medium text-ink-secondary block mb-1", children: [
              "Amount (",
              currencyObj.symbol || "Rs",
              ")"
            ] }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                required: true,
                value: cashAmount,
                onChange: (e) => setCashAmount(e.target.value),
                placeholder: "0.00",
                className: "w-full px-3 py-2 rounded-lg border border-line text-ink text-sm outline-none focus:border-line-strong"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "text-xs font-medium text-ink-secondary block mb-1", children: "Note / Description" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: cashNote,
                onChange: (e) => setCashNote(e.target.value),
                placeholder: "e.g. Daily cash deposit / Petty expense",
                className: "w-full px-3 py-2 rounded-lg border border-line text-ink text-sm outline-none focus:border-line-strong"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-2 justify-end mt-2", children: [
            /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setCashModalOpen(null), className: "px-4 py-2 text-xs font-medium text-ink-secondary hover:bg-interactive-hover rounded-lg", children: "Cancel" }),
            /* @__PURE__ */ jsx("button", { type: "submit", className: "px-4 py-2 text-xs font-medium bg-neutral-900 text-white rounded-lg hover:bg-interactive-hover", children: "Save Transaction" })
          ] })
        ] })
      ] }) }),
      sheetOpen && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-xs", onClick: () => setSheetOpen(false), children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-md bg-sunken h-full shadow-2xl p-6 overflow-y-auto border-l border-line flex flex-col", onClick: (e) => e.stopPropagation(), children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between pb-4 border-b border-line", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "font-semibold text-ink text-base", children: "Add a card" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted", children: "Pick what matters to your business. Drag to reorder." })
          ] }),
          /* @__PURE__ */ jsx("button", { onClick: () => setSheetOpen(false), className: "w-7 h-7 rounded-lg bg-sunken text-ink-secondary flex items-center justify-center font-bold text-sm", children: "×" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2 my-4", children: [
          /* @__PURE__ */ jsx("span", { className: "px-3 py-1 rounded-full bg-neutral-900 text-white text-xs font-medium", children: "All" }),
          /* @__PURE__ */ jsx("span", { className: "px-3 py-1 rounded-full bg-sunken text-ink-secondary text-xs font-medium", children: "Money" }),
          /* @__PURE__ */ jsx("span", { className: "px-3 py-1 rounded-full bg-sunken text-ink-secondary text-xs font-medium", children: "Stock" }),
          /* @__PURE__ */ jsx("span", { className: "px-3 py-1 rounded-full bg-sunken text-ink-secondary text-xs font-medium", children: "Operations" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-3 flex-1", children: [
          { title: "Cash Flow Projection", desc: "Upcoming 30-day forecasted inflows & outflows" },
          { title: "GST & Tax Summary", desc: "Output vs Input Tax liability for active period" },
          { title: tt("Staff Performance"), desc: "Daily sales per cashier and shift breakdown" },
          { title: "AI Opportunities", desc: "Smart re-order points and slow-moving items" }
        ].map((card, i) => /* @__PURE__ */ jsxs("div", { className: "bg-white p-4 rounded-xl border border-line flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "font-medium text-ink text-sm", children: card.title }),
            /* @__PURE__ */ jsx("div", { className: "text-xs text-ink-muted mt-0.5", children: card.desc })
          ] }),
          /* @__PURE__ */ jsx("button", { onClick: () => {
            alert(`Added ${card.title} to dashboard.`);
            setSheetOpen(false);
          }, className: "px-3 py-1.5 bg-neutral-900 text-white text-xs font-medium rounded-lg hover:bg-interactive-hover", children: "+ Add" })
        ] }, i)) })
      ] }) })
    ] })
  ] });
}
export {
  FullyFunctionalNextDashboard as default
};

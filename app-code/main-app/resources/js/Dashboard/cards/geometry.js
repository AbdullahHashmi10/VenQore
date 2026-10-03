/* ══════════════════════════════════════════════════════════════════════════
   Card geometry — one resolver for the board, the editor preview and the
   server payload.

   The grid is the Layout Law grid: 12 columns, a 64px row unit and a 24px
   gutter on both axes. A card is an integer span of columns and rows; its
   pixel size is always derived, never stored:

       height(rows) = rows × 64 + (rows − 1) × 24
       colWidth(B)  = (B − 11 × 24) / 12        (B = the board's inner width)
       width(cols)  = cols × colWidth + (cols − 1) × 24

   What changed from the category/fit tables: a card may take ANY integer
   span from its family's legibility floor up to 12 × 16. The floor is a
   property of what the card has to draw (a donut needs room for its hole, a
   table for three rows), so a legal size is always a readable size, and the
   editor never has to explain a "category".
   ══════════════════════════════════════════════════════════════════════════ */

export const GRID = Object.freeze({ cols: 12, unit: 64, gutter: 24, maxRows: 16 });

export function setGrid({ cols, unit, gutter } = {}) {
  /* The law ships these from layout-law.json; accept them, never invent. */
  if (Number(cols) > 0 || Number(unit) > 0 || Number(gutter) >= 0) {
    return Object.freeze({
      cols: Number(cols) || GRID.cols,
      unit: Number(unit) || GRID.unit,
      gutter: Number.isFinite(Number(gutter)) ? Number(gutter) : GRID.gutter,
      maxRows: GRID.maxRows,
    });
  }
  return GRID;
}

export const rowsToPx = (rows, g = GRID) => (rows < 1 ? 0 : rows * g.unit + (rows - 1) * g.gutter);
export const colWidth = (boardWidth, cols = GRID.cols, g = GRID) =>
  Math.max(1, (boardWidth - (cols - 1) * g.gutter) / cols);
export const colsToPx = (c, cw, g = GRID) => (c < 1 ? 0 : c * cw + (c - 1) * g.gutter);
/** Distance from one column's left edge to the next. */
export const colPitch = (cw, g = GRID) => cw + g.gutter;
export const rowPitch = (g = GRID) => g.unit + g.gutter;

/**
 * The smallest span [cols, rows] at which a family/variant is legible.
 *
 * Budgets (px): card padding 40, header 28, headline 46, caption 18,
 * legend 24/row. A 3-row card is 240px tall — header + headline leave a
 * ~120px plot, which is the least a time axis can label honestly.
 */
export function minSize(family, variant, opts = {}) {
  const legend = !!opts.legend;
  const series = Math.max(1, opts.seriesCount || 1);
  switch (family) {
    case 'number':
      if (variant === 'value') return [2, 1];
      return [3, 2];
    case 'status':
      return [2, 1];
    case 'area':
    case 'line':
      return [4, series > 1 || legend ? 4 : 3];
    case 'bar':
      return variant === 'horizontal' ? [4, 4] : [4, 3];
    case 'composed':
      return [5, 4];
    case 'pie':
      if (variant === 'half') return [4, 3];
      return legend ? [5, 4] : [3, 4];
    case 'ring':
      if (variant === 'half') return [3, 3];
      return legend ? [5, 4] : [3, 3];
    case 'gauge':
      return variant === 'linear' ? [3, 2] : [3, 3];
    case 'radar':
      return [4, 5];
    case 'heatmap':
      return [6, 4];
    case 'funnel':
      return variant === 'horizontal' ? [6, 3] : [4, 4];
    case 'scatter':
      return [4, 3];
    case 'sankey':
      return [6, 4];
    case 'sunburst':
      return [4, 4];
    case 'live':
      return [5, 3];
    case 'records':
      return variant === 'feed' ? [3, 4] : [4, 4];
    default:
      return [3, 3];
  }
}

/**
 * The largest span [cols, rows] a family stays good-looking at. A single
 * figure stretched across the board, or a donut the height of a screen, is
 * worse than a bigger card is worth — so each family has a ceiling the same
 * way it has a floor.
 */
export function maxSize(family, variant) {
  switch (family) {
    case 'number': return variant === 'value' ? [6, 3] : [6, 4];
    case 'status': return [6, 3];
    case 'gauge': return [6, 6];
    case 'ring':
    case 'pie':
    case 'sunburst': return [8, 8];
    case 'radar': return [8, 8];
    case 'funnel': return [10, 8];
    case 'heatmap': return [12, 8];
    case 'sankey': return [12, 8];
    case 'records': return [12, 12];
    default: return [12, 10];
  }
}

/** Named sizes the editor offers. Spans are intents; the family floor wins. */
export const SIZE_PRESETS = [
  { id: 'tile', label: 'Tile', hint: 'Name and number', w: 3, h: 1 },
  { id: 'compact', label: 'Compact', hint: 'Number with context', w: 3, h: 2 },
  { id: 'square', label: 'Square', hint: 'A focused chart', w: 4, h: 4 },
  { id: 'portrait', label: 'Portrait', hint: 'Tall — lists and dials', w: 4, h: 6 },
  { id: 'standard', label: 'Standard', hint: 'Room for a full chart', w: 6, h: 4 },
  { id: 'wide', label: 'Wide', hint: 'Long trends', w: 8, h: 4 },
  { id: 'full', label: 'Full width', hint: 'Spans the whole board', w: 12, h: 4, full: true },
];

/** Is a preset usable for this family, and if not, why not. */
export function presetState(preset, family, variant, opts = {}) {
  const [mw, mh] = minSize(family, variant, opts);
  if (preset.w < mw || preset.h < mh) {
    return { enabled: false, reason: `A ${familyNoun(family)} needs at least ${mw} × ${mh}.` };
  }
  return { enabled: true, reason: '' };
}

function familyNoun(family) {
  return ({
    number: 'number card', area: 'area chart', line: 'line chart', bar: 'bar chart',
    composed: 'combo chart', pie: 'donut', ring: 'ring', gauge: 'gauge', radar: 'radar',
    heatmap: 'heatmap', records: 'list', status: 'status card',
  }[family]) || 'card';
}

/**
 * Resolve a requested span into the span that will actually be drawn.
 *
 * request: { w, h, full }   cols: the board's live column count
 * Returns { w, h, reqW, reqH, full, raised, clamped, reason }
 *   reqW/reqH — the author's preference (persisted, never overwritten by a
 *               temporarily narrow screen)
 *   w/h       — the effective span on this board
 */
export function resolveSpan(request, family, variant, cols = GRID.cols, opts = {}) {
  const [mw, mh] = minSize(family, variant, opts);
  const [xw, xh] = maxSize(family, variant);
  const full = !!request.full;
  let reqW = full ? GRID.cols : clampInt(request.w, 1, Math.max(mw, xw), mw);
  let reqH = clampInt(request.h, 1, Math.max(mh, xh), mh);
  let raised = false;
  if (reqW < mw) { reqW = mw; raised = true; }
  if (reqH < mh) { reqH = mh; raised = true; }
  const effCols = Math.max(1, Math.min(GRID.cols, cols || GRID.cols));
  const w = full ? effCols : Math.min(reqW, effCols);
  const clamped = !full && w < reqW;
  const reason = raised
    ? `Raised to ${reqW} × ${reqH} — the smallest size a ${familyNoun(family)} stays readable at.`
    : clamped
      ? `Showing ${w} columns on this screen; it returns to ${reqW} on a wider one.`
      : '';
  return { w, h: reqH, reqW, reqH, full, raised, clamped, reason };
}

function clampInt(v, lo, hi, dflt) {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return dflt;
  return Math.max(lo, Math.min(hi, n));
}

/** Pixel box of a span on a board of the given inner width. */
export function pxBox(w, h, boardWidth, cols = GRID.cols, g = GRID) {
  const cw = colWidth(boardWidth, cols, g);
  return { width: colsToPx(w, cw, g), height: rowsToPx(h, g), colWidth: cw };
}

/**
 * Snap a pointer drag to whole columns/rows.
 * dx/dy are SCREEN pixels; `scale` is the uniform preview scale, so the delta
 * is first converted back to card pixels.
 */
export function snapDrag(start, dx, dy, scale, cw, g = GRID) {
  const s = Math.max(0.05, Number(scale) || 1);
  const dW = Math.round((dx / s) / colPitch(cw, g));
  const dH = Math.round((dy / s) / rowPitch(g));
  return { w: start.w + dW, h: start.h + dH };
}

/**
 * The Layout Law category a span corresponds to — kept so older readers of
 * `cat` (server columns, CSS interior classes) keep working.
 */
export function categoryOf(w, h, family) {
  if (h <= 1) return w <= 2 ? 'C1' : 'C2';
  if (family === 'number' || family === 'status') return h <= 4 && w <= 6 ? 'C3' : 'C4';
  const area = w * h;
  if (area <= 16 && w <= 6) return 'C4';
  if (area <= 64 && w <= 8) return 'C5';
  return 'C6';
}

/** Name a span for people: "6 × 4 · Standard". */
export function spanName(w, h, full) {
  if (full) return 'Full width';
  const hit = SIZE_PRESETS.find(p => p.w === w && p.h === h);
  return hit ? hit.label : 'Custom';
}

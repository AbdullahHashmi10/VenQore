/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  Layout Law v2.0 — the resolver                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * One resolver, three consumers. A dashboard card, a POS pane and a document
 * zone are the same object — a rectangle that knows several ways to lay its
 * inside out, each with a pixel floor — so the dashboard and the register can
 * never disagree about what the law says.
 *
 * Geometry comes from `resources/layout-law.json`, which `app/Reckoner/LayoutLaw.php`
 * also reads. Neither side restates a number. That matters: the twelve
 * `2x4 … 8x8` presets this replaces were declared twice, once in
 * `DashboardBuilderSheet.jsx` and once in `DashboardSanitizer.php`, and nothing
 * checked that the two lists agreed.
 *
 * ── What the law actually says ──────────────────────────────────────────────
 *
 *   size(n) = n·UNIT + (n−1)·GUTTER,  UNIT 64px vertical, GUTTER 24px both axes
 *
 * The gutter is part of the pitch, not a margin. `gap` computes it natively.
 *
 * Six categories, C1 Tile → C6 Canvas. Each declares a max and an ordered list
 * of fits; a fit is cols × rows plus a pixel width floor. There is no separate
 * "minimum size" — the leanest fit IS the minimum.
 *
 * **A card widens before it degrades.** It only drops to a leaner fit when
 * widening is exhausted, and degrading trades a column for a row and re-lays
 * its inside.
 */

import LAW from '../../layout-law.json';

export const GRID = LAW.grid;
export const SHELL = LAW.shell;
export const CATEGORIES = LAW.categories;
export const CATEGORY_KEYS = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'];
export const RANK_LAW = LAW.rankLaw;
export const NUMBER_LADDER = LAW.numberLadder.steps;
export const MAX_ACCENT_CARDS = LAW.accent.maxPerBoard;

/* ------------------------------------------------------------------ *
 * Geometry
 * ------------------------------------------------------------------ */

/**
 * `size(n) = n·UNIT + (n−1)·GUTTER` — the one law, both axes.
 *
 * Used for height in rows. For width, CSS Grid derives the column pitch from
 * the container, so only the row track is computed here.
 */
export function size(n) {
    if (!Number.isFinite(n) || n < 1) return 0;
    return n * GRID.unit + (n - 1) * GRID.gutter;
}

/** Height in px for a card spanning `rows` row tracks. */
export const heightOf = (rows) => size(rows);

/**
 * What `react-grid-layout` needs. It adds `margin` between tracks itself, so
 * passing the unit as `rowHeight` and the gutter as `margin` reproduces the law
 * exactly — `rowHeight * h + margin * (h - 1)` is `size(h)`.
 *
 * The grid shipped with `rowHeight={80}` and `margin={[16,16]}`, so every
 * persisted card height was mis-scaled against the law by 16px per row.
 */
export const gridProps = () => ({
    cols: GRID.columns,
    rowHeight: GRID.unit,
    margin: [GRID.gutter, GRID.gutter],
    containerPadding: [0, 0],
});

/* ------------------------------------------------------------------ *
 * Fits
 * ------------------------------------------------------------------ */

/** Every fit a category declares, widest first (the order in the law). */
export function fitsFor(category) {
    return CATEGORIES[category]?.fits ?? [];
}

/** The fit a card gets when nobody has chosen one. */
export function defaultFit(category) {
    const fits = fitsFor(category);
    return fits.find((f) => f.default) ?? fits[0] ?? null;
}

/** Look up one fit by its key. */
export function findFit(category, fitKey) {
    return fitsFor(category).find((f) => f.key === fitKey) ?? null;
}

/**
 * Resolve a category to the fit that should render at `availableWidth`.
 *
 * Widen before degrading: walk the fits from widest to leanest and take the
 * first whose floor the width clears. If nothing clears — a card in a very
 * narrow column — return the leanest fit rather than nothing, because a card
 * that renders slightly cramped is better than a hole in the grid.
 */
export function resolveFit(category, availableWidth, preferredKey = null) {
    const fits = fitsFor(category);
    if (!fits.length) return null;

    if (preferredKey) {
        const preferred = findFit(category, preferredKey);
        if (preferred && availableWidth >= preferred.floor) return preferred;
    }

    return fits.find((f) => availableWidth >= f.floor) ?? fits[fits.length - 1];
}

/** `{ w, h }` for a category + fit, clamped to the category's declared max. */
export function dimensionsOf(category, fitKey) {
    const cat = CATEGORIES[category];
    const fit = findFit(category, fitKey) ?? defaultFit(category);
    if (!cat || !fit) return { w: 4, h: 4 };

    return {
        w: Math.min(fit.w, cat.max.w, GRID.columns),
        h: Math.min(fit.h, cat.max.h),
    };
}

/* ------------------------------------------------------------------ *
 * Chart legality
 * ------------------------------------------------------------------ */

/** Charts a Reckoner shape may legally render as. First entry is the default. */
export const chartsForShape = (shape) => LAW.chartLegality[shape] ?? [];

export const defaultChartForShape = (shape) => chartsForShape(shape)[0] ?? 'stat';

export const isChartLegal = (shape, chart) => chartsForShape(shape).includes(chart);

/** Categories a chart can legibly occupy, leanest first. */
export const categoriesForChart = (chart) => LAW.chartCategories[chart] ?? ['C4', 'C5'];

/**
 * The legibility floor — the leanest category a chart may be rendered in.
 *
 * This is what the twelve-preset system had no way to express, which is how a
 * pie chart could be persisted at 2×4 and render as an unreadable disc.
 */
export const minCategoryForChart = (chart) => categoriesForChart(chart)[0] ?? 'C4';

/** The category a chart gets when a card is first created. */
export function defaultCategoryForChart(chart) {
    const cats = categoriesForChart(chart);
    // Middle of the legal range: the leanest is a floor, not a recommendation,
    // and the widest hogs a board the user has not asked to spend.
    return cats[Math.min(1, cats.length - 1)] ?? 'C4';
}

/**
 * Is this category legal for this chart?
 *
 * Legality is a floor, not a whitelist: a chart may always be given MORE room
 * than its floor. A stat in a C5 board is wasteful but readable; a heatmap in a
 * C1 tile is not readable at all, and only the second is a fail.
 */
export function isCategoryLegal(chart, category) {
    const floor = minCategoryForChart(chart);
    return CATEGORY_KEYS.indexOf(category) >= CATEGORY_KEYS.indexOf(floor);
}

/* ------------------------------------------------------------------ *
 * Coercion
 * ------------------------------------------------------------------ */

/**
 * Force any stored card into a legal shape.
 *
 * Mirrors `App\Reckoner\LayoutLaw::coerce()` — the server sanitises on write
 * and this sanitises on read, because rows persisted under the old preset
 * system are still in the database and `4x8` is not a legal fit of anything.
 *
 * Never throws. An illegal card becomes a legal one; it does not become a hole
 * in the grid or a stack trace in front of a user looking at their takings.
 */
export function coerce(card = {}) {
    const chart = card.chart || 'stat';

    let category = card.category;
    if (!CATEGORY_KEYS.includes(category) || !isCategoryLegal(chart, category)) {
        category = defaultCategoryForChart(chart);
    }

    const fit = findFit(category, card.fit) ?? defaultFit(category);
    const { w, h } = dimensionsOf(category, fit?.key);

    return {
        ...card,
        chart,
        category,
        fit: fit?.key ?? null,
        w,
        h,
        x: Math.max(0, Math.min(GRID.columns - w, Number(card.x) || 0)),
        y: Math.max(0, Number(card.y) || 0),
    };
}

/**
 * Map a legacy `WxH` preset onto the nearest legal category + fit.
 *
 * The twelve presets were arbitrary — `2x4`, `8x8` and the rest express neither
 * a C1 tile nor a 4×1 inline strip — so there is no exact translation. Nearest
 * by area, tie-broken by aspect ratio, keeps a wide card wide and a tall card
 * tall, which is what a user recognises when their board reloads.
 */
export function fromLegacySize(sizeKey, chart = 'stat') {
    const m = /^(\d+)x(\d+)$/.exec(String(sizeKey || ''));
    if (!m) return { category: defaultCategoryForChart(chart), fit: null };

    const w = Number(m[1]);
    const h = Number(m[2]);
    const area = w * h;
    const aspect = w / h;

    let best = null;
    for (const category of CATEGORY_KEYS) {
        if (!isCategoryLegal(chart, category)) continue;

        for (const fit of fitsFor(category)) {
            const dArea = Math.abs(fit.w * fit.h - area) / Math.max(area, 1);
            const dAspect = Math.abs(fit.w / fit.h - aspect) / Math.max(aspect, 0.1);
            const score = dArea + dAspect * 0.5;

            if (!best || score < best.score) best = { category, fit: fit.key, score };
        }
    }

    return best
        ? { category: best.category, fit: best.fit }
        : { category: defaultCategoryForChart(chart), fit: null };
}

/* ------------------------------------------------------------------ *
 * Validation
 * ------------------------------------------------------------------ */

/**
 * Reject an illegal layout before it renders.
 *
 * A validator, not a linter. This is the contract that lets Reckoner author
 * dashboards: it emits card descriptors, the engine turns them into geometry,
 * and a descriptor list that would produce an illegal layout never reaches the
 * DOM. Returns human-readable problems; empty means legal.
 */
export function validate(cards = []) {
    const problems = [];
    let accentCount = 0;

    cards.forEach((card, i) => {
        const at = `card ${i}${card.reading_key ? ` (${card.reading_key})` : ''}`;
        const cat = CATEGORIES[card.category];

        if (!cat) {
            problems.push(`${at}: unknown category "${card.category}".`);
            return;
        }

        const fit = findFit(card.category, card.fit);
        if (!fit) {
            problems.push(`${at}: "${card.fit}" is not a declared fit of ${card.category}.`);
        } else if (card.w !== fit.w || card.h !== fit.h) {
            problems.push(
                `${at}: fit "${fit.key}" is ${fit.w}x${fit.h} but the card is ` +
                `${card.w}x${card.h}. Rendering a fit at the wrong span is a fail.`,
            );
        }

        if (card.w > cat.max.w || card.h > cat.max.h) {
            problems.push(
                `${at}: ${card.w}x${card.h} exceeds ${card.category}'s max ` +
                `${cat.max.w}x${cat.max.h}.`,
            );
        }

        if (card.x + card.w > GRID.columns) {
            problems.push(`${at}: overflows the ${GRID.columns}-column grid at x=${card.x}.`);
        }

        if (card.chart && !isCategoryLegal(card.chart, card.category)) {
            problems.push(
                `${at}: "${card.chart}" needs at least ` +
                `${minCategoryForChart(card.chart)}; ${card.category} is below its ` +
                `legibility floor.`,
            );
        }

        if (card.style?.accent) accentCount += 1;
    });

    // Mechanism M1. Zero is as much a fail as two: a board with no accent card
    // has not said which number matters.
    if (accentCount > MAX_ACCENT_CARDS) {
        problems.push(
            `${accentCount} accent-filled cards. The accent is spent once per board ` +
            `and only on the headline metric (M1).`,
        );
    }

    return problems;
}

export default {
    GRID, SHELL, CATEGORIES, CATEGORY_KEYS, RANK_LAW, NUMBER_LADDER,
    size, heightOf, gridProps,
    fitsFor, defaultFit, findFit, resolveFit, dimensionsOf,
    chartsForShape, defaultChartForShape, isChartLegal,
    categoriesForChart, minCategoryForChart, defaultCategoryForChart, isCategoryLegal,
    coerce, fromLegacySize, validate,
};

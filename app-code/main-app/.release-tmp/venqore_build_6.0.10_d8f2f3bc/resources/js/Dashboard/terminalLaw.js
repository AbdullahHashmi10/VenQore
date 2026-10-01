/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  Layout Law v2.0 §10 — the terminal resolver                              ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * A dashboard has unlimited height, so §6 only had to defend the horizontal
 * axis. A TERMINAL is exactly one viewport tall and never scrolls the page, so
 * here height is the scarcer resource — and the worst case is not a phone, it
 * is a 1280×720 laptop, where a maximised browser leaves about 570 usable px.
 *
 * The per-viewport tables in VENQORE_LAYOUT_LAW.md are OUTPUTS of this
 * function, not its input. Geometry comes from `resources/layout-law.json`,
 * which `App\Reckoner\LayoutLaw` reads too.
 *
 * ── The shape of the algorithm ──────────────────────────────────────────────
 *
 *   1. Aspect decides columns or bands. Not width — ASPECT.
 *   2. Every resident pane reserves its LEANEST floor, in rank order.
 *   3. Panes upgrade one fit-step at a time, all of rank 1 before any of rank 2.
 *   4. Whatever is left is shared by weight, respecting caps.
 *   5. A vertical pass demotes stacked panes until the cart clears its floor.
 *
 * Step 5 is the only place in the whole law where one axis overrules the other.
 */

import LAW from '../../layout-law.json';

const T = LAW.terminal;

export const TERMINAL_VARIANTS = Object.keys(T.variants);
export const FLOORS = T.floors;

/* ------------------------------------------------------------------ *
 * 1. Columns or bands
 * ------------------------------------------------------------------ */

/**
 * Splitting a terminal into columns costs nothing vertically; stacking costs a
 * lot. So this is an ASPECT question, not a width question — a 768×950 portrait
 * iPad wants bands (height to spend, no width to spare) and a 1024×695
 * landscape iPad wants columns, exactly the reverse.
 *
 * Computed once per composition, so the only shape change a user ever sees on a
 * terminal is the portrait/landscape one — the same change a phone makes when
 * it is rotated.
 */
export function axisFor(variant, { width, height }) {
    if (T.variants[variant]?.forceLayout) return T.variants[variant].forceLayout;
    return width / height > T.aspect.columnsAbove ? 'columns' : 'bands';
}

/* ------------------------------------------------------------------ *
 * 2. Panes
 * ------------------------------------------------------------------ */

function paneSpec(variant, key) {
    const base = T.panes[key];
    if (!base) return null;
    const over = T.variants[variant]?.paneOverrides?.[key] ?? {};
    return { key, ...base, ...over, fits: base.fits };
}

export const panesFor = (variant) =>
    (T.variants[variant]?.panes ?? []).map((k) => paneSpec(variant, k)).filter(Boolean);

/** Leanest fit first — the order the waterfall reserves in. */
const leanest = (pane) => pane.fits[pane.fits.length - 1];

/** The next richer fit, or null at the top. */
function upgrade(pane, fitKey) {
    const i = pane.fits.findIndex((f) => f.key === fitKey);
    return i > 0 ? pane.fits[i - 1] : null;
}

/* ------------------------------------------------------------------ *
 * 3. The waterfall
 * ------------------------------------------------------------------ */

/**
 * Allocate width across resident panes.
 *
 * v1.0 split width by weight and let each pane relay into whatever it got. That
 * breaks the moment a rank-2 pane exists: on a 1024 iPad the catalog would take
 * 291px and push the cart to its MINIMAL fit, while the same cart on an 820px
 * iPad — a *smaller* screen — got its RELAY fit, because there the catalog had
 * not fitted at all. A bigger screen made the primary surface worse.
 *
 * So allocation is rank-ordered, not weight-ordered, and weight only breaks
 * ties inside a rank.
 */
function allocate(panes, available) {
    const state = panes.map((p) => ({
        pane: p,
        fit: leanest(p),
        width: leanest(p).floor,
    }));

    let spent = state.reduce((n, s) => n + s.width, 0);
    if (spent > available) return { state, spent, short: spent - available };

    // Upgrade one step at a time, all of rank 1 before any of rank 2, and
    // within a rank by weight.
    const ranks = [...new Set(panes.map((p) => p.rank))].sort((a, b) => a - b);
    for (const rank of ranks) {
        let moved = true;
        while (moved) {
            moved = false;
            const tier = state
                .filter((s) => s.pane.rank === rank)
                .sort((a, b) => b.pane.weight - a.pane.weight);

            for (const s of tier) {
                const next = upgrade(s.pane, s.fit.key);
                if (!next) continue;
                const cost = next.floor - s.width;
                if (cost <= 0 || spent + cost > available) continue;
                s.fit = next;
                s.width = next.floor;
                spent += cost;
                moved = true;
            }
        }
    }

    // Whatever is left is shared by weight, respecting caps.
    //
    // A fixed-information pane stops absorbing at its cap: a cart shows the
    // same five columns however wide it is, so past 805px extra width is pure
    // margin. A catalog genuinely shows more items, so it has no cap.
    let surplus = available - spent;
    let open = state.filter((s) => s.pane.cap == null || s.width < s.pane.cap);

    while (surplus > 1 && open.length) {
        const totalWeight = open.reduce((n, s) => n + s.pane.weight, 0);
        let given = 0;

        for (const s of open) {
            const share = Math.floor((surplus * s.pane.weight) / totalWeight);
            const room = s.pane.cap == null ? share : Math.min(share, s.pane.cap - s.width);
            s.width += room;
            given += room;
        }

        if (given <= 0) break;
        surplus -= given;
        open = state.filter((s) => s.pane.cap == null || s.width < s.pane.cap);
    }

    return { state, spent: available - surplus, short: 0 };
}

/* ------------------------------------------------------------------ *
 * 4. Residency
 * ------------------------------------------------------------------ */

/**
 * What a pane defends when width runs short.
 *
 *   hold: 'fit'       — the LAYOUT is the information. A 10-column line table
 *                       beats a present-but-stacked-cards one. Give up
 *                       residency to keep the fit.
 *   hold: 'residency' — PRESENCE is the information. A catalog you can see
 *                       beats a richer catalog behind a sheet. Give up the fit
 *                       to stay on screen.
 *
 * Without the distinction one global rule has to serve both and cannot: scoring
 * residency first drops a document's line table to cards at 615px, and scoring
 * fit first deletes the catalog from the Column variant — the one thing that
 * variant exists for.
 */
function demote(variant, pane, axis) {
    const seq = T.variants[variant]?.sequence ?? [];
    const inSequence = seq.includes(pane.key);

    if (pane.rank === 1) {
        // Never `tab`: a tab implies peers you switch between at will, and a
        // rank-1 pane needs a guaranteed moment, not a competed-for one.
        if (axis === 'bands') return 'stacked';
        return inSequence ? 'route' : 'stacked';
    }
    return pane.hold === 'residency' ? 'stacked' : 'sheet';
}

/* ------------------------------------------------------------------ *
 * 5. Resolve
 * ------------------------------------------------------------------ */

/**
 * The whole composition for one variant at one viewport.
 *
 * Never throws and never returns nothing: an impossible viewport produces the
 * leanest legal terminal rather than a blank screen, because the alternative is
 * a cashier looking at nothing with a customer waiting.
 */
export function resolveTerminal(variant, viewport) {
    const v = T.variants[variant] ? variant : 'counter';
    const { width, height } = viewport;
    const axis = axisFor(v, viewport);
    const panes = panesFor(v);

    const gutter = LAW.grid.gutter;
    const chrome = LAW.shell.headerHeight;
    const usableW = Math.max(0, width - gutter * 2);
    const usableH = Math.max(0, height - chrome);

    let resolved;

    if (axis === 'columns') {
        /*
         * Row puts its catalog in a top BAND of tiles even when the rest of the
         * terminal is in columns — that is the whole variant. On a wide screen a
         * two-row tile strip is reachable by thumb and leaves the full width for
         * the cart underneath, which a left column cannot do.
         *
         * So the catalog comes out of the width allocation entirely and the
         * remaining panes divide what is left.
         */
        const banded = T.variants[v].catalogPlacement === 'band'
            ? panes.filter((p) => p.key === 'catalog')
            : [];
        const columnar = panes.filter((p) => !banded.includes(p));

        const gaps = gutter * Math.max(0, columnar.length - 1);
        const { state, short } = allocate(columnar, usableW - gaps);

        resolved = [
            // The band sits above the columns, so it is listed first: the
            // resolved order IS the render order.
            ...banded.map((p) => {
                const fit = p.fits.find((f) => usableW >= f.floor) ?? leanest(p);
                return {
                    key: p.key, rank: p.rank, residency: 'stacked',
                    fit: fit.key, width: Math.round(usableW),
                    bandRows: T.variants[v].catalogBandRows ?? 1,
                };
            }),
            ...state.map((s) => ({
                key: s.pane.key,
                rank: s.pane.rank,
                residency: s.pane.residency
                    ?? (short > 0 && s.pane.hold === 'fit' && s.pane.rank > 1
                        ? demote(v, s.pane, axis)
                        : 'resident'),
                fit: s.fit.key,
                width: Math.round(s.width),
            })),
        ];
    } else {
        // Bands spend height instead of width, so every pane gets the full
        // width and the fit is whatever that width affords.
        resolved = panes.map((p) => {
            const fit = p.fits.find((f) => usableW >= f.floor) ?? leanest(p);
            return {
                key: p.key,
                rank: p.rank,
                // A variant may pin a pane's residency outright — Grid keeps its
                // tender in a sheet at every width, because when the product is
                // the interface the cart only needs to confirm.
                residency: p.residency
                    ?? (usableW >= leanest(p).floor ? 'stacked' : demote(v, p, axis)),
                fit: fit.key,
                width: Math.round(usableW),
            };
        });
    }

    return applyVerticalPass({ variant: v, axis, viewport, panes: resolved, usableH });
}

/**
 * The vertical pass — the one place an axis overrules the other.
 *
 * `hold: residency` defends a pane horizontally, where losing only means "you
 * have to open a sheet". The vertical axis has no such mercy: **a cart showing
 * fewer than three lines is not a cart, it is a receipt preview.**
 *
 * So stacked panes are demoted, most droppable first, until the cart clears
 * `cart_min_h`. This is why the Column variant quietly becomes Counter on a
 * 360×560 phone instead of showing a one-line cart.
 */
function applyVerticalPass(composition) {
    const { panes, usableH } = composition;
    const cart = panes.find((p) => p.key === 'cart');
    if (!cart) return withLines(composition);

    const bandHeight = (p) => (p.residency === 'stacked' ? estimateBand(p) : 0);
    const spentBy = (list) => list.reduce((n, p) => n + bandHeight(p), 0);

    // Most droppable first: lowest rank, then `hold: residency` (a catalog can
    // survive behind a sheet; a tender cannot).
    const order = [...panes]
        .filter((p) => p.key !== 'cart' && p.residency === 'stacked')
        .sort((a, b) => (b.rank - a.rank) || 0);

    for (const p of order) {
        if (usableH - spentBy(panes) >= FLOORS.cart_min_h) break;
        p.residency = 'sheet';
    }

    return withLines(composition);
}

/** Rough band heights, used only to decide demotion order. */
function estimateBand(pane) {
    if (pane.key === 'tender') return pane.fit === 'full' ? 220 : pane.fit === 'compact' ? 150 : 96;
    if (pane.key === 'catalog' || pane.key === 'floor') {
        return pane.fit?.startsWith('grid') ? 280 : 180;
    }
    return 0;
}

/**
 * How many cart lines fit.
 *
 * The row track is the Layout Law's own unit, so a cart line and a dashboard
 * row are the same height — which is what makes a terminal and a dashboard look
 * like the same product.
 */
function withLines(composition) {
    const { panes, usableH } = composition;
    const others = panes
        .filter((p) => p.key !== 'cart' && p.residency === 'stacked')
        .reduce((n, p) => n + estimateBand(p), 0);

    const cartHeight = Math.max(0, usableH - others);
    const lines = Math.max(0, Math.floor(cartHeight / LAW.grid.unit));

    return {
        ...composition,
        cartHeight: Math.round(cartHeight),
        cartLines: lines,
        // Below three the cart has stopped being a cart. The caller should show
        // the Counter variant rather than this.
        viable: lines >= 3,
    };
}

/* ------------------------------------------------------------------ *
 * Validation
 * ------------------------------------------------------------------ */

/** Reject an illegal composition before it renders. Empty means legal. */
export function validateTerminal(composition) {
    const problems = [];
    const { variant, panes } = composition;
    const seq = T.variants[variant]?.sequence ?? [];

    for (const p of panes) {
        if (!T.residency.ladder.includes(p.residency)) {
            problems.push(`${p.key}: unknown residency "${p.residency}".`);
        }
        if (p.rank === 1) {
            if (T.residency.rank1Forbidden.includes(p.residency)) {
                problems.push(
                    `${p.key}: a rank-1 pane may never be a tab — a tab implies peers you `
                    + `switch between at will, and rank 1 needs a guaranteed moment.`,
                );
            }
            if (T.residency.rank1AllowedInSequence.includes(p.residency) && !seq.includes(p.key)) {
                problems.push(
                    `${p.key}: rank-1 pane demoted to "${p.residency}" but "${variant}" declares `
                    + `no sequence containing it, so there is no guaranteed return path.`,
                );
            }
        }
    }

    if (!composition.viable) {
        problems.push(
            `cart resolves to ${composition.cartLines} lines; below ${FLOORS.cart_min_h}px `
            + `it is a receipt preview, not a cart. Fall back to the Counter variant.`,
        );
    }

    return problems;
}

export default {
    TERMINAL_VARIANTS, FLOORS,
    axisFor, panesFor, resolveTerminal, validateTerminal,
};

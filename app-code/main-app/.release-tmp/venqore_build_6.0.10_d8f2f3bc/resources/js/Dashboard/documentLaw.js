/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  Layout Law v2.0 §11 — the document resolver                              ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Eight of the thirteen document screens are the same file copy-pasted — same
 * imports, same `patchInvoice`, same drag-reorder, same scan modal, same profit
 * peek — with the labels swapped and a handful of fields silently dropped from
 * the payload.
 *
 * That is *why* `Terms` is decorative on every one of them, why a quotation has
 * no `Valid until`, and why a debit note never restores stock: a fix applied to
 * the sales invoice never reached the other seven.
 *
 * **A type is not a screen. It is a configuration** — a set of capability
 * switches and label overrides on one editor. `typeConfig('QT')` is that
 * configuration; `resolveDocument(width)` is the geometry it renders into.
 *
 * Both read `resources/layout-law.json`, which the PHP side reads too.
 */

import LAW from '../../layout-law.json';

const D = LAW.document;

export const DOCUMENT_TYPES = Object.keys(D.types);
export const DENSITIES = ['simple', 'standard', 'pro'];

/* ------------------------------------------------------------------ *
 * The type
 * ------------------------------------------------------------------ */

/**
 * Everything that makes one document type different from another.
 *
 * `can` is the answer to "will we lose something in the merge": every
 * capability filled on any of the thirteen screens today is filled here.
 */
export function typeConfig(code) {
    const t = D.types[code];
    if (!t) return null;

    const can = {};
    for (const [cap, codes] of Object.entries(D.capabilities)) {
        if (cap.startsWith('$')) continue;
        can[cap] = codes.includes(code);
    }

    return {
        code,
        ...t,
        // A prefix is the code itself — INV-2291, QT-118. Keeping them equal is
        // what stops a fourteenth type inventing a fourteenth numbering scheme.
        prefix: code,
        can,
        hasLines: can.lineItems && !t.noLines,
    };
}

/* ------------------------------------------------------------------ *
 * Density
 * ------------------------------------------------------------------ */

const fitsOf = (zone) => D.zones[zone].fits;
const fitIndex = (zone, key) => fitsOf(zone).findIndex((f) => f.key === key);

/** The richest fit a zone can hold at this width. Never null — cards always fit. */
function fitFor(zone, width) {
    return fitsOf(zone).find((f) => width >= f.floor) ?? fitsOf(zone)[fitsOf(zone).length - 1];
}

/**
 * Cap a requested density to what the width can actually honour.
 *
 * Density is the user's preference and this does not override it lightly — but
 * `pro` needs ten line columns, and ten columns below 933px do not become
 * cramped, they become unreadable. Capping is the law choosing a legible
 * `standard` over an illegible `pro`.
 */
export function capDensity(requested, lineFit) {
    const have = fitIndex('lines', lineFit);
    let density = DENSITIES.includes(requested) ? requested : 'standard';

    while (density) {
        const need = fitIndex('lines', D.densities[density].requiresLineFit);
        // Lower index is a richer fit, so "we have at least what it needs" is <=.
        if (have <= need) return density;
        density = DENSITIES[DENSITIES.indexOf(density) - 1] ?? null;
    }

    return 'simple';
}

/* ------------------------------------------------------------------ *
 * The composition
 * ------------------------------------------------------------------ */

/**
 * Nav state for a document surface.
 *
 * A document needs its width more than it needs a visible rail, so below 1024
 * the nav is hidden outright. 1708 is where it may finally expand — the first
 * width at which a 264px sidebar still leaves room for the ten-column table AND
 * the summary panel.
 */
export function navFor(width) {
    if (width < D.nav.hiddenBelow) return { state: 'hidden', width: 0 };
    if (width >= D.nav.expandedAtOrAbove) {
        return { state: 'expanded', width: LAW.shell.navExpanded };
    }
    return { state: 'rail', width: LAW.shell.navRail };
}

/**
 * The whole document surface at one width.
 *
 * The summary is resident only when the line table still clears its own floor
 * beside it. Where it cannot, it becomes a sticky action bar rather than the
 * same panel pinned to the bottom — a 438px bar on a 570px laptop leaves
 * nothing for the document it is summarising.
 */
export function resolveDocument(width, { density = 'standard', type = 'INV' } = {}) {
    const nav = navFor(width);
    const gutter = LAW.grid.gutter;
    const margin = LAW.shell.contentMarginMax;

    const content = Math.max(0, width - nav.width - margin * 2);
    const cfg = typeConfig(type) ?? typeConfig('INV');

    // Try the summary as a resident column first.
    const summaryFit = fitFor('summary', content);
    const forLines = content - summaryFit.floor - gutter;
    const linesFitResident = fitFor('lines', forLines);
    const linesFitStacked = fitFor('lines', content);

    // Resident only if it does not cost the table a fit-step. Presence is not
    // worth degrading the thing the document IS.
    const residentIsFree =
        fitIndex('lines', linesFitResident.key) === fitIndex('lines', linesFitStacked.key)
        && forLines >= linesFitResident.floor;

    const summaryResident = residentIsFree && content >= summaryFit.floor + gutter + linesFitStacked.floor;

    const linesWidth = summaryResident ? forLines : content;
    const linesFit = summaryResident ? linesFitResident : linesFitStacked;
    const headerFit = fitFor('header', content);
    const maxDensity = capDensity(density, linesFit.key);

    return {
        width,
        nav,
        content,
        type: cfg.code,
        header: { fit: headerFit.key, width: content, fields: D.densities[maxDensity].header },
        lines: cfg.hasLines
            ? { fit: linesFit.key, width: Math.round(linesWidth), columns: D.densities[maxDensity].lines }
            : null,
        summary: summaryResident
            ? { residency: 'resident', fit: summaryFit.key, width: Math.round(content - linesWidth - gutter) }
            : { residency: D.summaryFallback.mode, fit: 'tight', width: content, shows: D.summaryFallback.collapsedShows },
        density: maxDensity,
        densityRequested: density,
        densityCapped: maxDensity !== density,
    };
}

/* ------------------------------------------------------------------ *
 * Validation
 * ------------------------------------------------------------------ */

/** Reject an illegal document surface before it renders. Empty means legal. */
export function validateDocument(doc) {
    const problems = [];

    if (doc.lines) {
        const fit = fitsOf('lines').find((f) => f.key === doc.lines.fit);
        if (!fit) problems.push(`lines: "${doc.lines.fit}" is not a declared fit.`);
        else if (doc.lines.width < fit.floor) {
            problems.push(
                `lines: "${fit.key}" needs ${fit.floor}px and has ${doc.lines.width}px. `
                + `Below its floor the columns do not get cramped, they get unreadable.`,
            );
        }
    }

    if (doc.summary.residency === 'resident') {
        const fit = fitsOf('summary').find((f) => f.key === doc.summary.fit);
        if (fit && doc.summary.width < fit.floor) {
            problems.push(`summary: resident at ${doc.summary.width}px, below its ${fit.floor}px floor.`);
        }
    }

    const header = fitsOf('header').find((f) => f.key === doc.header.fit);
    if (header && doc.header.width < header.floor) {
        problems.push(`header: "${header.key}" needs ${header.floor}px, has ${doc.header.width}px.`);
    }

    return problems;
}

export default {
    DOCUMENT_TYPES, DENSITIES,
    typeConfig, capDensity, navFor, resolveDocument, validateDocument,
};

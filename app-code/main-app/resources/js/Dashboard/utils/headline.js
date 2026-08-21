import { formatCurrency, formatNumber, getCurrencySymbol } from '@/Utils/format';

/**
 * The number ladder, and the headline every card is built around.
 *
 * ── §8 · the ladder ─────────────────────────────────────────────────────────
 *
 * Currency drops first, then decimals, then magnitude:
 *
 *     full4 → full2 → full → grouped → abbr2 → abbr1 → abbr0 → bare
 *
 * Three rules come with it, and they are the whole point:
 *
 *   · Full precision belongs in the ledger, never on a dashboard card. A card
 *     answers "roughly what, and which way"; the ledger answers "exactly what".
 *   · The exact value is always one hover away. Every rung below `full2` still
 *     carries the unabbreviated figure in its `title`, so nothing is lost —
 *     it is only not shouted.
 *   · A value must never overflow, clip or ellipsize its card. It steps DOWN
 *     the ladder instead. An ellipsized number is not a smaller number, it is
 *     a wrong one: "Rs 1,240,9…" reads as 1.2 million or 12 million depending
 *     on how fast you glance.
 *
 * That last rule is why this walks the ladder against a character budget
 * rather than picking a format from the unit alone. The budget comes from the
 * card's category, because a C2 strip and a C6 canvas have very different
 * amounts of room for the same rupee figure.
 */

/** Characters a metric may occupy, by category. Measured, not guessed: the
 *  metric face is Space Grotesk at 38px (26px on the lean two), and these are
 *  the counts at which the string reaches the card's inner width at that
 *  category's narrowest declared fit. */
const BUDGET = { C1: 8, C2: 11, C3: 12, C4: 13, C5: 15, C6: 18 };

const abbreviate = (n, decimals) => {
    const abs = Math.abs(n);
    const [divisor, suffix] = abs >= 1e9 ? [1e9, 'B']
        : abs >= 1e6 ? [1e6, 'M']
        : abs >= 1e3 ? [1e3, 'K']
        : [1, ''];

    const scaled = n / divisor;
    // Trailing zeros in an abbreviation are noise: "1.0M" says nothing "1M"
    // does not, and costs two of a very small character budget.
    const text = scaled.toFixed(suffix ? decimals : 0).replace(/\.0+$/, '');
    return text + suffix;
};

/**
 * Walk the ladder until the rendered string fits.
 *
 * Returns `{ text, exact }` — `exact` is the unabbreviated, full-precision
 * value for the `title`, so the rung the card lands on never costs the reader
 * the real number.
 */
export function formatMetric(value, { unit, precision = 0, settings, category = 'C3' } = {}) {
    if (value === null || value === undefined || value === '') {
        return { text: '—', exact: null };
    }

    const n = typeof value === 'number' ? value : parseFloat(value);
    if (Number.isNaN(n)) return { text: String(value), exact: String(value) };

    const budget = BUDGET[category] ?? BUDGET.C3;
    const negative = n < 0;
    const abs = Math.abs(n);

    if (unit === 'percentage' || unit === 'percent') {
        const text = `${formatNumber(abs, precision, settings)}%`;
        return { text: sign(text, negative), exact: sign(`${formatNumber(abs, 2, settings)}%`, negative) };
    }

    const symbol = unit === 'currency' ? `${getCurrencySymbol(settings)} ` : '';
    const exact = sign(
        unit === 'currency' ? formatCurrency(abs, settings) : formatNumber(abs, precision, settings),
        negative,
    );

    /* The rungs, longest first. `grouped` is where a dashboard card starts —
       anything above it is ledger precision and is only reached by a card so
       wide that showing decimals costs nothing. */
    const rungs = [
        () => (unit === 'currency' ? formatCurrency(abs, settings) : formatNumber(abs, 2, settings)),
        () => symbol + formatNumber(abs, 0, settings),
        () => symbol + abbreviate(abs, 2),
        () => symbol + abbreviate(abs, 1),
        () => symbol + abbreviate(abs, 0),
        () => abbreviate(abs, 0),
    ];

    for (const rung of rungs) {
        const text = sign(rung(), negative);
        if (text.length <= budget) return { text, exact };
    }

    // Nothing fit. Show the leanest rung anyway rather than clipping — an
    // honest "1.2B" beats a truncated "1,240,912,3…".
    return { text: sign(abbreviate(abs, 0), negative), exact };
}

/**
 * A negative figure gets a minus sign AND parentheses.
 *
 * Never colour alone: roughly 1 in 12 men cannot reliably separate the red
 * from the green, and a red "1,240" and a green "1,240" are the same string.
 */
const sign = (text, negative) => (negative ? `(−${text})` : text);

/* ------------------------------------------------------------------ *
 * The delta
 * ------------------------------------------------------------------ */

/**
 * Which way is good depends on the reading, not on the sign.
 *
 * A rising cost and a rising revenue are the same arrow and opposite news, so
 * `direction` decides the tone and the arrow reports the movement. Neutral
 * readings get ink rather than the brand — teal means "this is the brand", and
 * a delta is data.
 */
export function resolveDelta(changePct, direction) {
    if (changePct === null || changePct === undefined) return null;

    const pct = typeof changePct === 'number' ? changePct : parseFloat(changePct);
    if (Number.isNaN(pct)) return null;

    if (pct === 0) return { tone: 'flat', rising: null, text: '0.0%' };

    const rising = pct > 0;
    const text = `${Math.abs(pct).toFixed(1)}%`;

    if (direction === 'upper_is_better') return { tone: rising ? 'up' : 'down', rising, text };
    if (direction === 'lower_is_better') return { tone: rising ? 'down' : 'up', rising, text };
    return { tone: 'flat', rising, text };
}

/* ------------------------------------------------------------------ *
 * The headline
 * ------------------------------------------------------------------ */

/**
 * The one figure a card leads with, whatever shape it holds.
 *
 * A SCALAR carries it directly. A SERIES leads with its most recent point,
 * because "the revenue trend" without a current revenue is a shape with no
 * anchor. A BREAKDOWN leads with its total. A RANKING leads with its own top
 * row's value only when the reading is a sum; otherwise it leads with nothing
 * and the list is the card.
 */
export function headlineOf(data, definition) {
    if (!data) return { value: null, changePct: null };

    if (data.value !== undefined && data.value !== null) {
        return { value: data.value, changePct: data.change_pct ?? null, previous: data.previous ?? null };
    }

    const series = data.series;
    if (Array.isArray(series) && series.length) {
        const points = Array.isArray(series[0]?.points) ? series[0].points : series;
        const last = points[points.length - 1];
        const value = typeof last === 'number' ? last : (last?.y ?? null);
        return { value, changePct: data.change_pct ?? null, previous: null };
    }

    if (Array.isArray(data.slices) && data.slices.length) {
        const total = data.slices.reduce((sum, s) => sum + (Number(s.value) || 0), 0);
        return { value: total, changePct: data.change_pct ?? null, previous: null };
    }

    return { value: null, changePct: data.change_pct ?? null, previous: null };
}

/**
 * Charts that print their own number in their own middle.
 *
 * A gauge with "68%" in the centre and "68%" again at 38px above it is the
 * same fact twice, and the second one is the card telling you it does not know
 * what it is for.
 */
export const SELF_LABELLED = new Set(['gauge', 'ring', 'sunburst', 'status']);

/** A stat with no body to make room for — the number IS the card. */
export const isBareStat = (card) => card?.chart === 'stat';

/**
 * The period vocabulary, in one place.
 *
 * These labels were written out three times — in the add-card library, in the
 * card editor and on the card face — which is three chances for "Last 7 days"
 * to become "Last 7 Days" in one of them. The keys are the Reckoner's
 * (`ReckonerPeriod::KEYS`); a definition declares which of them it supports and
 * `PERIOD_ORDER` decides the order they are offered in, shortest window first.
 */

export const PERIOD_LABELS = {
    today: 'Today',
    yesterday: 'Yesterday',
    this_week: 'This week',
    last_week: 'Last week',
    last_7_days: 'Last 7 days',
    this_month: 'This month',
    last_month: 'Last month',
    last_30_days: 'Last 30 days',
    this_quarter: 'This quarter',
    last_quarter: 'Last quarter',
    last_90_days: 'Last 90 days',
    this_year: 'This year',
    last_year: 'Last year',
    last_12_months: 'Last 12 months',
    all_time: 'All time',
    live: 'Live',
    custom: 'Custom range',
    as_of: 'As of',
};

export const PERIOD_ORDER = Object.keys(PERIOD_LABELS);

export const periodLabel = (key) => PERIOD_LABELS[key] || key;

/**
 * The periods a card may actually be switched to, in order.
 *
 * A definition that declares none still gets its current period back, so the
 * picker never renders as an empty menu — it renders as one immovable option,
 * which is the honest thing to show for a reading that has only one window.
 */
export function periodChoices(definition, current) {
    const declared = definition?.periods || [];
    const ordered = PERIOD_ORDER.filter((p) => declared.includes(p));
    if (ordered.length) return ordered;
    return current ? [current] : ['today'];
}

/**
 * The window a figure covers, as one line: `This month · 23 Jul – 21 Aug`.
 *
 * A number with no window is not a number you can act on — "Rs 920,625" is a
 * different fact depending on whether it is today or the year. The Reckoner
 * returns the resolved window with every read, so the card states it rather
 * than making the reader remember what the picker says.
 */
export function periodWhen(meta, fallbackKey) {
    const label = meta?.period?.label || periodLabel(fallbackKey);
    const from = formatDay(meta?.period?.start);
    const to = formatDay(meta?.period?.end);

    if (!from || !to) return label;
    // A single-day window says the day once, not twice.
    if (from === to) return `${label} · ${from}`;
    return `${label} · ${from} – ${to}`;
}

const DAY = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' });

function formatDay(value) {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : DAY.format(date);
}

/**
 * Sale Core — exact money arithmetic (calculation contract v2).
 *
 * Every amount is carried as an exact decimal ({ n: BigInt, s: scale }) until
 * the one place the policy says it becomes currency, and from then on as
 * integer MINOR units (paisa). No binary-float arithmetic decides a posted
 * amount. The PHP twin is app/Support/Money.php; both are proved against the
 * same fixtures in tests/fixtures/sale-totals/*.json.
 *
 * Rounding is half-up (half away from zero), the same as PHP round().
 */

export const CURRENCY_SCALE = 2;
const MAX_INPUT_SCALE = 6;
const MAX_ABS_MINOR = 10n ** 15n; // 10 trillion rupees — far beyond any till

const TEN = 10n;
const pow10 = (k) => TEN ** BigInt(k);

export class MoneyError extends Error {
    constructor(message, code = 'invalid_amount') {
        super(message);
        this.name = 'MoneyError';
        this.code = code;
    }
}

/**
 * Parse a number or decimal string into an exact decimal. Rejects NaN,
 * Infinity, exponent notation it cannot represent exactly, ambiguous
 * formatting ("1,000") and more than MAX_INPUT_SCALE decimals.
 */
export function dec(value, label = 'amount') {
    if (value === null || value === undefined || value === '') return { n: 0n, s: 0 };
    if (typeof value === 'bigint') return { n: value, s: 0 };
    let str;
    if (typeof value === 'number') {
        if (!Number.isFinite(value)) throw new MoneyError(`${label} is not a finite number`);
        str = String(value);
        if (/e/i.test(str)) {
            // Shortest round-trip form of tiny or huge numbers: rebuild exactly.
            const fixed = value.toFixed(MAX_INPUT_SCALE);
            if (Number(fixed) !== value) throw new MoneyError(`${label} has too many decimal places`);
            str = fixed;
        }
    } else if (typeof value === 'string') {
        str = value.trim();
    } else if (typeof value === 'object' && typeof value.n === 'bigint') {
        return value;
    } else {
        throw new MoneyError(`${label} is not a number`);
    }
    const m = /^([+-])?(\d+)(?:\.(\d*))?$/.exec(str) || /^([+-])?()\.(\d+)$/.exec(str);
    if (!m) throw new MoneyError(`${label} is not a plain decimal: "${str}"`);
    const sign = m[1] === '-' ? -1n : 1n;
    let frac = (m[3] || '').replace(/0+$/, '');
    if (frac.length > MAX_INPUT_SCALE) throw new MoneyError(`${label} has more than ${MAX_INPUT_SCALE} decimal places`);
    const n = BigInt((m[2] || '0') + frac) * sign;
    return { n, s: frac.length };
}

export const isZero = (d) => d.n === 0n;
export const mul = (a, b) => ({ n: a.n * b.n, s: a.s + b.s });
export const sub = (a, b) => {
    const s = Math.max(a.s, b.s);
    return { n: a.n * pow10(s - a.s) - b.n * pow10(s - b.s), s };
};
export const cmp = (a, b) => {
    const d = sub(a, b).n;
    return d === 0n ? 0 : (d > 0n ? 1 : -1);
};

/** Integer division of p / q rounded half away from zero. */
export function divRound(p, q) {
    if (q === 0n) throw new MoneyError('division by zero');
    if (q < 0n) { p = -p; q = -q; }
    const neg = p < 0n;
    const a = neg ? -p : p;
    let r = a / q;
    if ((a % q) * 2n >= q) r += 1n;
    return neg ? -r : r;
}

/** Exact decimal → BigInt minor units, half-up, once. */
export function toMinor(d, scale = CURRENCY_SCALE) {
    let r;
    if (d.s <= scale) r = d.n * pow10(scale - d.s);
    else r = divRound(d.n, pow10(d.s - scale));
    if (r > MAX_ABS_MINOR || r < -MAX_ABS_MINOR) throw new MoneyError('amount is too large', 'overflow');
    return r;
}

/** BigInt minor units → JS number in currency units (exact for 2dp values in range). */
export const fromMinor = (m) => Number(m) / 100;

/** Currency string "1234.50" for minor units — what goes over the wire. */
export function minorToString(m) {
    const neg = m < 0n;
    const a = neg ? -m : m;
    const s = a.toString().padStart(3, '0');
    return `${neg ? '-' : ''}${s.slice(0, -2)}.${s.slice(-2)}`;
}

/**
 * Split `total` minor units over `weights` (BigInt[] ≥ 0) by largest
 * remainder. Shares always sum to `total`; ties go to the earlier index.
 * A share never exceeds its weight when total ≤ Σweights.
 */
export function allocate(total, weights) {
    const sum = weights.reduce((a, w) => a + w, 0n);
    if (total === 0n || sum === 0n) return weights.map(() => 0n);
    if (total < 0n) throw new MoneyError('cannot allocate a negative amount');
    const shares = weights.map((w) => (total * w) / sum);
    let left = total - shares.reduce((a, x) => a + x, 0n);
    const order = weights
        .map((w, i) => ({ i, rem: (total * w) % sum }))
        .sort((x, y) => (y.rem > x.rem ? 1 : y.rem < x.rem ? -1 : x.i - y.i));
    for (let k = 0; left > 0n; k = (k + 1) % order.length) {
        if (weights[order[k].i] === 0n) continue;
        shares[order[k].i] += 1n;
        left -= 1n;
    }
    return shares;
}

/**
 * Bill-rounding increment in minor units for the `round_off_total` setting
 * ('none'/'' → none; '1','0',true → whole rupee; 'k' → k decimals; negative
 * k → tens/hundreds). Disabling bill rounding never disables currency precision.
 */
export function billIncrementMinor(setting) {
    if (setting === undefined || setting === null || setting === '' || setting === 'none' || setting === false) return 1n;
    if (setting === '1' || setting === '0' || setting === true || setting === 1 || setting === 0) return 100n;
    const k = parseInt(setting, 10);
    if (Number.isNaN(k) || k >= CURRENCY_SCALE) return 1n;
    return pow10(CURRENCY_SCALE - k);
}

/** Round minor units to a multiple of `inc`, half-up. */
export const roundToIncrement = (m, inc) => (inc <= 1n ? m : divRound(m, inc) * inc);

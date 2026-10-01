/**
 * VenQore Theme Engine — colour maths.
 *
 * Dependency-free helpers used by theme authors and by the CSS generator.
 * Nothing here touches the DOM, so it runs identically in Node (build script),
 * Vite (browser bundle) and SSR.
 *
 * Every colour that ends up in a theme is ultimately stored as an "RGB channel
 * triplet" string — e.g. "99 102 241" — because that is the only format that
 * lets Tailwind's `<alpha-value>` placeholder work:
 *
 *     bg-brand-500      -> rgb(var(--vq-indigo-500) / 1)
 *     bg-brand-500/30   -> rgb(var(--vq-indigo-500) / 0.3)
 *
 * Store a plain hex in the variable instead and every `/opacity` modifier in
 * the codebase silently breaks, so all conversion funnels through `toTriplet`.
 */

/* ------------------------------------------------------------------ *
 * Parsing
 * ------------------------------------------------------------------ */

const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

/** `#6366f1` | `#63f` | `#6366f1ff` -> `{ r, g, b, a }` (0-255, a is 0-1). */
export function parseHex(hex) {
    const m = HEX_RE.exec(String(hex).trim());
    if (!m) throw new Error(`[theme] Not a valid hex colour: ${hex}`);

    let body = m[1];
    if (body.length === 3) body = body.split('').map((c) => c + c).join('');

    return {
        r: parseInt(body.slice(0, 2), 16),
        g: parseInt(body.slice(2, 4), 16),
        b: parseInt(body.slice(4, 6), 16),
        a: body.length === 8 ? parseInt(body.slice(6, 8), 16) / 255 : 1,
    };
}

/** Accepts hex, "r g b", "r, g, b" or `{r,g,b}` and normalises to `{r,g,b}`. */
export function toRgb(input) {
    if (input && typeof input === 'object' && 'r' in input) return input;

    const s = String(input).trim();
    if (s.startsWith('#') || HEX_RE.test(s)) return parseHex(s);

    const parts = s.split(/[\s,]+/).filter(Boolean).map(Number);
    if (parts.length >= 3 && parts.every((n) => Number.isFinite(n))) {
        return { r: parts[0], g: parts[1], b: parts[2], a: 1 };
    }

    throw new Error(`[theme] Cannot interpret colour: ${input}`);
}

/* ------------------------------------------------------------------ *
 * Output
 * ------------------------------------------------------------------ */

const clamp255 = (n) => Math.max(0, Math.min(255, Math.round(n)));

/**
 * The canonical storage format: `"99 102 241"`.
 * This is what every theme ramp stop and semantic token holds.
 */
export function toTriplet(input) {
    const { r, g, b } = toRgb(input);
    return `${clamp255(r)} ${clamp255(g)} ${clamp255(b)}`;
}

/** Triplet (or anything parseable) back to `#rrggbb`, for tooling and docs. */
export function toHex(input) {
    const { r, g, b } = toRgb(input);
    const h = (n) => clamp255(n).toString(16).padStart(2, '0');
    return `#${h(r)}${h(g)}${h(b)}`;
}

/* ------------------------------------------------------------------ *
 * HSL round-trip (used for ramp generation and tinting)
 * ------------------------------------------------------------------ */

/** `{r,g,b}` (0-255) -> `{h,s,l}` with h in 0-360, s/l in 0-100. */
export function rgbToHsl(input) {
    const { r: R, g: G, b: B } = toRgb(input);
    const r = R / 255;
    const g = G / 255;
    const b = B / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;

    if (max === min) return { h: 0, s: 0, l: l * 100 };

    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    let h;
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;

    return { h: h * 60, s: s * 100, l: l * 100 };
}

/** `{h,s,l}` -> `{r,g,b}` (0-255). */
export function hslToRgb({ h, s, l }) {
    const H = ((h % 360) + 360) % 360 / 360;
    const S = Math.max(0, Math.min(100, s)) / 100;
    const L = Math.max(0, Math.min(100, l)) / 100;

    if (S === 0) {
        const v = L * 255;
        return { r: v, g: v, b: v, a: 1 };
    }

    const q = L < 0.5 ? L * (1 + S) : L + S - L * S;
    const p = 2 * L - q;

    const channel = (t) => {
        let T = t;
        if (T < 0) T += 1;
        if (T > 1) T -= 1;
        if (T < 1 / 6) return p + (q - p) * 6 * T;
        if (T < 1 / 2) return q;
        if (T < 2 / 3) return p + (q - p) * (2 / 3 - T) * 6;
        return p;
    };

    return {
        r: channel(H + 1 / 3) * 255,
        g: channel(H) * 255,
        b: channel(H - 1 / 3) * 255,
        a: 1,
    };
}

/* ------------------------------------------------------------------ *
 * Manipulation
 * ------------------------------------------------------------------ */

/** Blend two colours. `amount` 0 = all `a`, 1 = all `b`. */
export function mix(a, b, amount = 0.5) {
    const A = toRgb(a);
    const B = toRgb(b);
    const t = Math.max(0, Math.min(1, amount));
    return {
        r: A.r + (B.r - A.r) * t,
        g: A.g + (B.g - A.g) * t,
        b: A.b + (B.b - A.b) * t,
        a: 1,
    };
}

export const lighten = (c, amount) => mix(c, '#ffffff', amount);
export const darken = (c, amount) => mix(c, '#000000', amount);

/** Nudge saturation by `delta` percentage points, keeping hue and lightness. */
export function saturate(c, delta) {
    const hsl = rgbToHsl(c);
    return hslToRgb({ ...hsl, s: hsl.s + delta });
}

/* ------------------------------------------------------------------ *
 * Contrast (WCAG) — used by the theme validator
 * ------------------------------------------------------------------ */

function channelLuminance(v) {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(input) {
    const { r, g, b } = toRgb(input);
    return (
        0.2126 * channelLuminance(r) +
        0.7152 * channelLuminance(g) +
        0.0722 * channelLuminance(b)
    );
}

/** WCAG 2.1 contrast ratio, 1 (identical) to 21 (black on white). */
export function contrastRatio(fg, bg) {
    const a = relativeLuminance(fg);
    const b = relativeLuminance(bg);
    const [hi, lo] = a > b ? [a, b] : [b, a];
    return (hi + 0.05) / (lo + 0.05);
}

/* ------------------------------------------------------------------ *
 * Ramp generation
 * ------------------------------------------------------------------ */

export const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

/**
 * Target lightness per stop, tuned to sit close to Tailwind's own ramps so a
 * generated ramp can be dropped in beside a handwritten one without the UI
 * feeling like two different systems.
 */
const LIGHTNESS_CURVE = {
    50: 97, 100: 94, 200: 86, 300: 77, 400: 66,
    500: 56, 600: 48, 700: 40, 800: 32, 900: 25, 950: 15,
};

/**
 * Saturation multiplier per stop. Real palettes desaturate at the pale end and
 * hold chroma through the mid-tones; a flat multiplier makes the 50/100 stops
 * look radioactive, which is exactly the "too techy" complaint.
 */
const SATURATION_CURVE = {
    50: 0.55, 100: 0.62, 200: 0.72, 300: 0.82, 400: 0.93,
    500: 1.00, 600: 1.00, 700: 0.96, 800: 0.90, 900: 0.84, 950: 0.78,
};

/**
 * Build a full 11-stop ramp from a single base colour.
 *
 *     ramp('#6366f1')                      // base lands on 500
 *     ramp('#6366f1', { anchor: 600 })     // base lands on 600 instead
 *     ramp('#6366f1', { overrides: { 950: '#0b0a1c' } })
 *
 * This is the "easy mode" for theme authors: pick one colour, get a coherent
 * scale. Hand-tuned stops can still be pinned via `overrides`.
 */
export function ramp(base, { anchor = 500, overrides = {}, hueShift = 0, chroma = 1 } = {}) {
    const hsl = rgbToHsl(base);
    const anchorSat = hsl.s / (SATURATION_CURVE[anchor] ?? 1);

    const out = {};
    for (const shade of SHADES) {
        if (overrides[shade] != null) {
            out[shade] = toTriplet(overrides[shade]);
            continue;
        }

        // Hue drifts slightly across the ramp (cooler in shadow, warmer in
        // light) which is what stops flat ramps looking like plastic.
        const drift = hueShift * ((shade - anchor) / 450);

        out[shade] = toTriplet(
            hslToRgb({
                h: hsl.h + drift,
                s: Math.min(100, anchorSat * (SATURATION_CURVE[shade] ?? 1) * chroma),
                l: LIGHTNESS_CURVE[shade],
            }),
        );
    }
    return out;
}

/**
 * Normalise a hand-written ramp (hex values keyed by shade) into triplets, and
 * fail loudly if a stop is missing — a half-defined ramp produces invisible
 * elements at runtime, which is painful to trace back.
 */
export function literalRamp(stops, label = 'ramp') {
    const out = {};
    for (const shade of SHADES) {
        if (stops[shade] == null) {
            throw new Error(`[theme] ${label} is missing the ${shade} stop.`);
        }
        out[shade] = toTriplet(stops[shade]);
    }
    return out;
}

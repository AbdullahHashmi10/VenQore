/**
 * VenQore Command Center — platform-owner design tokens.
 *
 * ── What changed ────────────────────────────────────────────────────────────
 *
 * This file used to be a second, parallel source of truth: it hardcoded its own
 * indigo, its own slate, its own shadows. The platform shell therefore drifted
 * away from the rest of the product whenever either side was touched, and any
 * theme change had to be made twice to take effect everywhere.
 *
 * It now derives everything from the theme engine (`resources/js/theme/`) and
 * only shapes those values into the structure the Platform/* components already
 * expect. The public API is unchanged — `BRAND`, `GRADIENTS`, `tokens(isDark)`,
 * `statusColor()` and the `fmt*` helpers keep their old signatures — so no
 * consuming component needed editing.
 *
 * ── For new Platform/* code ─────────────────────────────────────────────────
 *
 * Prefer plain Tailwind classes (`bg-surface`, `text-ink-muted`, `border-line`).
 * They read the same tokens, need no prop drilling, and follow dark mode on
 * their own. This module is for inline styles and chart props, where classes
 * cannot reach.
 */

import { vq, role, gradients as themeGradients, getSemanticTokens } from '@/theme/runtime';
import { parseHex } from '@/theme/color';

/** `alpha('#6366f1', 0.55)` → `'rgb(99 102 241 / 0.55)'`. */
function alpha(hex, a) {
    const { r, g, b } = parseHex(hex);
    return `rgb(${r} ${g} ${b} / ${a})`;
}

/**
 * Named brand colours. The keys keep their original pigment names because
 * existing Platform/* code refers to them, but the values follow the active
 * theme — under a warm theme, `BRAND.indigo` is whatever that theme uses for
 * primary actions.
 */
export const BRAND = {
    indigo: role.brand[500],
    indigo2: role.brand[400],
    violet: role.accent[500],
    fuchsia: role.accent[400],
    sky: role.info[400],
    emerald: role.success[500],
    amber: role.warning[500],
    rose: role.danger[500],
    slate: vq.slate[500],
};

export const GRADIENTS = {
    brand: themeGradients.brand,
    brandSoft: themeGradients['brand-soft'],
    revenue: themeGradients.success,
    gmv: themeGradients.info,
    danger: themeGradients.danger,
    aurora: themeGradients.aurora,
};

/**
 * Surface, ink and line tokens for the platform shell.
 *
 * The translucent panels and deep shadows are the Command Center's own visual
 * language, so they are composed here rather than read wholesale from the
 * semantic set — but every colour underneath now comes from the active theme,
 * so the shell moves with it instead of against it.
 */
export function tokens(isDark) {
    const s = getSemanticTokens(isDark);
    const brand = role.brand[500];

    if (isDark) {
        return {
            isDark: true,
            // surfaces
            appBg: s['bg-sunken'],
            shellBg: alpha(s['bg-app'], 0.72),
            panel: alpha(s['bg-surface'], 0.66),
            panel2: alpha(s['bg-raised'], 0.45),
            panelSolid: s['bg-surface'],
            hover: alpha(brand, 0.1),
            // lines
            border: alpha(vq.slate[400], 0.14),
            border2: alpha(vq.slate[400], 0.26),
            rowBorder: alpha(vq.slate[400], 0.08),
            // ink
            ink: s.ink,
            sub: s['ink-secondary'],
            muted: s['ink-muted'],
            faint: s['ink-faint'],
            // controls
            inputBg: alpha(vq.slate[50], 0.04),
            inputBorder: alpha(vq.slate[400], 0.18),
            // effects
            ring: alpha(brand, 0.55),
            shadow: '0 18px 50px -12px rgb(0 0 0 / 0.7)',
            glow: `0 0 0 1px ${alpha(brand, 0.2)}, 0 10px 40px -10px ${alpha(brand, 0.35)}`,
            aurora: GRADIENTS.aurora,
        };
    }

    return {
        isDark: false,
        appBg: s['bg-app'],
        shellBg: alpha(s['bg-surface'], 0.82),
        panel: s['bg-surface'],
        panel2: s['bg-raised'],
        panelSolid: s['bg-surface'],
        hover: alpha(brand, 0.06),
        border: alpha(s.ink, 0.1),
        border2: alpha(s.ink, 0.16),
        rowBorder: alpha(s.ink, 0.06),
        ink: s.ink,
        sub: s['ink-secondary'],
        muted: s['ink-muted'],
        faint: s['ink-faint'],
        inputBg: s['bg-surface'],
        inputBorder: alpha(s.ink, 0.14),
        ring: alpha(brand, 0.45),
        shadow: `0 16px 40px -16px ${alpha(s.ink, 0.22)}`,
        glow: `0 0 0 1px ${alpha(brand, 0.16)}, 0 12px 32px -12px ${alpha(brand, 0.28)}`,
        aurora: GRADIENTS.aurora,
    };
}

/** Status → colour mapping used by badges across all list screens. */
export function statusColor(status) {
    const s = String(status || '').toLowerCase();
    const map = {
        active: BRAND.emerald,
        trial: BRAND.sky,
        suspended: BRAND.amber,
        cancelled: BRAND.rose,
        churned: BRAND.rose,
        deleted: BRAND.slate,
        pending: BRAND.amber,
        approved: BRAND.emerald,
        rejected: BRAND.rose,
        paid: BRAND.emerald,
        open: BRAND.sky,
        resolved: BRAND.emerald,
        new: BRAND.indigo,
    };
    return map[s] || BRAND.slate;
}

export function fmtCurrency(n, currency = 'USD') {
    const num = Number(n || 0);
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency', currency,
            maximumFractionDigits: num >= 1000 ? 0 : 2,
        }).format(num);
    } catch {
        return '$' + num.toLocaleString();
    }
}

export function fmtNumber(n) {
    return Number(n || 0).toLocaleString();
}

export function fmtCompact(n) {
    const num = Number(n || 0);
    if (Math.abs(num) >= 1000) {
        return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(num);
    }
    return String(num);
}

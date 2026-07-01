/**
 * VenQore Command Center — design tokens.
 *
 * One source of truth for the platform owner UI palette, in both light and
 * dark, driven by the global ThemeContext. Every Platform/* component reads
 * its colors from here so spacing/shadows/borders/surfaces stay consistent
 * across all five nav groups (fixes the audit's "theme inconsistency" finding).
 */

export const BRAND = {
    indigo: '#6366f1',
    indigo2: '#818cf8',
    violet: '#8b5cf6',
    fuchsia: '#d946ef',
    sky: '#38bdf8',
    emerald: '#10b981',
    amber: '#f59e0b',
    rose: '#ef4444',
    slate: '#64748b',
};

export const GRADIENTS = {
    brand: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 60%, #d946ef 100%)',
    brandSoft: 'linear-gradient(135deg, rgba(99,102,241,0.16), rgba(139,92,246,0.06))',
    revenue: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    gmv: 'linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)',
    danger: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
    aurora: 'radial-gradient(ellipse at 12% -8%, rgba(99,102,241,0.18), transparent 45%), radial-gradient(ellipse at 100% 0%, rgba(139,92,246,0.12), transparent 42%)',
};

export function tokens(isDark) {
    if (isDark) {
        return {
            isDark: true,
            // surfaces
            appBg: '#06080f',
            shellBg: 'rgba(9,11,20,0.72)',
            panel: 'rgba(17,24,39,0.66)',
            panel2: 'rgba(30,41,59,0.45)',
            panelSolid: '#0d1119',
            hover: 'rgba(99,102,241,0.10)',
            // lines
            border: 'rgba(148,163,184,0.14)',
            border2: 'rgba(148,163,184,0.26)',
            rowBorder: 'rgba(148,163,184,0.08)',
            // ink
            ink: '#f1f5f9',
            sub: '#cbd5e1',
            muted: '#7c8aa3',
            faint: '#5b6b86',
            // controls
            inputBg: 'rgba(255,255,255,0.04)',
            inputBorder: 'rgba(148,163,184,0.18)',
            // effects
            ring: 'rgba(99,102,241,0.55)',
            shadow: '0 18px 50px -12px rgba(0,0,0,0.7)',
            glow: '0 0 0 1px rgba(99,102,241,0.20), 0 10px 40px -10px rgba(99,102,241,0.35)',
            aurora: GRADIENTS.aurora,
        };
    }
    return {
        isDark: false,
        appBg: '#f4f5fb',
        shellBg: 'rgba(255,255,255,0.82)',
        panel: '#ffffff',
        panel2: '#f8fafc',
        panelSolid: '#ffffff',
        hover: 'rgba(99,102,241,0.06)',
        border: 'rgba(15,23,42,0.10)',
        border2: 'rgba(15,23,42,0.16)',
        rowBorder: 'rgba(15,23,42,0.06)',
        ink: '#0f172a',
        sub: '#334155',
        muted: '#64748b',
        faint: '#94a3b8',
        inputBg: '#ffffff',
        inputBorder: 'rgba(15,23,42,0.14)',
        ring: 'rgba(99,102,241,0.45)',
        shadow: '0 16px 40px -16px rgba(15,23,42,0.22)',
        glow: '0 0 0 1px rgba(99,102,241,0.16), 0 12px 32px -12px rgba(99,102,241,0.28)',
        aurora: 'radial-gradient(ellipse at 12% -8%, rgba(99,102,241,0.10), transparent 45%), radial-gradient(ellipse at 100% 0%, rgba(139,92,246,0.07), transparent 42%)',
    };
}

/** Status → color mapping used by badges across all list screens. */
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

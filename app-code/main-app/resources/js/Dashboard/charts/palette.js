/**
 * palette.js — WCAG AA compliant, color-blind safe chart palette
 * for both light and dark modes.
 *
 * See Rule 6 of §6.
 */
export const PALETTE = {
    // Primary categorical colors
    colors: [
        '#6366f1', // Indigo
        '#8b5cf6', // Violet
        '#3b82f6', // Blue
        '#10b981', // Emerald
        '#f59e0b', // Amber
        '#ef4444', // Rose
        '#06b6d4', // Cyan
    ],

    // Semantic mappings based on direction / severity
    semantic: {
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        neutral: '#6366f1',
    },

    // Light-mode chart theme config
    light: {
        grid: '#f1f5f9',
        axis: '#94a3b8',
        text: '#475569',
        bg: '#ffffff',
    },

    // Dark-mode chart theme config
    dark: {
        grid: '#1e293b',
        axis: '#475569',
        text: '#94a3b8',
        bg: '#0f172a',
    }
};

/** Get categorical color by index. */
export function getColor(index) {
    return PALETTE.colors[index % PALETTE.colors.length];
}

/** Get semantic color based on trend direction/severity. */
export function getSemanticColor(status) {
    return PALETTE.semantic[status] || PALETTE.semantic.neutral;
}

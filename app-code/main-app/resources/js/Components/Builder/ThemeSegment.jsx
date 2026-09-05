/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  ThemeSegment — the V6 segmented control, used as the theme switch.       ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * One control, two jobs: it sets the theme, and it is the first thing on the
 * page that responds to a click. That second job is why it springs rather than
 * fades — the builder's whole argument is "this thing reacts to you", and the
 * switch in the corner is where a visitor tests that before they trust it with
 * a question.
 *
 * The travelling pill is a `layoutId`, so motion interpolates its position and
 * width between segments instead of us animating a `left` we computed by hand.
 * That is what keeps it correct when the labels are localised and the segments
 * change width.
 *
 * `--vq-ease-spring` is `cubic-bezier(.34, 1.56, .64, 1)` — it overshoots. The
 * spring config below is tuned to land in the same place: enough bounce to read
 * as physical, not enough to wobble.
 *
 * ── Why it writes BOTH `.dark` and `data-theme` ────────────────────────────
 * The app has two conventions live at once: Tailwind is configured
 * `darkMode: 'class'` (so `dark:` variants need the class), while
 * Components/ds/navigation/ThemeToggle.jsx writes `data-theme`. Writing one and
 * not the other gives you a page where half the styles flip. Until those are
 * reconciled this writes both, which is correct under either reader.
 */

import React from 'react';
import { motion } from 'motion/react';

export const SPRING = { type: 'spring', stiffness: 420, damping: 32, mass: 0.85 };

/** Applies a theme to <html> under both conventions. Exported so the page can
 *  restore the visitor's previous theme when the builder unmounts. */
export function applyTheme(theme) {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
}

export default function ThemeSegment({ value, onChange, options, className = '' }) {
    const items = options || [
        { key: 'light', label: 'Light' },
        { key: 'dark', label: 'Dark' },
    ];

    return (
        <fieldset
            aria-label="Colour theme"
            className={`relative inline-flex items-center gap-1 rounded-full border border-line bg-surface p-1 shadow-xs ${className}`}
        >
            {items.map((opt) => {
                const active = opt.key === value;
                return (
                    <button
                        key={opt.key}
                        type="button"
                        aria-pressed={active}
                        onClick={() => onChange(opt.key)}
                        className={`relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-2xs font-semibold tracking-wide transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
                            active ? 'text-accent-on' : 'text-ink-muted hover:text-ink'
                        }`}
                    >
                        {active && (
                            <motion.span
                                layoutId="vq-theme-pill"
                                transition={SPRING}
                                className="absolute inset-0 rounded-full bg-accent-fill shadow-glow"
                            />
                        )}
                        <span className="relative flex items-center gap-1.5">
                            {opt.icon}
                            {opt.label}
                        </span>
                    </button>
                );
            })}
        </fieldset>
    );
}

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  BuilderShell — the frame every builder surface shares.                   ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Three screens run inside this shell — the public /build-workspace flow, the
 * in-app onboarding wizard, and the reconfigure page. They shared no code
 * before, which is why they had drifted into three different products: the
 * public one was light with a slate palette, the wizard was dark with hard-coded
 * neutrals, and neither could be re-themed because both typed their colours by
 * hand. Everything here is a V6 semantic token, so both modes come free and the
 * next theme change reaches all three at once.
 *
 * ── Theme ownership ────────────────────────────────────────────────────────
 * Light is the default, per the brief. The shell writes the theme to <html>
 * (both `.dark` and `data-theme`, see ThemeSegment) and RESTORES what was there
 * on unmount — the in-app surfaces sit inside an authenticated session that
 * already has a theme, and a builder that silently repaints the rest of the app
 * on exit is a bug people report as "the app went light on its own".
 *
 * ── The progress rail, and why it shows no numbers ─────────────────────────
 *
 * It draws a bar and nothing else. No "Step 1 of 9", no percentage.
 *
 * The reason is that the total is the single most discouraging thing on the
 * screen. A visitor two taps in has no way to know that four of those nine are
 * follow-ups they will probably never see; they read "9" as nine, decide this
 * is a form, and leave. Removing the number removes the decision.
 *
 * The fill is eased rather than linear — `1 - (1 - t)^1.8` — so the first two
 * answers carry the bar to roughly 37% and the back half decelerates. Early
 * motion is what makes a flow feel quick, and the front of this flow genuinely
 * IS the cheap part: the first questions are two taps each and they do most of
 * the work.
 *
 * What it does NOT do is go backwards. A bar that retreats to manufacture
 * suspense is noticed, reads as a bug, and costs more trust than an honest
 * number ever would — and unlike a hidden total, you cannot take it back. Fast
 * and monotonic gets the same feeling without the lie.
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Moon, Sun } from 'lucide-react';
import { ThinkingOrb } from '@/Components/ThinkingOrbs';
import MeshBackdrop from './MeshBackdrop';
import ThemeSegment, { applyTheme } from './ThemeSegment';

const STORAGE_KEY = 'vq-builder-theme';

const THEME_OPTIONS = [
    { key: 'light', label: 'Light', icon: <Sun size={13} strokeWidth={2.4} /> },
    { key: 'dark', label: 'Dark', icon: <Moon size={13} strokeWidth={2.4} /> },
];

export default function BuilderShell({
    children,
    step = 0,
    total = 0,
    eyebrow = null,
    onBack = null,
    footer = null,
    wide = false,
    orbState = 'breathing',
}) {
    /* Read once, during render. Doing this in an effect meant a guaranteed
       second render and a visible flash of the wrong theme.

       The `typeof window` guard is not defensive padding: this project ships an
       SSR bundle (`vite build --ssr`, `php artisan inertia:start-ssr`), and a
       lazy useState initialiser DOES run on the server. Without the guard the
       first render of this page on the SSR process throws on `window`, and the
       failure surfaces as a blank page in production rather than an error here. */
    const [theme, setTheme] = useState(() => {
        if (typeof window === 'undefined') return 'light';
        try {
            const saved = window.localStorage.getItem(STORAGE_KEY);
            if (saved === 'dark' || saved === 'light') return saved;
        } catch (e) {
            /* private mode, blocked storage — light is a fine answer */
        }
        return 'light';
    });

    /* Adopt the stored preference, then hand the page back on the way out. */
    useEffect(() => {
        const root = document.documentElement;
        const previous = {
            dark: root.classList.contains('dark'),
            attr: root.getAttribute('data-theme'),
        };

        root.setAttribute('data-vq-shell', 'builder');

        return () => {
            root.classList.toggle('dark', previous.dark);
            if (previous.attr) root.setAttribute('data-theme', previous.attr);
            else root.removeAttribute('data-theme');
            root.removeAttribute('data-vq-shell');
        };
    }, []);

    /* Applying the theme is its own effect so the mount effect above can
       honestly declare no dependencies. */
    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    const chooseTheme = (next) => {
        setTheme(next);
        try {
            window.localStorage.setItem(STORAGE_KEY, next);
        } catch (e) {
            /* nothing to do — the choice still applies for this visit */
        }
    };

    /* Eased fill. See the note above: front-loaded, monotonic, unlabelled. */
    const ratio = total > 0 ? Math.min(1, Math.max(0, step / total)) : 0;
    const pct = Math.round((1 - Math.pow(1 - ratio, 1.8)) * 100);

    return (
        <div className="relative min-h-screen text-ink">
            <MeshBackdrop />

            <div className="relative flex min-h-screen flex-col">
                <header className="shrink-0 px-5 pt-5 sm:px-8 sm:pt-7">
                    <div
                        className={`mx-auto flex items-center justify-between gap-4 ${
                            wide ? 'max-w-7xl' : 'max-w-6xl'
                        }`}
                    >
                        <div className="flex min-w-0 items-center gap-3">
                            {onBack ? (
                                <button
                                    type="button"
                                    onClick={onBack}
                                    className="flex h-9 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-2xs font-semibold text-ink-secondary shadow-xs transition-colors duration-fast ease-standard hover:bg-interactive-hover hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                                >
                                    Back
                                </button>
                            ) : null}
                            {/* The same orb Vena wears. Using it here rather
                                than a generic spinner means the thing that is
                                thinking during setup is visibly the thing that
                                will be thinking inside the product afterwards —
                                one face for the AI, not two. */}
                            <ThinkingOrb
                                state={orbState}
                                size={26}
                                aria-label="VenQore"
                            />
                            <span className="font-display text-base font-semibold tracking-tight text-ink">
                                VenQore
                            </span>
                            {eyebrow && (
                                <span className="hidden truncate rounded-full border border-line bg-surface px-2.5 py-1 text-3xs font-semibold uppercase tracking-widest text-ink-muted sm:inline">
                                    {eyebrow}
                                </span>
                            )}
                        </div>

                        <ThemeSegment
                            value={theme}
                            onChange={chooseTheme}
                            options={THEME_OPTIONS}
                        />
                    </div>

                    {total > 0 && (
                        <div
                            className={`mx-auto mt-5 ${wide ? 'max-w-7xl' : 'max-w-6xl'}`}
                        >
                            {/* A real <progress> for assistive tech, and the
                                painted bar beside it marked decorative. A
                                screen-reader user gets the actual value; a
                                sighted user gets the eased fill. Styling
                                <progress> itself across engines is not worth
                                what it costs. */}
                            <progress
                                className="sr-only"
                                aria-label="Setup progress"
                                value={pct}
                                max={100}
                            />
                            <div
                                aria-hidden="true"
                                className="h-1.5 overflow-hidden rounded-full bg-sunken"
                            >
                                <motion.div
                                    className="h-full rounded-full bg-accent-fill"
                                    initial={false}
                                    animate={{ width: `${pct}%` }}
                                    transition={{
                                        type: 'spring',
                                        stiffness: 220,
                                        damping: 30,
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </header>

                <main className="flex flex-1 items-center px-5 py-8 sm:px-8 sm:py-10">
                    <div
                        className={`mx-auto w-full ${wide ? 'max-w-7xl' : 'max-w-6xl'}`}
                    >
                        {children}
                    </div>
                </main>

                <footer className="shrink-0 px-5 pb-6 sm:px-8">
                    <div
                        className={`mx-auto flex flex-wrap items-center justify-between gap-3 border-t border-line-subtle pt-4 text-3xs text-ink-faint ${
                            wide ? 'max-w-7xl' : 'max-w-6xl'
                        }`}
                    >
                        <span>Every figure comes from one verified ledger.</span>
                        {footer}
                    </div>
                </footer>
            </div>
        </div>
    );
}

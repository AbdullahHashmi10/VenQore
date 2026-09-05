/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  LiveStack — the reason the questions are not friction.                   ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * This panel is the argument. A question the visitor answers into a void is a
 * tax; a question that visibly moves something is an investment, and people
 * will sit through a surprising number of the second kind. So every answer
 * lands here within the same beat: a row slides in, the counter ticks, and the
 * new row stays marked for a moment so it is obvious WHICH answer did that.
 *
 * The corollary is the rule that governs the config: if a question cannot move
 * this panel, it should not be asked. The three dropdowns this flow used to
 * open with — industry, sales method, team size — moved nothing, because the
 * server only ever read the free-text prompt. Two of the three were not even
 * validated. That is the exact failure this component exists to make visible.
 *
 * ── Answers that imply nothing ─────────────────────────────────────────────
 * "No, I don't keep stock" adds no module, and staying silent there reads as a
 * dropped click. So a no-op answer gets its own acknowledgement line: the
 * system confirms it is deliberately NOT adding anything. Restraint, shown.
 *
 * ── Ordering ───────────────────────────────────────────────────────────────
 * Preset modules first, in registry order, then implied ones in the order they
 * were earned. Re-sorting on every answer would make rows jump past each other
 * and lose the causal link between the tap and the arrival.
 */

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import NumberFlow from '@number-flow/react';
import { Layers, Sparkles } from 'lucide-react';
import { moduleGlyph } from './icons';

const ROW_SPRING = { type: 'spring', stiffness: 380, damping: 34, mass: 0.8 };

export default function LiveStack({
    modules = [],
    catalogue = {},
    attribution = {},
    lastAnswer = null,
    className = '',
}) {
    const still = useReducedMotion();
    const [freshKeys, setFreshKeys] = useState([]);
    const seenRef = useRef(new Set());
    const [noOpNote, setNoOpNote] = useState(null);

    /* Mark rows that arrived since the last render so they can glow briefly. */
    useEffect(() => {
        const incoming = modules.filter((k) => !seenRef.current.has(k));
        modules.forEach((k) => seenRef.current.add(k));
        if (incoming.length === 0) return;
        setFreshKeys(incoming);
        const t = window.setTimeout(() => setFreshKeys([]), 2200);
        return () => window.clearTimeout(t);
    }, [modules]);

    /* An answer that added nothing still deserves a reply. */
    useEffect(() => {
        if (!lastAnswer) return;
        const added = modules.filter((k) => attribution[k] === lastAnswer.questionKey);
        if (added.length > 0) {
            setNoOpNote(null);
            return;
        }
        setNoOpNote(lastAnswer.optionLabel);
        const t = window.setTimeout(() => setNoOpNote(null), 2600);
        return () => window.clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lastAnswer]);

    return (
        <aside
            aria-live="polite"
            aria-label="Your system so far"
            className={`flex flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-lg ${className}`}
        >
            <header className="flex items-center justify-between gap-3 border-b border-line-subtle px-5 py-4">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-accent-quiet text-accent-text">
                        <Layers size={16} strokeWidth={2} />
                    </span>
                    <div>
                        <p className="text-2xs font-semibold uppercase tracking-widest text-ink-muted">
                            Building
                        </p>
                        <p className="text-sm font-semibold leading-tight text-ink">
                            Your system
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="font-numeric text-2xl font-semibold leading-none text-ink">
                        <NumberFlow value={modules.length} />
                    </p>
                    <p className="text-3xs uppercase tracking-widest text-ink-faint">
                        modules
                    </p>
                </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
                <ul className="space-y-1.5">
                    <AnimatePresence initial={false}>
                        {modules.map((key) => {
                            const entry = catalogue[key] || {};
                            const Glyph = moduleGlyph(key, entry.icon);
                            const fresh = freshKeys.includes(key);
                            const earned = Boolean(attribution[key]);

                            return (
                                <motion.li
                                    key={key}
                                    layout={!still}
                                    initial={
                                        still
                                            ? { opacity: 0 }
                                            : { opacity: 0, x: 24, scale: 0.96 }
                                    }
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    exit={
                                        still
                                            ? { opacity: 0 }
                                            : { opacity: 0, x: -16, scale: 0.96 }
                                    }
                                    transition={ROW_SPRING}
                                    className={`flex items-center gap-3 rounded-md border px-3 py-2.5 transition-colors duration-slow ease-standard ${
                                        fresh
                                            ? 'border-accent bg-accent-quiet'
                                            : 'border-transparent bg-sunken'
                                    }`}
                                >
                                    <span
                                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xs ${
                                            fresh
                                                ? 'bg-accent-fill text-accent-on'
                                                : 'bg-surface text-ink-muted'
                                        }`}
                                    >
                                        <Glyph size={14} strokeWidth={2} />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-xs font-semibold text-ink">
                                            {entry.label || key.replace(/_/g, ' ')}
                                        </span>
                                        {entry.description && (
                                            <span className="block truncate text-3xs text-ink-faint">
                                                {entry.description}
                                            </span>
                                        )}
                                    </span>
                                    {earned && fresh && (
                                        <motion.span
                                            initial={{ opacity: 0, scale: 0.6 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={ROW_SPRING}
                                            className="shrink-0 rounded-full bg-accent-fill px-2 py-0.5 text-3xs font-bold uppercase tracking-wider text-accent-on"
                                        >
                                            Added
                                        </motion.span>
                                    )}
                                </motion.li>
                            );
                        })}
                    </AnimatePresence>
                </ul>
            </div>

            {/* Restraint, shown. An answer that adds nothing says so. */}
            <AnimatePresence>
                {noOpNote && (
                    <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                        className="flex items-start gap-2 overflow-hidden border-t border-line-subtle bg-sunken px-5 py-3 text-2xs leading-relaxed text-ink-secondary"
                    >
                        <Sparkles size={13} className="mt-0.5 shrink-0 text-accent-text" />
                        <span>
                            <span className="font-semibold text-ink">{noOpNote}</span>{' '}
                            &mdash; nothing extra needed. Kept lean on purpose.
                        </span>
                    </motion.p>
                )}
            </AnimatePresence>
        </aside>
    );
}

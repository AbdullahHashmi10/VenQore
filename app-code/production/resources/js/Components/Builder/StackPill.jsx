/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  StackPill — the live panel, for a phone.                                 ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * `LiveStack` is a 20rem column and there is nowhere to put it on a 390px
 * screen. Hiding it there was not a layout compromise, it was cutting the
 * mechanism the whole redesign rests on: without visible payoff, six questions
 * on a phone are six questions for nothing — and a phone is exactly how a
 * shopkeeper will meet this page.
 *
 * So the payoff survives, compressed to its two load-bearing parts: a count
 * that ticks, and the name of the thing the last answer just added. That is
 * enough to make the causal link between the tap and the result, which is all
 * the panel was ever really for.
 */

import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import NumberFlow from '@number-flow/react';
import { Layers } from 'lucide-react';

export default function StackPill({ modules = [], catalogue = {}, justAdded = null, className = '' }) {
    const label = justAdded ? catalogue[justAdded]?.label || justAdded : null;

    return (
        <div
            aria-live="polite"
            className={`flex items-center gap-3 rounded-lg border border-line bg-surface px-4 py-3 shadow-sm ${className}`}
        >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-accent-quiet text-accent-text">
                <Layers size={15} strokeWidth={2} />
            </span>

            <span className="min-w-0 flex-1">
                <span className="block text-3xs font-semibold uppercase tracking-widest text-ink-muted">
                    Your system
                </span>
                <span className="block h-4 overflow-hidden">
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.span
                            key={label || 'idle'}
                            initial={{ y: 12, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -12, opacity: 0 }}
                            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                            className="block truncate text-xs font-semibold text-ink"
                        >
                            {label ? `+ ${label}` : 'Building as you answer'}
                        </motion.span>
                    </AnimatePresence>
                </span>
            </span>

            <span className="shrink-0 text-right">
                <span className="block font-numeric text-xl font-semibold leading-none text-ink">
                    <NumberFlow value={modules.length} />
                </span>
                <span className="block text-3xs uppercase tracking-widest text-ink-faint">
                    modules
                </span>
            </span>
        </div>
    );
}

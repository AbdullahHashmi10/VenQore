/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  ModuleGrid — the reveal's editable surface.                              ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Add AND remove. That is not a feature note, it is a bug fix: the in-app
 * Proposal screen rendered `activeModules.map(...)` with an × on each chip and
 * nothing else, so "you can add anything you like" was only ever half true —
 * there was no list of inactive modules to add FROM. A visitor whose business
 * needed one more thing than the preset guessed had no way to say so, and the
 * screen that is supposed to sell the product quietly capped it.
 *
 * So: everything live in the registry is here, on or off, searchable, with the
 * on ones first. `catalogue` is the whole live module list from
 * `config/modules.php` — this component never decides what exists.
 *
 * ── Required modules ───────────────────────────────────────────────────────
 * Some modules are hard dependencies of others (`requires` in the registry).
 * They render locked with the reason, rather than being silently un-removable,
 * because a control that ignores a click with no explanation is worse than one
 * that is visibly disabled.
 */

import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Check, Lock, Plus, Search, X } from 'lucide-react';
import { moduleGlyph } from './icons';

const SPRING = { type: 'spring', stiffness: 400, damping: 34, mass: 0.8 };

export default function ModuleGrid({
    catalogue = [],
    active = [],
    locked = {},
    onToggle,
    searchable = true,
}) {
    const still = useReducedMotion();
    const [query, setQuery] = useState('');

    const rows = useMemo(() => {
        const q = query.trim().toLowerCase();
        const matched = catalogue.filter((m) => {
            if (!q) return true;
            return (
                (m.label || '').toLowerCase().includes(q) ||
                (m.description || '').toLowerCase().includes(q) ||
                m.key.toLowerCase().includes(q)
            );
        });
        /* On first, then registry order within each half. */
        return [
            ...matched.filter((m) => active.includes(m.key)),
            ...matched.filter((m) => !active.includes(m.key)),
        ];
    }, [catalogue, active, query]);

    return (
        <div>
            {searchable && (
                <div className="relative mb-4">
                    <Search
                        size={15}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
                    />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search everything VenQore can do…"
                        className="h-11 w-full rounded-md border border-line bg-surface pl-10 pr-10 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-focus"
                    />
                    {query && (
                        <button
                            type="button"
                            onClick={() => setQuery('')}
                            aria-label="Clear search"
                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink-faint transition-colors duration-fast ease-standard hover:bg-interactive-hover hover:text-ink"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            )}

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence initial={false}>
                    {rows.map((m) => {
                        const on = active.includes(m.key);
                        const lockReason = locked[m.key];
                        const Glyph = moduleGlyph(m.key, m.icon);

                        return (
                            <motion.button
                                key={m.key}
                                layout={!still}
                                type="button"
                                disabled={Boolean(lockReason)}
                                aria-pressed={on}
                                onClick={() => !lockReason && onToggle(m.key)}
                                initial={{ opacity: 0, scale: 0.97 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.97 }}
                                transition={SPRING}
                                title={lockReason || undefined}
                                className={`group flex items-start gap-3 rounded-md border p-3.5 text-left transition-colors duration-normal ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
                                    lockReason
                                        ? 'cursor-not-allowed border-line-subtle bg-sunken opacity-70'
                                        : on
                                          ? 'border-accent bg-accent-quiet'
                                          : 'border-line bg-surface hover:border-line-strong hover:bg-interactive-hover'
                                }`}
                            >
                                <span
                                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xs ${
                                        on
                                            ? 'bg-accent-fill text-accent-on'
                                            : 'bg-sunken text-ink-muted'
                                    }`}
                                >
                                    <Glyph size={15} strokeWidth={2} />
                                </span>

                                <span className="min-w-0 flex-1">
                                    <span className="block text-xs font-semibold leading-snug text-ink">
                                        {m.label}
                                    </span>
                                    {m.description && (
                                        <span className="mt-0.5 block text-3xs leading-normal text-ink-muted">
                                            {m.description}
                                        </span>
                                    )}
                                </span>

                                <span className="mt-0.5 shrink-0">
                                    {lockReason ? (
                                        <Lock size={13} className="text-ink-faint" />
                                    ) : on ? (
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-fill text-accent-on">
                                            <Check size={11} strokeWidth={3} />
                                        </span>
                                    ) : (
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full border border-line-strong text-ink-faint transition-colors duration-fast ease-standard group-hover:border-accent group-hover:text-accent-text">
                                            <Plus size={11} strokeWidth={3} />
                                        </span>
                                    )}
                                </span>
                            </motion.button>
                        );
                    })}
                </AnimatePresence>
            </div>

            {rows.length === 0 && (
                <p className="rounded-md border border-dashed border-line bg-surface px-4 py-8 text-center text-xs text-ink-muted">
                    Nothing matches &ldquo;{query}&rdquo;. It may be something we
                    do not build yet &mdash; tell us below and it goes on the list.
                </p>
            )}
        </div>
    );
}

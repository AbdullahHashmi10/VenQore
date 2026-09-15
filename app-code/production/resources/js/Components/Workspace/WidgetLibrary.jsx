import React, { useMemo, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';

/**
 * The card library — "Add card".
 *
 * A bottom sheet on phones and a right-hand drawer on desktop, from one
 * component. Both are the same list; only the panel's position and the entry
 * animation differ, which is a CSS concern and not worth two implementations.
 *
 * ── Only what is addable appears ───────────────────────────────────────────
 *
 * The catalogue arriving here has already been filtered by the server to what
 * this plan and this user can use, and cards already on the dashboard are
 * removed below. So the list is genuinely "things you can add", with no locked
 * rows and no upsells. A store that does not carry stock never learns that a Low
 * Stock card exists, which is the intended outcome: the dashboard should look
 * like it was built for that business.
 */
export default function WidgetLibrary({ open, catalog, activeIds, onAdd, onClose }) {
    const [query, setQuery] = useState('');

    const groups = useMemo(() => {
        const needle = query.trim().toLowerCase();

        const addable = catalog.filter((widget) => {
            if (activeIds.includes(widget.id)) return false;
            if (!needle) return true;

            return (
                widget.title.toLowerCase().includes(needle)
                || widget.description.toLowerCase().includes(needle)
                || widget.category.toLowerCase().includes(needle)
            );
        });

        // Preserve the server's ordering within each category — it reflects the
        // order the catalogue is written in, which is a considered sequence
        // rather than alphabetical noise.
        return addable.reduce((accumulator, widget) => {
            (accumulator[widget.category] ||= []).push(widget);
            return accumulator;
        }, {});
    }, [catalog, activeIds, query]);

    if (!open) return null;

    const categories = Object.keys(groups);

    return (
        <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="Add a card">
            <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute inset-0 bg-scrim/50 backdrop-blur-[2px]"
            />

            <div
                className={[
                    'relative ml-auto flex w-full flex-col bg-surface shadow-xl',
                    // Phone: a sheet anchored to the bottom, capped so the page
                    // behind stays visible — a full-screen takeover loses the
                    // context of what you are adding to.
                    'mt-auto max-h-[85vh] rounded-t-2xl',
                    // Desktop: a proper side drawer.
                    'sm:mt-0 sm:h-full sm:max-h-none sm:w-[26rem] sm:rounded-none sm:rounded-l-2xl',
                ].join(' ')}
            >
                <header className="shrink-0 border-b border-line px-5 pb-3 pt-4">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="text-base font-semibold text-ink">Add a card</h2>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close"
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted hover:bg-interactive-hover"
                        >
                            <X className="h-4 w-4" aria-hidden="true" />
                        </button>
                    </div>

                    <div className="relative mt-3">
                        <Search
                            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
                            aria-hidden="true"
                        />
                        <input
                            type="search"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search cards"
                            aria-label="Search cards"
                            className="min-h-control-md w-full rounded-xl border border-line bg-app pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint focus:border-brand-500 focus:ring-0"
                        />
                    </div>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
                    {categories.length === 0 && (
                        <p className="py-10 text-center text-sm text-ink-muted">
                            {query
                                ? 'No cards match that search.'
                                : 'Every card available to you is already on your dashboard.'}
                        </p>
                    )}

                    {categories.map((category) => (
                        <section key={category} className="mb-6 last:mb-0">
                            <h3 className="mb-2 text-2xs font-semibold uppercase tracking-wide text-ink-muted">
                                {category}
                            </h3>

                            <ul className="space-y-2">
                                {groups[category].map((widget) => (
                                    <li key={widget.id}>
                                        <button
                                            type="button"
                                            onClick={() => onAdd(widget.id)}
                                            className="flex w-full items-start gap-3 rounded-xl border border-line bg-app p-3 text-left transition-colors hover:bg-interactive-hover"
                                        >
                                            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-500/12 text-brand-500">
                                                <Plus className="h-4 w-4" aria-hidden="true" />
                                            </span>
                                            <span className="min-w-0">
                                                <span className="block truncate text-sm font-medium text-ink">
                                                    {widget.title}
                                                </span>
                                                <span className="mt-0.5 block text-xs leading-snug text-ink-muted">
                                                    {widget.description}
                                                </span>
                                            </span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ))}
                </div>
            </div>
        </div>
    );
}

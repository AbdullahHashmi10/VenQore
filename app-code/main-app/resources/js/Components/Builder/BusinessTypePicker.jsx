/**
 * BusinessTypePicker — all 85 business types (config/business_types.php),
 * searchable and grouped by sector. One click picks a type: its modules and
 * its words ("Clients", "Jobs", "Plumbers") are set up with no questions.
 *
 * Search matches the label, the note and every alias — so "darzi" finds
 * tailoring and "plumb" finds plumbers — using the same tokeniser as the
 * server-side matcher.
 */
import React, { useMemo, useState } from 'react';
import { ArrowRight, Search, X } from 'lucide-react';
import { filterBusinessTypes } from './matchBusinessTypes';

export default function BusinessTypePicker({ types = [], sectors = {}, onPick, selectedKey = null, className = '' }) {
    const [query, setQuery] = useState('');
    const [sector, setSector] = useState('all');

    const sectorKeys = Object.keys(sectors);

    const visible = useMemo(() => {
        const bySector = sector === 'all' ? types : types.filter((t) => t.sector === sector);
        return filterBusinessTypes(query, bySector);
    }, [types, sector, query]);

    const groups = useMemo(
        () =>
            sectorKeys
                .map((key) => ({ key, name: sectors[key]?.short || key, items: visible.filter((t) => t.sector === key) }))
                .filter((g) => g.items.length),
        [sectorKeys, sectors, visible],
    );

    return (
        <div className={className}>
            <label className="relative block">
                <span className="sr-only">Search business types</span>
                <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
                <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={`Search ${types.length} business types — plumber, pharmacy, darzi…`}
                    className="h-11 w-full rounded-md border border-line bg-surface pl-10 pr-10 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-focus"
                />
                {query && (
                    <button
                        type="button"
                        onClick={() => setQuery('')}
                        aria-label="Clear search"
                        className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded text-ink-muted hover:bg-interactive-hover"
                    >
                        <X size={14} />
                    </button>
                )}
            </label>

            <div className="mt-3 flex flex-wrap gap-1.5" role="tablist" aria-label="Sector">
                {[{ key: 'all', name: 'All' }, ...sectorKeys.map((k) => ({ key: k, name: sectors[k]?.short || k }))].map((s) => {
                    const on = sector === s.key;
                    const count = s.key === 'all' ? types.length : types.filter((t) => t.sector === s.key).length;
                    return (
                        <button
                            key={s.key}
                            type="button"
                            role="tab"
                            aria-selected={on}
                            onClick={() => setSector(s.key)}
                            className={`rounded-full border px-3 py-1 text-2xs font-semibold transition-colors duration-fast ${
                                on ? 'border-accent bg-accent-quiet text-accent-text' : 'border-line bg-surface text-ink-secondary hover:border-line-strong'
                            }`}
                        >
                            {s.name} <span className="text-ink-muted">{count}</span>
                        </button>
                    );
                })}
            </div>

            <div className="mt-4 max-h-[26rem] overflow-y-auto pr-1">
                {groups.length === 0 && (
                    <p className="rounded-md border border-line bg-surface px-4 py-3 text-sm text-ink-secondary">
                        No business type matches “{query}”. Describe it in the box above instead — we will set up the
                        closest fit and note what you need.
                    </p>
                )}
                {groups.map((g) => (
                    <section key={g.key} className="mb-4 last:mb-0" aria-label={g.name}>
                        <h3 className="mb-2 text-3xs font-bold uppercase tracking-widest text-ink-muted">
                            {g.name} · {g.items.length}
                        </h3>
                        <ul className="grid gap-2 sm:grid-cols-2">
                            {g.items.map((t) => {
                                const on = t.key === selectedKey;
                                return (
                                    <li key={t.key}>
                                        <button
                                            type="button"
                                            onClick={() => onPick?.(t.key)}
                                            className={`group flex h-full w-full items-start gap-2 rounded-lg border p-3 text-left transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
                                                on ? 'border-accent bg-accent-quiet' : 'border-line bg-surface hover:border-accent hover:bg-accent-quiet'
                                            }`}
                                        >
                                            <span className="min-w-0 flex-1">
                                                <span className="block text-sm font-semibold text-ink">{t.label}</span>
                                                {t.note && <span className="mt-0.5 block text-xs leading-snug text-ink-secondary">{t.note}</span>}
                                            </span>
                                            <ArrowRight size={14} className="mt-1 shrink-0 text-ink-faint group-hover:text-accent-text" />
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </section>
                ))}
            </div>
        </div>
    );
}

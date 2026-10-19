/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  ModuleCatalog — the one module picker, used by /build-workspace and the  ║
 * ║  in-app Builder (Store Configuration → Builder).                          ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Why it looks like this (14 Oct 2026):
 *   • Grouped by the JOB a module does (Selling, Stock, Money…), not a flat wall
 *     of 48 tiles. People scan for "how do I handle stock?", not for a name.
 *   • Each group says in one line what it is for and how many are on, so the
 *     page reads as a checklist of the business rather than a feature dump.
 *   • "Recommended" is a visible badge with the reason, never a silent default.
 *   • A switch, not a tick: the state reads at a glance and matches Settings.
 *
 * It never decides what exists — `modules` comes from config/modules.php via
 * the controller. It never decides what happens on toggle — `onToggle(key,
 * nextOn)` does. Group letters A–G are the registry's own groups.
 * Tokens only (DESIGN-RULES v3 law 1): brand/accent, ink, line, surface.
 */

import React, { useMemo, useState } from 'react';
import { Lock, Search, Sparkles, X, ChevronDown } from 'lucide-react';
import { moduleGlyph } from './icons';

export const MODULE_GROUPS = {
    A: { name: 'What you sell',        blurb: 'Products, services and how they are listed.' },
    B: { name: 'Selling',              blurb: 'The till, bills, invoices, quotes and returns.' },
    C: { name: 'Stock',                blurb: 'Know what is on the shelf and where it is.' },
    D: { name: 'Buying',               blurb: 'Suppliers, purchase orders and goods received.' },
    E: { name: 'Making',               blurb: 'Recipes, assembly and production.' },
    F: { name: 'Money',                blurb: 'Expenses, payments, credit (khata) and tax.' },
    G: { name: 'Team & growth',        blurb: 'Staff, reports, online store and loyalty.' },
};
const GROUP_ORDER = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

function Switch({ on, disabled }) {
    return (
        <span
            aria-hidden="true"
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-fast ease-standard ${
                disabled ? 'bg-sunken' : on ? 'bg-accent-fill' : 'bg-line-strong'
            }`}
        >
            <span
                className={`inline-block h-4 w-4 rounded-full bg-surface shadow-sm transition-transform duration-fast ease-standard ${
                    on ? 'translate-x-4' : 'translate-x-1'
                }`}
            />
        </span>
    );
}

function ModuleCard({ m, on, lockReason, recommended, why, highlight, disabled, onToggle, needsLabel }) {
    const Glyph = moduleGlyph(m.key, m.icon);
    const blocked = Boolean(lockReason) || disabled;
    return (
        <button
            type="button"
            role="switch"
            aria-checked={on}
            disabled={blocked}
            title={lockReason || undefined}
            onClick={() => !blocked && onToggle(m.key, !on)}
            className={`group relative flex h-full flex-col gap-3 rounded-lg border p-4 text-left transition-colors duration-normal ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
                highlight ? 'ring-2 ring-focus' : ''
            } ${
                lockReason
                    ? 'cursor-not-allowed border-line bg-sunken'
                    : on
                      ? 'border-accent bg-accent-quiet'
                      : 'border-line bg-surface hover:border-line-strong hover:bg-interactive-hover'
            } ${disabled && !lockReason ? 'opacity-60' : ''}`}
        >
            <div className="flex items-start gap-3">
                <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md transition-colors duration-fast ${
                        on ? 'bg-accent-fill text-accent-on' : 'bg-sunken text-ink-muted group-hover:text-ink'
                    }`}
                >
                    <Glyph size={18} strokeWidth={2} />
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold leading-snug text-ink">{m.label}</span>
                    {recommended && (
                        <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-accent-quiet px-2 py-0.5 text-3xs font-bold uppercase tracking-wider text-accent-text">
                            <Sparkles size={10} /> Recommended
                        </span>
                    )}
                    {m.plan_locked && !on && (
                        <span className="mt-1 ml-1 inline-flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-3xs font-bold uppercase tracking-wider text-ink-secondary">
                            <Lock size={10} /> {m.needs_plan ? `${m.needs_plan} plan` : 'Higher plan'}
                        </span>
                    )}
                </span>
                {lockReason ? (
                    <Lock size={15} className="mt-1 shrink-0 text-ink-faint" />
                ) : (
                    <Switch on={on} disabled={disabled} />
                )}
            </div>

            {(why || m.description) && (
                <p className="text-xs leading-relaxed text-ink-secondary">{why || m.description}</p>
            )}

            {(lockReason || needsLabel) && (
                <p className="mt-auto text-2xs font-medium text-ink-muted">
                    {lockReason || `Needs ${needsLabel} — switched on with it`}
                </p>
            )}
        </button>
    );
}

export default function ModuleCatalog({
    modules = [],
    active = [],
    locked = {},
    recommended = {},      // { key: 'why text' | true }
    highlight = null,
    disabled = false,
    onToggle,
    groupLabels = {},
    defaultFilter = 'all',
}) {
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState(defaultFilter); // all | on | recommended
    const [collapsed, setCollapsed] = useState({});

    const activeSet = useMemo(() => new Set(active), [active]);
    const byKey = useMemo(() => Object.fromEntries(modules.map((m) => [m.key, m])), [modules]);
    const recCount = Object.keys(recommended).filter((k) => byKey[k]).length;

    const groups = useMemo(() => {
        const q = query.trim().toLowerCase();
        const match = (m) => {
            if (filter === 'on' && !activeSet.has(m.key)) return false;
            if (filter === 'recommended' && !recommended[m.key]) return false;
            if (!q) return true;
            return [m.label, m.description, m.key, ...(m.aliases || [])]
                .filter(Boolean)
                .some((s) => String(s).toLowerCase().includes(q));
        };
        const out = {};
        for (const m of modules) {
            const g = GROUP_ORDER.includes(m.group) ? m.group : 'G';
            (out[g] ||= { all: [], shown: [] }).all.push(m);
            if (match(m)) out[g].shown.push(m);
        }
        // Recommended first inside each group; otherwise keep registry order.
        for (const g of Object.values(out)) {
            g.shown.sort((a, b) => (recommended[b.key] ? 1 : 0) - (recommended[a.key] ? 1 : 0));
        }
        return GROUP_ORDER.filter((g) => out[g]?.shown.length).map((g) => ({ key: g, ...out[g] }));
    }, [modules, query, filter, activeSet, recommended]);

    const chip = (id, label, count) => (
        <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            aria-pressed={filter === id}
            className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-xs font-semibold transition-colors duration-fast ease-standard ${
                filter === id
                    ? 'border-accent bg-accent-fill text-accent-on'
                    : 'border-line bg-surface text-ink-secondary hover:border-line-strong hover:text-ink'
            }`}
        >
            {label}
            <span className="vq-num opacity-75">{count}</span>
        </button>
    );

    return (
        <div>
            {/* Toolbar */}
            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative flex-1">
                    <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
                    <input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search — e.g. “barcode”, “khata”, “recipes”, “hold bill”"
                        className="h-11 w-full rounded-md border border-line bg-surface pl-10 pr-10 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-focus"
                    />
                    {query && (
                        <button
                            type="button"
                            onClick={() => setQuery('')}
                            aria-label="Clear search"
                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink-faint hover:bg-interactive-hover hover:text-ink"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
                    {chip('all', 'All', modules.length)}
                    {chip('on', 'Switched on', active.filter((k) => byKey[k]).length)}
                    {recCount > 0 && chip('recommended', 'Recommended', recCount)}
                </div>
            </div>

            {/* Groups */}
            <div className="space-y-8">
                {groups.map((g) => {
                    const meta = MODULE_GROUPS[g.key];
                    const onCount = g.all.filter((m) => activeSet.has(m.key)).length;
                    const isCollapsed = !!collapsed[g.key] && !query;
                    return (
                        <section key={g.key} aria-labelledby={`vq-grp-${g.key}`}>
                            <button
                                type="button"
                                onClick={() => setCollapsed((c) => ({ ...c, [g.key]: !c[g.key] }))}
                                className="mb-3 flex w-full items-end justify-between gap-4 border-b border-line pb-2 text-left"
                                aria-expanded={!isCollapsed}
                            >
                                <span>
                                    <span id={`vq-grp-${g.key}`} className="block text-base font-semibold text-ink">
                                        {groupLabels[g.key] || meta.name}
                                    </span>
                                    <span className="block text-xs text-ink-muted">{meta.blurb}</span>
                                </span>
                                <span className="flex shrink-0 items-center gap-2 text-xs font-semibold text-ink-secondary">
                                    <span className="vq-num">{onCount} of {g.all.length} on</span>
                                    <ChevronDown
                                        size={16}
                                        className={`transition-transform duration-fast ${isCollapsed ? '-rotate-90' : ''}`}
                                    />
                                </span>
                            </button>
                            {!isCollapsed && (
                                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                                    {g.shown.map((m) => {
                                        const needs = (m.requires || []).filter((k) => !activeSet.has(k));
                                        return (
                                            <ModuleCard
                                                key={m.key}
                                                m={m}
                                                on={activeSet.has(m.key)}
                                                lockReason={locked[m.key]}
                                                recommended={!!recommended[m.key]}
                                                why={typeof recommended[m.key] === 'string' ? recommended[m.key] : null}
                                                highlight={highlight === m.key}
                                                disabled={disabled}
                                                onToggle={onToggle}
                                                needsLabel={
                                                    !activeSet.has(m.key) && needs.length
                                                        ? needs.map((k) => byKey[k]?.label || k).join(', ')
                                                        : null
                                                }
                                            />
                                        );
                                    })}
                                </div>
                            )}
                        </section>
                    );
                })}
            </div>

            {groups.length === 0 && (
                <div className="rounded-lg border border-dashed border-line bg-surface px-4 py-10 text-center">
                    <p className="text-sm font-semibold text-ink">Nothing matches{query ? ` “${query}”` : ''}.</p>
                    <button
                        type="button"
                        onClick={() => { setQuery(''); setFilter('all'); }}
                        className="mt-2 text-xs font-semibold text-accent-text hover:underline"
                    >
                        Show everything
                    </button>
                </div>
            )}
        </div>
    );
}

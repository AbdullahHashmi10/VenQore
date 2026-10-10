import { useState } from 'react';
import { ChevronDown, Star } from 'lucide-react';

/*
 * Phone-only stats summary (hidden from the given breakpoint up, so the
 * desktop/tablet stat cards stay exactly as they were).
 * Collapsed: the first two figures side by side. Expanded: every figure in a
 * 2-column grouped grid. One card, no sideways scrolling, tap anywhere to toggle.
 */
const TONES = {
    emerald: 'text-emerald-600 dark:text-emerald-400',
    green: 'text-emerald-600 dark:text-emerald-400',
    red: 'text-red-600 dark:text-red-400',
    rose: 'text-rose-600 dark:text-rose-400',
    blue: 'text-blue-600 dark:text-blue-400',
    sky: 'text-sky-600 dark:text-sky-400',
    amber: 'text-amber-600 dark:text-amber-400',
    orange: 'text-orange-600 dark:text-orange-400',
    brand: 'text-brand-600 dark:text-brand-400',
    teal: 'text-teal-600 dark:text-teal-400',
    purple: 'text-purple-600 dark:text-purple-400',
    violet: 'text-violet-600 dark:text-violet-400',
    indigo: 'text-indigo-600 dark:text-indigo-400',
    ink: 'text-ink',
};
const DOTS = {
    emerald: 'bg-emerald-500', green: 'bg-emerald-500', red: 'bg-red-500', rose: 'bg-rose-500',
    blue: 'bg-blue-500', sky: 'bg-sky-500', amber: 'bg-amber-500', orange: 'bg-orange-500',
    brand: 'bg-brand-500', teal: 'bg-teal-500', purple: 'bg-purple-500', violet: 'bg-violet-500',
    indigo: 'bg-indigo-500', ink: 'bg-neutral-400',
};

const TINTS = {
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
    green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
    brand: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400',
    teal: 'bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400',
    ink: 'bg-app text-ink-secondary',
};

function readPin(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
}
function writePin(key, val) {
    try { window.localStorage.setItem(key, val); } catch (e) { /* storage unavailable */ }
}

/*
 * Phone-only summary with a starred figure.
 * - The starred figure is always visible, in a single bar-height row.
 * - A chevron drops the full list down in place; tap a row's star to make it
 *   the one that's always shown (remembered per page, per browser).
 * Hidden from `bp` up, so tablet/desktop stat cards are untouched.
 */
export default function MobileStats({ items = [], open = false, onToggle, bp = 'md', hero = 0, storageKey }) {
    const hide = bp === 'sm' ? 'sm:hidden' : 'md:hidden';
    const key = 'vq-stat-star:' + (storageKey || (typeof window !== 'undefined' ? window.location.pathname.replace(/\/s\/[^/]+/, '') : 'page'));
    const defaultLabel = (items[hero] || items[0])?.label;
    const [pinned, setPinned] = useState(() => (typeof window !== 'undefined' ? readPin(key) : null) || defaultLabel);
    const [dropped, setDropped] = useState(false);
    if (!items.length) return null;

    const main = items.find(i => i.label === pinned) || items[hero] || items[0];
    const isOpen = dropped;
    const pin = (label) => { setPinned(label); writePin(key, label); };
    const Icon = main.icon;

    return (
        <div className={`${hide} shrink-0 relative`}>
            {isOpen && <div className="fixed inset-0 z-20" onClick={() => setDropped(false)} aria-hidden="true" />}
            <div className="relative z-30 bg-surface rounded-xl border border-line shadow-sm">
            <div className="flex items-center gap-2.5 pl-1.5 pr-1 py-1.5">
                {Icon && (
                    <span className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${TINTS[main.tone] || TINTS.brand}`}>
                        <Icon size={17} />
                    </span>
                )}
                <button type="button" onClick={() => setDropped(!dropped)} className="min-w-0 flex-1 text-left" aria-expanded={isOpen}>
                    <span className="block text-[11px] font-medium text-ink-muted leading-tight truncate">{main.label}</span>
                    <span className={`block text-lg font-bold tabular-nums leading-tight truncate ${TONES[main.tone] && main.tone !== 'ink' ? TONES[main.tone] : 'text-ink'}`}>{main.value}</span>
                </button>
                <Star size={15} className="text-amber-500 fill-amber-400 shrink-0" aria-label="Starred" />
                {items.length > 1 && (
                    <button type="button" onClick={() => setDropped(!dropped)} aria-label={isOpen ? 'Hide summary' : 'Show all summary figures'} className="h-9 w-9 rounded-lg flex items-center justify-center text-ink-muted active:bg-app shrink-0">
                        <ChevronDown size={18} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                )}
            </div>
            {isOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-surface border border-line rounded-xl shadow-xl animate-[vqDrop_0.16s_ease-out] origin-top">
                    {items.map((it, i) => {
                        const RowIcon = it.icon;
                        const on = it.label === main.label;
                        return (
                            <div key={it.label} className={`flex items-center gap-2.5 pl-3 pr-1 py-1 ${i ? 'border-t border-line' : ''}`}>
                                {RowIcon && <RowIcon size={15} className="text-ink-muted shrink-0" />}
                                <span className="flex-1 min-w-0 text-[13px] text-ink-secondary truncate">{it.label}</span>
                                <span className={`text-sm font-semibold tabular-nums ${TONES[it.tone] || TONES.ink}`}>{it.value}</span>
                                <button
                                    type="button"
                                    onClick={() => pin(it.label)}
                                    aria-label={on ? `${it.label} is starred` : `Star ${it.label}`}
                                    aria-pressed={on}
                                    className="h-9 w-9 flex items-center justify-center rounded-lg active:bg-app shrink-0"
                                >
                                    <Star size={16} className={on ? 'text-amber-500 fill-amber-400' : 'text-ink-muted'} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
            </div>
        </div>
    );
}

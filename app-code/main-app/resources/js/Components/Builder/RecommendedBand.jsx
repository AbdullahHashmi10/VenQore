import React from 'react';
import { Check, Plus, Sparkles } from 'lucide-react';
import { moduleGlyph } from './icons';

/**
 * The house recommendations, shown as ours.
 *
 * Ticked by default and removable in one tap, in a band that says who put them
 * there and why. That labelling is the entire difference between advice and
 * padding: three extra modules a user notices they did not ask for costs more
 * trust than the three modules are worth, while the same three, named and
 * justified, read as someone who has seen a thousand of these.
 */
export default function RecommendedBand({ items, active, onToggle }) {
    return (
        <div className="mt-7 rounded-xl border border-accent bg-accent-quiet p-5">
            <div className="mb-3 flex items-center gap-2">
                <Sparkles size={14} className="text-accent-text" />
                <h2 className="text-sm font-semibold text-ink">
                    We added these — most people want them
                </h2>
            </div>
            <p className="mb-4 text-xs leading-relaxed text-ink-secondary">
                Included on every plan. Untick anything you would rather not have.
            </p>
            <div className="grid gap-2 sm:grid-cols-3">
                {items.map((m) => {
                    const on = active.includes(m.key);
                    const Glyph = moduleGlyph(m.key, m.icon);
                    return (
                        <button
                            key={m.key}
                            type="button"
                            aria-pressed={on}
                            onClick={() => onToggle(m.key)}
                            className={`flex items-start gap-3 rounded-md border p-3.5 text-left transition-colors duration-normal ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
                                on
                                    ? 'border-accent bg-surface'
                                    : 'border-line bg-surface opacity-60 hover:opacity-100'
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
                                <span className="block text-xs font-semibold text-ink">
                                    {m.label}
                                </span>
                                <span className="mt-0.5 block text-3xs leading-normal text-ink-muted">
                                    {m.why}
                                </span>
                            </span>
                            <span className="mt-0.5 shrink-0">
                                {on ? (
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-fill text-accent-on">
                                        <Check size={11} strokeWidth={3} />
                                    </span>
                                ) : (
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full border border-line-strong text-ink-faint">
                                        <Plus size={11} strokeWidth={3} />
                                    </span>
                                )}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}


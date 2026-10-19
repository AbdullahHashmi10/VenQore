/**
 * GiftBundle — "three extras, on the house".
 *
 * Shown on the builder checkpoint (hero), the final review and the account
 * step (compact). Everything it says comes from config/signup_gifts.php via
 * the `gifts` prop; nothing is restated here.
 *
 * Two rules the copy must keep:
 *  - The "worth" figure is what a comparable stand-alone tool typically costs.
 *    It is shown struck through beside "Free", never as a price we charge.
 *  - Every gift is optional. Claimed ones read "Included"; tapping un-claims;
 *    unclaimed ones read "Add it — free". Nobody is trapped into anything.
 */
import React from 'react';
import { motion } from 'motion/react';
import { Check, Gift, Plus, QrCode, Sparkles, Store } from 'lucide-react';

const ICONS = { Sparkles, Store, QrCode };

const money = (n) => `$${Math.round(n).toLocaleString()}`;

export default function GiftBundle({ gifts, claimed = [], onToggle, variant = 'hero', className = '' }) {
    const items = gifts?.items || [];
    if (!items.length) return null;

    const yearly = items.reduce((sum, g) => sum + (g.worth_monthly || 0) * 12, 0);
    const claimedCount = items.filter((g) => claimed.includes(g.key)).length;

    if (variant === 'compact') {
        return (
            <div className={`rounded-lg border border-accent bg-accent-quiet px-4 py-3 ${className}`}>
                <p className="flex items-center gap-2 text-xs font-semibold text-ink">
                    <Gift size={14} className="shrink-0 text-accent-text" />
                    {claimedCount > 0
                        ? `${claimedCount} free ${claimedCount === 1 ? 'extra' : 'extras'} included`
                        : 'Free extras available'}
                    {yearly > 0 && (
                        <span className="font-normal text-ink-secondary">
                            {' '}· typically <span className="vq-num line-through">{money(yearly)}</span>/yr elsewhere
                        </span>
                    )}
                </p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                    {items.map((g) => {
                        const on = claimed.includes(g.key);
                        const Icon = ICONS[g.icon] || Sparkles;
                        return (
                            <li key={g.key}>
                                <button
                                    type="button"
                                    onClick={() => onToggle?.(g.key)}
                                    aria-pressed={on}
                                    className={`inline-flex min-h-[32px] items-center gap-1.5 rounded-full border px-2.5 py-1 text-2xs font-semibold transition-colors duration-fast ease-standard ${
                                        on
                                            ? 'border-accent bg-surface text-ink'
                                            : 'border-dashed border-line-strong bg-transparent text-ink-secondary hover:text-ink'
                                    }`}
                                >
                                    <Icon size={12} className={on ? 'text-accent-text' : 'text-ink-muted'} />
                                    {g.title}
                                    {on ? <Check size={12} strokeWidth={3} className="text-accent-text" /> : <Plus size={12} />}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </div>
        );
    }

    return (
        <section
            aria-labelledby="vq-gifts-title"
            className={`overflow-hidden rounded-xl border border-accent bg-surface shadow-sm ${className}`}
        >
            <div className="flex flex-col gap-3 border-b border-line bg-accent-quiet px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-8">
                <div className="max-w-2xl">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-fill px-2.5 py-1 text-3xs font-bold uppercase tracking-widest text-accent-on">
                        <Gift size={11} /> A gift from us
                    </span>
                    <h2 id="vq-gifts-title" className="mt-3 text-xl font-semibold leading-snug text-ink sm:text-2xl">
                        {gifts.headline || 'Three extras, on the house'}
                    </h2>
                    {gifts.lede && <p className="mt-1.5 text-sm leading-relaxed text-ink-secondary">{gifts.lede}</p>}
                </div>
                {yearly > 0 && (
                    <div className="shrink-0 sm:text-right">
                        <p className="text-3xs font-semibold uppercase tracking-widest text-ink-muted">Typically on their own</p>
                        <p className="mt-0.5 flex items-baseline gap-2 sm:justify-end">
                            <span className="vq-num text-lg font-semibold text-ink-muted line-through">{money(yearly)}/yr</span>
                            <span className="vq-num text-2xl font-semibold text-accent-text">Free</span>
                        </p>
                    </div>
                )}
            </div>

            <ul className="grid gap-px bg-line sm:grid-cols-3">
                {items.map((g, i) => {
                    const on = claimed.includes(g.key);
                    const Icon = ICONS[g.icon] || Sparkles;
                    return (
                        <motion.li
                            key={g.key}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.12 + i * 0.09, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                            className="flex flex-col bg-surface p-5 sm:p-6"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${on ? 'bg-accent-fill text-accent-on' : 'bg-sunken text-ink-muted'}`}>
                                    <Icon size={18} />
                                </span>
                                {g.worth_monthly > 0 && (
                                    <span className="text-right text-2xs leading-tight text-ink-muted">
                                        <span className="vq-num line-through">{money(g.worth_monthly)}/mo</span>
                                        <span className="block font-semibold text-accent-text">Free</span>
                                    </span>
                                )}
                            </div>
                            <h3 className="mt-3 text-base font-semibold text-ink">{g.title}</h3>
                            <p className="mt-1 text-sm leading-relaxed text-ink-secondary">{g.tagline}</p>
                            {g.note && <p className="mt-2 text-xs leading-relaxed text-ink-muted">{g.note}</p>}
                            <div className="mt-auto pt-4">
                                <button
                                    type="button"
                                    onClick={() => onToggle?.(g.key)}
                                    aria-pressed={on}
                                    className={`inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-full border text-xs font-semibold transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
                                        on
                                            ? 'border-accent bg-accent-quiet text-accent-text hover:bg-interactive-hover'
                                            : 'border-line bg-surface text-ink hover:border-accent hover:text-accent-text'
                                    }`}
                                >
                                    {on ? (<><Check size={14} strokeWidth={3} /> Included</>) : (<><Plus size={14} /> Add it — free</>)}
                                </button>
                            </div>
                        </motion.li>
                    );
                })}
            </ul>

            {gifts.promise && (
                <p className="border-t border-line px-5 py-3 text-xs text-ink-muted sm:px-8">{gifts.promise}</p>
            )}
        </section>
    );
}
